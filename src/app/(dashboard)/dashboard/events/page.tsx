'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Calendar,
  Users,
  Target,
  Globe,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  QrCode,
  Share2,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { Event, EventType, EventStatus } from '@/types/event';
import { EVENT_TYPE_CONFIG } from '@/types/event';

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'پیش‌نویس', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  published: { label: 'منتشر شده', color: 'text-green-600', bgColor: 'bg-green-100' },
  ongoing: { label: 'در حال برگزاری', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: 'برگزار شده', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  cancelled: { label: 'لغو شده', color: 'text-red-600', bgColor: 'bg-red-100' },
  archived: { label: 'آرشیو', color: 'text-gray-500', bgColor: 'bg-gray-50' },
};

interface EventWithCount extends Event {
  attendee_count: number;
}

function EventCard({ event, onDelete }: { event: EventWithCount; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const typeConfig = EVENT_TYPE_CONFIG[event.event_type as keyof typeof EVENT_TYPE_CONFIG];
  const statusConfig = STATUS_CONFIG[event.status];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      {/* Color bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: event.theme_color || typeConfig?.color || '#2563eb' }}
      />

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {event.banner_url ? (
              <img
                src={event.banner_url}
                alt={event.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: event.theme_color || typeConfig?.color || '#2563eb' }}
              >
                {event.event_type === 'focused_event' ? (
                  <Target className="w-6 h-6" />
                ) : (
                  <Globe className="w-6 h-6" />
                )}
              </div>
            )}
            <div>
              <h3 className="font-semibold line-clamp-1">{event.title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{typeConfig?.label}</span>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded hover:bg-muted transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 border rounded-lg shadow-lg py-1 min-w-[140px]">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Eye className="w-4 h-4" />
                    مشاهده
                  </Link>
                  <Link
                    href={`/dashboard/events/${event.id}/edit`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Edit className="w-4 h-4" />
                    ویرایش
                  </Link>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                    <QrCode className="w-4 h-4" />
                    QR Code
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                    <Share2 className="w-4 h-4" />
                    اشتراک‌گذاری
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      if (confirm('آیا از حذف این ایونت مطمئن هستید؟')) {
                        onDelete(event.id);
                      }
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Date & Location */}
        <div className="space-y-2 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.start_date)}</span>
            <span className="text-xs">•</span>
            <Clock className="w-3 h-3" />
            <span>{formatTime(event.start_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>
              {event.location_type === 'online'
                ? 'آنلاین'
                : event.location_type === 'hybrid'
                ? 'ترکیبی'
                : event.venue_name || event.city || 'حضوری'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            {event.attendee_count || 0}
            {event.max_attendees && ` / ${event.max_attendees}`}
            {' '}نفر
          </div>

          <span className={cn('px-2 py-0.5 rounded text-xs', statusConfig.bgColor, statusConfig.color)}>
            {statusConfig.label}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'all'>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      const data = await res.json();

      if (data.success) {
        setEvents(data.data);
      } else {
        setError(data.error || 'خطا در دریافت ایونت‌ها');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setEvents(events.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      !searchQuery ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || event.event_type === filterType;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">ایونت‌های من</h1>
          <p className="text-muted-foreground mt-1">
            مدیریت جلسات، ورکشاپ‌ها و رویدادهای شبکه‌سازی
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus className="w-4 h-4 ml-2" />
            ایونت جدید
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="جستجوی ایونت..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                'px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors',
                filterType === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              همه
            </button>
            <button
              onClick={() => setFilterType('focused_event')}
              className={cn(
                'px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2',
                filterType === 'focused_event'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              <Target className="w-3 h-3" />
              هدف‌محور
            </button>
            <button
              onClick={() => setFilterType('networking_event')}
              className={cn(
                'px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2',
                filterType === 'networking_event'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              <Globe className="w-3 h-3" />
              شبکه‌سازی
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'draft', 'published', 'ongoing', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors',
                filterStatus === status
                  ? 'bg-foreground text-background'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {status === 'all' ? 'همه وضعیت‌ها' : STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-1.5 bg-muted" />
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchEvents} className="mt-4">
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            {events.length === 0 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">هنوز ایونتی ندارید</h3>
                <p className="text-muted-foreground mb-4">
                  اولین ایونت خود را بسازید
                </p>
                <Button asChild>
                  <Link href="/dashboard/events/new">
                    <Plus className="w-4 h-4 ml-2" />
                    ایجاد ایونت
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">ایونتی با این معیارها یافت نشد</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={deleteEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
