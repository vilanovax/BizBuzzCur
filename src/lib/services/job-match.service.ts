/**
 * Job Match Service
 *
 * Provides "Why this job?" insights by analyzing
 * user signals against job requirements.
 *
 * This is an EXPLANATION ENGINE, not a recommender.
 * It explains WHY a job might be relevant, never says "good" or "bad".
 *
 * Architectural rules:
 * - Stateless service (no DB access)
 * - No dependency on UI
 * - No personality labels exposed (DISC, MBTI, etc.)
 * - Pure function: input → output
 */

import type { Signal } from '@/modules/personality-engine/contracts/signal.schema';
import {
  JobAdapter,
  type JobArchetype,
  type JobSignalRequirement,
} from '@/modules/personality-engine/adapters/job.adapter';
import type { JobAdWithDetails, EmploymentType, LocationType, ExperienceLevel } from '@/types/job';
import { getJobSignalWeights, toJobSignalRequirements } from './job-signal-weight.service';

/**
 * Work environment context
 */
export type WorkMode = 'remote' | 'onsite' | 'hybrid';
export type TeamSize = 'solo' | 'small' | 'medium' | 'large';
export type Environment = 'startup' | 'enterprise' | 'agency' | 'unknown';

/**
 * Context for matching a job
 */
export interface JobContext {
  /** Job archetype for personality matching */
  archetype?: JobArchetype;
  /** Job domain/industry */
  domain?: string;
  /** User's skills that match job requirements */
  matchingSkills?: string[];
  /** Employment type */
  employmentType?: EmploymentType;
  /** Location type / work mode */
  locationType?: LocationType;
  /** Experience level */
  experienceLevel?: ExperienceLevel;
  /** Work mode derived from location type */
  workMode?: WorkMode;
  /** Team size (inferred from company size) */
  teamSize?: TeamSize;
  /** Work environment (startup/enterprise/agency) */
  environment?: Environment;
}

/**
 * Result of job matching
 */
export interface JobMatchResult {
  /** Whether we have personality-based insights */
  hasPersonalityMatch: boolean;
  /** Match score (0-100), only if personality data exists. INTERNAL use only. */
  score?: number;
  /** Positive, human-readable reasons (2-3 max) */
  reasons: string[];
  /** Informational warnings (0-1 max, never blocking) */
  warnings: string[];
  /** Summary message for UI */
  summary: string;
  /** Match type for UI styling */
  matchType: 'personality' | 'skills' | 'domain' | 'generic';
  /** Confidence in the match (0-1), affects reason strength */
  confidence?: number;
}

/**
 * Infer team size from company size
 */
function inferTeamSize(companySize?: string | null): TeamSize {
  if (!companySize) return 'small';

  const size = companySize.toLowerCase();
  if (size.includes('1-10') || size.includes('solo') || size.includes('۱-۱۰')) {
    return 'solo';
  }
  if (size.includes('11-50') || size.includes('۱۱-۵۰') || size === 'small') {
    return 'small';
  }
  if (size.includes('51-200') || size.includes('۵۱-۲۰۰') || size === 'medium') {
    return 'medium';
  }
  return 'large'; // 200+
}

/**
 * Infer environment from company/job context
 */
function inferEnvironment(job: JobAdWithDetails): Environment {
  const description = (job.description || '').toLowerCase();
  const industry = (job.company?.industry || '').toLowerCase();

  // Startup signals
  if (
    description.includes('استارتاپ') ||
    description.includes('startup') ||
    industry.includes('startup') ||
    description.includes('سریع رشد')
  ) {
    return 'startup';
  }

  // Enterprise signals
  if (
    description.includes('سازمان') ||
    description.includes('enterprise') ||
    description.includes('corporate') ||
    industry.includes('bank') ||
    industry.includes('insurance')
  ) {
    return 'enterprise';
  }

  // Agency signals
  if (
    description.includes('آژانس') ||
    description.includes('agency') ||
    industry.includes('marketing') ||
    industry.includes('advertising')
  ) {
    return 'agency';
  }

  return 'unknown';
}

/**
 * Infer work mode from location type
 */
function inferWorkMode(locationType?: LocationType | null): WorkMode {
  if (!locationType) return 'onsite';
  return locationType as WorkMode;
}

/**
 * Infer job archetype from job details
 */
