'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import type { ProfessionalDomain } from '@/types/professional';

interface DomainSelectorProps {
  domains: ProfessionalDomain[];
  selectedId?: string | null;
  onSelect: (domain: ProfessionalDomain) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function DomainSelector({
  domains,
  selectedId,
  onSelect,
  isLoading = false,
  error,
  className,
}: DomainSelectorProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 gap-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive text-sm">
        {error}
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        هیچ حوزه‌ای یافت نشد
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {domains.map((domain) => {
        const isSelected = selectedId === domain.id;

        return (
          <button
            key={domain.id}
            type="button"
            onClick={() => onSelect(domain)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-6 transition-all duration-200',
              'hover:shadow-md hover:scale-[1.02]',
              isSelected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-primary/50'
            )}
          >
            {/* Icon */}
            {domain.icon && (
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full text-2xl',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
                style={{
                  backgroundColor: isSelected ? domain.color || undefined : undefined,
                }}
              >
                {getIconEmoji(domain.icon)}
              </div>
            )}

            {/* Name */}
            <span className="font-medium text-foreground">
              {domain.name_fa}
            </span>
            <span className="text-xs text-muted-foreground">
              {domain.name_en}
            </span>

            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2 left-2">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Map Lucide icon names to emojis (simplified mapping)
function getIconEmoji(iconName: string): string {
  const iconMap: Record<string, string> = {
    'landmark': '🏛️',
    'building-2': '🏢',
    'code': '💻',
    'laptop': '💻',
    'briefcase': '💼',
    'scale': '⚖️',
    'heart-pulse': '❤️',
    'stethoscope': '🩺',
    'graduation-cap': '🎓',
    'palette': '🎨',
    'megaphone': '📢',
    'truck': '🚚',
    'wrench': '🔧',
    'shopping-bag': '🛍️',
  };

  return iconMap[iconName] || '📌';
}
