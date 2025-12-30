'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { InboxItem } from '@/components/inbox/InboxItem';
import { InboxFilters } from '@/components/inbox/InboxFilters';
import { InboxEmpty } from '@/components/inbox/InboxEmpty';
import type { InboxItem as InboxItemType, InboxFilter, InboxCounts } from '@/types/inbox';

export default function InboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<InboxItemType[]>([]);
  const [counts, setCounts] = useState<InboxCounts>({
    total: 0,
    unread: 0,
    archived: 0,
    connected: 0,
    events: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<InboxFilter>(
    (searchParams.get('filter') as InboxFilter) || 'all'
  );

  // Fetch inbox data
  useEffect(() => {
    const fetchInbox = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/inbox?filter=${activeFilter}`);
        const data = await res.json();

        if (data.success) {
          setItems(data.data);
          setCounts(data.counts);
        }
      } catch (error) {
        console.error('Failed to fetch inbox:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInbox();
  }, [activeFilter]);

  // Handle filter change
  const handleFilterChange = (filter: InboxFilter) => {
    setActiveFilter(filter);
    const url = new URL(window.location.href);
    url.searchParams.set('filter', filter);
    router.push(url.pathname + url.search, { scroll: false });
  };

  // Handle conversation click
  const handleItemClick = (item: InboxItemType) => {
    router.push(`/dashboard/inbox/${item.id}`);
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.other_participant.first_name?.toLowerCase().includes(query) ||
      item.other_participant.last_name?.toLowerCase().includes(query) ||
      item.context_name?.toLowerCase().includes(query) ||
      item.last_message_preview?.toLowerCase().includes(query) ||
      item.contact.notes?.toLowerCase().includes(query) ||
      item.contact.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Separate pinned and regular items
  const pinnedItems = filteredItems.filter(item => item.is_pinned);
  const regularItems = filteredItems.filter(item => !item.is_pinned);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-2xl font-bold mb-1">Inbox</h1>
        <p className="text-sm text-muted-foreground mb-4">
          ارتباط‌ها و گفتگوهای شما
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="جستجو در نام، ایونت یا یادداشت…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filters */}
        <InboxFilters
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          counts={counts}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <InboxEmpty filter={activeFilter} />
        ) : (
          <div className="p-2">
            {/* Pinned items */}
            {pinnedItems.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground px-3 py-2">
                  سنجاق شده
                </p>
                <div className="space-y-1">
                  {pinnedItems.map((item) => (
                    <InboxItem
                      key={item.id}
                      item={item}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular items */}
            {regularItems.length > 0 && (
              <div>
                {pinnedItems.length > 0 && (
                  <p className="text-xs font-medium text-muted-foreground px-3 py-2">
                    همه گفتگوها
                  </p>
                )}
                <div className="space-y-1">
                  {regularItems.map((item) => (
                    <InboxItem
                      key={item.id}
                      item={item}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
