/**
 * Profile Strength & Completeness Score Service
 *
 * «پروفایل تو چقدر قوی، قابل اعتماد و قابل ارائه است — و برای چه موقعیتی؟»
 *
 * This is the backbone of BizBuzz intelligence.
 * Profile Score ≠ "form filled" → Profile Score = "identity quality"
 *
 * Two separate scores:
 * 1. Completeness - Are the required pieces present?
 * 2. Strength - Is what exists strong and meaningful?
 */

import sql from '@/lib/db';
import type { ProfileVersionContext } from '@/types/profile-version';
import type {
  ProfileScore,
  ProfileScoreSummary,
  CompletenessFactors,
  CompletenessBreakdown,
  StrengthFactors,
  StrengthBreakdown,
  ContextualScore,
  ScoreSuggestion,
  ReadinessLevel,
  SuggestionImpact,
  ProfileBlock,
} from '@/types/profile-score';
import {
  COMPLETENESS_WEIGHTS,
  STRENGTH_WEIGHTS,
  COVERAGE_THRESHOLDS,
  CONTEXT_REQUIREMENTS,
  CONTEXT_WEIGHT_MULTIPLIERS,
  getReadinessLevel,
} from '@/types/profile-score';

// =============================================================================
// MAIN SCORE CALCULATION
// =============================================================================

/**
 * Calculate complete profile score
 */
