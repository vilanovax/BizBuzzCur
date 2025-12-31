/**
 * Candidate Match Service
 *
 * Provides "Why this candidate?" insights for hiring teams.
 *
 * This is an EXPLANATION ENGINE, not a scorer.
 * It explains WHY a candidate may align with a role.
 * It does NOT rank, score, or recommend decisions.
 *
 * The final decision is always human.
 *
 * Architectural rules:
 * - Stateless service (no DB access)
 * - No dependency on UI
 * - No personality labels exposed (DISC, MBTI, etc.)
 * - No percentages or scores shown
 * - Bias-safe and ethics-compliant
 * - Pure function: input → output
 */

import type { Signal } from '@/modules/personality-engine/contracts/signal.schema';
import type { JobArchetype } from '@/modules/personality-engine/adapters/job.adapter';

/**
 * Job context for matching
 */
export interface JobContextForCandidate {
  /** Job archetype */
  archetype?: JobArchetype;
  /** Work mode */
  workMode?: 'remote' | 'onsite' | 'hybrid';
  /** Team size */
  teamSize?: 'solo' | 'small' | 'medium' | 'large';
  /** Work environment */
  environment?: 'startup' | 'enterprise' | 'agency' | 'unknown';
  /** Role title for context */
  roleTitle?: string;
  /** Key requirements */
  keyRequirements?: string[];
}

/**
 * Candidate context
 */
export interface CandidateContext {
  /** Candidate's signals (abstract, never exposed) */
  signals: Signal[];
  /** Matching skills */
  matchingSkills?: string[];
  /** Cover message (if provided) */
  hasCoverMessage?: boolean;
}

/**
 * Result of candidate matching
 * This is what hiring teams see
 */
export interface CandidateFitResult {
  /** Whether we have signal-based insights */
  hasSignalInsights: boolean;
  /** Top-line summary (one sentence, neutral) */
  fitSummary: string;
  /** Positive alignments (2-3 max) */
  strengths: string[];
  /** Soft considerations (0-2 max, never blocking) */
  considerations: string[];
  /** Confidence note (only if low confidence) */
  confidenceNote?: string;
  /** Type of insights available */
  insightType: 'signals' | 'skills' | 'application';
}

/**
 * Signal to strength mapping
 * Maps abstract signals to role-specific strengths
 * NEVER mentions personality tests or labels
 */
const SIGNAL_STRENGTHS: Record<string, (roleContext: string) => string> = {
  // Decision & Leadership
  leadership_tendency: (role) => `توانایی هدایت و مدیریت که با نیازهای ${role} همخوانی دارد`,
  decision_style: (role) => `رویکرد تحلیلی در تصمیم‌گیری متناسب با ${role}`,
  risk_tolerance: (role) => `آمادگی برای پذیرش چالش‌های جدید در ${role}`,

  // Collaboration & Communication
  collaboration_style: (role) => `سبک همکاری تیمی مناسب برای ${role}`,
  social_energy: (role) => `مهارت در تعامل و ارتباط مؤثر در ${role}`,
  communication_style: (role) => `سبک ارتباطی متناسب با نیازهای ${role}`,
  conflict_approach: (role) => `توانایی مدیریت سازنده تعارض در محیط ${role}`,

  // Work Style
  structure_preference: (role) => `علاقه به کار منظم که با ساختار ${role} همخوانی دارد`,
  autonomy_need: (role) => `توانایی کار مستقل متناسب با استقلال ${role}`,
  detail_orientation: (role) => `دقت بالا و توجه به جزئیات مورد نیاز ${role}`,
  task_approach: (role) => `رویکرد اجرایی متناسب با نیازهای ${role}`,

  // Environment & Pace
  pace_preference: (role) => `سازگاری با ریتم کاری ${role}`,
  change_adaptability: (role) => `انعطاف در برابر تغییرات محیط ${role}`,
  routine_preference: (role) => `تطابق با ماهیت کاری ${role}`,
  noise_tolerance: (role) => `سازگاری با محیط کاری ${role}`,

  // Motivation
  achievement_drive: (role) => `انگیزه قوی برای دستیابی به اهداف ${role}`,
  recognition_need: (role) => `انگیزه مناسب برای محیط ${role}`,
};

/**
 * Signal to consideration mapping
 * Framed as growth opportunities, never as weaknesses
 */
const SIGNAL_CONSIDERATIONS: Record<string, (roleContext: string) => string> = {
  social_energy: (role) => `${role} شامل تعاملات مکرر است که ممکن است نیاز به سازگاری داشته باشد`,
  pace_preference: (role) => `محیط پرسرعت ${role} ممکن است چالش‌برانگیزتر باشد`,
  structure_preference: (role) => `ساختار ${role} ممکن است متفاوت از ترجیحات کاری باشد`,
  autonomy_need: (role) => `سطح استقلال در ${role} ممکن است متفاوت باشد`,
  collaboration_style: (role) => `${role} شامل همکاری‌های متنوع است که ممکن است نیاز به تطابق داشته باشد`,
  change_adaptability: (role) => `تغییرات مکرر در ${role} ممکن است نیاز به انعطاف بیشتر داشته باشد`,
};

/**
 * Match a candidate against a job
 * Returns explanation for hiring team
 *
 * IMPORTANT: This does NOT score or rank candidates
 * It provides context for human decision-making
 */
export function matchCandidate(
  candidate: CandidateContext,
  job: JobContextForCandidate
): CandidateFitResult {
  const roleContext = job.roleTitle || 'این نقش';

  // Case 1: Candidate has personality signals
  if (candidate.signals && candidate.signals.length > 0) {
    return matchWithSignals(candidate, job, roleContext);
  }

  // Case 2: Candidate has matching skills
  if (candidate.matchingSkills && candidate.matchingSkills.length > 0) {
    return matchWithSkills(candidate, job, roleContext);
  }

  // Case 3: Application-only fallback
  return applicationOnlyMatch(candidate, job, roleContext);
}

