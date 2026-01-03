/**
 * AI Version Generator Types
 *
 * Types for the AI-powered profile version generator wizard.
 * User answers structured questions → AI generates version rules.
 *
 * Key principles:
 * - AI does NOT invent data
 * - AI only structures, emphasizes, and presents existing data
 * - Every AI decision is explainable in Persian
 */

import type {
  ProfileVersionContext,
  VisibilityRule,
  EmphasisRule,
  OrderingRule,
  VisibilityMode,
} from './profile-version';

// =============================================================================
// WIZARD TYPES
// =============================================================================

/**
 * Wizard purpose options
 */
export type WizardPurpose =
  | 'networking'      // شبکه‌سازی
  | 'job_seeking'     // کاریابی
  | 'investor_pitch'  // ارائه به سرمایه‌گذار
  | 'team_intro'      // معرفی به تیم
  | 'other';          // هدف دیگه

/**
 * Audience type options
 */
export type WizardAudienceType =
  | 'individual'  // یک نفر
  | 'company'     // شرکت
  | 'investor'    // سرمایه‌گذار
  | 'recruiter'   // استخدام‌کننده
  | 'general';    // عمومی

/**
 * Tone options
 */
export type WizardTone =
  | 'formal'       // رسمی
  | 'casual'       // صمیمی
  | 'professional'; // حرفه‌ای

/**
 * Emphasis block options
 */
export type EmphasisBlock = 'skills' | 'experience' | 'projects' | 'education';

/**
 * Hide block options
 */
export type HideBlock = 'contact' | 'education' | 'social';

/**
 * Wizard step answers
 */
export interface WizardAnswers {
  purpose: WizardPurpose;
  purposeDescription?: string; // If purpose is "other"
  audienceType: WizardAudienceType;
  tone: WizardTone;
  emphasize: EmphasisBlock[];
  hide?: HideBlock[];
}

// =============================================================================
// AI GENERATION TYPES
// =============================================================================

/**
 * Profile data structure for AI prompt
 */
export interface ProfileDataForAI {
  basics: {
    name: string;
    headline?: string;
    bio?: string;
  };
  skills: string[];
  experiences: {
    id: string;
    title: string;
    company: string;
    summary?: string;
  }[];
  projects: {
    id: string;
    name: string;
    description?: string;
  }[];
  education: {
    id: string;
    institution: string;
    degree?: string;
    field?: string;
  }[];
}

/**
 * AI-generated visibility rule (simpler format)
 */
export interface AIVisibilityRule {
  block: string;
  mode: 'show' | 'hide' | 'limited';
}

/**
 * AI-generated emphasis rule (by name, not ID)
 */
export interface AIEmphasisRule {
  targetType: 'skill' | 'experience' | 'project' | 'education';
  targetName: string;
  weight: number; // 1-5
}

/**
 * AI-generated ordering rule
 */
export interface AIOrderingRule {
  block: string;
  order: number;
}

/**
 * AI version meta information
 */
export interface AIVersionMeta {
  name: string;
  context: ProfileVersionContext;
  confidence: number; // 0-1
}

/**
 * AI response structure (strict JSON format)
 */
export interface AIGeneratedVersion {
  versionMeta: AIVersionMeta;
  visibility: AIVisibilityRule[];
  emphasis: AIEmphasisRule[];
  ordering: AIOrderingRule[];
  explanation: string[]; // Persian explanations
}

/**
 * Converted rules ready for database
 */
