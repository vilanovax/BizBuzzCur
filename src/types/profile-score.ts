/**
 * Profile Strength & Completeness Score Types
 *
 * «پروفایل تو چقدر قوی، قابل اعتماد و قابل ارائه است — و برای چه موقعیتی؟»
 *
 * Two separate scores:
 * 1. Completeness Score - آیا اجزای لازم وجود دارند؟
 * 2. Strength Score - آیا آنچه وجود دارد، قوی و معنادار است؟
 *
 * These two are NEVER the same.
 */

import type { ProfileVersionContext } from './profile-version';

// =============================================================================
// CORE SCORE TYPES
// =============================================================================

/**
 * Readiness level for a context
 */
export type ReadinessLevel = 'ready' | 'almost' | 'weak';

/**
 * Suggestion impact level
 */
export type SuggestionImpact = 'low' | 'medium' | 'high';

/**
 * Suggestion action type
 */
export type SuggestionType = 'add' | 'improve' | 'highlight';

/**
 * Profile block for targeting suggestions
 */
export type ProfileBlock =
  | 'basics'
  | 'photo'
  | 'headline'
  | 'bio'
  | 'contact'
  | 'social'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'activity';

// =============================================================================
// COMPLETENESS SCORE
// =============================================================================

/**
 * Completeness factors - structural presence
 */
export interface CompletenessFactors {
  hasPhoto: boolean;
  hasHeadline: boolean;
  hasBio: boolean;
  hasContact: boolean;
  skillsCount: number;
  experiencesCount: number;
  projectsCount: number;
  hasEducation: boolean;
  hasActivity: boolean;
}

/**
 * Completeness breakdown by category
 */
export interface CompletenessBreakdown {
  basics: number;        // 0-20: photo, headline, bio
  skills: number;        // 0-20: skill coverage
  experience: number;    // 0-25: work experience
  projects: number;      // 0-20: portfolio
  education: number;     // 0-10: education history
  activity: number;      // 0-5: platform activity
  total: number;         // 0-100
}

// =============================================================================
// STRENGTH SCORE
// =============================================================================

/**
 * Strength dimensions - quality & meaning
 */
export interface StrengthFactors {
  clarity: number;         // 0-1: وضوح روایت - headline و bio واضح‌اند؟
  depth: number;           // 0-1: عمق تجربه - مهارت‌ها شواهد دارند؟
  consistency: number;     // 0-1: انسجام - نقش‌ها و مهارت‌ها هم‌خوانند؟
  differentiation: number; // 0-1: تمایز - شبیه همه یا خاص؟
  trust: number;           // 0-1: اعتماد - فعالیت، لینک، تایید؟
}

/**
 * Strength breakdown with weights applied
 */
export interface StrengthBreakdown {
  clarity: number;         // 0-25
  depth: number;           // 0-25
  consistency: number;     // 0-20
  differentiation: number; // 0-15
  trust: number;           // 0-15
  total: number;           // 0-100
}

// =============================================================================
// CONTEXTUAL SCORES
// =============================================================================

/**
 * Score for a specific context/version
 */
export interface ContextualScore {
  context: ProfileVersionContext;
  strength: number;           // 0-100
  readiness: ReadinessLevel;
  missingElements: string[];  // What's missing for this context
}

// =============================================================================
// SUGGESTIONS
// =============================================================================

/**
 * Actionable improvement suggestion
 */
export interface ScoreSuggestion {
  type: SuggestionType;
  target: ProfileBlock;
  impact: SuggestionImpact;
  estimatedGain: number;      // Estimated score improvement
  message: string;
  priority: number;           // 1 = highest priority
}

// =============================================================================
// MAIN PROFILE SCORE
// =============================================================================

/**
 * Complete profile score
 */
export interface ProfileScore {
  profileId: string;

  // Main scores
  completeness: number;       // 0-100
  strength: number;           // 0-100

  // Breakdowns
  completenessBreakdown: CompletenessBreakdown;
  strengthBreakdown: StrengthBreakdown;

  // Context-specific
  contextScores: ContextualScore[];

  // Actionable
  suggestions: ScoreSuggestion[];

  // Metadata
  updatedAt: string;
}

/**
 * Simplified score for display
 */
export interface ProfileScoreSummary {
  completeness: number;
  strength: number;
  overallReadiness: ReadinessLevel;
  topSuggestion?: ScoreSuggestion;
}

// =============================================================================
// SCORE WEIGHTS
// =============================================================================

/**
 * Completeness weights
 */
export const COMPLETENESS_WEIGHTS = {
  basics: 20,      // photo + headline + bio
  skills: 20,
  experience: 25,
  projects: 20,
  education: 10,
  activity: 5,
} as const;

/**
 * Strength weights
 */
export const STRENGTH_WEIGHTS = {
  clarity: 0.25,
  depth: 0.25,
  consistency: 0.20,
  differentiation: 0.15,
  trust: 0.15,
} as const;

