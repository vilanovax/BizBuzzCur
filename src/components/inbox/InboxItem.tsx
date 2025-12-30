'use client';

import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import {
  Calendar,
  Video,
  Share2,
  UserPlus,
  MessageCircle,
  Pin,
  VolumeX,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { InboxItem as InboxItemType } from '@/types/inbox';

interface InboxItemProps {
  item: InboxItemType;
  isSelected?: boolean;
  onClick?: () => void;
}

const contextIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  event: Calendar,
  meeting: Video,
  profile_share: Share2,
  connection: UserPlus,
  direct: MessageCircle,
};

export function InboxItem({ item, isSelected, onClick }: InboxItemProps) {
  const ContextIcon = item.context_type ? contextIcons[item.context_type] : MessageCircle;

  const getStatusBadge = () => {
    if (item.connection.status === 'accepted') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          ارتباط برقرار شده
        </span>
      );
    }
    if (item.connection.status === 'pending') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          در انتظار تأیید
        </span>
      );
    }
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        مهمان
      </span>
    );
  };

  const timeAgo = item.last_message_at
    ? formatDistanceToNow(new Date(item.last_message_at), {
        addSuffix: true,
        locale: faIR,
      })
    : '';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-right',
        isSelected
          ? 'bg-primary/10'
          : 'hover:bg-accent/50',
        item.unread_count > 0 && 'bg-primary/5'
      )}
    >
      {/* Avatar with unread indicator */}
      <div className="relative flex-shrink-0">
        {item.other_participant.avatar_url ? (
          <img
            src={item.other_participant.avatar_url}
            alt={item.other_participant.first_name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-lg">
              {item.other_participant.first_name?.charAt(0)}
            </span>
          </div>
        )}
        {/* Unread indicator */}
        {item.unread_count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top row: Name + Time */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn(
              'font-medium truncate',
              item.unread_count > 0 && 'font-semibold'
            )}>
              {item.other_participant.first_name} {item.other_participant.last_name}
            </span>
            {item.is_pinned && (
              <Pin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
            {item.is_muted && (
              <VolumeX className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
            {item.is_favorite && (
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {timeAgo}
          </span>
        </div>

        {/* Message preview */}
        <p className={cn(
          'text-sm truncate mb-1.5',
          item.unread_count > 0
            ? 'text-foreground'
            : 'text-muted-foreground'
        )}>
          {item.last_message_preview || 'بدون پیام'}
        </p>

        {/* Bottom row: Context + Status */}
        <div className="flex items-center justify-between gap-2">
          {/* Context badge */}
          {item.context_name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
              <ContextIcon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{item.context_name}</span>
            </div>
          )}

          {/* Status badge */}
          <div className="flex-shrink-0">
            {getStatusBadge()}
          </div>
        </div>

        {/* Tags preview */}
        {item.contact.tags && item.contact.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {item.contact.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {item.contact.tags.length > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{item.contact.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Unread count badge */}
      {item.unread_count > 0 && (
        <div className="flex-shrink-0">
          <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
            {item.unread_count}
          </span>
        </div>
      )}
    </button>
  );
}
