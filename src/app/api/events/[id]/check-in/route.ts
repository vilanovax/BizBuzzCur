import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/events/[id]/check-in - Check in an attendee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: eventId } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ticket_code, attendee_id } = body;

    // Get event and check ownership
    const [event] = await sql`
      SELECT organizer_id, title, status FROM events WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.organizer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Find attendee by ticket code or ID
    let attendee;
    if (ticket_code) {
      [attendee] = await sql`
        SELECT * FROM event_attendees
        WHERE event_id = ${eventId} AND ticket_code = ${ticket_code}
      `;
    } else if (attendee_id) {
      [attendee] = await sql`
        SELECT * FROM event_attendees
        WHERE event_id = ${eventId} AND id = ${attendee_id}
      `;
    } else {
      return NextResponse.json(
        { success: false, error: 'Ticket code or attendee ID required' },
        { status: 400 }
      );
    }

    if (!attendee) {
      return NextResponse.json({
        success: false,
        error: 'Attendee not found',
      }, { status: 404 });
    }

    // Check if attendee is approved
    if (attendee.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: `Attendee status is ${attendee.status}, not approved`,
      }, { status: 400 });
    }

    // Check if already checked in
    if (attendee.checked_in) {
      return NextResponse.json({
        success: false,
        error: 'Already checked in',
        attendee,
      }, { status: 400 });
    }

    // Perform check-in
    const [updated] = await sql`
      UPDATE event_attendees
      SET
        checked_in = true,
        checked_in_at = NOW(),
        checked_in_by = ${user.id}
      WHERE id = ${attendee.id}
      RETURNING *
    `;

    // Update attendance count
    await sql`
      UPDATE events
      SET attendance_count = attendance_count + 1
      WHERE id = ${eventId}
    `;

    // Get attendee with user info
    const [attendeeWithUser] = await sql`
      SELECT ea.*,
        u.first_name, u.last_name, u.avatar_url
      FROM event_attendees ea
      LEFT JOIN users u ON u.id = ea.user_id
      WHERE ea.id = ${updated.id}
    `;

    return NextResponse.json({
      success: true,
      attendee: attendeeWithUser,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check in' },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/check-in - Get check-in stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: eventId } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get event and check ownership
    const [event] = await sql`
      SELECT organizer_id FROM events WHERE id = ${eventId}
    `;

    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get stats
    const [stats] = await sql<[{
      total_approved: number;
      checked_in: number;
      not_checked_in: number;
    }]>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'approved')::int as total_approved,
        COUNT(*) FILTER (WHERE status = 'approved' AND checked_in = true)::int as checked_in,
        COUNT(*) FILTER (WHERE status = 'approved' AND checked_in = false)::int as not_checked_in
      FROM event_attendees
      WHERE event_id = ${eventId}
    `;

    // Get recent check-ins
    const recentCheckins = await sql`
      SELECT ea.id, ea.full_name, ea.checked_in_at,
        u.avatar_url
      FROM event_attendees ea
      LEFT JOIN users u ON u.id = ea.user_id
      WHERE ea.event_id = ${eventId} AND ea.checked_in = true
      ORDER BY ea.checked_in_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentCheckins,
      },
    });
  } catch (error) {
    console.error('Get check-in stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get check-in stats' },
      { status: 500 }
    );
  }
}
