import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, hasScope } from '@/lib/api/middleware/auth';
import sql from '@/lib/db';
import { nanoid } from 'nanoid';

// GET /api/v1/meeting - List user's meetings
export async function GET(request: NextRequest) {
  try {
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

    if (!hasScope(auth, 'meeting:read')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'insufficient_scope',
            message: 'Required scope: meeting:read',
          },
        },
        { status: 403 }
      );
    }

    // Get query params
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    // Build query
    let meetings;
    let total;
    const userId = auth.userId!;

    if (status) {
      meetings = await sql`
        SELECT * FROM personal_events
        WHERE creator_id = ${userId} AND status = ${status}
        ORDER BY start_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      [{ count: total }] = await sql`
        SELECT COUNT(*)::int as count FROM personal_events
        WHERE creator_id = ${userId} AND status = ${status}
      `;
    } else {
      meetings = await sql`
        SELECT * FROM personal_events
        WHERE creator_id = ${userId}
        ORDER BY start_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      [{ count: total }] = await sql`
        SELECT COUNT(*)::int as count FROM personal_events
        WHERE creator_id = ${userId}
      `;
    }

    return NextResponse.json({
      success: true,
      data: meetings,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Meeting list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'server_error', message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/meeting - Create meeting
export async function POST(request: NextRequest) {
  try {
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

    if (!hasScope(auth, 'meeting:create')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'insufficient_scope',
            message: 'Required scope: meeting:create',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      event_type = 'meeting',
      start_date,
      end_date,
      timezone = 'Asia/Tehran',
      location_type = 'online',
      venue_name,
      address,
      city,
      online_link,
      max_attendees,
      attendees = [],
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'invalid_request', message: 'title is required' },
        },
        { status: 400 }
      );
    }

    if (!start_date) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'invalid_request', message: 'start_date is required' },
        },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = `${nanoid(10)}`;
    const creatorId = auth.userId!;

    // Create meeting
    const [meeting] = await sql`
      INSERT INTO personal_events (
        creator_id, slug, title, description, event_type,
        start_date, end_date, timezone,
        location_type, venue_name, address, city, online_link,
        max_attendees
      ) VALUES (
        ${creatorId}, ${slug}, ${title}, ${description || null}, ${event_type},
        ${start_date}, ${end_date || null}, ${timezone},
        ${location_type}, ${venue_name || null}, ${address || null}, ${city || null}, ${online_link || null},
        ${max_attendees || null}
      )
      RETURNING *
    `;

    // Add attendees if provided
    if (attendees.length > 0) {
      for (const attendee of attendees) {
        await sql`
          INSERT INTO personal_event_attendees (
            event_id, user_id, name, email, phone, role
          ) VALUES (
            ${meeting.id},
            ${attendee.user_id || null},
            ${attendee.name || 'Unknown'},
            ${attendee.email || null},
            ${attendee.phone || null},
            ${attendee.role || 'attendee'}
          )
        `;
      }
    }

    // Fetch created meeting with attendees
    const createdAttendees = await sql`
      SELECT id, name, email, rsvp_status, role
      FROM personal_event_attendees
      WHERE event_id = ${meeting.id}
    `;

    return NextResponse.json({
      success: true,
      data: {
        ...meeting,
        attendees: createdAttendees,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Meeting create error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'server_error', message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
