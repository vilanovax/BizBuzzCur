'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Users, Briefcase, Sparkles } from 'lucide-react';

interface OnboardingWhyProps {
  onContinue: () => void;
  onSkip: () => void;
}

const BENEFITS = [
  {
    icon: Sparkles,
    text: 'پروفایل‌های پیشنهادی مناسب کارت',
  },
  {
    icon: Users,
    text: 'ارتباط با افراد هم‌حوزه',
  },
  {
    icon: Briefcase,
    text: 'نمایش آگهی‌ها و فرصت‌های مرتبط',
  },
];

export function OnboardingWhy({ onContinue, onSkip }: OnboardingWhyProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Emoji/Icon */}
      <div className="text-5xl mb-6">
        <span role="img" aria-label="target">🎯</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">
        BizBuzz چطور شخصی‌سازی می‌شه؟
      </h1>

      {/* Benefits List */}
      <div className="max-w-sm w-full mb-8 space-y-4">
        {BENEFITS.map((benefit, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 text-right"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <benefit.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-foreground">{benefit.text}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={onContinue} size="lg" className="w-full">
          ادامه
        </Button>
        <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
          رد کن
        </Button>
      </div>
    </div>
  );
}
