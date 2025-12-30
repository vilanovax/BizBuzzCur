// Company Team Member Roles
export type CompanyRole = 'owner' | 'admin' | 'recruiter' | 'member';

// Invitation Status
export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

// Company Size
export type CompanySize =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-1000'
  | '1001-5000'
  | '5000+';

// Company Type
export type CompanyType =
  | 'startup'
  | 'private'
  | 'public'
  | 'nonprofit'
  | 'government'
  | 'educational';

// Company (Entity)
export interface Company {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  description?: string | null;

  // Branding
  logo_url?: string | null;
  cover_image_url?: string | null;
  brand_color?: string | null;

  // Company Info
  industry?: string | null;
  company_size?: CompanySize | null;
  founded_year?: number | null;
  company_type?: CompanyType | null;

  // Contact
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;

  // Social
  linkedin_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  telegram_url?: string | null;

  // Leadership
  ceo_name?: string | null;
  ceo_message?: string | null;
  vision?: string | null;
  mission?: string | null;
  core_values?: string[] | null;

  // Status
  is_verified: boolean;
  is_hiring: boolean;
  show_in_directory: boolean;

  // Analytics
  total_views: number;

  // Owner
  created_by: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Company Team Member
export interface CompanyTeamMember {
  id: string;
  company_id: string;
  user_id: string;
  department_id?: string | null;

  // Role
  role: CompanyRole;

  // Invitation
  invitation_status: InvitationStatus;
  invited_by?: string | null;
  invited_at?: string | null;
  joined_at?: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Team Member with User info
export interface CompanyTeamMemberWithUser extends CompanyTeamMember {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  };
}

// Company Department (Sub-Entity)
export interface CompanyDepartment {
  id: string;
  company_id: string;
  parent_department_id?: string | null;

  name: string;
  description?: string | null;
  head_user_id?: string | null;

  created_at: string;
  updated_at: string;
}

// Create Company Request
export interface CreateCompanyRequest {
  name: string;
  slug?: string; // Auto-generated if not provided
  tagline?: string;
  description?: string;
  industry?: string;
  company_size?: CompanySize;
  founded_year?: number;
  company_type?: CompanyType;
  website?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
}

// Update Company Request
export interface UpdateCompanyRequest extends Partial<CreateCompanyRequest> {
  logo_url?: string;
  cover_image_url?: string;
  brand_color?: string;
  linkedin_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  telegram_url?: string;
  ceo_name?: string;
  ceo_message?: string;
  vision?: string;
  mission?: string;
  core_values?: string[];
  is_hiring?: boolean;
  show_in_directory?: boolean;
}

// Company with stats (for display)
export interface CompanyWithStats extends Company {
  member_count: number;
  department_count: number;
  active_jobs_count: number;
  user_role?: CompanyRole | null; // Current user's role in this company
}

// Role Labels (Persian)
export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  owner: 'مالک',
  admin: 'مدیر',
  recruiter: 'استخدام‌کننده',
  member: 'عضو',
};

// Company Size Labels (Persian)
export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  '1-10': '۱-۱۰ نفر',
  '11-50': '۱۱-۵۰ نفر',
  '51-200': '۵۱-۲۰۰ نفر',
  '201-500': '۲۰۱-۵۰۰ نفر',
  '501-1000': '۵۰۱-۱۰۰۰ نفر',
  '1001-5000': '۱۰۰۱-۵۰۰۰ نفر',
  '5000+': 'بیش از ۵۰۰۰ نفر',
};

// Company Type Labels (Persian)
export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  startup: 'استارتاپ',
  private: 'خصوصی',
  public: 'سهامی عام',
  nonprofit: 'غیرانتفاعی',
  government: 'دولتی',
  educational: 'آموزشی',
};

// Permission helpers
export function canManageCompany(role: CompanyRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

export function canPostJobs(role: CompanyRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin' || role === 'recruiter';
}

export function canViewApplications(role: CompanyRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin' || role === 'recruiter';
}

export function canInviteMembers(role: CompanyRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}
