'use client';

import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { FileUpload } from '@/components/ui/FileUpload';
import type { FieldSchema, FieldVisibility } from '../schemas/field-types';

interface FieldRendererProps {
  field: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  visibility?: FieldVisibility;
  disabled?: boolean;
  error?: string;
}

// Generic field renderer based on field type
export function FieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
  error,
}: FieldRendererProps) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <Input
          id={field.key}
          type={field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : 'text'}
          label={field.labelFa || field.label}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholderFa || field.placeholder}
          disabled={disabled}
          error={error}
        />
      );

    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {field.labelFa || field.label}
          </label>
          <textarea
            id={field.key}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholderFa || field.placeholder}
            disabled={disabled}
            rows={4}
            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
          {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {field.labelFa || field.label}
          </label>
          <select
            id={field.key}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">انتخاب کنید...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.labelFa || opt.label}
              </option>
            ))}
          </select>
          {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        </div>
      );

    case 'image':
      return (
        <ImageUpload
          value={(value as string) || undefined}
          onChange={(url) => onChange(url)}
          type={field.key === 'cover_url' ? 'cover_image' : 'profile_photo'}
          labelFa={field.labelFa}
          label={field.label}
          aspectRatio={field.key === 'cover_url' ? 'cover' : 'square'}
          disabled={disabled}
        />
      );

    case 'file':
      return (
        <FileUpload
          value={(value as string) || undefined}
          onChange={(url) => onChange(url)}
          type="resume"
          labelFa={field.labelFa}
          label={field.label}
          accept={field.accept}
          disabled={disabled}
        />
      );

    case 'social_links':
      return (
        <SocialLinksEditor
          value={(value as Record<string, string>) || {}}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'skills':
      return (
        <SkillsEditor
          value={(value as Array<{ name: string; level: string }>) || []}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'custom_fields':
      return (
        <CustomFieldsEditor
          value={(value as Array<{ label: string; value: string }>) || []}
          onChange={onChange}
          disabled={disabled}
        />
      );

    default:
      return (
        <Input
          id={field.key}
          label={field.labelFa || field.label}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          error={error}
        />
      );
  }
}

// Social Links Editor
interface SocialLinksEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  disabled?: boolean;
}

const SOCIAL_PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/...' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/...' },
  { key: 'website', label: 'Website', placeholder: 'https://...' },
];

function SocialLinksEditor({ value, onChange, disabled }: SocialLinksEditorProps) {
  const handleChange = (key: string, val: string) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        شبکه‌های اجتماعی
      </label>
      <div className="grid gap-3">
        {SOCIAL_PLATFORMS.map((platform) => (
          <div key={platform.key} className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-24 shrink-0">
              {platform.label}
            </span>
            <Input
              value={value[platform.key] || ''}
              onChange={(e) => handleChange(platform.key, e.target.value)}
              placeholder={platform.placeholder}
              disabled={disabled}
              className="flex-1"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skills Editor
interface SkillsEditorProps {
  value: Array<{ name: string; level: string }>;
  onChange: (value: Array<{ name: string; level: string }>) => void;
  disabled?: boolean;
}

const SKILL_LEVELS = [
  { value: 'beginner', label: 'مبتدی' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'پیشرفته' },
  { value: 'expert', label: 'متخصص' },
];

function SkillsEditor({ value, onChange, disabled }: SkillsEditorProps) {
  const addSkill = () => {
    onChange([...value, { name: '', level: 'intermediate' }]);
  };

  const updateSkill = (index: number, field: 'name' | 'level', val: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const removeSkill = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground">
          مهارت‌ها
        </label>
        <button
          type="button"
          onClick={addSkill}
          disabled={disabled}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          + افزودن مهارت
        </button>
      </div>

      <div className="space-y-2">
        {value.map((skill, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={skill.name}
              onChange={(e) => updateSkill(index, 'name', e.target.value)}
              placeholder="نام مهارت"
              disabled={disabled}
              className="flex-1"
            />
            <select
              value={skill.level}
              onChange={(e) => updateSkill(index, 'level', e.target.value)}
              disabled={disabled}
              className="px-2 py-2 border border-input rounded-lg bg-background text-sm"
            >
              {SKILL_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeSkill(index)}
              disabled={disabled}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          هنوز مهارتی اضافه نشده
        </p>
      )}
    </div>
  );
}

// Custom Fields Editor
interface CustomFieldsEditorProps {
  value: Array<{ label: string; value: string }>;
  onChange: (value: Array<{ label: string; value: string }>) => void;
  disabled?: boolean;
}

function CustomFieldsEditor({ value, onChange, disabled }: CustomFieldsEditorProps) {
  const addField = () => {
    onChange([...value, { label: '', value: '' }]);
  };

  const updateField = (index: number, field: 'label' | 'value', val: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const removeField = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground">
          فیلدهای سفارشی
        </label>
        <button
          type="button"
          onClick={addField}
          disabled={disabled}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          + افزودن فیلد
        </button>
      </div>

      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={item.label}
              onChange={(e) => updateField(index, 'label', e.target.value)}
              placeholder="عنوان"
              disabled={disabled}
              className="w-1/3"
            />
            <Input
              value={item.value}
              onChange={(e) => updateField(index, 'value', e.target.value)}
              placeholder="مقدار"
              disabled={disabled}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => removeField(index)}
              disabled={disabled}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          هنوز فیلدی اضافه نشده
        </p>
      )}
    </div>
  );
}
