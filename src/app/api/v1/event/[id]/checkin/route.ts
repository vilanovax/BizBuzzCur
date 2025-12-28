import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, hasScope } from '@/lib/api/middleware/auth';
import sql from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const { ticket_code, attendee_id } = body;

    // Authenticate request
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'unauthorized', message: auth.error },
        },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
      );
    }

    // Check scope
    if (!hasScope(auth, 'event:checkin')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'insufficient_scope',
            message: 'Required scope: event:checkin',
          },
        },
        { status: 403 }
      );
    }

    // Find event
    const [event] = await sql`
      SELECT id, title, organizer_id, status
      FROM events
      WHERE id = ${eventId}
    `;

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'not_found', message: 'Event not found' },
        },
        { status: 404 }
      );
    }

    // Check if event is active
    if (!['published', 'ongoing'].includes(event.status)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'invalid_state', message: 'Event is not active' },
        },
        { status: 400 }
      );
    }

    // Find attendee by ticket code or attendee ID
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
        {
          success: false,
          error: { code: 'invalid_request', message: 'ticket_code or attendee_id required' },
        },
        { status: 400 }
      );
    }

    if (!attendee) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'not_found', message: 'Attendee not found' },
        },
        { status: 404 }
      );
    }

    // Check if already checked in
    if (attendee.checked_in) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'already_checked_in',
            message: 'Attendee already checked in',
            checked_in_at: attendee.checked_in_at,
          },
        },
        { status: 409 }
      );
    }

    // Check if attendee is approved
    if (attendee.status !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'not_approved',
            message: `Attendee status is ${attendee.status}, must be approved`,
          },
        },
        { status: 400 }
      );
    }

    // Perform check-in
    const checkedInBy = auth.userId!;
    const [updatedAttendee] = await sql`
      UPDATE event_attendees
      SET
        checked_in = TRUE,
        checked_in_at = NOW(),
        checked_in_by = ${checkedInBy}
      WHERE id = ${attendee.id}
      RETURNING *
    `;

    // Update event attendance count
    await sql`
      UPDATE events
      SET attendance_count = attendance_count + 1
      WHERE id = ${eventId}
    `;

    return NextResponse.json({
      success: true,
      data: {
        attendee_id: updatedAttendee.id,
        full_name: updatedAttendee.full_name,
        email: updatedAttendee.email,
        company: updatedAttendee.company,
        job_title: updatedAttendee.job_title,
        checked_in: true,
        checked_in_at: updatedAttendee.checked_in_at,
      },
      meta: {
        event_id: eventId,
        event_title: event.title,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Event check-in error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'server_error', message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
