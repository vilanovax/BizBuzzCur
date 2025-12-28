'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Sparkles, Users, Bell } from 'lucide-react';

interface OnboardingDoneProps {
  domainNameFa?: string;
  onGoToDashboard: () => void;
}

export function OnboardingDone({ domainNameFa, onGoToDashboard }: OnboardingDoneProps) {
  // Dynamic message based on domain
  const getMessage = () => {
    if (!domainNameFa) {
      return 'پروفایل حرفه‌ای‌ت آماده شد!';
    }

    // Domain-specific messages
    const messages: Record<string, string> = {
      'مالی': 'پروفایل‌های مالی و کامیونیتی‌های مرتبط برات فعال شد',
      'فناوری اطلاعات': 'مهارت‌ها و فرصت‌های IT برات آماده‌ست',
      'حقوقی': 'شبکه حقوقی و فرصت‌های مرتبط برات فعال شد',
      'بازاریابی': 'ابزارهای مارکتینگ و کامیونیتی‌ها برات آماده‌ست',
    };

    return messages[domainNameFa] || `پروفایل ${domainNameFa} برات فعال شد`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Celebration Emoji */}
      <div className="text-6xl mb-6">
        <span role="img" aria-label="celebration">🎉</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-4">
        آماده‌ای!
      </h1>

      {/* Dynamic message */}
      <p className="text-muted-foreground max-w-sm mb-8">
        {getMessage()}
      </p>

      {/* What's unlocked */}
      <div className="max-w-sm w-full mb-8 space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 text-right">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm text-green-700 dark:text-green-300">
            پروفایل‌های پیشنهادی آماده‌ست
          </span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-right">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm text-blue-700 dark:text-blue-300">
            می‌تونی با افراد هم‌حوزه ارتباط بگیری
          </span>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-right">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm text-purple-700 dark:text-purple-300">
            فرصت‌های مرتبط بهت نشون داده می‌شه
          </span>
        </div>
      </div>

      {/* CTA */}
      <Button onClick={onGoToDashboard} size="lg" className="w-full max-w-xs">
        رفتن به داشبورد
      </Button>
    </div>
  );
}
