export type ProfileType = 'business_card' | 'resume' | 'event';

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  telegram?: string;
  github?: string;
  website?: string;
}

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

  // Display Settings
  theme_color: string;
  is_public: boolean;
  is_active: boolean;

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
}

export interface UpdateProfileInput extends Partial<CreateProfileInput> {
  photo_url?: string;
  cover_url?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  custom_fields?: CustomField[];
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
