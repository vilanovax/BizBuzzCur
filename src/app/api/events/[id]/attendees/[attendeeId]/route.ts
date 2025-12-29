import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { AttendeeStatus } from '@/types/event';

// GET /api/events/[id]/attendees/[attendeeId] - Get single attendee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attendeeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: eventId, attendeeId } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user owns this event
    const [event] = await sql`
      SELECT organizer_id FROM events WHERE id = ${eventId}
    `;

    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const [attendee] = await sql`
      SELECT ea.*,
        u.first_name, u.last_name, u.avatar_url
      FROM event_attendees ea
      LEFT JOIN users u ON u.id = ea.user_id
      WHERE ea.id = ${attendeeId} AND ea.event_id = ${eventId}
    `;

    if (!attendee) {
      return NextResponse.json(
        { success: false, error: 'Attendee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: attendee,
    });
  } catch (error) {
    console.error('Get attendee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get attendee' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id]/attendees/[attendeeId] - Update attendee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attendeeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: eventId, attendeeId } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user owns this event
    const [event] = await sql`
      SELECT organizer_id, title FROM events WHERE id = ${eventId}
    `;

    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, role, notes } = body;

    // Get current attendee data
    const [currentAttendee] = await sql`
      SELECT * FROM event_attendees WHERE id = ${attendeeId} AND event_id = ${eventId}
    `;

    if (!currentAttendee) {
      return NextResponse.json(
        { success: false, error: 'Attendee not found' },
        { status: 404 }
      );
    }

    // Update attendee
    const [updated] = await sql`
      UPDATE event_attendees
      SET
        status = COALESCE(${status || null}, status),
        role = COALESCE(${role || null}, role),
        notes = COALESCE(${notes || null}, notes),
        updated_at = NOW()
      WHERE id = ${attendeeId} AND event_id = ${eventId}
      RETURNING *
    `;

    // If status changed to approved, send notification
    if (status === 'approved' && currentAttendee.status !== 'approved' && currentAttendee.user_id) {
      await sql`
        INSERT INTO notifications (user_id, type, title, body, action_url)
        VALUES (
          ${currentAttendee.user_id},
          'event_approved',
          'ثبت‌نام تایید شد',
          ${`ثبت‌نام شما در ایونت "${event.title}" تایید شد`},
          ${`/e/${eventId}`}
        )
      `;
    }

    // If status changed to rejected, send notification
    if (status === 'rejected' && currentAttendee.status !== 'rejected' && currentAttendee.user_id) {
      await sql`
        INSERT INTO notifications (user_id, type, title, body, action_url)
        VALUES (
          ${currentAttendee.user_id},
          'event_rejected',
          'ثبت‌نام رد شد',
          ${`متأسفانه ثبت‌نام شما در ایونت "${event.title}" رد شد`},
          ${`/e/${eventId}`}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update attendee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update attendee' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/attendees/[attendeeId] - Remove attendee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attendeeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: eventId, attendeeId } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user owns this event
    const [event] = await sql`
      SELECT organizer_id FROM events WHERE id = ${eventId}
    `;

    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    await sql`
      DELETE FROM event_attendees
      WHERE id = ${attendeeId} AND event_id = ${eventId}
    `;

    // Update registration count
    await sql`
      UPDATE events
      SET registration_count = registration_count - 1
      WHERE id = ${eventId} AND registration_count > 0
    `;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete attendee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete attendee' },
      { status: 500 }
    );
  }
}
