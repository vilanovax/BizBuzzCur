'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Inbox,
  User,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NextAction {
  type: 'inbox' | 'profile' | 'job' | 'company' | 'event';
  priority: number;
  title: string;
  description: string;
  href: string;
  count?: number;
}

interface NextActionsWidgetProps {
  actions: NextAction[];
}

const actionIcons = {
  inbox: Inbox,
  profile: User,
  job: Briefcase,
  company: Building2,
  event: Calendar,
};

const actionColors = {
  inbox: 'bg-blue-500',
  profile: 'bg-purple-500',
  job: 'bg-green-500',
  company: 'bg-orange-500',
  event: 'bg-pink-500',
};

export function NextActionsWidget({ actions }: NextActionsWidgetProps) {
  if (actions.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-700 dark:text-green-400">
                همه چیز مرتب است!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-500">
                در حال حاضر کار خاصی نیاز به انجام ندارید
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          الان چه کار کنم؟
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => {
          const Icon = actionIcons[action.type];
          const bgColor = actionColors[action.type];

          return (
            <Link key={index} href={action.href}>
              <div className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all group">
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', bgColor)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{action.title}</h4>
                    {action.count && action.count > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                        {action.count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </p>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
