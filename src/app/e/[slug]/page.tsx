import { notFound } from 'next/navigation';
import Link from 'next/link';
import sql from '@/lib/db';
import type { Event, EventAttendee } from '@/types/event';
import { EVENT_TYPE_CONFIG } from '@/types/event';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Globe,
  Target,
  Share2,
  Bookmark,
  User,
  DollarSign,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { EventRegistration } from '@/components/events/EventRegistration';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fetch event by slug
async function getEvent(slug: string): Promise<Event | null> {
  try {
    const [event] = await sql<Event[]>`
      SELECT e.*,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'avatar_url', u.avatar_url
        ) as organizer
      FROM events e
      LEFT JOIN users u ON u.id = e.organizer_id
      WHERE e.slug = ${slug}
        AND (e.status = 'published' OR e.status = 'ongoing')
        AND (e.visibility = 'public' OR e.visibility = 'unlisted')
    `;
    return event || null;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

// Get attendee count
async function getAttendeeCount(eventId: string): Promise<number> {
  try {
    const [{ count }] = await sql<[{ count: number }]>`
      SELECT COUNT(*)::int as count
      FROM event_attendees
      WHERE event_id = ${eventId} AND status = 'approved'
    `;
    return count;
  } catch (error) {
    return 0;
  }
}

// Get attendees preview (first few with photos)
async function getAttendeesPreview(eventId: string): Promise<Partial<EventAttendee>[]> {
  try {
    const attendees = await sql<Partial<EventAttendee>[]>`
      SELECT ea.id, ea.full_name, ea.photo_url, ea.company,
        u.avatar_url as user_avatar
      FROM event_attendees ea
      LEFT JOIN users u ON u.id = ea.user_id
      WHERE ea.event_id = ${eventId} AND ea.status = 'approved'
      ORDER BY ea.registered_at DESC
      LIMIT 8
    `;
    return attendees;
  } catch (error) {
    return [];
  }
}

// Increment view count
async function incrementViewCount(eventId: string) {
  try {
    await sql`
      UPDATE events
      SET view_count = view_count + 1
      WHERE id = ${eventId}
    `;
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

export default async function PublicEventPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  // Increment view count
  incrementViewCount(event.id);

  const attendeeCount = await getAttendeeCount(event.id);
  const attendeesPreview = await getAttendeesPreview(event.id);
  const typeConfig = EVENT_TYPE_CONFIG[event.event_type as keyof typeof EVENT_TYPE_CONFIG];

  // Format date
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

  // Check if event is full
  const isFull = event.max_attendees ? attendeeCount >= event.max_attendees : false;

  // Check if registration is closed
  const isRegistrationClosed =
    event.registration_deadline &&
    new Date(event.registration_deadline) < new Date();

  // Check if event has passed
  const isPast = new Date(event.start_date) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Banner */}
      <div
        className="h-48 md:h-64 relative"
        style={{ backgroundColor: event.theme_color || typeConfig?.color || '#2563eb' }}
      >
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {event.event_type === 'focused_event' ? (
              <Target className="w-24 h-24 text-white/20" />
            ) : (
              <Globe className="w-24 h-24 text-white/20" />
            )}
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium shadow-sm flex items-center gap-2">
          {event.event_type === 'focused_event' ? (
            <Target className="w-4 h-4" style={{ color: typeConfig?.color }} />
          ) : (
            <Globe className="w-4 h-4" style={{ color: typeConfig?.color }} />
          )}
          <span>{typeConfig?.label}</span>
        </div>

        {/* Share Button */}
        <button className="absolute top-4 left-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors">
          <Share2 className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 pb-12">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Event Card */}
            <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
              {/* Event Header */}
              <div className="p-6">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  {event.title}
                </h1>

                {/* Date & Time */}
                <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span>{formatDate(event.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>{formatTime(event.start_date)}</span>
                    {event.end_date && (
                      <>
                        <span>-</span>
                        <span>{formatTime(event.end_date)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  {event.location_type === 'online' ? (
                    <>
                      <Video className="w-5 h-5 text-primary" />
                      <span>آنلاین</span>
                      {event.online_platform && (
                        <span className="text-sm bg-muted px-2 py-0.5 rounded">
                          {event.online_platform}
                        </span>
                      )}
                    </>
                  ) : event.location_type === 'hybrid' ? (
                    <>
                      <Globe className="w-5 h-5 text-primary" />
                      <span>ترکیبی (حضوری + آنلاین)</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5 text-primary" />
                      <span>
                        {event.venue_name}
                        {event.venue_name && event.city && ' - '}
                        {event.city}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Organizer */}
              {event.organizer && (
                <div className="px-6 py-4 border-t flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: event.theme_color || '#2563eb' }}
                  >
                    {event.organizer.avatar_url ? (
                      <img
                        src={event.organizer.avatar_url}
                        alt={`${event.organizer.first_name} ${event.organizer.last_name}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      event.organizer.first_name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">برگزارکننده</p>
                    <p className="font-medium">
                      {event.organizer.first_name} {event.organizer.last_name}
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="px-6 py-4 border-t">
                  <h3 className="font-semibold mb-3">درباره ایونت</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Location Details */}
              {event.location_type !== 'online' && (event.address || event.map_url) && (
                <div className="px-6 py-4 border-t">
                  <h3 className="font-semibold mb-3">محل برگزاری</h3>
                  <div className="space-y-2 text-muted-foreground">
                    {event.venue_name && (
                      <p className="font-medium text-foreground">{event.venue_name}</p>
                    )}
                    {event.address && <p>{event.address}</p>}
                    {event.map_url && (
                      <a
                        href={event.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        مشاهده روی نقشه
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Attendees Preview */}
            {attendeesPreview.length > 0 && (
              <div className="bg-card rounded-xl border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    شرکت‌کنندگان
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {attendeeCount} نفر
                    {event.max_attendees && ` از ${event.max_attendees}`}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {attendeesPreview.map((attendee) => (
                    <div key={attendee.id} className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {attendee.photo_url || (attendee as any).user_avatar ? (
                          <img
                            src={attendee.photo_url || (attendee as any).user_avatar}
                            alt={attendee.full_name || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                  {attendeeCount > 8 && (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
                      +{attendeeCount - 8}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Registration Card */}
            <div className="bg-card rounded-xl border shadow-lg sticky top-4">
              <div className="p-6">
                {/* Price */}
                <div className="text-center mb-4">
                  {event.is_free ? (
                    <div className="text-2xl font-bold text-green-600">رایگان</div>
                  ) : (
                    <div className="text-2xl font-bold">
                      {event.price?.toLocaleString()}{' '}
                      <span className="text-sm font-normal text-muted-foreground">
                        {event.currency === 'IRR' ? 'تومان' : event.currency}
                      </span>
                    </div>
                  )}
                </div>

                {/* Capacity */}
                {event.max_attendees && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">ظرفیت</span>
                      <span>
                        {attendeeCount} / {event.max_attendees}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min((attendeeCount / event.max_attendees) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {isPast && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4 text-sm">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span>این ایونت برگزار شده است</span>
                  </div>
                )}

                {!isPast && isRegistrationClosed && (
                  <div className="flex items-center gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg mb-4 text-sm text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>ثبت‌نام بسته شده است</span>
                  </div>
                )}

                {!isPast && !isRegistrationClosed && isFull && !event.allow_waitlist && (
                  <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg mb-4 text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>ظرفیت تکمیل شده است</span>
                  </div>
                )}

                {/* Registration Component */}
                <EventRegistration
                  eventId={event.id}
                  eventSlug={event.slug}
                  isFull={isFull}
                  allowWaitlist={event.allow_waitlist}
                  isRegistrationClosed={isRegistrationClosed || false}
                  isPast={isPast}
                  isFree={event.is_free}
                />

                {/* Deadline */}
                {event.registration_deadline && !isRegistrationClosed && (
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    مهلت ثبت‌نام: {formatDate(event.registration_deadline)}
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="px-6 py-3 border-t flex gap-2">
                <button className="flex-1 py-2 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
                  <Bookmark className="w-4 h-4" />
                  ذخیره
                </button>
                <button className="flex-1 py-2 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
                  <Share2 className="w-4 h-4" />
                  اشتراک
                </button>
              </div>
            </div>

            {/* Event Features */}
            {event.event_type === 'networking_event' && event.features && (
              <div className="bg-card rounded-xl border p-4">
                <h4 className="font-medium text-sm mb-3">امکانات این ایونت</h4>
                <div className="space-y-2 text-sm">
                  {event.features.networking_tools && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>ابزارهای شبکه‌سازی</span>
                    </div>
                  )}
                  {event.features.matchmaking && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>میچ‌میکینگ هوشمند</span>
                    </div>
                  )}
                  {event.features.job_board && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>بورد فرصت‌های شغلی</span>
                    </div>
                  )}
                  {event.features.check_in && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>ورود با QR Code</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            ساخته شده با{' '}
            <Link href="/" className="text-primary hover:underline font-medium">
              بیزباز
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    return {
      title: 'ایونت یافت نشد',
    };
  }

  const typeConfig = EVENT_TYPE_CONFIG[event.event_type as keyof typeof EVENT_TYPE_CONFIG];

  return {
    title: `${event.title} | بیزباز`,
    description: event.description?.slice(0, 160) || `${typeConfig?.label} در بیزباز`,
    openGraph: {
      title: event.title,
      description: event.description || typeConfig?.label,
      images: event.banner_url ? [{ url: event.banner_url }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description || typeConfig?.label,
      images: event.banner_url ? [event.banner_url] : [],
    },
  };
}
