'use client';

import { useState } from 'react';
import { X, UserPlus, MessageCircle, Users, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface GuestSignupPromptProps {
  trigger: 'connect' | 'chat' | 'bookmark' | 'view_profile' | 'default';
  eventSlug: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

const TRIGGER_MESSAGES = {
  connect: {
    title: 'برای ارسال درخواست ارتباط',
    description: 'با ساخت حساب رایگان، می‌توانید با شرکت‌کنندگان ارتباط برقرار کنید و شبکه حرفه‌ای خود را گسترش دهید.',
    icon: Users,
  },
  chat: {
    title: 'برای ادامه گفتگو',
    description: 'با ساخت حساب، تاریخچه چت‌های شما ذخیره می‌شود و می‌توانید بعد از پایان ایونت هم به آنها دسترسی داشته باشید.',
    icon: MessageCircle,
  },
  bookmark: {
    title: 'برای ذخیره این کاربر',
    description: 'با ساخت حساب، می‌توانید کاربران مورد علاقه را ذخیره کنید و بعداً با آنها ارتباط برقرار کنید.',
    icon: Bookmark,
  },
  view_profile: {
    title: 'برای مشاهده پروفایل کامل',
    description: 'با ساخت حساب، به اطلاعات کامل شرکت‌کنندگان و وضعیت شغلی آنها دسترسی خواهید داشت.',
    icon: UserPlus,
  },
  default: {
    title: 'برای حفظ ارتباط‌ها و ادامه گفتگو',
    description: 'یک حساب رایگان BizBuzz بسازید و از تمام امکانات شبکه‌سازی حرفه‌ای بهره‌مند شوید.',
    icon: UserPlus,
  },
};

export function GuestSignupPrompt({
  trigger,
  eventSlug,
  onDismiss,
  showDismiss = true,
}: GuestSignupPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const message = TRIGGER_MESSAGES[trigger] || TRIGGER_MESSAGES.default;
  const Icon = message.icon;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 relative">
      {showDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 left-2 p-1 rounded-full hover:bg-primary/10 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm mb-1">{message.title}</p>
          <p className="text-xs text-muted-foreground mb-3">
            {message.description}
          </p>
          <div className="flex gap-2">
            <a href={`/signup?redirect=/e/${eventSlug}`}>
              <Button size="sm">ساخت حساب رایگان</Button>
            </a>
            {showDismiss && (
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                ادامه به‌عنوان مهمان
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for tracking guest actions and showing prompts
export function useGuestPrompt(isGuest: boolean) {
  const [actionCount, setActionCount] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptTrigger, setPromptTrigger] = useState<GuestSignupPromptProps['trigger']>('default');

  const trackAction = (action: GuestSignupPromptProps['trigger']) => {
    if (!isGuest) return { shouldBlock: false };

    // Actions that always require signup
    const blockedActions = ['connect', 'bookmark'];
    if (blockedActions.includes(action)) {
      setPromptTrigger(action);
      setShowPrompt(true);
      return { shouldBlock: true };
    }

    // Actions that require signup after multiple uses
    const limitedActions = ['chat', 'view_profile'];
    if (limitedActions.includes(action)) {
      const newCount = actionCount + 1;
      setActionCount(newCount);

      // Show prompt after 2nd action
      if (newCount >= 2) {
        setPromptTrigger(action);
        setShowPrompt(true);
        return { shouldBlock: false, showPrompt: true };
      }
    }

    return { shouldBlock: false };
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  return {
    showPrompt,
    promptTrigger,
    trackAction,
    dismissPrompt,
  };
}
