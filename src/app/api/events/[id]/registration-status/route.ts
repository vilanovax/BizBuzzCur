import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/events/[id]/registration-status - Check if user is registered
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: eventId } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const [registration] = await sql`
      SELECT id, status, ticket_code, checked_in, registered_at
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
  } catch (error) {
    console.error('Get registration status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get registration status' },
      { status: 500 }
    );
  }
}
