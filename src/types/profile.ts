export type ProfileType = 'business_card' | 'resume' | 'event' | 'company';

/**
 * Quick Profile Intent
 *
 * User-selected purpose for creating a profile.
 * Each intent maps to default settings (visibility, CTA, layout).
 */
export type ProfileIntent =
  | 'networking'    // شبکه‌سازی - for events and meetups
  | 'job'           // شغلی - for job applications
  | 'freelance'     // فریلنس / مشاوره - for consulting/projects
  | 'business'      // معرفی کسب‌وکار - for formal business intro
  | 'simple';       // لینک ساده - minimal contact sharing

/**
 * Intent configuration with defaults and copy
 */
export interface IntentConfig {
  id: ProfileIntent;
  icon: string;
  title: string;
  description: string;
  defaults: {
    profile_type: ProfileType;
    visibility: ProfileVisibility;
    cta_type: CTAType;
    template_id: TemplateId;
  };
}

/**
 * Intent configurations (Persian)
 */
export const PROFILE_INTENTS: Record<ProfileIntent, IntentConfig> = {
  networking: {
    id: 'networking',
    icon: '👋',
    title: 'شبکه‌سازی',
    description: 'برای معرفی سریع در رویدادها و آشنایی‌ها',
    defaults: {
      profile_type: 'business_card',
      visibility: 'public',
      cta_type: 'connect',
      template_id: 'event_networking',
    },
  },
  job: {
    id: 'job',
    icon: '💼',
    title: 'شغلی',
    description: 'برای ارسال به کارفرما یا فرصت‌های شغلی',
    defaults: {
      profile_type: 'resume',
      visibility: 'public',
      cta_type: 'message',
      template_id: 'resume_job',
    },
  },
  freelance: {
    id: 'freelance',
    icon: '🧑‍💻',
    title: 'فریلنس / مشاوره',
    description: 'برای معرفی تخصص و دریافت پروژه',
    defaults: {
      profile_type: 'business_card',
      visibility: 'public',
      cta_type: 'message',
      template_id: 'freelance_consulting',
    },
  },
  business: {
    id: 'business',
    icon: '🏢',
    title: 'معرفی کسب‌وکار',
    description: 'برای معرفی خودت یا تیمت به‌صورت رسمی',
    defaults: {
      profile_type: 'company',
      visibility: 'public',
      cta_type: 'visit_website',
      template_id: 'company_intro',
    },
  },
  simple: {
    id: 'simple',
    icon: '⚡',
    title: 'لینک ساده',
    description: 'فقط یک معرفی کوتاه با راه ارتباطی',
    defaults: {
      profile_type: 'business_card',
      visibility: 'public',
      cta_type: 'message',
      template_id: 'business_card_work',
    },
  },
};

/**
 * Quick Profile Creation Input
 */
export interface QuickProfileInput {
  intent: ProfileIntent;
  display_name: string;
  headline: string;
  contact: string;        // Email, phone, or URL
  contact_type: 'email' | 'phone' | 'link';
  photo_url?: string;
}

/**
 * Quick Profile Copy (Persian)
 */
export const QUICK_PROFILE_COPY = {
  // Entry screen
  entry: {
    title: 'یک پروفایل سریع بساز',
    subtitle: 'برای هر موقعیت، یک معرفی مناسب',
    helper: 'این نسخه سریع است — هر وقت خواستی می‌تونی حرفه‌ای‌ترش کنی.',
    cta: 'شروع',
  },

  // Step 1 - Intent
  intent: {
    title: 'این پروفایل رو برای چی می‌سازی؟',
    subtitle: 'ما بر اساس انتخابت، بهترین قالب رو آماده می‌کنیم.',
    footer: 'بعداً می‌تونی این پروفایل رو کپی یا تغییر بدی.',
  },

  // Step 2 - Info
  info: {
    title: 'اطلاعات پایه',
    subtitle: 'فقط چیزهایی که واقعاً لازم هست.',
    fields: {
      name: {
        label: 'نام نمایشی',
        placeholder: 'مثلاً: علی رضایی',
      },
      headline: {
        label: 'عنوان کوتاه',
        placeholder: 'مثلاً: توسعه‌دهنده بک‌اند | Node.js',
        helper: 'یک خط کافیه — لازم نیست کامل باشه.',
      },
      contact: {
        label: 'راه ارتباطی',
        placeholder: 'ایمیل، شماره یا لینک',
        helper: 'فقط یکی کافیه.',
      },
      photo: {
        label: 'تصویر پروفایل (اختیاری)',
        helper: 'می‌تونی بعداً اضافه کنی.',
      },
    },
    cta: 'ساخت پروفایل',
  },

  // Success screen
  success: {
    title: 'پروفایلت آماده‌ست 🎉',
    subtitle: 'می‌تونی همین الان به اشتراک بذاری.',
    shareCta: 'اشتراک‌گذاری پروفایل',
    qrCta: 'دریافت QR Code',
    upgradeCta: 'حرفه‌ای‌ترش کن',
    upgradeHelper: 'افزودن مهارت‌ها، توضیحات و لینک‌ها — هر وقت خواستی.',
  },

  // Persistent helpers
  helpers: {
    banner: 'این نسخه‌ی سریع پروفایله. هیچ چیز دائمی نیست.',
    editTooltip: 'می‌تونی هر بخش رو بعداً تغییر بدی.',
  },
};

