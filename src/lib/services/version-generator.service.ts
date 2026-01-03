/**
 * AI Version Generator Service
 *
 * Generates profile version rules using OpenAI GPT-4.
 * Based on wizard answers, AI structures, emphasizes, and presents
 * the user's existing profile data.
 *
 * Key principles:
 * - AI does NOT invent data
 * - AI only works with existing profile data
 * - Every decision is explainable in Persian
 */

import { generateWithRetry, parseJsonResponse, isOpenAIConfigured } from './openai.service';
import sql from '@/lib/db';
import type {
  WizardAnswers,
  ProfileDataForAI,
  AIGeneratedVersion,
  GeneratedVersionRules,
  PURPOSE_TO_INTENT,
  AUDIENCE_TO_PROMPT,
  TONE_TO_PROMPT,
} from '@/types/version-generator';
import type {
  ProfileBlock,
  VisibilityRule,
  EmphasisRule,
  OrderingRule,
  EmphasisTargetType,
} from '@/types/profile-version';

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

const SYSTEM_PROMPT = `You are an AI Profile Builder for BizBuzz.

Your job is NOT to invent data.
Your job is to STRUCTURE, EMPHASIZE, and PRESENT the user's existing profile
based on their stated intent.

You must:
- Use ONLY the provided data
- Never add fake experience, skills, or achievements
- Decide what to highlight, hide, or reorder
- Keep the tone aligned with the user's goal
- Explain your choices briefly and clearly in Persian

You are building a PROFILE VERSION, not a new profile.

When building the profile version:
1. Prioritize relevance to the intent
2. Highlight blocks that best support the intent
3. Hide or de-emphasize unrelated sections
4. Reorder sections for fast understanding
5. Keep language clear, human, and honest

Guardrails:
- DO NOT add missing skills
- DO NOT rewrite experience facts
- DO NOT inflate titles
- DO NOT judge the user's capability
- DO NOT compare with other users

Response format: You MUST respond with valid JSON only, no additional text.

JSON Schema:
{
  "versionMeta": {
    "name": "string (Persian name for the version, e.g., 'نسخه تیمی')",
    "context": "string (one of: 'public', 'network', 'team', 'investor', 'job', 'custom')",
    "confidence": "number (0-1, how confident you are in this version)"
  },
  "visibility": [
    { "block": "string", "mode": "show|hide|limited" }
  ],
  "emphasis": [
    { "targetType": "skill|experience|project|education", "targetName": "string", "weight": "number (1-5)" }
  ],
  "ordering": [
    { "block": "string", "order": "number" }
  ],
  "explanation": [
    "string (Persian explanation for each major decision)"
  ]
}

Valid blocks: basics, photo, contact, social, experience, education, skills, projects, signals, custom

Each explanation must:
- Refer to the intent
- Refer to visible data
- Be understandable by a non-technical user`;

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Generate profile version with AI
 */
export async function generateVersionWithAI(
  profileId: string,
  wizardAnswers: WizardAnswers
): Promise<GeneratedVersionRules> {
  // Check if OpenAI is configured
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key is not configured');
  }

  // Fetch profile data
  const profileData = await getProfileDataForAI(profileId);
  if (!profileData) {
    throw new Error('Profile not found or empty');
  }

  // Validate profile has sufficient data
  validateProfileData(profileData);

  // Build the user prompt
  const userPrompt = buildUserPrompt(profileData, wizardAnswers);

  // Call OpenAI
  const response = await generateWithRetry(SYSTEM_PROMPT, userPrompt, {
    temperature: 0.7,
    maxTokens: 2000,
    responseFormat: 'json',
    maxRetries: 3,
  });

  // Parse AI response
  const aiVersion = parseJsonResponse<AIGeneratedVersion>(response);

  // Validate AI response structure
  validateAIResponse(aiVersion);

  // Convert to database-ready format
  const rules = convertToRules(aiVersion, profileData);

  return rules;
}

// =============================================================================
// PROFILE DATA FETCHING
// =============================================================================

/**
 * Get profile data formatted for AI prompt
 */
