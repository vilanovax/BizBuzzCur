// Job Ad Status
export type JobStatus = 'draft' | 'published' | 'paused' | 'closed' | 'filled';

// Employment Types
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';

// Location Types
export type LocationType = 'onsite' | 'remote' | 'hybrid';

// Team Context (Quick Job)
export type TeamContext = 'solo' | 'small_team' | 'cross_functional';

// Apply Method (Quick Job)
export type ApplyMethod = 'bizbuzz' | 'external_link';

// Experience Levels
export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager';

// Application Status
export type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'shortlisted'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'withdrawn'
  | 'hired';

// Salary Range
export interface SalaryRange {
  min?: number;
  max?: number;
  currency: string; // IRR, USD, EUR, etc.
  period: 'hourly' | 'monthly' | 'yearly';
  is_negotiable?: boolean;
}

// Workstyle Expectations (Professional Job Phase 2)
export interface WorkstyleExpectations {
  autonomy?: number; // 1-5
  collaboration?: number; // 1-5
  pace?: number; // 1-5 (slow to fast)
  structure?: number; // 1-5 (flexible to structured)
}

// Team Snapshot (Professional Job Phase 2)
export interface TeamSnapshot {
  team_size?: number;
  works_with?: string[]; // e.g., ["Product Manager", "Backend Engineer"]
  reports_to?: string;
}

// Hiring Preferences (Internal Only, Professional Job Phase 2)
export interface HiringPreferences {
  decision_speed?: 'fast' | 'careful';
  remote_openness?: number; // 1-5
  target_days_to_hire?: number;
}

// Job Ad
export interface JobAd {
  id: string;
  company_id: string;
  department_id?: string | null;
  created_by: string;
  display_profile_id?: string | null;

  // Job Info
  title: string;
  description?: string | null;
  employment_type?: EmploymentType | null;
  location_type?: LocationType | null;
  location?: string | null;
  salary_range?: SalaryRange | null;

  // Quick Job Fields
  role_summary?: string | null;
  team_context?: TeamContext | null;
  apply_method?: ApplyMethod | null;
  external_apply_url?: string | null;

  // Requirements
  experience_level?: ExperienceLevel | null;
  required_skills: string[];
  preferred_skills: string[];

  // Professional Job Fields (Phase 2)
  workstyle_expectations?: WorkstyleExpectations | null;
  team_snapshot?: TeamSnapshot | null;
  hiring_preferences?: HiringPreferences | null;
  skill_importance?: Record<string, 'low' | 'medium' | 'high'> | null;

  // Taxonomy
  domain_id?: string | null;
  specialization_id?: string | null;

  // Status
  status: JobStatus;
  is_featured: boolean;

  // Event Context
  event_id?: string | null;

  // Timestamps
  published_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Job Ad with related data (for display)
export interface JobAdWithDetails extends JobAd {
  company: {
    id: string;
    name: string;
    logo_url?: string | null;
    slug: string;
    industry?: string | null;
    company_size?: string | null;
    tagline?: string | null;
    city?: string | null;
    country?: string | null;
    website_url?: string | null;
  };
  department?: {
    id: string;
    name: string;
  } | null;
  domain?: {
    id: string;
    name_fa: string;
    name_en: string;
  } | null;
  specialization?: {
    id: string;
    name_fa: string;
    name_en: string;
  } | null;
  application_count?: number;
  has_applied?: boolean; // For logged-in users
}

// Job Application
export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;

  // Application Details
  cover_message?: string | null;
  resume_url?: string | null;

  // Status
  status: ApplicationStatus;

  // Conversation
  conversation_id?: string | null;

  // Timestamps
  applied_at: string;
  reviewed_at?: string | null;
  status_changed_at?: string | null;
  status_changed_by?: string | null;

  // Notes (admin only)
  internal_notes?: string | null;
}

// Application with related data
export interface JobApplicationWithDetails extends JobApplication {
  job: {
    id: string;
    title: string;
    company_id: string;
    company_name: string;
  };
  applicant: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
    email?: string | null;
  };
}

