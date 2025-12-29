import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { nanoid } from 'nanoid';
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
    } else if (email) {
      const [existing] = await sql`
        SELECT id FROM event_attendees
        WHERE event_id = ${eventId} AND email = ${email}
      `;

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Email already registered for this event' },
          { status: 400 }
        );
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
        payment_status
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
        ${event.is_free ? 'not_required' : 'pending'}
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

    return NextResponse.json({
      success: true,
      data: attendee,
    });
  } catch (error) {
    console.error('Register attendee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register' },
      { status: 500 }
    );
  }
}
