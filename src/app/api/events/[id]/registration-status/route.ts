import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/events/[id]/registration-status - Check if user is registered
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: eventId } = await params;

    // Check for logged-in user first
    if (user) {
      const [registration] = await sql`
        SELECT id, status, ticket_code, checked_in, registered_at, is_guest
        FROM event_attendees
        WHERE event_id = ${eventId} AND user_id = ${user.id}
      `;

      if (!registration) {
        return NextResponse.json({
          success: true,
          data: null,
        });
      }

      return NextResponse.json({
        success: true,
        data: registration,
      });
    }

    // Check for guest session
    const cookieStore = await cookies();
    const guestSessionToken = cookieStore.get('guest_session')?.value;

    if (guestSessionToken) {
      const [guestSession] = await sql`
        SELECT gs.id, gs.attendee_id, ea.status, ea.ticket_code, ea.checked_in, ea.registered_at
        FROM guest_sessions gs
        LEFT JOIN event_attendees ea ON ea.id = gs.attendee_id
        WHERE gs.session_token = ${guestSessionToken}
          AND gs.event_id = ${eventId}
          AND gs.is_active = TRUE
          AND gs.expires_at > NOW()
      `;

      if (guestSession && guestSession.attendee_id) {
        return NextResponse.json({
          success: true,
          data: {
            id: guestSession.attendee_id,
            status: guestSession.status,
            ticket_code: guestSession.ticket_code,
            checked_in: guestSession.checked_in,
            registered_at: guestSession.registered_at,
            is_guest: true,
          },
        });
      }
    }

    // No user and no valid guest session
    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Get registration status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get registration status' },
      { status: 500 }
    );
  }
}
