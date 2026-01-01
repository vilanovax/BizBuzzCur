/**
 * Share Decision Engine Types
 *
 * «الان کدوم Version رو کجا Share کنم؟»
 *
 * This is the intelligence core of BizBuzz.
 * Share isn't just "copy link" - it's an identity decision.
 */

// =============================================================================
// SHARE CONTEXT (Inputs)
// =============================================================================

/**
 * User's intent for sharing
 */
export type ShareIntent =
  | 'introduce'    // معرفی اولیه
  | 'network'      // شبکه‌سازی
  | 'collaborate'  // همکاری
  | 'pitch'        // ارائه به سرمایه‌گذار
  | 'discover';    // کشف شدن

/**
 * Type of audience
 */
export type AudienceType =
  | 'person'       // یک نفر خاص
  | 'team'         // تیم
  | 'investor'     // سرمایه‌گذار
  | 'community'    // جامعه / عموم
  | 'recruiter';   // استخدام‌کننده

/**
 * Share channel
 */
export type ShareChannel =
  | 'link'         // لینک مستقیم
  | 'dm'           // پیام خصوصی
  | 'email'        // ایمیل
  | 'qr'           // QR Code
  | 'social';      // شبکه اجتماعی

/**
 * Urgency level
 */
export type ShareUrgency = 'low' | 'medium' | 'high';

/**
 * Share Context - What the engine needs to make a decision
 */
export interface ShareContext {
  intent: ShareIntent;
  audienceType?: AudienceType;
  channel: ShareChannel;
  targetId?: string;        // If sharing with specific person/team
  urgency?: ShareUrgency;
}

// =============================================================================
// DECISION OUTPUT
// =============================================================================

/**
 * Reason types for explainability
 */
export type DecisionReasonType =
  | 'context_match'      // تطابق با موقعیت
  | 'signal_strength'    // قوت سیگنال
  | 'trust'              // اعتماد
  | 'simplicity'         // سادگی
  | 'completeness';      // کامل بودن

/**
 * Explainability reason
 */
export interface DecisionReason {
  type: DecisionReasonType;
  message: string;
}

/**
 * Action item types for suggestions
 */
export type ActionItemType =
  | 'highlight'    // پررنگ کردن
  | 'add'          // اضافه کردن
  | 'improve';     // بهبود دادن

/**
 * Suggested action to improve version
 */
export interface ActionItem {
  type: ActionItemType;
  message: string;
  targetBlock?: string;  // Which profile block to improve
}

/**
 * Confidence level for UI display
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Share Decision - The engine's recommendation
 */
export interface ShareDecision {
  recommendedVersionId: string;
  recommendedVersionName: string;
  confidence: number;           // 0-100
  confidenceLevel: ConfidenceLevel;
  reasons: DecisionReason[];
  alternatives: AlternativeVersion[];
  suggestions?: ActionItem[];
  shareUrl: string;
}

/**
 * Alternative version option
 */
export interface AlternativeVersion {
  versionId: string;
  versionName: string;
  score: number;
  whyNot?: string;  // Why this wasn't recommended
}

/**
 * No suitable version fallback
 */
export interface NoVersionFallback {
  hasRecommendation: false;
  suggestedContext: string;
  createVersionUrl: string;
  message: string;
}

/**
 * Full decision response (either recommendation or fallback)
 */
export type ShareDecisionResponse =
  | (ShareDecision & { hasRecommendation: true })
  | NoVersionFallback;

// =============================================================================
// SCORING COMPONENTS
// =============================================================================

/**
 * Version score breakdown
 */
export interface VersionScoreBreakdown {
  versionId: string;
  contextFit: number;        // 0-1
  signalRelevance: number;   // 0-1
  completeness: number;      // 0-1
  trustScore: number;        // 0-1
  totalScore: number;        // Weighted sum
}

/**
 * Scoring weights
 */
export const SCORE_WEIGHTS = {
  contextFit: 0.4,
  signalRelevance: 0.3,
  completeness: 0.2,
  trustScore: 0.1,
} as const;

// =============================================================================
// CONTEXT → VERSION MAPPING
// =============================================================================

/**
 * Intent to Version Context mapping
 */
