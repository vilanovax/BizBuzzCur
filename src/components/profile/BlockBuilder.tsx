'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  User,
  FileText,
  Briefcase,
  Phone,
  Share2,
  Zap,
  Building,
  GraduationCap,
  Paperclip,
  Image as ImageIcon,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { FieldRenderer } from '@/lib/profile/builder/form-builder';
import type { ResolvedSection } from '@/lib/profile/schemas/section-schema';
import type { FieldVisibility } from '@/lib/profile/schemas/field-types';

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  User,
  FileText,
  Briefcase,
  Phone,
  Share2,
  Zap,
  Building,
  GraduationCap,
  Paperclip,
  Image: ImageIcon,
  Settings,
};

interface BlockBuilderProps {
  sections: ResolvedSection[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onVisibilityChange?: (key: string, visibility: FieldVisibility) => void;
  onSectionToggle?: (sectionId: string, enabled: boolean) => void;
  visibilityMap?: Record<string, FieldVisibility>;
  errors?: Record<string, string>;
  disabled?: boolean;
  className?: string;
}

export function BlockBuilder({
  sections,
  values,
  onChange,
  onVisibilityChange,
  onSectionToggle,
  visibilityMap = {},
  errors = {},
  disabled = false,
  className,
}: BlockBuilderProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.filter((s) => s.defaultExpanded).map((s) => s.id))
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {sections
        .filter((section) => section.enabled)
        .map((section) => {
          const Icon = ICON_MAP[section.icon || 'FileText'] || FileText;
          const isExpanded = expandedSections.has(section.id);

          return (
            <div
              key={section.id}
              className={cn(
                'border rounded-xl overflow-hidden transition-all',
                isExpanded ? 'bg-card' : 'bg-muted/30'
              )}
            >
              {/* Section Header */}
              <div
                className={cn(
                  'flex items-center gap-3 p-4 cursor-pointer select-none',
                  section.collapsible && 'hover:bg-muted/50'
                )}
                onClick={() => section.collapsible && toggleSection(section.id)}
              >
                {/* Drag handle (for future drag-n-drop) */}
                <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />

                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">
                    {section.labelFa}
                  </h3>
                  {section.descriptionFa && (
                    <p className="text-xs text-muted-foreground">
                      {section.descriptionFa}
                    </p>
                  )}
                </div>

                {/* Toggle button for section */}
                {onSectionToggle && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSectionToggle(section.id, !section.enabled);
                    }}
                    className="p-1.5 rounded-lg hover:bg-muted"
                  >
                    {section.enabled ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                )}

                {/* Collapse indicator */}
                {section.collapsible && (
                  <div className="p-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {section.fields
                    .filter((f) => f.enabled)
                    .map((field) => (
                      <div key={field.schema.key} className="relative">
                        {/* Field with visibility control */}
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <FieldRenderer
                              field={field.schema}
                              value={values[field.schema.key]}
                              onChange={(val) => onChange(field.schema.key, val)}
                              visibility={visibilityMap[field.schema.key] || field.visibility}
                              disabled={disabled}
                              error={errors[field.schema.key]}
                            />
                          </div>

                          {/* Visibility toggle */}
                          {onVisibilityChange && (
                            <VisibilityToggle
                              value={visibilityMap[field.schema.key] || field.visibility}
                              onChange={(v) => onVisibilityChange(field.schema.key, v)}
                              disabled={disabled}
                            />
                          )}
                        </div>

                        {/* Required indicator */}
                        {field.required && (
                          <span className="absolute top-0 left-0 text-destructive text-xs">
                            *
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

// Visibility Toggle Component
interface VisibilityToggleProps {
  value: FieldVisibility;
  onChange: (value: FieldVisibility) => void;
  disabled?: boolean;
}

const VISIBILITY_OPTIONS: { value: FieldVisibility; icon: LucideIcon; label: string }[] = [
  { value: 'public', icon: Eye, label: 'عمومی' },
  { value: 'masked', icon: EyeOff, label: 'نصفه' },
  { value: 'after_connect', icon: User, label: 'بعد از اتصال' },
  { value: 'hidden', icon: EyeOff, label: 'مخفی' },
];

function VisibilityToggle({ value, onChange, disabled }: VisibilityToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const current = VISIBILITY_OPTIONS.find((o) => o.value === value) || VISIBILITY_OPTIONS[0];
  const CurrentIcon = current.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'p-2 rounded-lg border transition-colors',
          value === 'public' && 'text-green-600 border-green-200 bg-green-50',
          value === 'masked' && 'text-yellow-600 border-yellow-200 bg-yellow-50',
          value === 'after_connect' && 'text-blue-600 border-blue-200 bg-blue-50',
          value === 'hidden' && 'text-gray-600 border-gray-200 bg-gray-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title={current.label}
      >
        <CurrentIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-20 bg-card border rounded-lg shadow-lg py-1 min-w-[120px]">
            {VISIBILITY_OPTIONS.map((option) => {
              const OptionIcon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted',
                    value === option.value && 'bg-primary/10 text-primary'
                  )}
                >
                  <OptionIcon className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