export type ProfileVisibility = 'public' | 'connections' | 'private' | 'event_only';
export type PhoneVisibility = 'full' | 'masked' | 'after_connect' | 'hidden';
export type EmailVisibility = 'full' | 'masked' | 'after_connect' | 'hidden';
export type CTAType = 'connect' | 'message' | 'book_meeting' | 'download_cv' | 'visit_website' | 'none';

export type TemplateId =
  | 'business_card_work'
  | 'resume_job'
  | 'event_networking'
  | 'company_intro'
  | 'freelance_consulting'
  | 'custom';

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  telegram?: string;
  github?: string;
  website?: string;
}

// Image sizes for optimized display
export interface ImageSizes {
  original: string;  // 1024px - storage only
  large: string;     // 512px - profile page
  medium: string;    // 256px - cards, lists
  thumbnail: string; // 96px - avatars, chat
}

export interface ProfileImages {
  photo?: ImageSizes;
  cover?: string; // Cover doesn't need variants
}

// Theme color presets
export const THEME_COLORS = [
  '#2563eb', // Blue (default)
  '#7c3aed', // Purple
  '#059669', // Green
  '#dc2626', // Red
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#be185d', // Pink
  '#1f2937', // Gray/Dark
  '#000000', // Black
] as const;

export interface Profile {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  profile_type: ProfileType;
  schema_version: string;

  // Basic Info
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  cover_url: string | null;

  // Contact Info
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;

  // Professional Info
  job_title: string | null;
  company: string | null;
  industry: string | null;

  // Social Links
  social_links: SocialLinks;

  // Custom Fields
  custom_fields: CustomField[];

  // QR Code
  qr_code_url: string | null;

  // Template & Notes
  template_id: TemplateId | null;
  internal_notes: string | null;

  // Display Settings
  theme_color: string;
  is_public: boolean;
  is_active: boolean;

  // Privacy & Visibility
  visibility: ProfileVisibility;
  expires_at: string | null;
  phone_visibility: PhoneVisibility;
  email_visibility: EmailVisibility;

  // Call to Action
  cta_type: CTAType;
  cta_url: string | null;

  // Files
  resume_file_url: string | null;

  // Analytics
  view_count: number;
  completion_score: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CustomField {
  id?: string;
  label: string;
  value: string;
  type?: 'text' | 'link' | 'email' | 'phone';
}

export interface ProfileEducation {
  id: string;
  profile_id: string;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  display_order: number;
}

export interface ProfileExperience {
  id: string;
  profile_id: string;
  company: string;
  title: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship' | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  display_order: number;
}

export interface ProfileSkill {
  id: string;
  profile_id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  display_order: number;
}

export interface CreateProfileInput {
  title: string;
  profile_type: ProfileType;
  template_id?: TemplateId;
  full_name?: string;
  headline?: string;
  bio?: string;
  email?: string;
  phone?: string;
  website?: string;
  job_title?: string;
  company?: string;
  social_links?: SocialLinks;
  theme_color?: string;
  is_public?: boolean;
  visibility?: ProfileVisibility;
  phone_visibility?: PhoneVisibility;
  email_visibility?: EmailVisibility;
  cta_type?: CTAType;
  cta_url?: string;
  internal_notes?: string;
  expires_at?: string;
}

export interface UpdateProfileInput extends Partial<CreateProfileInput> {
  photo_url?: string;
  cover_url?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  custom_fields?: CustomField[];
  resume_file_url?: string;
}

// API Response format for SDK consumers
export interface ProfileAPIResponse {
  data: Profile;
  meta: {
    schema_version: string;
    context: ProfileType;
    retrieved_at: string;
  };
}
