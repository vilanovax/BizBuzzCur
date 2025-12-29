'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Eye,
  Edit,
  Share2,
  QrCode,
  MoreVertical,
  ExternalLink,
  Target,
  Globe,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EventQRCodeModal } from '@/components/events/EventQRCodeModal';
import { cn } from '@/lib/utils/cn';
import type { Event, EventStatus } from '@/types/event';
import { EVENT_TYPE_CONFIG } from '@/types/event';

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'پیش‌نویس', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  published: { label: 'منتشر شده', color: 'text-green-600', bgColor: 'bg-green-100' },
  ongoing: { label: 'در حال برگزاری', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: 'برگزار شده', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  cancelled: { label: 'لغو شده', color: 'text-red-600', bgColor: 'bg-red-100' },
  archived: { label: 'آرشیو', color: 'text-gray-500', bgColor: 'bg-gray-50' },
};

interface EventWithStats extends Event {
  attendee_count: number;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();

  const [event, setEvent] = useState<EventWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();

      if (data.success) {
        setEvent(data.data);
      } else {
        setError(data.error || 'خطا در دریافت اطلاعات');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: EventStatus) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        setEvent({ ...event!, status });
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteEvent = async () => {
    if (!confirm('آیا از حذف این ایونت مطمئن هستید؟')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard/events');
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/e/${event?.slug}`;
    navigator.clipboard.writeText(url);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive mb-4">{error || 'ایونت یافت نشد'}</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/events')}>
          بازگشت به لیست
        </Button>
      </div>
    );
  }

  const typeConfig = EVENT_TYPE_CONFIG[event.event_type as keyof typeof EVENT_TYPE_CONFIG];
  const statusConfig = STATUS_CONFIG[event.status];
  const themeColor = event.theme_color || typeConfig?.color || '#2563eb';

  return (
    <div className="space-y-6">
      {/* Banner/Header with Theme Color */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ backgroundColor: themeColor }}
      >
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="h-32" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              {event.event_type === 'focused_event' ? (
                <Target className="w-5 h-5" />
              ) : (
                <Globe className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{event.title}</h1>
              <p className="text-sm text-white/80">{typeConfig?.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/events"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <span className={cn('px-3 py-1 rounded-full text-xs font-medium', statusConfig.bgColor, statusConfig.color)}>
          {statusConfig.label}
        </span>
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="w-4 h-4 ml-1" />
            کپی لینک
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/e/${event.slug}`} target="_blank">
              <ExternalLink className="w-4 h-4 ml-1" />
              مشاهده
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/events/${eventId}/edit`}>
              <Edit className="w-4 h-4 ml-1" />
              ویرایش
            </Link>
          </Button>

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 border rounded-lg shadow-lg py-1 min-w-[160px]">
                  <Link
                    href={`/e/${event.slug}`}
                    target="_blank"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    پیش‌نمایش
                  </Link>
                  <hr className="my-1" />
                  {event.status === 'draft' && (
                    <button
                      onClick={() => {
                        updateStatus('published');
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      انتشار
                    </button>
                  )}
                  {event.status === 'published' && (
                    <button
                      onClick={() => {
                        updateStatus('ongoing');
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    >
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      شروع ایونت
                    </button>
                  )}
                  {event.status === 'ongoing' && (
                    <button
                      onClick={() => {
                        updateStatus('completed');
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    >
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                      پایان ایونت
                    </button>
                  )}
                  {event.status !== 'cancelled' && event.status !== 'completed' && (
                    <button
                      onClick={() => {
                        if (confirm('آیا از لغو این ایونت مطمئن هستید؟')) {
                          updateStatus('cancelled');
                        }
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-amber-600"
                    >
                      <XCircle className="w-4 h-4" />
                      لغو ایونت
                    </button>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      deleteEvent();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{event.attendee_count || 0}</p>
                <p className="text-xs text-muted-foreground">ثبت‌نام</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{event.view_count || 0}</p>
                <p className="text-xs text-muted-foreground">بازدید</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{event.attendance_count || 0}</p>
                <p className="text-xs text-muted-foreground">حضور</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${typeConfig?.color}20` }}
              >
                {event.max_attendees ? (
                  <span className="text-sm font-bold" style={{ color: typeConfig?.color }}>
                    {Math.round((event.attendee_count / event.max_attendees) * 100)}%
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">∞</span>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {event.max_attendees || '∞'}
                </p>
                <p className="text-xs text-muted-foreground">ظرفیت</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href={`/dashboard/events/${eventId}/attendees`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">مدیریت شرکت‌کنندگان</span>
              <ArrowRight className="w-4 h-4 mr-auto rotate-180" />
            </CardContent>
          </Card>
        </Link>
        <Link href={`/dashboard/events/${eventId}/check-in`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <QrCode className="w-5 h-5 text-primary" />
              <span className="font-medium">ثبت ورود (Check-in)</span>
              <ArrowRight className="w-4 h-4 mr-auto rotate-180" />
            </CardContent>
          </Card>
        </Link>
        <button onClick={() => setShowQRModal(true)}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Share2 className="w-5 h-5 text-primary" />
              <span className="font-medium">اشتراک‌گذاری و QR</span>
              <ArrowRight className="w-4 h-4 mr-auto rotate-180" />
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Event Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Info */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">اطلاعات ایونت</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formatDate(event.start_date)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(event.start_date)}
                    {event.end_date && ` - ${formatTime(event.end_date)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {event.location_type === 'online' ? (
                  <Video className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {event.location_type === 'online'
                      ? 'آنلاین'
                      : event.location_type === 'hybrid'
                      ? 'ترکیبی'
                      : 'حضوری'}
                  </p>
                  {event.venue_name && (
                    <p className="text-sm text-muted-foreground">
                      {event.venue_name}
                      {event.city && ` - ${event.city}`}
                    </p>
                  )}
                  {event.online_platform && (
                    <p className="text-sm text-muted-foreground">
                      {event.online_platform}
                    </p>
                  )}
                </div>
              </div>

              {event.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">تنظیمات</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">هزینه</span>
                <span className="font-medium">
                  {event.is_free ? 'رایگان' : `${event.price?.toLocaleString()} تومان`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">دسترسی</span>
                <span className="font-medium">
                  {event.visibility === 'public'
                    ? 'عمومی'
                    : event.visibility === 'unlisted'
                    ? 'فقط با لینک'
                    : 'خصوصی'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">تایید خودکار</span>
                <span className="font-medium">
                  {event.auto_approve ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">لیست انتظار</span>
                <span className="font-medium">
                  {event.allow_waitlist ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
              {event.registration_deadline && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مهلت ثبت‌نام</span>
                  <span className="font-medium">
                    {formatDate(event.registration_deadline)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Modal */}
      <EventQRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        eventSlug={event.slug}
        eventTitle={event.title}
        themeColor={event.theme_color}
      />
    </div>
  );
}
