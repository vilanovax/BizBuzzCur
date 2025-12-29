'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { EventForm } from '@/components/events/EventForm';
import type { Event } from '@/types/event';

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <Link
          href="/dashboard/events"
          className="text-primary hover:underline"
        >
          بازگشت به لیست
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/events/${eventId}`}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">ویرایش ایونت</h1>
          <p className="text-sm text-muted-foreground">{event.title}</p>
        </div>
      </div>

      {/* Form */}
      <EventForm
        mode="edit"
        eventId={eventId}
        initialData={{
          title: event.title,
          description: event.description || '',
          event_type: event.event_type,
          category: event.category || '',
          start_date: event.start_date,
          end_date: event.end_date || '',
          timezone: event.timezone,
          location_type: event.location_type,
          venue_name: event.venue_name || '',
          address: event.address || '',
          city: event.city || '',
          online_link: event.online_link || '',
          online_platform: event.online_platform || '',
          max_attendees: event.max_attendees || undefined,
          is_free: event.is_free,
          price: event.price,
          currency: event.currency,
          visibility: event.visibility,
          is_invite_only: event.is_invite_only,
          features: event.features,
          theme_color: event.theme_color,
          welcome_message: event.welcome_message || '',
          banner_url: event.banner_url || '',
          welcome_attachments: event.welcome_attachments || [],
        }}
      />
    </div>
  );
}
