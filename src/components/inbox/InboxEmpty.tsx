'use client';

import Link from 'next/link';
import { MessageCircle, Calendar, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { InboxFilter } from '@/types/inbox';

interface InboxEmptyProps {
  filter: InboxFilter;
}

const emptyStates: Record<InboxFilter, { icon: React.ElementType; title: string; description: string; cta?: { label: string; href: string } }> = {
  all: {
    icon: MessageCircle,
    title: 'هنوز گفتگویی نداری',
    description: 'وقتی پروفایلت رو به اشتراک بذاری یا در ایونتی شرکت کنی، گفتگوها اینجا نمایش داده می‌شن.',
    cta: { label: 'مشاهده ایونت‌ها', href: '/dashboard/events' },
  },
  unread: {
    icon: MessageCircle,
    title: 'پیام خوانده‌نشده‌ای نداری',
    description: 'تمام پیام‌هایت را خوانده‌ای',
  },
  connected: {
    icon: Users,
    title: 'هنوز ارتباطی برقرار نکردی',
    description: 'با افرادی که ملاقات می‌کنی درخواست ارتباط بفرست',
    cta: { label: 'مشاهده ایونت‌ها', href: '/dashboard/events' },
  },
  events: {
    icon: Calendar,
    title: 'گفتگویی از ایونت‌ها نداری',
    description: 'در ایونت‌ها شرکت کن و با شرکت‌کنندگان گفتگو کن',
    cta: { label: 'مشاهده ایونت‌ها', href: '/dashboard/events' },
  },
  jobs: {
    icon: Briefcase,
    title: 'گفتگویی از درخواست‌های شغلی نداری',
    description: 'برای فرصت‌های شغلی درخواست بفرست تا گفتگوها اینجا نمایش داده شوند',
    cta: { label: 'مشاهده فرصت‌ها', href: '/dashboard/jobs' },
  },
  archived: {
    icon: MessageCircle,
    title: 'آرشیو خالی است',
    description: 'گفتگوهای آرشیو شده اینجا نمایش داده می‌شوند',
  },
};

export function InboxEmpty({ filter }: InboxEmptyProps) {
  const state = emptyStates[filter] || emptyStates.all;
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{state.title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {state.description}
      </p>
      {state.cta && (
        <Link href={state.cta.href}>
          <Button>{state.cta.label}</Button>
        </Link>
      )}
    </div>
  );
}
