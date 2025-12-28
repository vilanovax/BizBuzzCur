// Professional Taxonomy Types
// Layers: Domain → Specialization → Skills
// Plus: Professional Status

// ============================================
// LAYER 1: Professional Domains
// ============================================
export interface ProfessionalDomain {
  id: string;
  slug: string;
  name_en: string;
  name_fa: string;
  description_en: string | null;
  description_fa: string | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// LAYER 2: Specializations
// ============================================
export interface Specialization {
  id: string;
  domain_id: string;
  slug: string;
  name_en: string;
  name_fa: string;
  description_en: string | null;
  description_fa: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Specialization with domain info (for display)
export interface SpecializationWithDomain extends Specialization {
  domain: ProfessionalDomain;
}

// ============================================
// LAYER 3: Skills
// ============================================
export type SkillCategory = 'technical' | 'soft' | 'certification' | 'tool' | 'methodology' | 'language';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Skill {
  id: string;
  slug: string;
  name_en: string;
  name_fa: string;
  description_en: string | null;
  description_fa: string | null;
  category: SkillCategory;
  suggested_domain_ids: string[];
  popularity_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Skill suggestion (for autocomplete)
export interface SkillSuggestion extends Skill {
  relevance_score?: number; // When suggested based on specialization
}

// ============================================
// LAYER 4: Professional Status
// ============================================
export type StatusType = 'availability' | 'seeking' | 'offering';
export type StatusVisibility = 'public' | 'connections' | 'event_only' | 'private';

export interface ProfessionalStatus {
  id: string;
  slug: string;
  name_en: string;
  name_fa: string;
  description_en: string | null;
  description_fa: string | null;
  icon: string | null;
  color: string | null;
  status_type: StatusType;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// ============================================
// USER PROFESSIONAL IDENTITY
// ============================================

export interface UserDomain {
  id: string;
  user_id: string;
  domain_id: string;
  is_primary: boolean;
  created_at: string;
  domain?: ProfessionalDomain;
}

export interface UserSpecialization {
  id: string;
  user_id: string;
  specialization_id: string;
  years_experience: number | null;
  created_at: string;
  specialization?: Specialization;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  level: SkillLevel;
  years_experience: number | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  skill?: Skill;
}

export interface UserProfessionalStatus {
  id: string;
  user_id: string;
  status_id: string;
  profile_id: string | null; // NULL = global status
  visibility: StatusVisibility;
  custom_message: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  status?: ProfessionalStatus;
}

// ============================================
// COMPLETE USER PROFESSIONAL PROFILE
// ============================================
export interface UserProfessionalProfile {
  primaryDomain: UserDomain | null;
  secondaryDomains: UserDomain[];
  specializations: UserSpecialization[];
  skills: UserSkill[];
  status: UserProfessionalStatus | null;
}

// ============================================
// API INPUT TYPES
// ============================================

export interface SetUserDomainInput {
  domain_id: string;
  is_primary?: boolean;
}

export interface SetUserSpecializationInput {
  specialization_id: string;
  years_experience?: number;
}

export interface SetUserSkillInput {
  skill_id: string;
  level?: SkillLevel;
  years_experience?: number;
}

export interface UpdateUserSkillInput {
  level?: SkillLevel;
  years_experience?: number;
  display_order?: number;
}

export interface SetUserStatusInput {
  status_id: string;
  profile_id?: string;
  visibility?: StatusVisibility;
  custom_message?: string;
  expires_at?: string;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface SkillSearchParams {
  query?: string;
  domain_id?: string;
  specialization_id?: string;
  category?: SkillCategory;
  limit?: number;
  offset?: number;
}

export interface UserSkillsFilter {
  domain_id?: string;
  specialization_id?: string;
  min_level?: SkillLevel;
  verified_only?: boolean;
}

// ============================================
// SKILL LEVEL METADATA
// ============================================
export const SKILL_LEVELS: Record<SkillLevel, { label: string; labelFa: string; description: string; value: number }> = {
  beginner: {
    label: 'Beginner',
    labelFa: 'مبتدی',
    description: 'Basic understanding, learning',
    value: 1,
  },
  intermediate: {
    label: 'Intermediate',
    labelFa: 'متوسط',
    description: 'Can work independently',
    value: 2,
  },
  advanced: {
    label: 'Advanced',
    labelFa: 'پیشرفته',
    description: 'Deep expertise, can mentor',
    value: 3,
  },
  expert: {
    label: 'Expert',
    labelFa: 'خبره',
    description: 'Industry-recognized expert',
    value: 4,
  },
};

// ============================================
// SKILL CATEGORY METADATA
// ============================================
export const SKILL_CATEGORIES: Record<SkillCategory, { label: string; labelFa: string }> = {
  technical: { label: 'Technical', labelFa: 'فنی' },
  soft: { label: 'Soft Skills', labelFa: 'مهارت‌های نرم' },
  certification: { label: 'Certification', labelFa: 'گواهینامه' },
  tool: { label: 'Tool', labelFa: 'ابزار' },
  methodology: { label: 'Methodology', labelFa: 'متدولوژی' },
  language: { label: 'Language', labelFa: 'زبان' },
};

// ============================================
// STATUS TYPE METADATA
// ============================================
export const STATUS_TYPES: Record<StatusType, { label: string; labelFa: string }> = {
  availability: { label: 'Availability', labelFa: 'در دسترس بودن' },
  seeking: { label: 'Seeking', labelFa: 'جستجو' },
  offering: { label: 'Offering', labelFa: 'ارائه' },
};
