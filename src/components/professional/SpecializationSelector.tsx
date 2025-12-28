'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import type { Specialization } from '@/types/professional';

interface SpecializationSelectorProps {
  specializations: Specialization[];
  selectedIds: string[];
  onToggle: (specialization: Specialization) => void;
  maxSelections?: number;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function SpecializationSelector({
  specializations,
  selectedIds,
  onToggle,
  maxSelections = 5,
  isLoading = false,
  error,
  className,
}: SpecializationSelectorProps) {
  const canSelectMore = selectedIds.length < maxSelections;

  if (isLoading) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-10 w-28 rounded-full bg-muted animate-pulse"
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

  if (specializations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        ابتدا یک حوزه تخصصی انتخاب کنید
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selection counter */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {selectedIds.length} از {maxSelections} انتخاب شده
        </span>
        {!canSelectMore && (
          <span className="text-amber-600">
            حداکثر تعداد انتخاب
          </span>
        )}
      </div>

      {/* Chips */}
      <div className={cn('flex flex-wrap gap-2', className)}>
        {specializations.map((spec) => {
          const isSelected = selectedIds.includes(spec.id);
          const isDisabled = !isSelected && !canSelectMore;

          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => !isDisabled && onToggle(spec)}
              disabled={isDisabled}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted hover:bg-muted/80 text-foreground',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSelected && (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              <span>{spec.name_fa}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
