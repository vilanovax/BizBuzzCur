export type ProfileType = 'business_card' | 'resume' | 'event' | 'company';

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
