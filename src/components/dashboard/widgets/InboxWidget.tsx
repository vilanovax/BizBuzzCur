'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Inbox,
  MessageSquare,
  Briefcase,
  Calendar,
  User,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatDistanceToNow } from '@/lib/utils/date';

interface Conversation {
  id: string;
  contextType: string | null;
  contextName: string | null;
  lastMessage: string | null;
  otherParticipant: string | null;
  unreadCount: number;
  updatedAt: string;
}

interface InboxWidgetProps {
  conversations: Conversation[];
  totalUnread: number;
}

const contextIcons: Record<string, typeof MessageSquare> = {
  job_application: Briefcase,
  event: Calendar,
  profile_share: User,
  direct: MessageSquare,
};

export function InboxWidget({ conversations, totalUnread }: InboxWidgetProps) {
  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              صندوق ورودی
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              هنوز مکالمه‌ای ندارید
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              با شرکت در رویدادها یا ارسال درخواست شغلی، مکالمه شروع کنید
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            صندوق ورودی
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                {totalUnread}
              </span>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/inbox" className="flex items-center gap-1">
              همه
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {conversations.map((conv) => {
          const Icon = contextIcons[conv.contextType || 'direct'] || MessageSquare;

          return (
            <Link key={conv.id} href={`/dashboard/inbox/${conv.id}`}>
              <div
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors',
                  conv.unreadCount > 0
                    ? 'bg-primary/5 hover:bg-primary/10'
                    : 'hover:bg-accent'
                )}
              >
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      'text-sm truncate',
                      conv.unreadCount > 0 && 'font-semibold'
                    )}>
                      {conv.otherParticipant || 'مکالمه'}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(conv.updatedAt)}
                    </span>
                  </div>
                  {conv.contextName && (
                    <p className="text-xs text-primary truncate">
                      {conv.contextName}
                    </p>
                  )}
                  {conv.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.lastMessage}
                    </p>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