export interface GeneratedVersionRules {
  name: string;
  context: ProfileVersionContext;
  confidence: number;
  visibility_rules: VisibilityRule[];
  emphasis_rules: EmphasisRule[];
  ordering_rules: OrderingRule[];
  reasons: { type: 'ai_generated'; message: string }[];
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Generate preview request
 */
export interface GenerateVersionPreviewRequest {
  wizardAnswers: WizardAnswers;
}

/**
 * Generate preview response
 */
export interface GenerateVersionPreviewResponse {
  preview: GeneratedVersionRules;
  profileId: string;
}

/**
 * Confirm generated version request
 */
export interface ConfirmGeneratedVersionRequest {
  rules: GeneratedVersionRules;
  modify?: boolean;
}

// =============================================================================
// WIZARD STEP DEFINITIONS
// =============================================================================

export interface WizardStepOption<T> {
  value: T;
  label: string;
  description?: string;
}

export interface WizardStep {
  id: string;
  title: string;
  subtitle?: string;
}

// =============================================================================
// LABELS (Persian)
// =============================================================================

export const WIZARD_PURPOSE_LABELS: Record<WizardPurpose, string> = {
  networking: 'شبکه‌سازی',
  job_seeking: 'کاریابی',
  investor_pitch: 'ارائه به سرمایه‌گذار',
  team_intro: 'معرفی به تیم',
  other: 'هدف دیگه...',
};

export const WIZARD_PURPOSE_DESCRIPTIONS: Record<WizardPurpose, string> = {
  networking: 'برای معرفی در رویدادها و ساخت ارتباط',
  job_seeking: 'برای ارسال به فرصت‌های شغلی',
  investor_pitch: 'برای جذب سرمایه یا معرفی به سرمایه‌گذار',
  team_intro: 'برای معرفی به هم‌تیمی‌های جدید',
  other: 'یک هدف خاص دیگه دارم',
};

export const WIZARD_AUDIENCE_LABELS: Record<WizardAudienceType, string> = {
  individual: 'یک نفر',
  company: 'شرکت',
  investor: 'سرمایه‌گذار',
  recruiter: 'استخدام‌کننده',
  general: 'عمومی',
};

export const WIZARD_TONE_LABELS: Record<WizardTone, string> = {
  formal: 'رسمی',
  casual: 'صمیمی',
  professional: 'حرفه‌ای',
};

export const WIZARD_EMPHASIS_LABELS: Record<EmphasisBlock, string> = {
  skills: 'مهارت‌ها',
  experience: 'تجربیات',
  projects: 'پروژه‌ها',
  education: 'تحصیلات',
};

export const WIZARD_HIDE_LABELS: Record<HideBlock, string> = {
  contact: 'اطلاعات تماس',
  education: 'تحصیلات',
  social: 'شبکه‌های اجتماعی',
};

// =============================================================================
// UX COPY (Persian)
// =============================================================================

export const WIZARD_COPY = {
  title: 'ساخت نسخه سفارشی با هوش مصنوعی',
  subtitle: 'با چند سوال ساده، یک نسخه مناسب هدفت می‌سازیم',

  steps: {
    purpose: {
      title: 'این نسخه رو برای چی می‌خوای؟',
      subtitle: 'هدفت رو انتخاب کن تا بتونیم بهترین تنظیمات رو پیشنهاد بدیم',
    },
    audience: {
      title: 'مخاطبت کیه؟',
      subtitle: 'این نسخه قراره کی ببینه؟',
    },
    tone: {
      title: 'لحن مورد نظرت؟',
      subtitle: 'چطور می‌خوای دیده بشی؟',
    },
    emphasize: {
      title: 'چی پررنگ بشه؟',
      subtitle: 'کدوم بخش‌ها مهم‌ترن برای هدفت؟',
    },
    hide: {
      title: 'چی پنهان بشه؟',
      subtitle: 'اختیاری: اگه چیزی هست که نمی‌خوای نشون داده بشه',
    },
  },

  generating: {
    title: 'در حال ساخت نسخه...',
    subtitle: 'هوش مصنوعی داره بهترین تنظیمات رو پیدا می‌کنه',
  },

  preview: {
    title: 'نسخه‌ی پیشنهادی',
    subtitle: 'این نسخه بر اساس هدف شما ساخته شد',
    reasons_title: 'چرا این تنظیمات؟',
    edit_button: 'ویرایش',
    confirm_button: 'تأیید و ذخیره',
    cancel_button: 'انصراف',
  },

  errors: {
    generation_failed: 'متأسفانه ساخت نسخه با مشکل مواجه شد. لطفاً دوباره تلاش کنید.',
    missing_profile_data: 'پروفایلت هنوز کامل نیست. لطفاً اول پروفایلت رو تکمیل کن.',
    invalid_response: 'پاسخ هوش مصنوعی معتبر نبود. لطفاً دوباره تلاش کنید.',
  },

  buttons: {
    next: 'بعدی',
    back: 'قبلی',
    generate: 'ساخت نسخه',
    retry: 'تلاش مجدد',
  },
};

// =============================================================================
// INTENT MAPPING (for AI prompt)
// =============================================================================

export const PURPOSE_TO_INTENT: Record<WizardPurpose, string> = {
  networking: 'NETWORKING',
  job_seeking: 'JOB_APPLICATION',
  investor_pitch: 'INVESTOR_PITCH',
  team_intro: 'TEAM_COLLABORATION',
  other: 'CUSTOM',
};

export const AUDIENCE_TO_PROMPT: Record<WizardAudienceType, string> = {
  individual: 'single_person',
  company: 'company_hr',
  investor: 'investor_vc',
  recruiter: 'recruiter',
  general: 'general_public',
};

export const TONE_TO_PROMPT: Record<WizardTone, string> = {
  formal: 'formal',
  casual: 'casual_friendly',
  professional: 'professional_friendly',
};