// Create Job Request
export interface CreateJobRequest {
  company_id: string;
  department_id?: string;
  display_profile_id?: string;
  title: string;
  description?: string;
  employment_type?: EmploymentType;
  location_type?: LocationType;
  location?: string;
  salary_range?: SalaryRange;
  // Quick Job Fields
  role_summary?: string;
  team_context?: TeamContext;
  apply_method?: ApplyMethod;
  external_apply_url?: string;
  // Requirements
  experience_level?: ExperienceLevel;
  required_skills?: string[];
  preferred_skills?: string[];
  // Professional Job Fields
  workstyle_expectations?: WorkstyleExpectations;
  team_snapshot?: TeamSnapshot;
  hiring_preferences?: HiringPreferences;
  skill_importance?: Record<string, 'low' | 'medium' | 'high'>;
  // Taxonomy
  domain_id?: string;
  specialization_id?: string;
  event_id?: string;
}

// Quick Job Request (minimal fields for fast publishing)
export interface QuickJobRequest {
  company_id: string;
  title: string;
  role_summary: string;
  domain_id?: string;
  location_type: LocationType;
  team_context: TeamContext;
  apply_method?: ApplyMethod;
  external_apply_url?: string;
}

// Update Job Request
export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: JobStatus;
  is_featured?: boolean;
}

// Apply to Job Request
export interface ApplyToJobRequest {
  cover_message?: string;
  resume_url?: string;
}

// Job Discovery Filters
export interface JobDiscoveryFilters {
  domain_id?: string;
  specialization_id?: string;
  employment_type?: EmploymentType;
  location_type?: LocationType;
  experience_level?: ExperienceLevel;
  skills?: string[];
  event_id?: string;
}

// Application Status Labels (Persian)
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'در انتظار بررسی',
  reviewing: 'در حال بررسی',
  shortlisted: 'در لیست نهایی',
  interviewing: 'در فرآیند مصاحبه',
  offered: 'پیشنهاد شغلی ارسال شده',
  rejected: 'رد شده',
  withdrawn: 'انصراف داده شده',
  hired: 'استخدام شده',
};

// Employment Type Labels (Persian)
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'تمام‌وقت',
  part_time: 'پاره‌وقت',
  contract: 'پیمانی',
  internship: 'کارآموزی',
  freelance: 'فریلنسر',
};

// Location Type Labels (Persian)
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  onsite: 'حضوری',
  remote: 'دورکاری',
  hybrid: 'ترکیبی',
};

// Experience Level Labels (Persian)
export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: 'تازه‌کار',
  junior: 'جونیور',
  mid: 'میانی',
  senior: 'سنیور',
  lead: 'سرپرست',
  manager: 'مدیر',
};

// Job Status Labels (Persian)
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'پیش‌نویس',
  published: 'منتشر شده',
  paused: 'متوقف شده',
  closed: 'بسته شده',
  filled: 'پر شده',
};

// Team Context Labels (Persian)
export const TEAM_CONTEXT_LABELS: Record<TeamContext, string> = {
  solo: 'کار فردی',
  small_team: 'تیم کوچک',
  cross_functional: 'تیم چند تخصصی',
};

// Team Context Descriptions (Persian)
export const TEAM_CONTEXT_DESCRIPTIONS: Record<TeamContext, string> = {
  solo: 'مستقل و بدون تیم ثابت',
  small_team: 'همکاری نزدیک با ۲-۵ نفر',
  cross_functional: 'کار با تیم‌های مختلف',
};

// Apply Method Labels (Persian)
export const APPLY_METHOD_LABELS: Record<ApplyMethod, string> = {
  bizbuzz: 'درخواست در بیزباز',
  external_link: 'لینک خارجی',
};

