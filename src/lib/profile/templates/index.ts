// Profile Templates - Config-driven template system
import type { ProfileType, CTAType } from '@/types/profile';
import type { FieldVisibility } from '../schemas/field-types';
import { resolveSections, type ResolvedSection } from '../schemas/section-schema';

export type ContextType =
  | 'BUSINESS_MEETING'
  | 'JOB_APPLICATION'
  | 'EVENT_NETWORKING'
  | 'COMPANY_INTRO'
  | 'FREELANCE_PORTFOLIO'
  | 'SOCIAL_CONNECT'
  | 'CUSTOM';

export interface TemplateDefaults {
  visibility: 'public' | 'connections' | 'private' | 'event_only';
  phoneVisibility: FieldVisibility;
  emailVisibility: FieldVisibility;
  ctaType: CTAType;
  themeColor: string;
}

export interface ProfileTemplate {
  id: string;
  name: string;
  nameFa: string;
  description: string;
  descriptionFa: string;
  profileType: ProfileType;
  context: ContextType;
  icon: string;
  color: string;
  defaults: TemplateDefaults;
  sections: string[]; // Section IDs to include
  sectionOverrides?: Record<string, { enabled?: boolean; fields?: { key: string; required?: boolean; visibility?: FieldVisibility }[] }>;
}

// Template Definitions
export const TEMPLATES: ProfileTemplate[] = [
  {
    id: 'business_card_work',
    name: 'Business Card',
    nameFa: 'کارت ویزیت کاری',
    description: 'Professional business card for networking',
    descriptionFa: 'کارت ویزیت حرفه‌ای برای شبکه‌سازی',
    profileType: 'business_card',
    context: 'BUSINESS_MEETING',
    icon: 'Briefcase',
    color: '#2563eb',
    defaults: {
      visibility: 'public',
      phoneVisibility: 'masked',
      emailVisibility: 'public',
      ctaType: 'connect',
      themeColor: '#2563eb',
    },
    sections: ['basic_info', 'professional', 'contact', 'social'],
    sectionOverrides: {
      contact: {
        fields: [
          { key: 'email', visibility: 'public' },
          { key: 'phone', visibility: 'masked' },
          { key: 'website' },
        ],
      },
    },
  },
  {
    id: 'resume_job',
    name: 'Job Resume',
    nameFa: 'رزومه کاریابی',
    description: 'Complete resume for job applications',
    descriptionFa: 'رزومه کامل برای استخدام و کاریابی',
    profileType: 'resume',
    context: 'JOB_APPLICATION',
    icon: 'FileText',
    color: '#7c3aed',
    defaults: {
      visibility: 'public',
      phoneVisibility: 'public',
      emailVisibility: 'public',
      ctaType: 'download_cv',
      themeColor: '#7c3aed',
    },
    sections: ['basic_info', 'about', 'professional', 'skills', 'experience', 'education', 'files', 'contact', 'social'],
  },
  {
    id: 'event_networking',
    name: 'Event Networking',
    nameFa: 'شبکه‌سازی رویداد',
    description: 'Quick profile for events and conferences',
    descriptionFa: 'پروفایل سریع برای رویدادها و کنفرانس‌ها',
    profileType: 'event',
    context: 'EVENT_NETWORKING',
    icon: 'Users',
    color: '#059669',
    defaults: {
      visibility: 'public',
      phoneVisibility: 'after_connect',
      emailVisibility: 'after_connect',
      ctaType: 'connect',
      themeColor: '#059669',
    },
    sections: ['basic_info', 'professional', 'social'],
    sectionOverrides: {
      contact: { enabled: false },
    },
  },
  {
    id: 'company_intro',
    name: 'Company Profile',
    nameFa: 'معرفی شرکت',
    description: 'Company or organization introduction',
    descriptionFa: 'معرفی شرکت یا سازمان',
    profileType: 'company',
    context: 'COMPANY_INTRO',
    icon: 'Building2',
    color: '#0891b2',
    defaults: {
      visibility: 'public',
      phoneVisibility: 'public',
      emailVisibility: 'public',
      ctaType: 'visit_website',
      themeColor: '#0891b2',
    },
    sections: ['basic_info', 'about', 'contact', 'social', 'cover', 'custom'],
  },
  {
    id: 'freelance_consulting',
    name: 'Freelance / Consulting',
    nameFa: 'فریلنس / مشاوره',
    description: 'Profile for freelancers and consultants',
    descriptionFa: 'پروفایل برای فریلنسرها و مشاوران',
    profileType: 'business_card',
    context: 'FREELANCE_PORTFOLIO',
    icon: 'UserCircle',
    color: '#ea580c',
    defaults: {
      visibility: 'public',
      phoneVisibility: 'masked',
      emailVisibility: 'public',
      ctaType: 'book_meeting',
      themeColor: '#ea580c',
    },
    sections: ['basic_info', 'about', 'skills', 'contact', 'social', 'custom'],
  },
  {
    id: 'custom',
    name: 'Custom Profile',
    nameFa: 'پروفایل سفارشی',
    description: 'Build your own custom profile',
    descriptionFa: 'پروفایل کاملاً سفارشی بسازید',
    profileType: 'business_card',
    context: 'CUSTOM',
    icon: 'Settings2',
    color: '#1f2937',
    defaults: {
      visibility: 'public',
      phoneVisibility: 'public',
      emailVisibility: 'public',
      ctaType: 'connect',
      themeColor: '#2563eb',
    },
    sections: ['basic_info', 'about', 'professional', 'contact', 'social', 'skills', 'experience', 'education', 'files', 'cover', 'custom'],
  },
];

