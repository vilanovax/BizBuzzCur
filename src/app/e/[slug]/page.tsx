import { notFound } from 'next/navigation';
import Link from 'next/link';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { Event, EventAttendee, EventAttachment } from '@/types/event';
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
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  File,
  Link as LinkIcon,
} from 'lucide-react';
import { EventRegistration } from '@/components/events/EventRegistration';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fetch event by slug
async function getEvent(slug: string, userId?: string): Promise<Event | null> {
  try {
    // If user is the organizer, they can see any status
    if (userId) {
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
          AND e.organizer_id = ${userId}
      `;
      if (event) return event;
    }

    // For public access - only published/ongoing and public/unlisted
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

  // Try to get current user (for organizer preview)
  const user = await getCurrentUser();
  const event = await getEvent(slug, user?.id);

  if (!event) {
    notFound();
  }

  // Check if this is a draft preview (organizer viewing their own draft)
  const isDraftPreview = event.status === 'draft' && user?.id === event.organizer_id;

  // Parse welcome_attachments if it's a string (JSONB from database)
  const attachments: EventAttachment[] = event.welcome_attachments
    ? (typeof event.welcome_attachments === 'string'
        ? JSON.parse(event.welcome_attachments)
        : event.welcome_attachments)
    : [];

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
      {/* Draft Preview Banner */}
      {isDraftPreview && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium">
          <span>این پیش‌نمایش است. رویداد هنوز منتشر نشده و فقط شما می‌توانید آن را ببینید.</span>
          <Link href={`/dashboard/events/${event.id}`} className="underline mr-2 hover:no-underline">
            ویرایش و انتشار
          </Link>
        </div>
      )}

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

      {/* Event Info Header - Below Banner */}
      <div className="max-w-4xl mx-auto px-4 py-6 border-b bg-card/50 backdrop-blur-sm">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          {event.title}
        </h1>
        <div className="flex flex-wrap gap-4 text-muted-foreground">
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
          <div className="flex items-center gap-2">
            {event.location_type === 'online' ? (
              <>
                <Video className="w-5 h-5 text-primary" />
                <span>آنلاین</span>
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
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Event Card */}
            <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
              {/* Organizer */}
              {event.organizer && (
                <div className="px-6 py-4 flex items-center gap-3">
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

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="px-6 py-4 border-t">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-primary" />
                    فایل‌های ضمیمه
                  </h3>
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => {
                      const isImage = attachment.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      const isPDF = attachment.url?.match(/\.pdf$/i);
                      const isLink = attachment.type === 'link';

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                        >
                          {/* Icon */}
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {isLink ? (
                              <LinkIcon className="w-5 h-5 text-primary" />
                            ) : isImage ? (
                              <ImageIcon className="w-5 h-5 text-primary" />
                            ) : isPDF ? (
                              <FileText className="w-5 h-5 text-primary" />
                            ) : (
                              <File className="w-5 h-5 text-primary" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {attachment.name || 'فایل ضمیمه'}
                            </p>
                            {attachment.size && (
                              <p className="text-xs text-muted-foreground">
                                {(attachment.size / 1024).toFixed(0)} KB
                              </p>
                            )}
                          </div>

                          {/* Action Button */}
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={!isLink}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors opacity-70 group-hover:opacity-100"
                          >
                            {isLink ? (
                              <ExternalLink className="w-4 h-4" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </a>
                        </div>
                      );
                    })}
                  </div>

                  {/* Image Gallery Preview */}
                  {attachments.some(a => a.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {attachments
                        .filter(a => a.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                        .map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-video rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={attachment.url}
                              alt={attachment.name || 'تصویر ضمیمه'}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                    </div>
                  )}
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
          <div className="space-y-4 order-first md:order-last">
            {/* Registration Card */}
            <div className="bg-card rounded-xl border shadow-lg md:sticky md:top-4">
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
                  eventType={event.event_type as 'focused_event' | 'networking_event'}
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
