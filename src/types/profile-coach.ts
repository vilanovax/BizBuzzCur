/**
 * AI Profile Coach Types
 *
 * Built on: Versioning + Share Decisions + Analytics + Profile Scores
 *
 * Coach answers:
 * «الان مهم‌ترین کاری که می‌تونی برای قوی‌تر شدن هویتت انجام بدی چیه؟ و چرا؟»
 *
 * Coach is NOT:
 * - Free-form chat
 * - Generic advice ("improve your bio")
 * - Content generation without context
 *
 * Coach IS:
 * - Context-aware
 * - Version-aware
 * - Explainable
 * - Action-oriented
 */

import type { ProfileVersionContext } from './profile-version';
import type { ProfileBlock } from './profile-score';

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * User's goal for coaching
 */
export type CoachGoal =
  | 'growth'      // رشد کلی
  | 'network'     // شبکه‌سازی
  | 'visibility'  // دیده شدن
  | 'trust';      // اعتمادسازی

/**
 * Coach mode / trigger
 */
export type CoachMode =
  | 'instant'     // لحظه‌ای (قبل/بعد از share)
  | 'goal_based'  // هدف‌محور
  | 'weekly';     // گزارش هفتگی

/**
 * Coach trigger event
 */
export type CoachTrigger =
  | 'pre_share'           // قبل از share
  | 'post_share'          // بعد از share
  | 'strength_drop'       // افت strength
  | 'weekly_digest'       // گزارش هفتگی
  | 'goal_set'            // تنظیم هدف
  | 'manual';             // درخواست دستی

/**
 * Action type for recommendations
 */
export type CoachActionType =
  | 'add'         // اضافه کردن
  | 'improve'     // بهبود
  | 'highlight'   // پررنگ کردن
  | 'hide';       // پنهان کردن

/**
 * Priority level
 */
export type CoachPriority = 'high' | 'medium' | 'low';

/**
 * Evidence source
 */
export type EvidenceSource =
  | 'analytics'   // داده‌های تحلیلی
  | 'score'       // امتیازات پروفایل
  | 'context';    // زمینه share

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Coach input - everything the coach needs to make recommendations
 */
export interface CoachInput {
  profileId: string;
  mode: CoachMode;
  trigger: CoachTrigger;
  userGoal?: CoachGoal;
  recentShareContext?: {
    intent: string;
    audienceType?: string;
    versionId?: string;
  };
}

// =============================================================================
// OUTPUT TYPES
// =============================================================================

/**
 * Evidence for explainability
 */
export interface CoachEvidence {
  source: EvidenceSource;
  message: string;
}

/**
 * Recommended action
 */
export interface CoachRecommendedAction {
  type: CoachActionType;
  target: ProfileBlock | string;  // Block or version ID
  targetLabel: string;
  expectedImpact: number;         // Estimated score improvement
}

/**
 * Single coach advice
 */
export interface CoachAdvice {
  id: string;
  focusArea: ProfileBlock;
  focusAreaLabel: string;
  priority: CoachPriority;
  explanation: string;
  recommendedAction: CoachRecommendedAction;
  evidence: CoachEvidence[];
}

/**
 * Full coach response
 */
export interface CoachResponse {
  mode: CoachMode;
  trigger: CoachTrigger;
  advice: CoachAdvice;              // Single advice (not multiple!)
  profileHealthSummary: {
    completeness: number;
    strength: number;
    trend: 'up' | 'stable' | 'down';
  };
  timestamp: string;
}

// =============================================================================
// WEEKLY REPORT TYPES
// =============================================================================

/**
 * Weekly coach report (Premium)
 */
export interface WeeklyCoachReport {
  periodStart: string;
  periodEnd: string;

  // Strengths
  strengths: Array<{
    area: ProfileBlock;
    message: string;
  }>;

  // Needs improvement
  improvements: Array<{
    area: ProfileBlock;
    message: string;
    priority: CoachPriority;
  }>;

  // Top recommendation
  topRecommendation: CoachAdvice;

  // Stats
  stats: {
    sharesThisWeek: number;
    viewsThisWeek: number;
    strengthChange: number;
    completenessChange: number;
  };
}

// =============================================================================
// LABELS (Persian)
// =============================================================================