// Get template by ID
export function getTemplate(id: string): ProfileTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

// Get templates by context
export function getTemplatesByContext(context: ContextType): ProfileTemplate[] {
  return TEMPLATES.filter((t) => t.context === context);
}

// Get templates by profile type
export function getTemplatesByType(type: ProfileType): ProfileTemplate[] {
  return TEMPLATES.filter((t) => t.profileType === type);
}

// Resolve template to full configuration with sections and fields
export interface ResolvedTemplate extends ProfileTemplate {
  resolvedSections: ResolvedSection[];
}

export function resolveTemplate(templateId: string): ResolvedTemplate | undefined {
  const template = getTemplate(templateId);
  if (!template) return undefined;

  const resolvedSections = resolveSections(template.sections, template.sectionOverrides as unknown as Record<string, Record<string, unknown>>);

  return {
    ...template,
    resolvedSections,
  };
}

// Build form configuration from template
export interface FormConfiguration {
  templateId: string;
  context: ContextType;
  sections: Array<{
    id: string;
    label: string;
    labelFa: string;
    icon?: string;
    enabled: boolean;
    collapsible: boolean;
    fields: Array<{
      key: string;
      type: string;
      label: string;
      labelFa: string;
      required: boolean;
      visibility: FieldVisibility;
      placeholder?: string;
      placeholderFa?: string;
      options?: Array<{ value: string; label: string; labelFa?: string }>;
    }>;
  }>;
  defaults: TemplateDefaults;
}

export function buildFormConfiguration(templateId: string): FormConfiguration | undefined {
  const resolved = resolveTemplate(templateId);
  if (!resolved) return undefined;

  return {
    templateId: resolved.id,
    context: resolved.context,
    defaults: resolved.defaults,
    sections: resolved.resolvedSections.map((section) => ({
      id: section.id,
      label: section.label,
      labelFa: section.labelFa,
      icon: section.icon,
      enabled: section.enabled,
      collapsible: section.collapsible ?? true,
      fields: section.fields.map((field) => ({
        key: field.schema.key,
        type: field.schema.type,
        label: field.schema.label,
        labelFa: field.schema.labelFa,
        required: field.required,
        visibility: field.visibility,
        placeholder: field.schema.placeholder,
        placeholderFa: field.schema.placeholderFa,
        options: field.schema.options,
      })),
    })),
  };
}
