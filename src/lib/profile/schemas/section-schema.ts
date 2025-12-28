// Section Schema - Defines profile sections
import type { FieldSchema, FieldVisibility } from './field-types';
import { FIELD_DEFINITIONS } from './field-types';

export interface SectionField {
  key: string;
  required?: boolean;
  defaultVisibility?: FieldVisibility;
  order?: number;
}

export interface SectionSchema {
  id: string;
  label: string;
  labelFa: string;
  description?: string;
  descriptionFa?: string;
  icon?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  fields: SectionField[];
}

// Predefined sections
export const SECTION_DEFINITIONS: Record<string, SectionSchema> = {
  basic_info: {
    id: 'basic_info',
    label: 'Basic Information',
    labelFa: 'اطلاعات پایه',
    icon: 'User',
    collapsible: false,
    defaultExpanded: true,
    fields: [
      { key: 'full_name', required: true },
      { key: 'headline' },
      { key: 'photo_url' },
    ],
  },
  about: {
    id: 'about',
    label: 'About',
    labelFa: 'درباره',
    icon: 'FileText',
    collapsible: true,
    defaultExpanded: true,
    fields: [{ key: 'bio' }],
  },
  professional: {
    id: 'professional',
    label: 'Professional Info',
    labelFa: 'اطلاعات شغلی',
    icon: 'Briefcase',
    collapsible: true,
    defaultExpanded: true,
    fields: [
      { key: 'job_title' },
      { key: 'company' },
      { key: 'industry' },
    ],
  },
  contact: {
    id: 'contact',
    label: 'Contact Information',
    labelFa: 'اطلاعات تماس',
    icon: 'Phone',
    collapsible: true,
    defaultExpanded: true,
    fields: [
      { key: 'email', defaultVisibility: 'public' },
      { key: 'phone', defaultVisibility: 'masked' },
      { key: 'website' },
      { key: 'address', defaultVisibility: 'hidden' },
      { key: 'city' },
      { key: 'country' },
    ],
  },
  social: {
    id: 'social',
    label: 'Social Links',
    labelFa: 'شبکه‌های اجتماعی',
    icon: 'Share2',
    collapsible: true,
    defaultExpanded: true,
    fields: [{ key: 'social_links' }],
  },
  skills: {
    id: 'skills',
    label: 'Skills',
    labelFa: 'مهارت‌ها',
    icon: 'Zap',
    collapsible: true,
    defaultExpanded: true,
    fields: [{ key: 'skills' }],
  },
  experience: {
    id: 'experience',
    label: 'Work Experience',
    labelFa: 'سوابق شغلی',
    icon: 'Building',
    collapsible: true,
    defaultExpanded: true,
    fields: [{ key: 'experience' }],
  },
  education: {
    id: 'education',
    label: 'Education',
    labelFa: 'تحصیلات',
    icon: 'GraduationCap',
    collapsible: true,
    defaultExpanded: true,
    fields: [{ key: 'education' }],
  },
  files: {
    id: 'files',
    label: 'Files',
    labelFa: 'فایل‌ها',
    icon: 'Paperclip',
    collapsible: true,
    defaultExpanded: true,
    fields: [{ key: 'resume_file_url' }],
  },
  cover: {
    id: 'cover',
    label: 'Cover Image',
    labelFa: 'تصویر کاور',
    icon: 'Image',
    collapsible: true,
    defaultExpanded: false,
    fields: [{ key: 'cover_url' }],
  },
  custom: {
    id: 'custom',
    label: 'Custom Fields',
    labelFa: 'فیلدهای سفارشی',
    icon: 'Settings',
    collapsible: true,
    defaultExpanded: true,
    fields: [{ key: 'custom_fields' }],
  },
};

// Resolved section with full field definitions
export interface ResolvedSection {
  id: string;
  label: string;
  labelFa: string;
  description?: string;
  descriptionFa?: string;
  icon?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  enabled: boolean;
  order: number;
  fields: Array<{
    schema: FieldSchema;
    required: boolean;
    visibility: FieldVisibility;
    enabled: boolean;
    order: number;
  }>;
}

export function getSectionDefinition(id: string): SectionSchema | undefined {
  return SECTION_DEFINITIONS[id];
}

export function resolveSections(
  sectionIds: string[],
  overrides?: Record<string, Partial<SectionSchema>>
): ResolvedSection[] {
  return sectionIds.map((id, index) => {
    const section = SECTION_DEFINITIONS[id];
    if (!section) {
      throw new Error(`Section not found: ${id}`);
    }

    const override = overrides?.[id];
    const mergedSection = { ...section, ...override };

    return {
      id: mergedSection.id,
      label: mergedSection.label,
      labelFa: mergedSection.labelFa,
      description: mergedSection.description,
      descriptionFa: mergedSection.descriptionFa,
      icon: mergedSection.icon,
      collapsible: mergedSection.collapsible,
      defaultExpanded: mergedSection.defaultExpanded,
      enabled: true,
      order: index,
      fields: mergedSection.fields.map((field, fieldIndex) => {
        const fieldDef = FIELD_DEFINITIONS[field.key];
        if (!fieldDef) {
          throw new Error(`Field not found: ${field.key}`);
        }
        return {
          schema: fieldDef,
          required: field.required ?? false,
          visibility: field.defaultVisibility ?? fieldDef.defaultVisibility ?? 'public',
          enabled: true,
          order: field.order ?? fieldIndex,
        };
      }),
    };
  });
}
