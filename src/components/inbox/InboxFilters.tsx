'use client';

import { cn } from '@/lib/utils/cn';
import type { InboxFilter, InboxCounts } from '@/types/inbox';

interface InboxFiltersProps {
  activeFilter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  counts: InboxCounts;
}

const filters: { key: InboxFilter; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'unread', label: 'خوانده‌نشده' },
  { key: 'connected', label: 'ارتباط‌ها' },
  { key: 'events', label: 'ایونت‌ها' },
  { key: 'archived', label: 'آرشیو' },
];

export function InboxFilters({ activeFilter, onFilterChange, counts }: InboxFiltersProps) {
  const getCount = (filter: InboxFilter): number => {
    switch (filter) {
      case 'all': return counts.total;
      case 'unread': return counts.unread;
      case 'connected': return counts.connected;
      case 'events': return counts.events;
      case 'archived': return counts.archived;
      default: return 0;
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {filters.map((filter) => {
        const count = getCount(filter.key);
        const isActive = activeFilter === filter.key;

        return (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent hover:bg-accent/80 text-muted-foreground'
            )}
          >
            {filter.label}
            {count > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                isActive
                  ? 'bg-primary-foreground/20'
                  : 'bg-background'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