export const INTENT_TO_CONTEXT: Record<ShareIntent, string[]> = {
  introduce: ['public', 'network'],
  network: ['network', 'public'],
  collaborate: ['team', 'network'],
  pitch: ['investor', 'job'],
  discover: ['public', 'job'],
};

/**
 * Audience to Version Context mapping
 */
export const AUDIENCE_TO_CONTEXT: Record<AudienceType, string[]> = {
  person: ['network', 'public'],
  team: ['team', 'network'],
  investor: ['investor', 'job'],
  community: ['public'],
  recruiter: ['job', 'investor'],
};

// =============================================================================
// CONFIDENCE THRESHOLDS
// =============================================================================

export const CONFIDENCE_THRESHOLDS = {
  high: 70,
  medium: 40,
  low: 0,
} as const;

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= CONFIDENCE_THRESHOLDS.high) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
  return 'low';
}

// =============================================================================
// LABELS (Persian)
// =============================================================================

export const SHARE_INTENT_LABELS: Record<ShareIntent, string> = {
  introduce: 'معرفی اولیه',
  network: 'شبکه‌سازی',
  collaborate: 'همکاری',
  pitch: 'ارائه به سرمایه‌گذار',
  discover: 'کشف شدن',
};

export const SHARE_INTENT_DESCRIPTIONS: Record<ShareIntent, string> = {
  introduce: 'می‌خوام خودم رو معرفی کنم',
  network: 'می‌خوام ارتباط جدید بسازم',
  collaborate: 'می‌خوام همکاری کنم',
  pitch: 'می‌خوام ایده‌م رو ارائه بدم',
  discover: 'می‌خوام دیده بشم',
};

export const AUDIENCE_TYPE_LABELS: Record<AudienceType, string> = {
  person: 'یک نفر',
  team: 'تیم',
  investor: 'سرمایه‌گذار',
  community: 'عموم',
  recruiter: 'استخدام‌کننده',
};

export const SHARE_CHANNEL_LABELS: Record<ShareChannel, string> = {
  link: 'لینک',
  dm: 'پیام خصوصی',
  email: 'ایمیل',
  qr: 'QR Code',
  social: 'شبکه اجتماعی',
};

export const DECISION_REASON_LABELS: Record<DecisionReasonType, string> = {
  context_match: 'تطابق با موقعیت',
  signal_strength: 'قوت سیگنال',
  trust: 'اعتماد',
  simplicity: 'سادگی',
  completeness: 'کامل بودن',
};

export const ACTION_ITEM_LABELS: Record<ActionItemType, string> = {
  highlight: 'پررنگ کردن',
  add: 'اضافه کردن',
  improve: 'بهبود دادن',
};

export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  high: 'اطمینان بالا',
  medium: 'اطمینان متوسط',
  low: 'اطمینان پایین',
};

// =============================================================================
// UX COPY (Persian)
// =============================================================================

export const SHARE_DECISION_COPY = {
  intentStep: {
    title: 'می‌خوای پروفایلت رو برای چی Share کنی؟',
    subtitle: 'بر اساس هدفت، بهترین نسخه رو پیشنهاد می‌دیم.',
  },
  recommendation: {
    title: 'پیشنهاد BizBuzz',
    subtitle: 'بهترین انتخاب برای این موقعیت:',
    confidenceLabel: 'اطمینان',
    whyTitle: 'چرا؟',
  },
  actions: {
    shareThis: 'Share این نسخه',
    viewOthers: 'نسخه‌های دیگر',
    createNew: 'ساخت نسخه جدید',
  },
  fallback: {
    title: 'نسخه‌ی مناسب ندارید',
    subtitle: 'پیشنهاد می‌کنیم یک Version جدید بسازید',
    createButton: 'ساخت نسخه پیشنهادی',
  },
  explainability: {
    title: 'چرا این Version؟',
    autoGenerated: 'این توضیحات به‌صورت خودکار تولید شده‌اند.',
  },
  lowConfidence: {
    warning: 'اطمینان پایین',
    message: 'این نسخه ممکنه بهترین انتخاب نباشه. پیشنهاد می‌کنیم نسخه‌های دیگر رو هم ببینید.',
  },
};