export async function calculateProfileScore(profileId: string): Promise<ProfileScore> {
  // Gather all profile data
  const profileData = await getProfileData(profileId);

  // Calculate completeness
  const completenessFactors = extractCompletenessFactors(profileData);
  const completenessBreakdown = calculateCompletenessBreakdown(completenessFactors);

  // Calculate strength
  const strengthFactors = await calculateStrengthFactors(profileId, profileData);
  const strengthBreakdown = calculateStrengthBreakdown(strengthFactors);

  // Calculate contextual scores
  const contextScores = calculateContextualScores(
    completenessFactors,
    strengthFactors,
    profileData
  );

  // Generate suggestions
  const suggestions = generateSuggestions(
    completenessFactors,
    strengthFactors,
    completenessBreakdown,
    strengthBreakdown
  );

  return {
    profileId,
    completeness: completenessBreakdown.total,
    strength: strengthBreakdown.total,
    completenessBreakdown,
    strengthBreakdown,
    contextScores,
    suggestions,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get simplified score summary for display
 */
export async function getProfileScoreSummary(profileId: string): Promise<ProfileScoreSummary> {
  const score = await calculateProfileScore(profileId);

  // Overall readiness based on average
  const avgScore = (score.completeness + score.strength) / 2;
  const overallReadiness = getReadinessLevel(avgScore);

  return {
    completeness: score.completeness,
    strength: score.strength,
    overallReadiness,
    topSuggestion: score.suggestions[0],
  };
}

// =============================================================================
// DATA GATHERING
// =============================================================================

interface ProfileData {
  profile: {
    id: string;
    photo_url: string | null;
    headline: string | null;
    bio: string | null;
    email: string | null;
    phone: string | null;
    website_url: string | null;
  } | null;
  skills: Array<{ id: string; name: string; level: string | null }>;
  experiences: Array<{
    id: string;
    title: string;
    company: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
  }>;
  educations: Array<{
    id: string;
    institution: string;
    degree: string | null;
    field_of_study: string | null;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string | null;
    url: string | null;
  }>;
  socialLinks: Array<{ platform: string; url: string }>;
  activityCount: number;
}

/**
 * Get all profile data needed for scoring
 */
async function getProfileData(profileId: string): Promise<ProfileData> {
  // Get profile basics
  type ProfileBasics = {
    id: string;
    photo_url: string | null;
    headline: string | null;
    bio: string | null;
    email: string | null;
    phone: string | null;
    website_url: string | null;
  };
  const profileRows = await sql<ProfileBasics[]>`
    SELECT id, photo_url, headline, bio, email, phone, website_url
    FROM profiles
    WHERE id = ${profileId} AND deleted_at IS NULL
  `;
  const profile = profileRows[0] || null;

  // Get skills
  type SkillRow = { id: string; name: string; level: string | null };
  const skills = await sql<SkillRow[]>`
    SELECT ps.id, s.name, ps.level
    FROM profile_skills ps
    JOIN skills s ON ps.skill_id = s.id
    WHERE ps.profile_id = ${profileId}
  `;

  // Get experiences
  type ExperienceRow = {
    id: string;
    title: string;
    company: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
  };
  const experiences = await sql<ExperienceRow[]>`
    SELECT id, title, company, description, start_date, end_date
    FROM experiences
    WHERE profile_id = ${profileId}
    ORDER BY start_date DESC
  `;

  // Get educations
  type EducationRow = {
    id: string;
    institution: string;
    degree: string | null;
    field_of_study: string | null;
  };
  const educations = await sql<EducationRow[]>`
    SELECT id, institution, degree, field_of_study
    FROM educations
    WHERE profile_id = ${profileId}
  `;

  // Get projects (if table exists, otherwise empty)
  type ProjectRow = {
    id: string;
    title: string;
    description: string | null;
    url: string | null;
  };
  let projects: ProjectRow[] = [];
  try {
    projects = await sql<ProjectRow[]>`
      SELECT id, title, description, url
      FROM projects
      WHERE profile_id = ${profileId}
    `;
  } catch {
    // Projects table may not exist yet
    projects = [];
  }

  // Get social links
  type SocialLinkRow = { platform: string; url: string };
  const socialLinks = await sql<SocialLinkRow[]>`
    SELECT platform, url
    FROM social_links
    WHERE profile_id = ${profileId}
  `;

  // Get activity count (messages sent, events attended, etc.)
  let activityCount = 0;
  try {
    type CountRow = { count: string };
    const countRows = await sql<CountRow[]>`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      JOIN profiles p ON cp.profile_id = p.id
      WHERE p.id = ${profileId}
    `;
    activityCount = parseInt(countRows[0]?.count || '0');
  } catch {
    activityCount = 0;
  }

  return {
    profile,
    skills,
    experiences,
    educations,
    projects,
    socialLinks,
    activityCount,
  };
}

// =============================================================================
// COMPLETENESS SCORE
// =============================================================================

/**
 * Extract completeness factors from profile data
 */
function extractCompletenessFactors(data: ProfileData): CompletenessFactors {
  return {
    hasPhoto: !!data.profile?.photo_url,
    hasHeadline: !!(data.profile?.headline && data.profile.headline.length >= COVERAGE_THRESHOLDS.minHeadlineLength),
    hasBio: !!(data.profile?.bio && data.profile.bio.length >= COVERAGE_THRESHOLDS.minBioLength),
    hasContact: !!(data.profile?.email || data.profile?.phone || data.profile?.website_url),
    skillsCount: data.skills.length,
    experiencesCount: data.experiences.length,
    projectsCount: data.projects.length,
    hasEducation: data.educations.length > 0,
    hasActivity: data.activityCount > 0,
  };
}

/**
 * Calculate completeness breakdown
 */
function calculateCompletenessBreakdown(factors: CompletenessFactors): CompletenessBreakdown {
  // Basics: photo + headline + bio (20 points)
  let basics = 0;
  if (factors.hasPhoto) basics += 7;
  if (factors.hasHeadline) basics += 7;
  if (factors.hasBio) basics += 6;

  // Skills (20 points)
  const skillsCoverage = Math.min(1, factors.skillsCount / COVERAGE_THRESHOLDS.minSkills);
  const skills = Math.round(skillsCoverage * COMPLETENESS_WEIGHTS.skills);

  // Experience (25 points)
  const expCoverage = Math.min(1, factors.experiencesCount / COVERAGE_THRESHOLDS.minExperiences);
  const experience = Math.round(expCoverage * COMPLETENESS_WEIGHTS.experience);

  // Projects (20 points)
  const projectsCoverage = Math.min(1, factors.projectsCount / COVERAGE_THRESHOLDS.minProjects);
  const projects = Math.round(projectsCoverage * COMPLETENESS_WEIGHTS.projects);

  // Education (10 points)
  const education = factors.hasEducation ? COMPLETENESS_WEIGHTS.education : 0;

  // Activity (5 points)
  const activity = factors.hasActivity ? COMPLETENESS_WEIGHTS.activity : 0;

  const total = basics + skills + experience + projects + education + activity;

  return {
    basics,
    skills,
    experience,
    projects,
    education,
    activity,
    total,
  };
}

// =============================================================================
// STRENGTH SCORE
// =============================================================================

/**
 * Calculate strength factors
 */
async function calculateStrengthFactors(
  profileId: string,
  data: ProfileData
): Promise<StrengthFactors> {
  return {
    clarity: calculateClarity(data),
    depth: calculateDepth(data),
    consistency: await calculateConsistency(profileId, data),
    differentiation: calculateDifferentiation(data),
    trust: calculateTrust(data),
  };
}

/**
 * Calculate clarity score (0-1)
 * Headline و Bio واضح‌اند؟
 */
function calculateClarity(data: ProfileData): number {
  let score = 0;

  // Headline clarity
  const headline = data.profile?.headline || '';
  if (headline.length >= 20 && headline.length <= 100) {
    score += 0.4; // Good length
  } else if (headline.length >= 10) {
    score += 0.2; // Acceptable
  }

  // Bio clarity
  const bio = data.profile?.bio || '';
  if (bio.length >= 100 && bio.length <= 500) {
    score += 0.4; // Good length
  } else if (bio.length >= 50) {
    score += 0.2; // Acceptable
  }

  // Has structured content (not just raw text)
  if (bio.includes('•') || bio.includes('-') || bio.includes('\n')) {
    score += 0.1; // Structured
  }

  // Has a clear value proposition in headline
  const valueWords = ['متخصص', 'توسعه‌دهنده', 'مدیر', 'طراح', 'مشاور', 'کارشناس'];
  if (valueWords.some((word) => headline.includes(word))) {
    score += 0.1;
  }

  return Math.min(1, score);
}

/**
 * Calculate depth score (0-1)
 * مهارت‌ها فقط اسم‌اند یا شواهد دارند؟
 */
function calculateDepth(data: ProfileData): number {
  let score = 0;

  // Skills with levels
  const skillsWithLevel = data.skills.filter((s) => s.level).length;
  const skillLevelRatio = data.skills.length > 0 ? skillsWithLevel / data.skills.length : 0;
  score += skillLevelRatio * 0.3;

  // Experiences with descriptions
  const expsWithDesc = data.experiences.filter(
    (e) => e.description && e.description.length > 30
  ).length;
  const expDescRatio = data.experiences.length > 0 ? expsWithDesc / data.experiences.length : 0;
  score += expDescRatio * 0.3;

  // Projects with URLs (proof of work)
  const projectsWithUrl = data.projects.filter((p) => p.url).length;
  const projectUrlRatio = data.projects.length > 0 ? projectsWithUrl / data.projects.length : 0;
  score += projectUrlRatio * 0.2;

  // Duration of experiences (longer = more depth)
  const hasLongExp = data.experiences.some((e) => {
    if (!e.start_date) return false;
    const start = new Date(e.start_date);
    const end = e.end_date ? new Date(e.end_date) : new Date();
    const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return months >= 12; // At least 1 year
  });
  if (hasLongExp) score += 0.2;

  return Math.min(1, score);
}

/**
 * Calculate consistency score (0-1)
 * نقش‌ها و مهارت‌ها هم‌خوانند؟
 */
async function calculateConsistency(
  profileId: string,
  data: ProfileData
): Promise<number> {
  let score = 0.5; // Base score

  // Check if skills align with experience titles
  const expTitles = data.experiences.map((e) => e.title.toLowerCase()).join(' ');
  const skillNames = data.skills.map((s) => s.name.toLowerCase());

  // Simple keyword matching
  const techKeywords = ['توسعه', 'برنامه', 'طراحی', 'مدیریت', 'بازاریابی', 'فروش'];
  const expCategory = techKeywords.find((k) => expTitles.includes(k));
  const hasMatchingSkills = skillNames.some((s) =>
    techKeywords.some((k) => s.includes(k) && expTitles.includes(k))
  );

  if (hasMatchingSkills) {
    score += 0.3;
  }

  // All experiences in same general field
  const uniqueCompanies = new Set(data.experiences.map((e) => e.company)).size;
  const expCount = data.experiences.length;
  if (expCount > 0 && uniqueCompanies <= expCount) {
    score += 0.1; // Not too scattered
  }

  // Education aligns with career
  if (data.educations.length > 0 && data.experiences.length > 0) {
    score += 0.1; // Has both = coherent path
  }

  return Math.min(1, score);
}

/**
 * Calculate differentiation score (0-1)
 * شبیه همه یا خاص؟
 */
function calculateDifferentiation(data: ProfileData): number {
  let score = 0.3; // Base score

  // Has projects (shows initiative)
  if (data.projects.length > 0) {
    score += 0.2;
  }

  // Has unique bio (not template-like)
  const bio = data.profile?.bio || '';
  const genericPhrases = ['علاقه‌مند به', 'فعال در زمینه', 'با تجربه در'];
  const hasGenericBio = genericPhrases.some((p) => bio.includes(p));
  if (bio.length > 100 && !hasGenericBio) {
    score += 0.2;
  }

  // Has diverse skills (not just basics)
  if (data.skills.length >= 5) {
    score += 0.15;
  }

  // Has social presence
  if (data.socialLinks.length >= 2) {
    score += 0.15;
  }

  return Math.min(1, score);
}

/**
 * Calculate trust score (0-1)
 * فعالیت، لینک، تایید؟
 */
function calculateTrust(data: ProfileData): number {
  let score = 0;

  // Has photo
  if (data.profile?.photo_url) {
    score += 0.25;
  }

  // Has contact info
  if (data.profile?.email || data.profile?.phone) {
    score += 0.2;
  }

  // Has website/portfolio
  if (data.profile?.website_url) {
    score += 0.15;
  }

  // Has social links (verifiable)
  if (data.socialLinks.length > 0) {
    score += 0.15;
  }

  // Has activity on platform
  if (data.activityCount > 0) {
    score += 0.15;
  }

  // Has multiple experiences (established career)
  if (data.experiences.length >= 2) {
    score += 0.1;
  }

  return Math.min(1, score);
}

/**
 * Calculate strength breakdown
 */
function calculateStrengthBreakdown(factors: StrengthFactors): StrengthBreakdown {
  const clarity = Math.round(factors.clarity * 100 * STRENGTH_WEIGHTS.clarity);
  const depth = Math.round(factors.depth * 100 * STRENGTH_WEIGHTS.depth);
  const consistency = Math.round(factors.consistency * 100 * STRENGTH_WEIGHTS.consistency);
  const differentiation = Math.round(factors.differentiation * 100 * STRENGTH_WEIGHTS.differentiation);
  const trust = Math.round(factors.trust * 100 * STRENGTH_WEIGHTS.trust);

  return {
    clarity,
    depth,
    consistency,
    differentiation,
    trust,
    total: clarity + depth + consistency + differentiation + trust,
  };
}

// =============================================================================
// CONTEXTUAL SCORES
// =============================================================================

/**
 * Calculate scores for each context
 */
function calculateContextualScores(
  completeness: CompletenessFactors,
  strength: StrengthFactors,
  data: ProfileData
): ContextualScore[] {
  const contexts: ProfileVersionContext[] = ['public', 'network', 'team', 'investor', 'job'];

  return contexts.map((context) => {
    const requirements = CONTEXT_REQUIREMENTS[context];
    const multipliers = CONTEXT_WEIGHT_MULTIPLIERS[context];

    let score = 0;
    let maxScore = 0;
    const missingElements: string[] = [];

    // Check each required block
    requirements.forEach((block) => {
      const multiplier = multipliers[block] || 1;
      const blockScore = getBlockScore(block, completeness, strength, data);
      const weightedMax = 20 * multiplier;

      score += blockScore * multiplier;
      maxScore += weightedMax;

      if (blockScore < 10) {
        missingElements.push(block);
      }
    });

    const normalizedScore = Math.round((score / maxScore) * 100);

    return {
      context,
      strength: normalizedScore,
      readiness: getReadinessLevel(normalizedScore),
      missingElements,
    };
  });
}

/**
 * Get score for a specific block
 */
function getBlockScore(
  block: ProfileBlock,
  completeness: CompletenessFactors,
  strength: StrengthFactors,
  data: ProfileData
): number {
  switch (block) {
    case 'basics':
      return (completeness.hasPhoto ? 7 : 0) +
        (completeness.hasHeadline ? 7 : 0) +
        (completeness.hasBio ? 6 : 0);
    case 'photo':
      return completeness.hasPhoto ? 20 : 0;
    case 'headline':
      return completeness.hasHeadline ? 20 * strength.clarity : 0;
    case 'bio':
      return completeness.hasBio ? 20 * strength.clarity : 0;
    case 'contact':
      return completeness.hasContact ? 20 : 0;
    case 'social':
      return Math.min(20, data.socialLinks.length * 7);
    case 'experience':
      return Math.min(20, completeness.experiencesCount * 10) * (0.5 + strength.depth * 0.5);
    case 'education':
      return completeness.hasEducation ? 20 : 0;
    case 'skills':
      return Math.min(20, completeness.skillsCount * 4);
    case 'projects':
      return Math.min(20, completeness.projectsCount * 20);
    case 'activity':
      return completeness.hasActivity ? 20 : 0;
    default:
      return 0;
  }
}

// =============================================================================
// SUGGESTIONS ENGINE
// =============================================================================

/**
 * Generate actionable improvement suggestions
 */
function generateSuggestions(
  completeness: CompletenessFactors,
  strength: StrengthFactors,
  completenessBreakdown: CompletenessBreakdown,
  strengthBreakdown: StrengthBreakdown
): ScoreSuggestion[] {
  const suggestions: ScoreSuggestion[] = [];

  // High impact: Photo
  if (!completeness.hasPhoto) {
    suggestions.push({
      type: 'add',
      target: 'photo',
      impact: 'high',
      estimatedGain: 7,
      message: 'اضافه کردن عکس پروفایل اعتماد را بالا می‌برد',
      priority: 1,
    });
  }

  // High impact: Headline
  if (!completeness.hasHeadline) {
    suggestions.push({
      type: 'add',
      target: 'headline',
      impact: 'high',
      estimatedGain: 7,
      message: 'یک تیتر حرفه‌ای بنویسید که کارتان را توضیح دهد',
      priority: 2,
    });
  } else if (strength.clarity < 0.5) {
    suggestions.push({
      type: 'improve',
      target: 'headline',
      impact: 'medium',
      estimatedGain: 5,
      message: 'تیتر را واضح‌تر و مشخص‌تر کنید',
      priority: 3,
    });
  }

  // Medium impact: Bio
  if (!completeness.hasBio) {
    suggestions.push({
      type: 'add',
      target: 'bio',
      impact: 'medium',
      estimatedGain: 6,
      message: 'یک معرفی کوتاه (حداقل ۵۰ کاراکتر) بنویسید',
      priority: 4,
    });
  }

  // High impact: Skills
  if (completeness.skillsCount < COVERAGE_THRESHOLDS.minSkills) {
    const needed = COVERAGE_THRESHOLDS.minSkills - completeness.skillsCount;
    suggestions.push({
      type: 'add',
      target: 'skills',
      impact: 'high',
      estimatedGain: Math.min(8, needed * 4),
      message: `${needed} مهارت دیگر اضافه کنید (حداقل ${COVERAGE_THRESHOLDS.minSkills} مهارت)`,
      priority: 5,
    });
  }

  // High impact: Experience
  if (completeness.experiencesCount < COVERAGE_THRESHOLDS.minExperiences) {
    suggestions.push({
      type: 'add',
      target: 'experience',
      impact: 'high',
      estimatedGain: 12,
      message: 'سوابق کاری خود را اضافه کنید',
      priority: 6,
    });
  } else if (strength.depth < 0.5) {
    suggestions.push({
      type: 'improve',
      target: 'experience',
      impact: 'medium',
      estimatedGain: 8,
      message: 'توضیحات بیشتری به سوابق کاری اضافه کنید',
      priority: 7,
    });
  }

  // Medium impact: Projects
  if (completeness.projectsCount < COVERAGE_THRESHOLDS.minProjects) {
    suggestions.push({
      type: 'add',
      target: 'projects',
      impact: 'medium',
      estimatedGain: 10,
      message: 'یک پروژه نمونه اضافه کنید تا کارتان را نشان دهد',
      priority: 8,
    });
  }

  // Low impact: Education
  if (!completeness.hasEducation) {
    suggestions.push({
      type: 'add',
      target: 'education',
      impact: 'low',
      estimatedGain: 5,
      message: 'تحصیلات خود را اضافه کنید',
      priority: 9,
    });
  }

  // Medium impact: Social links
  if (strength.trust < 0.5) {
    suggestions.push({
      type: 'add',
      target: 'social',
      impact: 'medium',
      estimatedGain: 5,
      message: 'لینک شبکه‌های اجتماعی اضافه کنید (LinkedIn، GitHub، ...)',
      priority: 10,
    });
  }

  // Sort by priority and return top 5
  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get score for a specific context
 */
export async function getContextScore(
  profileId: string,
  context: ProfileVersionContext
): Promise<ContextualScore | null> {
  const score = await calculateProfileScore(profileId);
  return score.contextScores.find((cs) => cs.context === context) || null;
}

/**
 * Check if profile is ready for a specific context
 */
export async function isProfileReadyForContext(
  profileId: string,
  context: ProfileVersionContext
): Promise<{ ready: boolean; score: number; missing: string[] }> {
  const contextScore = await getContextScore(profileId, context);

  if (!contextScore) {
    return { ready: false, score: 0, missing: [] };
  }

  return {
    ready: contextScore.readiness === 'ready',
    score: contextScore.strength,
    missing: contextScore.missingElements,
  };
}

/**
 * Get improvement estimate for a suggestion
 */
export function estimateImprovement(
  currentScore: ProfileScore,
  suggestion: ScoreSuggestion
): number {
  return Math.min(100, currentScore.completeness + suggestion.estimatedGain);
}