export const COACH_GOAL_LABELS: Record<CoachGoal, string> = {
  growth: 'رشد کلی',
  network: 'شبکه‌سازی',
  visibility: 'دیده شدن',
  trust: 'اعتمادسازی',
};

export const COACH_GOAL_DESCRIPTIONS: Record<CoachGoal, string> = {
  growth: 'می‌خوام پروفایلم به‌طور کلی قوی‌تر بشه',
  network: 'می‌خوام ارتباطات حرفه‌ای بیشتری بسازم',
  visibility: 'می‌خوام بیشتر دیده بشم',
  trust: 'می‌خوام اعتماد بیشتری ایجاد کنم',
};

export const COACH_MODE_LABELS: Record<CoachMode, string> = {
  instant: 'پیشنهاد لحظه‌ای',
  goal_based: 'مربی هدف‌محور',
  weekly: 'گزارش هفتگی',
};

export const COACH_TRIGGER_LABELS: Record<CoachTrigger, string> = {
  pre_share: 'قبل از اشتراک‌گذاری',
  post_share: 'بعد از اشتراک‌گذاری',
  strength_drop: 'افت قدرت پروفایل',
  weekly_digest: 'گزارش هفتگی',
  goal_set: 'تنظیم هدف',
  manual: 'درخواست دستی',
};

export const COACH_ACTION_LABELS: Record<CoachActionType, string> = {
  add: 'اضافه کردن',
  improve: 'بهبود',
  highlight: 'پررنگ کردن',
  hide: 'پنهان کردن',
};

export const COACH_PRIORITY_LABELS: Record<CoachPriority, string> = {
  high: 'اولویت بالا',
  medium: 'اولویت متوسط',
  low: 'اولویت پایین',
};

export const EVIDENCE_SOURCE_LABELS: Record<EvidenceSource, string> = {
  analytics: 'داده‌های تحلیلی',
  score: 'امتیاز پروفایل',
  context: 'زمینه فعلی',
};

// =============================================================================
// UX COPY (Persian)
// =============================================================================

export const COACH_COPY = {
  instant: {
    preShareTitle: 'پیشنهاد BizBuzz',
    preShareSubtitle: 'قبل از Share:',
    postShareTitle: 'چطور بود؟',
    postShareSubtitle: 'پیشنهاد برای دفعه بعد:',
    applyButton: 'اعمال پیشنهاد',
    skipButton: 'بعداً',
  },
  goalBased: {
    title: 'هدفت چیه؟',
    subtitle: 'بر اساس هدفت، مسیر بهبود رو نشون می‌دیم',
    resultTitle: 'مسیر پیشنهادی',
  },
  weekly: {
    title: 'گزارش هفتگی پروفایل',
    strengthsTitle: 'نقاط قوت',
    improvementsTitle: 'نیاز به بهبود',
    recommendationTitle: 'اقدام پیشنهادی',
    statsTitle: 'آمار این هفته',
  },
  evidence: {
    title: 'چرا این پیشنهاد؟',
    basedOn: 'بر اساس:',
  },
  impact: {
    prefix: '+',
    suffix: 'امتیاز',
  },
};

// =============================================================================
// COACH LOGIC CONSTANTS
// =============================================================================

/**
 * Goal to focus area mapping
 */
export const GOAL_FOCUS_AREAS: Record<CoachGoal, ProfileBlock[]> = {
  growth: ['headline', 'bio', 'skills', 'experience', 'projects'],
  network: ['headline', 'social', 'skills', 'bio'],
  visibility: ['photo', 'headline', 'bio', 'skills'],
  trust: ['photo', 'experience', 'social', 'projects'],
};

/**
 * Context to focus area mapping
 */
export const CONTEXT_FOCUS_AREAS: Record<ProfileVersionContext, ProfileBlock[]> = {
  public: ['photo', 'headline', 'bio'],
  network: ['skills', 'social', 'headline'],
  team: ['projects', 'skills', 'experience'],
  investor: ['experience', 'projects', 'headline'],
  job: ['experience', 'skills', 'education'],
  custom: ['headline', 'bio'],
};

/**
 * Priority thresholds
 */
export const PRIORITY_THRESHOLDS = {
  high: { minImpact: 8, maxStrength: 50 },
  medium: { minImpact: 4, maxStrength: 70 },
  low: { minImpact: 0, maxStrength: 100 },
} as const;