// Quick Job Microcopy (Persian)
// Tone: "کافیه برای شروع" - never say "ناقص" or "باید تکمیل شود"
export const QUICK_JOB_COPY = {
  entry: {
    title: 'یه آگهی سریع بساز',
    subtitle: 'نقش رو مشخص کن؛ جزئیات رو بعداً اضافه می‌کنیم.',
  },
  step1: {
    title: 'اطلاعات نقش',
    subtitle: 'چه کسی رو دنبال می‌کنید؟',
  },
  step2: {
    title: 'روش درخواست',
    subtitle: 'متقاضیان چطور درخواست بدن؟',
  },
  fields: {
    title: {
      label: 'عنوان شغل',
      placeholder: 'مثال: طراح UI/UX',
    },
    role_summary: {
      label: 'توضیح کوتاه نقش',
      placeholder: 'این نقش چه مشکلی رو حل می‌کنه؟',
      helper: '۲-۳ جمله کافیه',
    },
    domain: {
      label: 'حوزه تخصصی',
      placeholder: 'انتخاب حوزه',
    },
    location_type: {
      label: 'نوع حضور',
    },
    team_context: {
      label: 'محیط کاری',
    },
    apply_method: {
      bizbuzz: {
        title: 'درخواست در بیزباز',
        description: 'متقاضیان مستقیم در پلتفرم درخواست می‌دهند',
      },
      external: {
        title: 'لینک خارجی',
        description: 'هدایت به سایت یا فرم دیگر',
        placeholder: 'آدرس صفحه درخواست',
      },
    },
  },
  inline: {
    helper: 'برای شروع، همین کافیه.',
  },
  publish: {
    cta: 'انتشار آگهی',
    draft: 'ذخیره پیش‌نویس',
    helper: 'می‌تونی هر زمان خواستی جزئیات بیشتری اضافه کنی.',
  },
  success: {
    title: 'آگهی منتشر شد!',
    subtitle: 'الان قابل مشاهده و دریافت درخواست است.',
    bridge: {
      title: 'می‌خوای افراد مناسب‌تری جذب بشن؟',
      body: 'با اضافه‌کردن چند جزئیات کوتاه، توضیح بهتری از این نقش می‌دی.',
      cta: 'بهبود آگهی',
      helper: 'اختیاری — حدود ۳ تا ۵ دقیقه',
    },
  },
};

// Professional Job Microcopy (Persian)
// Tone: "بهتر می‌کنه، نه کامل می‌کنه" - never say "ناقص" or "درصد تکمیل"
export const PROFESSIONAL_JOB_COPY = {
  header: {
    title: 'بهبود آگهی شغلی',
    subtitle: 'این بخش‌ها کمک می‌کنن تناسب نقش و متقاضی بهتر توضیح داده بشه.',
  },
  intro: {
    helper: 'هر کدوم از این بخش‌ها اختیاریه. هر چی اضافه کنی، matching دقیق‌تر می‌شه.',
  },
  modules: {
    skills: {
      title: 'مهارت‌ها و تخصص',
      helper: 'مهارت‌ها کمک می‌کنن افراد مرتبط‌تر این آگهی رو ببینن.',
    },
    experience: {
      title: 'سطح تجربه',
      helper: 'برای شفافیت بیشتر — اجباری نیست.',
    },
    workstyle: {
      title: 'انتظارات سبک کاری',
      helper: 'این بخش توضیح می‌ده نقش چطور کار می‌کنه، نه اینکه دنبال چه تیپ آدمی هستید.',
      helperBottom: 'برای توضیح تناسب استفاده می‌شه، نه فیلتر کردن.',
    },
    team: {
      title: 'اطلاعات تیم',
      helper: 'کمک می‌کنه متقاضی بدونه وارد چه تیمی می‌شه.',
    },
    company: {
      title: 'اطلاعات شرکت',
      helper: 'برای ویرایش، به تنظیمات شرکت بروید.',
    },
    hiring: {
      title: 'تنظیمات استخدام',
      helper: 'فقط برای بهبود فرآیند استخدام استفاده می‌شه. برای متقاضی نمایش داده نمی‌شه.',
      badge: 'داخلی',
    },
  },
  actions: {
    save: 'ذخیره',
    viewJob: 'مشاهده آگهی',
  },
  toast: {
    saved: 'تغییرات روی matching اعمال شد.',
  },
  footer: {
    hint: 'جزئیات بیشتر = توضیح بهتر تناسب نقش',
    autoSave: 'تغییرات به‌صورت خودکار ذخیره می‌شن.',
  },
};

// Forbidden words in job microcopy
// These words create pressure and should NEVER be used
export const MICROCOPY_FORBIDDEN_WORDS = [
  'کامل',
  'ناقص',
  'درصد تکمیل',
  'الزامی',
  'باید پر شود',
  'تکمیل آگهی',
  'اجباری',
] as const;

// Preferred words in job microcopy
// These words encourage without pressure
export const MICROCOPY_PREFERRED_WORDS = [
  'اختیاری',
  'برای شروع',
  'می‌تونی',
  'بهتر',
  'دقیق‌تر',
  'کمک می‌کنه',
] as const;