function inferJobArchetype(job: JobAdWithDetails): JobArchetype {
  const title = job.title.toLowerCase();
  const description = (job.description || '').toLowerCase();
  const combined = `${title} ${description}`;

  // Leadership roles
  if (
    combined.includes('مدیر') ||
    combined.includes('manager') ||
    combined.includes('lead') ||
    combined.includes('head') ||
    combined.includes('director') ||
    combined.includes('سرپرست')
  ) {
    return 'leadership';
  }

  // Creative roles
  if (
    combined.includes('طراح') ||
    combined.includes('designer') ||
    combined.includes('creative') ||
    combined.includes('artist') ||
    combined.includes('ux') ||
    combined.includes('ui')
  ) {
    return 'creative';
  }

  // Analytical roles
  if (
    combined.includes('تحلیل') ||
    combined.includes('analyst') ||
    combined.includes('data') ||
    combined.includes('research') ||
    combined.includes('scientist')
  ) {
    return 'analytical';
  }

  // Sales roles
  if (
    combined.includes('فروش') ||
    combined.includes('sales') ||
    combined.includes('business development') ||
    combined.includes('account')
  ) {
    return 'sales';
  }

  // Support roles
  if (
    combined.includes('پشتیبان') ||
    combined.includes('support') ||
    combined.includes('customer') ||
    combined.includes('hr') ||
    combined.includes('منابع انسانی')
  ) {
    return 'support';
  }

  // Operations roles
  if (
    combined.includes('عملیات') ||
    combined.includes('operations') ||
    combined.includes('admin') ||
    combined.includes('coordinator')
  ) {
    return 'operations';
  }

  // Default to analytical for tech roles
  if (
    combined.includes('توسعه') ||
    combined.includes('developer') ||
    combined.includes('engineer') ||
    combined.includes('برنامه')
  ) {
    return 'analytical';
  }

  return 'operations'; // Default fallback
}

/**
 * Build full job context from job details
 */
function buildJobContext(job: JobAdWithDetails): JobContext {
  return {
    archetype: inferJobArchetype(job),
    domain: job.domain?.name_fa,
    locationType: job.location_type || undefined,
    employmentType: job.employment_type || undefined,
    experienceLevel: job.experience_level || undefined,
    workMode: inferWorkMode(job.location_type),
    teamSize: inferTeamSize(job.company?.company_size),
    environment: inferEnvironment(job),
  };
}

/**
 * Match a user against a job
 *
 * Priority order:
 * 1. Personality signals (if available)
 * 2. Skill match (if skills overlap)
 * 3. Domain match (if same field)
 * 4. Generic fallback
 */
export function matchJob(
  userSignals: Signal[] | null,
  job: JobAdWithDetails,
  matchingSkills?: string[]
): JobMatchResult {
  // Build full context
  const context = buildJobContext(job);

  // Case 1: User has personality signals
  if (userSignals && userSignals.length > 0) {
    return matchWithPersonality(userSignals, job, context, matchingSkills);
  }

  // Case 2: User has matching skills
  if (matchingSkills && matchingSkills.length > 0) {
    return matchWithSkills(job, matchingSkills);
  }

  // Case 3: Match by domain only
  if (job.domain?.name_fa) {
    return matchWithDomain(job);
  }

  // Case 4: Generic fallback
  return genericMatch(job);
}

/**
 * Match using personality signals with weighted confidence
 *
 * Algorithm:
 * 1. Get signal weights from job context (Phase 1 derived + Phase 2 explicit)
 * 2. Fall back to archetype requirements if no specific weights
 * 3. Match each user signal against requirements
 * 4. Weight by importance * confidence
 * 5. Generate human-readable reasons (never mention tests/algorithms)
 * 6. Add warnings for potential friction (never blocking)
 */