/**
 * Match using abstract signals
 * Never exposes raw signals or labels
 */
function matchWithSignals(
  candidate: CandidateContext,
  job: JobContextForCandidate,
  roleContext: string
): CandidateFitResult {
  const signals = candidate.signals;
  const strengths: string[] = [];
  const considerations: string[] = [];
  let totalConfidence = 0;

  // Analyze signals and generate strengths
  for (const signal of signals) {
    totalConfidence += signal.confidence;

    // High alignment (value > 0.5 and confidence > 0.5) → strength
    if (signal.value > 0.5 && signal.confidence > 0.5) {
      const strengthFn = SIGNAL_STRENGTHS[signal.id];
      if (strengthFn && strengths.length < 3) {
        strengths.push(strengthFn(roleContext));
      }
    }

    // Potential friction (value < -0.3 and confidence > 0.6) → consideration
    if (signal.value < -0.3 && signal.confidence > 0.6) {
      const considerationFn = SIGNAL_CONSIDERATIONS[signal.id];
      if (considerationFn && considerations.length < 2) {
        considerations.push(considerationFn(roleContext));
      }
    }
  }

  // Add skill-based strengths if available
  if (candidate.matchingSkills && candidate.matchingSkills.length > 0 && strengths.length < 3) {
    if (candidate.matchingSkills.length === 1) {
      strengths.push(`تجربه در ${candidate.matchingSkills[0]} که با نیازهای ${roleContext} مرتبط است`);
    } else {
      strengths.push(`مهارت‌های مرتبط شامل ${candidate.matchingSkills.slice(0, 2).join(' و ')}`);
    }
  }

  // Calculate average confidence
  const avgConfidence = signals.length > 0 ? totalConfidence / signals.length : 0;

  // Generate fit summary
  const fitSummary = generateFitSummary(strengths.length, considerations.length, roleContext);

  // Confidence note only if low
  const confidenceNote = avgConfidence < 0.5
    ? 'این بینش‌ها بر اساس اطلاعات محدود هستند و باید به عنوان زمینه تکمیلی استفاده شوند.'
    : undefined;

  return {
    hasSignalInsights: true,
    fitSummary,
    strengths: strengths.slice(0, 3),
    considerations: considerations.slice(0, 2),
    confidenceNote,
    insightType: 'signals',
  };
}

/**
 * Match using skills only
 */
function matchWithSkills(
  candidate: CandidateContext,
  job: JobContextForCandidate,
  roleContext: string
): CandidateFitResult {
  const skills = candidate.matchingSkills || [];
  const strengths: string[] = [];

  if (skills.length === 1) {
    strengths.push(`تجربه در ${skills[0]} که با نیازهای ${roleContext} همخوانی دارد`);
  } else if (skills.length === 2) {
    strengths.push(`مهارت‌های ${skills[0]} و ${skills[1]} مرتبط با ${roleContext}`);
  } else if (skills.length > 2) {
    strengths.push(`${skills.length} مهارت مشترک با نیازمندی‌های ${roleContext}`);
  }

  // Add context about application
  if (candidate.hasCoverMessage) {
    strengths.push('پیام همراه ارسال شده که نشان‌دهنده علاقه به این موقعیت است');
  }

  return {
    hasSignalInsights: false,
    fitSummary: `این کاربر بر اساس مهارت‌ها و تجربه مرتبط برای ${roleContext} درخواست داده است.`,
    strengths,
    considerations: [],
    insightType: 'skills',
  };
}

/**
 * Fallback when no signals or skills
 */
function applicationOnlyMatch(
  candidate: CandidateContext,
  job: JobContextForCandidate,
  roleContext: string
): CandidateFitResult {
  const strengths: string[] = [];

  if (candidate.hasCoverMessage) {
    strengths.push('پیام همراه ارسال شده که نشان‌دهنده علاقه به این موقعیت است');
  }

  return {
    hasSignalInsights: false,
    fitSummary: `این کاربر برای ${roleContext} درخواست داده است. برای ارزیابی بیشتر، پروفایل را بررسی کنید.`,
    strengths,
    considerations: [],
    insightType: 'application',
  };
}

/**
 * Generate neutral fit summary
 * NEVER uses scores, percentages, or recommendations
 */
function generateFitSummary(
  strengthCount: number,
  considerationCount: number,
  roleContext: string
): string {
  if (strengthCount >= 2 && considerationCount === 0) {
    return `ترجیحات کاری این کاربر با نیازهای ${roleContext} همخوانی خوبی دارد.`;
  }

  if (strengthCount >= 1 && considerationCount <= 1) {
    return `ترجیحات کاری این کاربر با برخی جنبه‌های ${roleContext} همخوانی دارد.`;
  }

  if (considerationCount >= 1) {
    return `این کاربر ممکن است نیاز به سازگاری با برخی جنبه‌های ${roleContext} داشته باشد.`;
  }

  return `اطلاعات محدودی برای ارزیابی همخوانی با ${roleContext} در دسترس است.`;
}

/**
 * Build job context from job details
 */
export function buildJobContextForCandidate(job: {
  title?: string;
  location_type?: string;
  company_size?: string;
  environment?: string;
  required_skills?: string[];
}): JobContextForCandidate {
  return {
    roleTitle: job.title || 'این نقش',
    workMode: (job.location_type as 'remote' | 'onsite' | 'hybrid') || 'onsite',
    keyRequirements: job.required_skills || [],
  };
}
