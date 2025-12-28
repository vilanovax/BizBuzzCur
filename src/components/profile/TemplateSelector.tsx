'use client';

import * as React from 'react';
import {
  Briefcase,
  FileText,
  Users,
  Building2,
  UserCircle,
  Settings2,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { TEMPLATES, type ProfileTemplate } from '@/lib/profile/templates/index';

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  FileText,
  Users,
  Building2,
  UserCircle,
  Settings2,
};

interface TemplateSelectorProps {
  templates?: ProfileTemplate[];
  selectedId?: string | null;
  onSelect: (templateId: string) => void;
  className?: string;
}

export function TemplateSelector({
  templates = TEMPLATES,
  selectedId,
  onSelect,
  className,
}: TemplateSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const Icon = ICON_MAP[template.icon] || Briefcase;
          const isSelected = selectedId === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={cn(
                'relative p-4 rounded-xl border-2 text-right transition-all',
                'hover:border-primary/50 hover:shadow-md',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card'
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div
                  className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: template.color }}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${template.color}20` }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: template.color }}
                />
              </div>

              {/* Content */}
              <h3 className="font-semibold text-foreground">
                {template.nameFa}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {template.descriptionFa}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-3">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${template.color}20`,
                    color: template.color,
                  }}
                >
                  {template.sections.length} بخش
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {template.context === 'CUSTOM' ? 'سفارشی' : template.profileType}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
