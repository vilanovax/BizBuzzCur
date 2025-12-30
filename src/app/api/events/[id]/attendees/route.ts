import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import type { RegisterAttendeeInput } from '@/types/event';

// GET /api/events/[id]/attendees - Get event attendees
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: eventId } = await params;

    // Get event to check access
    const [event] = await sql`
      SELECT organizer_id, visibility, status, is_invite_only
      FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const isOwner = user?.id === event.organizer_id;
    const isPublished = event.status === 'published' || event.status === 'ongoing';

    // Only owner can see attendees of draft/private events
    if (!isOwner && !isPublished) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected, cancelled, waitlist
    const role = searchParams.get('role'); // organizer, presenter, attendee, observer

    const attendees = await sql`
      SELECT
        ea.*,
        u.first_name,
        u.last_name,
        u.avatar_url
      FROM event_attendees ea
      LEFT JOIN users u ON u.id = ea.user_id
      WHERE ea.event_id = ${eventId}
        ${status ? sql`AND ea.status = ${status}` : sql``}
        ${role ? sql`AND ea.role = ${role}` : sql``}
      ORDER BY ea.registered_at DESC
    `;

    // For non-owners, limit the info shown
    const attendeesData = attendees.map(a => {
      const base = {
        id: a.id,
        full_name: a.full_name,
        company: a.company,
        job_title: a.job_title,
        photo_url: a.photo_url || a.avatar_url,
        role: a.role,
        networking_status: a.networking_status,
        registered_at: a.registered_at,
        user: a.user_id ? {
          id: a.user_id,
          first_name: a.first_name,
          last_name: a.last_name,
          avatar_url: a.avatar_url,
        } : null,
      };

      // Owner sees more info
      if (isOwner) {
        return {
          ...base,
          email: a.email,
          phone: a.phone,
          status: a.status,
          checked_in: a.checked_in,
          checked_in_at: a.checked_in_at,
          ticket_code: a.ticket_code,
          payment_status: a.payment_status,
          notes: a.notes,
          registration_data: a.registration_data,
        };
      }

      return base;
    });

    return NextResponse.json({
      success: true,
      data: attendeesData,
      isOwner,
    });
  } catch (error) {
    console.error('Get attendees error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get attendees' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/attendees - Register for event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const user = await getCurrentUser();
    const body: RegisterAttendeeInput = await request.json();

    const {
      full_name,
      email,
      phone,
      company,
      job_title,
      registration_data = {},
      ticket_id,
      networking_status,
      is_guest = false,
    } = body;

    // Get event
    const [event] = await sql`
      SELECT *
      FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event is open for registration
    if (event.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Event is not open for registration' },
        { status: 400 }
      );
    }

    // Check registration deadline
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }

    // Check capacity
    if (event.max_attendees) {
      const [{ count }] = await sql<[{ count: number }]>`
        SELECT COUNT(*)::int as count
        FROM event_attendees
        WHERE event_id = ${eventId} AND status = 'approved'
      `;

      if (count >= event.max_attendees) {
        if (!event.allow_waitlist) {
          return NextResponse.json(
            { success: false, error: 'Event is full' },
            { status: 400 }
          );
        }
      }
    }

    // Check if already registered
    if (user) {
      const [existing] = await sql`
        SELECT id FROM event_attendees
        WHERE event_id = ${eventId} AND user_id = ${user.id}
      `;

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Already registered for this event' },
          { status: 400 }
        );
      }
    } else if (email || phone) {
      // Check by email
      if (email) {
        const [existing] = await sql`
          SELECT id FROM event_attendees
          WHERE event_id = ${eventId} AND email = ${email}
        `;

        if (existing) {
          return NextResponse.json(
            { success: false, error: 'این ایمیل قبلاً در این ایونت ثبت‌نام کرده' },
            { status: 400 }
          );
        }
      }

      // Check by phone
      if (phone) {
        const [existing] = await sql`
          SELECT id FROM event_attendees
          WHERE event_id = ${eventId} AND phone = ${phone}
        `;

        if (existing) {
          return NextResponse.json(
            { success: false, error: 'این شماره موبایل قبلاً در این ایونت ثبت‌نام کرده' },
            { status: 400 }
          );
        }
      }
    }

    // Determine initial status
    let status = event.auto_approve ? 'approved' : 'pending';

    // Check waitlist
    if (event.max_attendees) {
      const [{ count }] = await sql<[{ count: number }]>`
        SELECT COUNT(*)::int as count
        FROM event_attendees
        WHERE event_id = ${eventId} AND status = 'approved'
      `;

      if (count >= event.max_attendees && event.allow_waitlist) {
        status = 'waitlist';
      }
    }

    // Generate ticket code
    const ticketCode = `${event.slug.toUpperCase()}-${nanoid(8).toUpperCase()}`;

    // Determine if this is a guest registration
    const isGuestRegistration = is_guest || (!user && (full_name || phone || email));

    // Create attendee
    const [attendee] = await sql`
      INSERT INTO event_attendees (
        event_id,
        user_id,
        full_name,
        email,
        phone,
        company,
        job_title,
        registration_data,
        status,
        role,
        ticket_code,
        networking_status,
        payment_status,
        is_guest
      ) VALUES (
        ${eventId},
        ${user?.id || null},
        ${full_name || (user ? `${user.first_name} ${user.last_name}` : 'Guest')},
        ${email || user?.email || null},
        ${phone || null},
        ${company || null},
        ${job_title || null},
        ${JSON.stringify(registration_data)},
        ${status},
        'attendee',
        ${ticketCode},
        ${networking_status || null},
        ${event.is_free ? 'not_required' : 'pending'},
        ${isGuestRegistration ? true : false}
      )
      RETURNING *
    `;

    // Update registration count
    await sql`
      UPDATE events
      SET registration_count = registration_count + 1
      WHERE id = ${eventId}
    `;

    // Create notification for organizer
    await sql`
      INSERT INTO notifications (user_id, type, title, body, action_url, action_data, related_user_id)
      VALUES (
        ${event.organizer_id},
        'event_invitation',
        'ثبت‌نام جدید',
        ${`${full_name || 'کاربر جدید'} در ایونت ${event.title} ثبت‌نام کرد`},
        ${`/dashboard/events/${eventId}/attendees`},
        ${JSON.stringify({ event_id: eventId, attendee_id: attendee.id })},
        ${user?.id || null}
      )
    `;

    // Create guest session for guest registrations
    let guestSessionToken: string | null = null;
    if (isGuestRegistration) {
      guestSessionToken = nanoid(32);

      // Calculate expiry: event end date + 24 hours, or 7 days if no end date
      const eventEndDate = event.end_date ? new Date(event.end_date) : new Date(event.start_date);
      const expiresAt = new Date(eventEndDate.getTime() + 24 * 60 * 60 * 1000);

      // Create guest session
      await sql`
        INSERT INTO guest_sessions (
          session_token,
          name,
          phone,
          email,
          event_id,
          attendee_id,
          expires_at
        ) VALUES (
          ${guestSessionToken},
          ${full_name || 'Guest'},
          ${phone || null},
          ${email || null},
          ${eventId},
          ${attendee.id},
          ${expiresAt.toISOString()}
        )
      `;

      // Update attendee with guest_session_id
      await sql`
        UPDATE event_attendees
        SET guest_session_id = (
          SELECT id FROM guest_sessions WHERE session_token = ${guestSessionToken}
        )
        WHERE id = ${attendee.id}
      `;
    }

    // Create response with guest session cookie if applicable
    const response = NextResponse.json({
      success: true,
      data: attendee,
    });

    if (guestSessionToken) {
      const cookieStore = await cookies();
      cookieStore.set('guest_session', guestSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Register attendee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register' },
      { status: 500 }
    );
  }
}