async function getProfileDataForAI(profileId: string): Promise<ProfileDataForAI | null> {
  // Fetch basic profile info
  type ProfileBasics = {
    name: string;
    headline: string | null;
    bio: string | null;
  };

  const [profile] = await sql<ProfileBasics[]>`
    SELECT name, headline, bio FROM profiles
    WHERE id = ${profileId} AND deleted_at IS NULL
  `;

  if (!profile) return null;

  // Fetch skills
  type SkillRow = { name: string };
  const skills = await sql<SkillRow[]>`
    SELECT s.name FROM profile_skills ps
    JOIN skills s ON ps.skill_id = s.id
    WHERE ps.profile_id = ${profileId}
    ORDER BY ps.proficiency_level DESC NULLS LAST
  `;

  // Fetch experiences
  type ExperienceRow = {
    id: string;
    title: string;
    company_name: string;
    description: string | null;
  };
  const experiences = await sql<ExperienceRow[]>`
    SELECT id, title, company_name, description FROM profile_experiences
    WHERE profile_id = ${profileId}
    ORDER BY start_date DESC NULLS LAST
  `;

  // Fetch education
  type EducationRow = {
    id: string;
    institution: string;
    degree: string | null;
    field_of_study: string | null;
  };
  const education = await sql<EducationRow[]>`
    SELECT id, institution, degree, field_of_study FROM profile_education
    WHERE profile_id = ${profileId}
    ORDER BY start_date DESC NULLS LAST
  `;

  // Fetch projects (if table exists)
  type ProjectRow = {
    id: string;
    name: string;
    description: string | null;
  };
  let projects: ProjectRow[] = [];
  try {
    projects = await sql<ProjectRow[]>`
      SELECT id, name, description FROM profile_projects
      WHERE profile_id = ${profileId}
      ORDER BY created_at DESC
    `;
  } catch {
    // Projects table may not exist yet
    projects = [];
  }

  return {
    basics: {
      name: profile.name,
      headline: profile.headline || undefined,
      bio: profile.bio || undefined,
    },
    skills: skills.map((s) => s.name),
    experiences: experiences.map((e) => ({
      id: e.id,
      title: e.title,
      company: e.company_name,
      summary: e.description || undefined,
    })),
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || undefined,
    })),
    education: education.map((e) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree || undefined,
      field: e.field_of_study || undefined,
    })),
  };
}

/**
 * Validate that profile has sufficient data for AI generation
 */
function validateProfileData(data: ProfileDataForAI): void {
  if (!data.basics.name) {
    throw new Error('Profile must have a name');
  }

  // At least some content should exist
  const hasContent =
    data.skills.length > 0 ||
    data.experiences.length > 0 ||
    data.education.length > 0 ||
    data.projects.length > 0 ||
    data.basics.bio;

  if (!hasContent) {
    throw new Error('Profile has insufficient data for AI generation');
  }
}

// =============================================================================
// PROMPT BUILDING
// =============================================================================

/**
 * Map wizard purpose to intent string
 */
const PURPOSE_MAP: Record<string, string> = {
  networking: 'NETWORKING',
  job_seeking: 'JOB_APPLICATION',
  investor_pitch: 'INVESTOR_PITCH',
  team_intro: 'TEAM_COLLABORATION',
  other: 'CUSTOM',
};

/**
 * Map audience to prompt string
 */
const AUDIENCE_MAP: Record<string, string> = {
  individual: 'single_person',
  company: 'company_hr',
  investor: 'investor_vc',
  recruiter: 'recruiter',
  general: 'general_public',
};

/**
 * Map tone to prompt string
 */
const TONE_MAP: Record<string, string> = {
  formal: 'formal',
  casual: 'casual_friendly',
  professional: 'professional_friendly',
};

/**
 * Build the user prompt for AI
 */
function buildUserPrompt(data: ProfileDataForAI, answers: WizardAnswers): string {
  const intent = PURPOSE_MAP[answers.purpose] || 'CUSTOM';
  const audience = AUDIENCE_MAP[answers.audienceType] || 'general_public';
  const tone = TONE_MAP[answers.tone] || 'professional_friendly';

  const promptData = {
    intent,
    tone,
    audience,
    userPreferences: {
      emphasize: answers.emphasize,
      hide: answers.hide || [],
      customDescription: answers.purposeDescription,
    },
    profileData: {
      basics: data.basics,
      skills: data.skills,
      experiences: data.experiences.map((e) => ({
        title: e.title,
        company: e.company,
        summary: e.summary,
      })),
      projects: data.projects.map((p) => ({
        name: p.name,
        description: p.description,
      })),
      education: data.education.map((e) => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field,
      })),
    },
  };

  return JSON.stringify(promptData, null, 2);
}

// =============================================================================
// AI RESPONSE VALIDATION
// =============================================================================

/**
 * Validate AI response structure
 */
function validateAIResponse(response: AIGeneratedVersion): void {
  if (!response.versionMeta || !response.versionMeta.name) {
    throw new Error('AI response missing versionMeta.name');
  }

  if (!response.versionMeta.context) {
    throw new Error('AI response missing versionMeta.context');
  }

  if (!Array.isArray(response.visibility)) {
    throw new Error('AI response visibility must be an array');
  }

  if (!Array.isArray(response.emphasis)) {
    throw new Error('AI response emphasis must be an array');
  }

  if (!Array.isArray(response.ordering)) {
    throw new Error('AI response ordering must be an array');
  }

  if (!Array.isArray(response.explanation)) {
    throw new Error('AI response explanation must be an array');
  }
}

// =============================================================================
// CONVERSION
// =============================================================================

/**
 * Valid profile blocks
 */
