/**
 * Profile Versioning Types
 *
 * One Profile → Many Versions
 * Version = "یک روایت هدفمند از همان پروفایل، برای یک موقعیت خاص"
 *
 * Key principles:
 * - Data is NEVER duplicated
 * - Version only controls: visibility, emphasis, ordering
 * - Every version is explainable
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Version types
 * - system: Auto-generated based on context
 * - user: Manually created by user
 */
export type ProfileVersionType = 'system' | 'user';

/**
 * Context types for versions
 * Each context has different defaults for visibility/emphasis
 */
export type ProfileVersionContext =
  | 'public'    // General sharing
  | 'network'   // For networking/connections
  | 'team'      // For team/colleague introduction
  | 'investor'  // For investor/pitch context
  | 'job'       // For job applications
  | 'custom';   // User-defined context

/**
 * Profile blocks that can be controlled
 */
export type ProfileBlock =
  | 'basics'     // name, headline, bio
  | 'photo'      // profile photo
  | 'contact'    // email, phone, website
  | 'social'     // social links
  | 'experience' // work experience
  | 'education'  // education history
  | 'skills'     // skills list
  | 'projects'   // projects (future)
  | 'signals'    // personality signals (future)
  | 'custom';    // custom fields

/**
 * Visibility modes for blocks
 */
export type VisibilityMode = 'show' | 'hide' | 'limited';

/**
 * Target types for emphasis
 */
export type EmphasisTargetType = 'skill' | 'experience' | 'education' | 'project';

/**
 * Reason types for explainability
 */
export type ReasonType = 'context_fit' | 'signal_strength' | 'network_match' | 'user_preference';

// =============================================================================
// RULES
// =============================================================================

/**
 * Visibility rule - controls which blocks are shown/hidden
 */
export interface VisibilityRule {
  block: ProfileBlock;
  mode: VisibilityMode;
}

/**
 * Emphasis rule - controls which items are highlighted
 * weight: 1-5 (5 = most emphasized)
 */
export interface EmphasisRule {
  targetId: string;
  targetType: EmphasisTargetType;
  weight: number;
}

/**
 * Ordering rule - controls the order of blocks
 */
export interface OrderingRule {
  block: ProfileBlock;
  order: number;
}

/**
 * Explainability reason
 */
export interface VersionReason {
  type: ReasonType;
  message: string;
}

// =============================================================================
// PROFILE VERSION ENTITY
// =============================================================================

/**
 * Profile Version
 */
export interface ProfileVersion {
  id: string;
  profile_id: string;

  // Identity
  name: string;
  type: ProfileVersionType;
  context: ProfileVersionContext;

  // Rules
  visibility_rules: VisibilityRule[];
  emphasis_rules: EmphasisRule[];
  ordering_rules: OrderingRule[];

  // Sharing
  slug: string | null;
  is_default: boolean;
  expires_at: string | null;

  // Explainability
  auto_generated: boolean;
  reasons: VersionReason[];

