'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import type { Specialization } from '@/types/professional';

interface OnboardingSpecializationProps {
  specializations: Specialization[];
  selectedIds: string[];
  onToggle: (specId: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  isLoading?: boolean;
  maxSelections?: number;
}

export function OnboardingSpecialization({
  specializations,
  selectedIds,
  onToggle,
  onContinue,
  onSkip,
  isLoading = false,
  maxSelections = 3,
}: OnboardingSpecializationProps) {
  const canSelectMore = selectedIds.length < maxSelections;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-2 text-center">
        در کدام حوزه‌ها تمرکز داری؟
      </h1>

      {/* Subtitle */}
      <p className="text-muted-foreground text-center mb-2">
        (اختیاری)
      </p>

      {/* Counter */}
      <p className="text-sm text-muted-foreground mb-6">
        حداکثر {maxSelections} مورد انتخاب کن
        {selectedIds.length > 0 && (
          <span className="text-primary mr-2">
            ({selectedIds.length} انتخاب شده)
          </span>
        )}
      </p>

      {/* Specialization Chips */}
      {isLoading ? (
        <div className="flex flex-wrap justify-center gap-3 max-w-lg">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-10 w-24 rounded-full bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3 max-w-lg mb-8">
          {specializations.map((spec) => {
            const isSelected = selectedIds.includes(spec.id);
            const isDisabled = !isSelected && !canSelectMore;

            return (
              <button
                key={spec.id}
                onClick={() => !isDisabled && onToggle(spec.id)}
                disabled={isDisabled}
                className={cn(
                  'px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-muted hover:bg-muted/80 text-foreground',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSelected && (
                  <span className="mr-1">✓</span>
                )}
                {spec.name_fa}
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={onContinue}
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          ادامه
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="w-full text-muted-foreground"
        >
          رد کن
        </Button>
      </div>
    </div>
  );
}