/**
 * Minimum thresholds for good coverage
 */
export const COVERAGE_THRESHOLDS = {
  minSkills: 5,
  minExperiences: 2,
  minProjects: 1,
  minBioLength: 50,
  minHeadlineLength: 10,
} as const;

/**
 * Readiness thresholds
 */
export const READINESS_THRESHOLDS = {
  ready: 70,
  almost: 40,
  weak: 0,
} as const;

export function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= READINESS_THRESHOLDS.ready) return 'ready';
  if (score >= READINESS_THRESHOLDS.almost) return 'almost';
  return 'weak';
}

// =============================================================================
// LABELS (Persian)
// =============================================================================

export const READINESS_LABELS: Record<ReadinessLevel, string> = {
  ready: 'آماده',
  almost: 'تقریباً آماده',
  weak: 'نیاز به کار',
};

export const READINESS_COLORS: Record<ReadinessLevel, string> = {
  ready: 'green',
  almost: 'yellow',
  weak: 'orange',
};

export const SUGGESTION_TYPE_LABELS: Record<SuggestionType, string> = {
  add: 'اضافه کردن',
  improve: 'بهبود',
  highlight: 'پررنگ کردن',
};

export const SUGGESTION_IMPACT_LABELS: Record<SuggestionImpact, string> = {
  low: 'تأثیر کم',
  medium: 'تأثیر متوسط',
  high: 'تأثیر زیاد',
};

export const PROFILE_BLOCK_LABELS: Record<ProfileBlock, string> = {
  basics: 'اطلاعات پایه',
  photo: 'عکس پروفایل',
  headline: 'تیتر',
  bio: 'معرفی',
  contact: 'اطلاعات تماس',
  social: 'شبکه‌های اجتماعی',
  experience: 'سوابق کاری',
  education: 'تحصیلات',
  skills: 'مهارت‌ها',
  projects: 'پروژه‌ها',
  activity: 'فعالیت',
};

export const STRENGTH_DIMENSION_LABELS: Record<keyof StrengthFactors, string> = {
  clarity: 'وضوح روایت',
  depth: 'عمق تجربه',
  consistency: 'انسجام',
  differentiation: 'تمایز',
  trust: 'قابل اعتماد بودن',
};

export const STRENGTH_DIMENSION_DESCRIPTIONS: Record<keyof StrengthFactors, string> = {
  clarity: 'Headline و Bio واضح‌اند؟',
  depth: 'مهارت‌ها فقط اسم‌اند یا شواهد دارند؟',
  consistency: 'نقش‌ها و مهارت‌ها هم‌خوانند؟',
  differentiation: 'شبیه همه یا خاص؟',
  trust: 'فعالیت، لینک، تایید؟',
};

// =============================================================================
// UX COPY (Persian)
// =============================================================================

export const PROFILE_SCORE_COPY = {
  dashboard: {
    title: 'سلامت پروفایل',
    completenessLabel: 'تکمیل‌بودن',
    strengthLabel: 'قدرت',
    improveButton: 'بهبود پروفایل',
  },
  detail: {
    title: 'جزئیات امتیاز',
    strongBecause: 'قوی چون:',
    canImprove: 'قابل بهبود:',
  },
  contextual: {
    title: 'آمادگی برای هر موقعیت',
    versionStrength: 'قدرت نسخه',
  },
  suggestions: {
    title: 'پیشنهادات بهبود',
    impactLabel: 'تأثیر',
    gainLabel: 'امتیاز',
  },
  empty: {
    noSuggestions: 'پروفایل شما کامل است!',
  },
};

// =============================================================================
// CONTEXT-SPECIFIC REQUIREMENTS
// =============================================================================

/**
 * What's important for each context
 */
export const CONTEXT_REQUIREMENTS: Record<ProfileVersionContext, ProfileBlock[]> = {
  public: ['basics', 'headline', 'bio', 'photo', 'skills'],
  network: ['basics', 'headline', 'skills', 'experience', 'social'],
  team: ['basics', 'skills', 'projects', 'experience'],
  investor: ['basics', 'headline', 'experience', 'projects', 'education'],
  job: ['basics', 'headline', 'experience', 'skills', 'education'],
  custom: ['basics', 'headline'],
};

/**
 * Weight multipliers for context-specific scoring
 */
export const CONTEXT_WEIGHT_MULTIPLIERS: Record<ProfileVersionContext, Partial<Record<ProfileBlock, number>>> = {
  public: { headline: 1.5, bio: 1.5, photo: 1.3 },
  network: { skills: 1.5, social: 1.3, experience: 1.2 },
  team: { projects: 1.5, skills: 1.3, experience: 1.2 },
  investor: { experience: 1.5, projects: 1.3, education: 1.2 },
  job: { experience: 1.5, skills: 1.3, education: 1.2 },
  custom: {},
};