  // Analytics
  view_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Profile Version with computed share URL
 */
export interface ProfileVersionWithShare extends ProfileVersion {
  share_url: string | null;
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Create Profile Version Request
 */
export interface CreateProfileVersionRequest {
  profile_id: string;
  name: string;
  context: ProfileVersionContext;
  visibility_rules?: VisibilityRule[];
  emphasis_rules?: EmphasisRule[];
  ordering_rules?: OrderingRule[];
  slug?: string;
  is_default?: boolean;
  expires_at?: string;
}

/**
 * Update Profile Version Request
 */
export interface UpdateProfileVersionRequest {
  name?: string;
  context?: ProfileVersionContext;
  visibility_rules?: VisibilityRule[];
  emphasis_rules?: EmphasisRule[];
  ordering_rules?: OrderingRule[];
  slug?: string;
  is_default?: boolean;
  expires_at?: string;
}

// =============================================================================
// LABELS (Persian)
// =============================================================================

export const PROFILE_VERSION_CONTEXT_LABELS: Record<ProfileVersionContext, string> = {
  public: 'عمومی',
  network: 'شبکه‌سازی',
  team: 'معرفی به تیم',
  investor: 'سرمایه‌گذار',
  job: 'شغلی',
  custom: 'سفارشی',
};

export const PROFILE_VERSION_CONTEXT_DESCRIPTIONS: Record<ProfileVersionContext, string> = {
  public: 'برای اشتراک‌گذاری عمومی',
  network: 'برای معرفی در رویدادها و شبکه‌سازی',
  team: 'برای معرفی به هم‌تیمی‌ها',
  investor: 'برای معرفی به سرمایه‌گذاران',
  job: 'برای ارسال به فرصت‌های شغلی',
  custom: 'نسخه سفارشی با تنظیمات دلخواه',
};

export const PROFILE_BLOCK_LABELS: Record<ProfileBlock, string> = {
  basics: 'اطلاعات پایه',
  photo: 'تصویر پروفایل',
  contact: 'اطلاعات تماس',
  social: 'شبکه‌های اجتماعی',
  experience: 'سوابق کاری',
  education: 'تحصیلات',
  skills: 'مهارت‌ها',
  projects: 'پروژه‌ها',
  signals: 'سیگنال‌های شخصیتی',
  custom: 'فیلدهای سفارشی',
};

export const VISIBILITY_MODE_LABELS: Record<VisibilityMode, string> = {
  show: 'نمایش',
  hide: 'پنهان',
  limited: 'محدود',
};

export const REASON_TYPE_LABELS: Record<ReasonType, string> = {
  context_fit: 'تناسب با موقعیت',
  signal_strength: 'قوت سیگنال',
  network_match: 'تطابق شبکه',
  user_preference: 'ترجیح کاربر',
};

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default visibility rules per context
 */
export const DEFAULT_VISIBILITY_BY_CONTEXT: Record<ProfileVersionContext, VisibilityRule[]> = {
  public: [],
  network: [
    { block: 'contact', mode: 'limited' },
  ],
  team: [
    { block: 'education', mode: 'hide' },
  ],
  investor: [
    { block: 'contact', mode: 'limited' },
  ],
  job: [],
  custom: [],
};

/**
 * Default ordering per context
 */
export const DEFAULT_ORDERING_BY_CONTEXT: Record<ProfileVersionContext, OrderingRule[]> = {
  public: [
    { block: 'basics', order: 1 },
    { block: 'experience', order: 2 },
    { block: 'education', order: 3 },
    { block: 'skills', order: 4 },
  ],
  network: [
    { block: 'basics', order: 1 },
    { block: 'skills', order: 2 },
    { block: 'experience', order: 3 },
  ],
  team: [
    { block: 'basics', order: 1 },
    { block: 'skills', order: 2 },
    { block: 'projects', order: 3 },
    { block: 'experience', order: 4 },
  ],
  investor: [
    { block: 'basics', order: 1 },
    { block: 'experience', order: 2 },
    { block: 'projects', order: 3 },
    { block: 'skills', order: 4 },
  ],
  job: [
    { block: 'basics', order: 1 },
    { block: 'experience', order: 2 },
    { block: 'skills', order: 3 },
    { block: 'education', order: 4 },
  ],
  custom: [],
};

// =============================================================================
// UX COPY (Persian)
// =============================================================================

export const PROFILE_VERSION_COPY = {
  create: {
    title: 'ساخت نسخه جدید',
    subtitle: 'یک روایت متفاوت از پروفایلت برای یک موقعیت خاص',
  },
  step1: {
    title: 'این نسخه برای چه موقعیتی است؟',
    subtitle: 'بر اساس انتخابت، تنظیمات پیشنهادی می‌دیم.',
  },
  step2: {
    title: 'سفارشی‌سازی',
    subtitle: 'چه چیزی نشون داده بشه و چی پررنگ بشه.',
    helper: 'هیچ داده‌ای حذف نمی‌شه — فقط نحوه نمایش عوض می‌شه.',
  },
  step3: {
    title: 'اشتراک‌گذاری',
    subtitle: 'لینک اختصاصی این نسخه.',
    created: 'لینک اختصاصی ساخته شد',
  },
  explainability: {
    title: 'چرا این نسخه؟',
    autoGenerated: 'این توضیحات به‌صورت خودکار تولید شده‌اند.',
  },
  list: {
    title: 'نسخه‌های پروفایل',
    subtitle: 'هر نسخه یک روایت متفاوت از همان هویت است.',
    empty: 'هنوز نسخه‌ای نساختی.',
    createCta: 'ساخت نسخه جدید',
  },
};
