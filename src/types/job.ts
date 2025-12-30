// Job Ad Status
export type JobStatus = 'draft' | 'published' | 'paused' | 'closed' | 'filled';

// Employment Types
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';

// Location Types
export type LocationType = 'onsite' | 'remote' | 'hybrid';

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

  // Requirements
  experience_level?: ExperienceLevel | null;
  required_skills: string[];
  preferred_skills: string[];

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
  experience_level?: ExperienceLevel;
  required_skills?: string[];
  preferred_skills?: string[];
  domain_id?: string;
  specialization_id?: string;
  event_id?: string;
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
