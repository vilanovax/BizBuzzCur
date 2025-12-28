'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

interface OnboardingWelcomeProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function OnboardingWelcome({ onContinue, onSkip }: OnboardingWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Emoji/Icon */}
      <div className="text-6xl mb-6">
        <span role="img" aria-label="wave">👋</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-4">
        خوش آمدی به BizBuzz
      </h1>

      {/* Body */}
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        BizBuzz بهت کمک می‌کنه هویت حرفه‌ای‌تو هوشمندانه مدیریت کنی،
        <br />
        و فقط همون اطلاعاتی رو که لازمه، به اشتراک بذاری.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={onContinue} size="lg" className="w-full">
          شروع کنیم
        </Button>
        <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
          بعداً
        </Button>
      </div>
    </div>
  );
}
