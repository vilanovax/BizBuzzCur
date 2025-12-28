// Field Types - Core schema for profile fields
// This defines all possible field types and their configurations

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'image'
  | 'file'
  | 'social_links'
  | 'skills'
  | 'experience'
  | 'education'
  | 'custom_fields';

export type FieldVisibility = 'public' | 'masked' | 'after_connect' | 'hidden';

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface FieldOption {
  value: string;
  label: string;
  labelFa?: string;
}

export interface FieldSchema {
  key: string;
  type: FieldType;
  label: string;
  labelFa: string;
  placeholder?: string;
  placeholderFa?: string;
  description?: string;
  descriptionFa?: string;
  defaultValue?: unknown;
  defaultVisibility?: FieldVisibility;
  validation?: FieldValidation;
  options?: FieldOption[]; // For select/multiselect
  accept?: string; // For file inputs (e.g., ".pdf,.doc")
  maxSize?: number; // Max file size in bytes
}

// All available fields in the system
export const FIELD_DEFINITIONS: Record<string, FieldSchema> = {
  // Basic Info
  full_name: {
    key: 'full_name',
    type: 'text',
    label: 'Full Name',
    labelFa: 'نام کامل',
    placeholder: 'Enter your full name',
    placeholderFa: 'نام و نام خانوادگی',
    validation: { required: true, maxLength: 255 },
    defaultVisibility: 'public',
  },
  headline: {
    key: 'headline',
    type: 'text',
    label: 'Headline',
    labelFa: 'عنوان',
    placeholder: 'e.g., Software Engineer at Company',
    placeholderFa: 'مثلاً: مدیر مالی در شرکت X',
    validation: { maxLength: 500 },
    defaultVisibility: 'public',
  },
  bio: {
    key: 'bio',
    type: 'textarea',
    label: 'Bio',
    labelFa: 'درباره من',
    placeholder: 'Tell us about yourself...',
    placeholderFa: 'درباره خودتان بنویسید...',
    validation: { maxLength: 2000 },
    defaultVisibility: 'public',
  },
  photo_url: {
    key: 'photo_url',
    type: 'image',
    label: 'Profile Photo',
    labelFa: 'عکس پروفایل',
    accept: 'image/jpeg,image/png,image/webp',
    maxSize: 5 * 1024 * 1024, // 5MB
    defaultVisibility: 'public',
  },
  cover_url: {
    key: 'cover_url',
    type: 'image',
    label: 'Cover Image',
    labelFa: 'تصویر کاور',
    accept: 'image/jpeg,image/png,image/webp',
    maxSize: 10 * 1024 * 1024, // 10MB
    defaultVisibility: 'public',
  },

  // Contact Info
  email: {
    key: 'email',
    type: 'email',
    label: 'Email',
    labelFa: 'ایمیل',
    placeholder: 'email@example.com',
    validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$', patternMessage: 'Invalid email' },
    defaultVisibility: 'public',
  },
  phone: {
    key: 'phone',
    type: 'phone',
    label: 'Phone',
    labelFa: 'شماره تماس',
    placeholder: '09121234567',
    placeholderFa: '۰۹۱۲۱۲۳۴۵۶۷',
    defaultVisibility: 'masked',
  },
  website: {
    key: 'website',
    type: 'url',
    label: 'Website',
    labelFa: 'وب‌سایت',
    placeholder: 'https://example.com',
    defaultVisibility: 'public',
  },
  address: {
    key: 'address',
    type: 'textarea',
    label: 'Address',
    labelFa: 'آدرس',
    defaultVisibility: 'hidden',
  },
  city: {
    key: 'city',
    type: 'text',
    label: 'City',
    labelFa: 'شهر',
    defaultVisibility: 'public',
  },
  country: {
    key: 'country',
    type: 'text',
    label: 'Country',
    labelFa: 'کشور',
    defaultVisibility: 'public',
  },

  // Professional Info
  job_title: {
    key: 'job_title',
    type: 'text',
    label: 'Job Title',
    labelFa: 'عنوان شغلی',
    placeholder: 'e.g., Product Manager',
    placeholderFa: 'مثلاً: مدیر محصول',
    defaultVisibility: 'public',
  },
  company: {
    key: 'company',
    type: 'text',
    label: 'Company',
    labelFa: 'شرکت',
    placeholder: 'Company name',
    placeholderFa: 'نام شرکت',
    defaultVisibility: 'public',
  },
  industry: {
    key: 'industry',
    type: 'select',
    label: 'Industry',
    labelFa: 'صنعت',
    defaultVisibility: 'public',
    options: [
      { value: 'technology', label: 'Technology', labelFa: 'فناوری' },
      { value: 'finance', label: 'Finance', labelFa: 'مالی' },
      { value: 'healthcare', label: 'Healthcare', labelFa: 'بهداشت و درمان' },
      { value: 'education', label: 'Education', labelFa: 'آموزش' },
      { value: 'retail', label: 'Retail', labelFa: 'خرده‌فروشی' },
      { value: 'manufacturing', label: 'Manufacturing', labelFa: 'تولید' },
      { value: 'consulting', label: 'Consulting', labelFa: 'مشاوره' },
      { value: 'other', label: 'Other', labelFa: 'سایر' },
    ],
  },

  // Complex Fields
  social_links: {
    key: 'social_links',
    type: 'social_links',
    label: 'Social Links',
    labelFa: 'شبکه‌های اجتماعی',
    defaultVisibility: 'public',
  },
  skills: {
    key: 'skills',
    type: 'skills',
    label: 'Skills',
    labelFa: 'مهارت‌ها',
    defaultVisibility: 'public',
  },
  experience: {
    key: 'experience',
    type: 'experience',
    label: 'Work Experience',
    labelFa: 'سوابق شغلی',
    defaultVisibility: 'public',
  },
  education: {
    key: 'education',
    type: 'education',
    label: 'Education',
    labelFa: 'تحصیلات',
    defaultVisibility: 'public',
  },
  custom_fields: {
    key: 'custom_fields',
    type: 'custom_fields',
    label: 'Custom Fields',
    labelFa: 'فیلدهای سفارشی',
    defaultVisibility: 'public',
  },

  // Files
  resume_file_url: {
    key: 'resume_file_url',
    type: 'file',
    label: 'Resume File',
    labelFa: 'فایل رزومه',
    accept: '.pdf,.doc,.docx',
    maxSize: 10 * 1024 * 1024, // 10MB
    defaultVisibility: 'public',
  },
};

export function getFieldDefinition(key: string): FieldSchema | undefined {
  return FIELD_DEFINITIONS[key];
}

export function getFieldDefinitions(keys: string[]): FieldSchema[] {
  return keys.map((key) => FIELD_DEFINITIONS[key]).filter(Boolean);
}