const VALID_BLOCKS: ProfileBlock[] = [
  'basics',
  'photo',
  'contact',
  'social',
  'experience',
  'education',
  'skills',
  'projects',
  'signals',
  'custom',
];

/**
 * Valid emphasis target types
 */
const VALID_EMPHASIS_TYPES: EmphasisTargetType[] = ['skill', 'experience', 'education', 'project'];

/**
 * Convert AI response to database-ready rules
 */
function convertToRules(
  aiVersion: AIGeneratedVersion,
  profileData: ProfileDataForAI
): GeneratedVersionRules {
  // Convert visibility rules
  const visibility_rules: VisibilityRule[] = aiVersion.visibility
    .filter((v) => VALID_BLOCKS.includes(v.block as ProfileBlock))
    .map((v) => ({
      block: v.block as ProfileBlock,
      mode: v.mode as 'show' | 'hide' | 'limited',
    }));

  // Convert emphasis rules (resolve names to IDs)
  const emphasis_rules: EmphasisRule[] = aiVersion.emphasis
    .filter((e) => VALID_EMPHASIS_TYPES.includes(e.targetType as EmphasisTargetType))
    .map((e) => {
      const targetId = resolveTargetId(e.targetType, e.targetName, profileData);
      return {
        targetId: targetId || e.targetName, // Fallback to name if ID not found
        targetType: e.targetType as EmphasisTargetType,
        weight: Math.max(1, Math.min(5, e.weight)), // Clamp 1-5
      };
    })
    .filter((e) => e.targetId); // Remove if no valid target

  // Convert ordering rules
  const ordering_rules: OrderingRule[] = aiVersion.ordering
    .filter((o) => VALID_BLOCKS.includes(o.block as ProfileBlock))
    .map((o) => ({
      block: o.block as ProfileBlock,
      order: o.order,
    }));

  // Convert explanations to reasons
  const reasons = aiVersion.explanation.map((message) => ({
    type: 'ai_generated' as const,
    message,
  }));

  return {
    name: aiVersion.versionMeta.name,
    context: aiVersion.versionMeta.context,
    confidence: Math.max(0, Math.min(1, aiVersion.versionMeta.confidence)),
    visibility_rules,
    emphasis_rules,
    ordering_rules,
    reasons,
  };
}

/**
 * Resolve target name to ID
 */
function resolveTargetId(
  type: string,
  name: string,
  data: ProfileDataForAI
): string | null {
  const nameLower = name.toLowerCase();

  switch (type) {
    case 'skill':
      // Skills don't have IDs in our format, use the name
      const skill = data.skills.find((s) => s.toLowerCase() === nameLower);
      return skill || null;

    case 'experience':
      const exp = data.experiences.find(
        (e) =>
          e.title.toLowerCase() === nameLower ||
          e.company.toLowerCase() === nameLower
      );
      return exp?.id || null;

    case 'project':
      const proj = data.projects.find(
        (p) => p.name.toLowerCase() === nameLower
      );
      return proj?.id || null;

    case 'education':
      const edu = data.education.find(
        (e) =>
          e.institution.toLowerCase() === nameLower ||
          (e.degree && e.degree.toLowerCase() === nameLower)
      );
      return edu?.id || null;

    default:
      return null;
  }
}

// =============================================================================
// FALLBACK (Template-based)
// =============================================================================

/**
 * Fallback to template version when AI fails
 */
export function getFallbackVersion(answers: WizardAnswers): GeneratedVersionRules {
  // Map purpose to context
  const contextMap: Record<string, string> = {
    networking: 'network',
    job_seeking: 'job',
    investor_pitch: 'investor',
    team_intro: 'team',
    other: 'custom',
  };

  const context = contextMap[answers.purpose] || 'custom';

  // Default visibility based on hide preferences
  const visibility_rules: VisibilityRule[] = (answers.hide || []).map((block) => ({
    block: block as ProfileBlock,
    mode: 'hide' as const,
  }));

  // Default ordering based on emphasis preferences
  const ordering_rules: OrderingRule[] = [];
  let order = 1;
  ordering_rules.push({ block: 'basics', order: order++ });

  if (answers.emphasize.includes('skills')) {
    ordering_rules.push({ block: 'skills', order: order++ });
  }
  if (answers.emphasize.includes('experience')) {
    ordering_rules.push({ block: 'experience', order: order++ });
  }
  if (answers.emphasize.includes('projects')) {
    ordering_rules.push({ block: 'projects', order: order++ });
  }
  if (answers.emphasize.includes('education')) {
    ordering_rules.push({ block: 'education', order: order++ });
  }

  return {
    name: `نسخه سفارشی`,
    context: context as any,
    confidence: 0.5, // Lower confidence for fallback
    visibility_rules,
    emphasis_rules: [],
    ordering_rules,
    reasons: [
      {
        type: 'ai_generated',
        message: 'این نسخه بر اساس ترجیحات شما ساخته شده.',
      },
    ],
  };
}
