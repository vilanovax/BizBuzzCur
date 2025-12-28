'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import type { ProfessionalDomain } from '@/types/professional';

interface OnboardingDomainProps {
  domains: ProfessionalDomain[];
  selectedId: string | null;
  suggestedId: string | null;
  suggestionReason: string | null;
  onSelect: (domainId: string) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

// Icon mapping for domains
const DOMAIN_ICONS: Record<string, string> = {
  finance: '💰',
  it: '💻',
  legal: '⚖️',
  marketing: '📢',
  healthcare: '🏥',
  education: '🎓',
  engineering: '🔧',
  design: '🎨',
};

export function OnboardingDomain({
  domains,
  selectedId,
  suggestedId,
  suggestionReason,
  onSelect,
  onSkip,
  isLoading = false,
}: OnboardingDomainProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-2 text-center">
        بیشتر فعالیت حرفه‌ای شما در کدام حوزه است؟
      </h1>

      {/* Subtitle */}
      <p className="text-muted-foreground text-center mb-8">
        (می‌تونی بعداً تغییرش بدی)
      </p>

      {/* Suggestion hint */}
      {suggestedId && suggestionReason && (
        <div className="mb-6 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
          پیشنهاد: {suggestionReason}
        </div>
      )}

      {/* Domain Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {domains.map((domain) => {
            const isSelected = selectedId === domain.id;
            const isSuggested = suggestedId === domain.id;

            return (
              <button
                key={domain.id}
                onClick={() => onSelect(domain.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 transition-all duration-200',
                  'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : isSuggested
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                )}
              >
                {/* Suggested badge */}
                {isSuggested && !isSelected && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                    پیشنهادی
                  </span>
                )}

                {/* Icon */}
                <span className="text-4xl">
                  {DOMAIN_ICONS[domain.slug] || '📌'}
                </span>

                {/* Name */}
                <span className="font-medium text-foreground">
                  {domain.name_fa}
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

          {/* Skip option as a card */}
          <button
            onClick={onSkip}
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed transition-all duration-200',
              'border-border hover:border-muted-foreground/50 text-muted-foreground'
            )}
          >
            <span className="text-3xl">➕</span>
            <span className="text-sm">بعداً انتخاب می‌کنم</span>
          </button>
        </div>
      )}
    </div>
  );
}
