'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  MoreVertical,
  Calendar,
  Video,
  Share2,
  UserPlus,
  MessageCircle,
  Pin,
  VolumeX,
  Volume2,
  Archive,
  Star,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

interface ConversationHeaderProps {
  conversation: {
    id: string;
    context_type: string | null;
    context_name: string | null;
    context_slug: string | null;
    is_muted: boolean;
    is_pinned: boolean;
    is_favorite: boolean;
    other_participant: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
    relationship: {
      status: string;
      connection_id: string | null;
    };
  };
  onToggleMute: () => void;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onRequestConnect?: () => void;
}

const contextIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  event: Calendar,
  meeting: Video,
  profile_share: Share2,
  connection: UserPlus,
  direct: MessageCircle,
};

export function ConversationHeader({
  conversation,
  onToggleMute,
  onTogglePin,
  onToggleFavorite,
  onRequestConnect,
}: ConversationHeaderProps) {
  const router = useRouter();
  const ContextIcon = conversation.context_type
    ? contextIcons[conversation.context_type]
    : MessageCircle;

  const getStatusBadge = () => {
    switch (conversation.relationship.status) {
      case 'connected':
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            متصل
          </span>
        );
      case 'pending_sent':
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            در انتظار پاسخ
          </span>
        );
      case 'pending_received':
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            درخواست دریافتی
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            مهمان
          </span>
        );
    }
  };

  return (
    <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Main header */}
      <div className="flex items-center gap-3 p-3">
        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard/inbox')}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Avatar */}
        {conversation.other_participant.avatar_url ? (
          <img
            src={conversation.other_participant.avatar_url}
            alt={conversation.other_participant.first_name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium">
              {conversation.other_participant.first_name?.charAt(0)}
            </span>
          </div>
        )}

        {/* Name and status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {conversation.other_participant.first_name}{' '}
              {conversation.other_participant.last_name}
            </span>
            {conversation.is_favorite && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {getStatusBadge()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleFavorite}
            className={cn(
              'p-2 rounded-lg transition-colors',
              conversation.is_favorite
                ? 'text-yellow-500 hover:bg-yellow-500/10'
                : 'text-muted-foreground hover:bg-accent'
            )}
            title={conversation.is_favorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          >
            <Star className={cn('w-5 h-5', conversation.is_favorite && 'fill-current')} />
          </button>
          <button
            onClick={onTogglePin}
            className={cn(
              'p-2 rounded-lg transition-colors',
              conversation.is_pinned
                ? 'text-primary hover:bg-primary/10'
                : 'text-muted-foreground hover:bg-accent'
            )}
            title={conversation.is_pinned ? 'برداشتن سنجاق' : 'سنجاق کردن'}
          >
            <Pin className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleMute}
            className={cn(
              'p-2 rounded-lg transition-colors',
              conversation.is_muted
                ? 'text-destructive hover:bg-destructive/10'
                : 'text-muted-foreground hover:bg-accent'
            )}
            title={conversation.is_muted ? 'فعال کردن اعلان‌ها' : 'بی‌صدا کردن'}
          >
            {conversation.is_muted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <Link
            href={`/${conversation.other_participant.id}`}
            className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            title="مشاهده پروفایل"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Context bar */}
      {conversation.context_name && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 rounded-lg px-3 py-2">
            <ContextIcon className="w-4 h-4" />
            <span>از طریق:</span>
            {conversation.context_slug ? (
              <Link
                href={`/e/${conversation.context_slug}`}
                className="text-primary hover:underline"
              >
                {conversation.context_name}
              </Link>
            ) : (
              <span>{conversation.context_name}</span>
            )}
          </div>
        </div>
      )}

      {/* Relationship action bar */}
      {conversation.relationship.status === 'none' && onRequestConnect && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between gap-3 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">این گفتگو هنوز ذخیره نشده</span>
            </div>
            <Button size="sm" onClick={onRequestConnect}>
              <UserPlus className="w-4 h-4 ml-1" />
              درخواست ارتباط
            </Button>
          </div>
        </div>
      )}

      {conversation.relationship.status === 'pending_received' && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
              <UserPlus className="w-4 h-4" />
              <span>درخواست ارتباط دارید</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                رد کردن
              </Button>
              <Button size="sm">
                پذیرش
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