function matchWithPersonality(
  signals: Signal[],
  job: JobAdWithDetails,
  context: JobContext,
  matchingSkills?: string[]
): JobMatchResult {
  // Use new signal weight service for better matching
  const weightMap = getJobSignalWeights(job);
  let requirements: JobSignalRequirement[];

  // If we have meaningful weights from Phase 1/2 data, use them
  const jobRequirements = toJobSignalRequirements(weightMap);
  if (jobRequirements.length > 0) {
    requirements = jobRequirements;
  } else {
    // Fall back to archetype-based requirements
    const archetype = context.archetype || 'operations';
    requirements = JobAdapter.getArchetypeRequirements(archetype);
  }

  const match = JobAdapter.matchCandidateToJob(signals, requirements);

  const reasons: string[] = [];
  const warnings: string[] = [];

  // Add personality-based reasons (max 2)
  // These reasons should NEVER mention tests or algorithms
  if (match.strengthReasons.length > 0) {
    reasons.push(...match.strengthReasons.slice(0, 2));
  }

  // Add skill-based reasons if available
  if (matchingSkills && matchingSkills.length > 0) {
    if (matchingSkills.length === 1) {
      reasons.push(`تجربه شما در ${matchingSkills[0]}`);
    } else if (matchingSkills.length === 2) {
      reasons.push(`مهارت‌های ${matchingSkills[0]} و ${matchingSkills[1]}`);
    } else {
      reasons.push(`${matchingSkills.length} مهارت مرتبط با این موقعیت`);
    }
  }

  // Add domain reason if space available
  if (job.domain?.name_fa && reasons.length < 3) {
    reasons.push(`فعالیت در حوزه ${job.domain.name_fa}`);
  }

  // Add work mode context if relevant
  if (context.workMode === 'remote' && reasons.length < 3) {
    reasons.push('امکان دورکاری');
  }

  // Generate warnings (max 1, informational only)
  // These should be constructive, never judgmental
  // Friction reasons are already framed as opportunities by the adapter
  if (match.frictionReasons.length > 0 && match.confidence >= 0.6) {
    // Only show warning if we're confident about the signal
    warnings.push(match.frictionReasons[0]);
  }

  // Generate summary based on score
  // Never expose exact percentages to users
  let summary: string;
  if (match.overallScore >= 75) {
    summary = 'این موقعیت با سبک کاری شما تناسب بالایی دارد';
  } else if (match.overallScore >= 55) {
    summary = 'ویژگی‌های کاری شما با نیازهای این نقش همخوانی دارد';
  } else {
    summary = 'این موقعیت می‌تواند چالش‌های رشد جدیدی برای شما ایجاد کند';
  }

  return {
    hasPersonalityMatch: true,
    score: match.overallScore,
    reasons: reasons.slice(0, 3),
    warnings: warnings.slice(0, 1),
    summary,
    matchType: 'personality',
    confidence: match.confidence,
  };
}

/**
 * Match using skills only (fallback when no personality data)
 */
function matchWithSkills(
  job: JobAdWithDetails,
  matchingSkills: string[]
): JobMatchResult {
  const reasons: string[] = [];

  if (matchingSkills.length === 1) {
    reasons.push(`تجربه شما در ${matchingSkills[0]} با نیاز این موقعیت مطابقت دارد`);
  } else if (matchingSkills.length <= 3) {
    reasons.push(`مهارت‌های ${matchingSkills.join('، ')} شما`);
  } else {
    reasons.push(`${matchingSkills.length} مهارت مشترک با نیازمندی‌های شغل`);
  }

  if (job.domain?.name_fa) {
    reasons.push(`فعالیت در حوزه ${job.domain.name_fa}`);
  }

  if (job.location_type === 'remote') {
    reasons.push('امکان دورکاری');
  }

  return {
    hasPersonalityMatch: false,
    reasons: reasons.slice(0, 3),
    warnings: [], // No warnings without personality data
    summary: 'مهارت‌های شما با نیازهای این موقعیت همخوانی دارد',
    matchType: 'skills',
  };
}

/**
 * Match using domain only (fallback when no skills match)
 */
function matchWithDomain(job: JobAdWithDetails): JobMatchResult {
  const reasons: string[] = [
    `این موقعیت در حوزه ${job.domain!.name_fa} است`,
  ];

  if (job.location_type === 'remote') {
    reasons.push('امکان دورکاری');
  }

  return {
    hasPersonalityMatch: false,
    reasons,
    warnings: [],
    summary: `این موقعیت در حوزه ${job.domain!.name_fa} است که با پروفایل شما مرتبط است`,
    matchType: 'domain',
  };
}

/**
 * Generic fallback when no data available
 */
function genericMatch(job: JobAdWithDetails): JobMatchResult {
  const reasons: string[] = [];

  if (job.company?.name) {
    reasons.push(`فرصت همکاری با ${job.company.name}`);
  }

  if (job.location_type === 'remote') {
    reasons.push('امکان دورکاری');
  } else if (job.location_type === 'hybrid') {
    reasons.push('مدل کاری ترکیبی');
  }

  return {
    hasPersonalityMatch: false,
    reasons,
    warnings: [],
    summary: 'شما از طریق جستجو یا صفحه شرکت به این آگهی دسترسی پیدا کردید',
    matchType: 'generic',
  };
}

/**
 * Calculate matching skills between user and job
 */
export function findMatchingSkills(
  userSkills: string[],
  jobRequiredSkills: string[],
  jobPreferredSkills: string[]
): string[] {
  const userSkillsLower = userSkills.map((s) => s.toLowerCase());
  const allJobSkills = [...jobRequiredSkills, ...jobPreferredSkills];

  return allJobSkills.filter((skill) =>
    userSkillsLower.some(
      (userSkill) =>
        userSkill === skill.toLowerCase() ||
        skill.toLowerCase().includes(userSkill) ||
        userSkill.includes(skill.toLowerCase())
    )
  );
}
