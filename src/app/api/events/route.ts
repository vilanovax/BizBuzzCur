import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils/slugify';
import type { CreateEventInput, EventFeatures, EventType } from '@/types/event';
import { FOCUSED_EVENT_FEATURES, NETWORKING_EVENT_FEATURES } from '@/types/event';

// GET /api/events - Get user's events
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // draft, published, ongoing, completed, cancelled
    const type = searchParams.get('type'); // focused_event, networking_event
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = sql`
      SELECT
        e.*,
        (SELECT COUNT(*)::int FROM event_attendees WHERE event_id = e.id AND status = 'approved') as attendee_count
      FROM events e
      WHERE e.organizer_id = ${user.id}
    `;

    // Note: For dynamic filtering, we'll use a different approach
    const events = await sql`
      SELECT
        e.*,
        (SELECT COUNT(*)::int FROM event_attendees WHERE event_id = e.id AND status = 'approved') as attendee_count
      FROM events e
      WHERE e.organizer_id = ${user.id}
        ${status ? sql`AND e.status = ${status}` : sql``}
        ${type ? sql`AND e.event_type = ${type}` : sql``}
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json({
      success: true,
      data: events.map(e => ({
        ...e,
        features: e.features || (e.event_type === 'focused_event' ? FOCUSED_EVENT_FEATURES : NETWORKING_EVENT_FEATURES),
        images: e.images || [],
        custom_fields: e.custom_fields || [],
        welcome_attachments: e.welcome_attachments || [],
      }))
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateEventInput = await request.json();
    const {
      title,
      description,
      event_type,
      category,
      start_date,
      end_date,
      timezone = 'Asia/Tehran',
      location_type,
      venue_name,
      address,
      city,
      country,
      online_link,
      online_platform,
      max_attendees,
      is_free = true,
      price = 0,
      currency = 'IRR',
      visibility = 'public',
      is_invite_only = false,
      features,
      theme_color,
      welcome_message,
      custom_fields = [],
      banner_url,
      welcome_attachments = [],
    } = body;

    // Validate required fields
    if (!title || !event_type || !start_date || !location_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate event type
    if (!['focused_event', 'networking_event'].includes(event_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Generate slug from title (e.g., "همایش بازاریابی" -> "hamayesh-bazaryabi-abc123")
    const slug = slugify(title);

    // Get default features based on event type
    const defaultFeatures = event_type === 'focused_event'
      ? FOCUSED_EVENT_FEATURES
      : NETWORKING_EVENT_FEATURES;

    // Merge with custom features if provided
    const finalFeatures: EventFeatures = features
      ? { ...defaultFeatures, ...features }
      : defaultFeatures;

    // Get theme color from event type config
    const finalThemeColor = theme_color || (event_type === 'focused_event' ? '#2563eb' : '#059669');

    // Create event
    const [event] = await sql`
      INSERT INTO events (
        organizer_id,
        slug,
        title,
        description,
        event_type,
        category,
        start_date,
        end_date,
        timezone,
        location_type,
        venue_name,
        address,
        city,
        country,
        online_link,
        online_platform,
        max_attendees,
        is_free,
        price,
        currency,
        visibility,
        is_invite_only,
        features,
        theme_color,
        welcome_message,
        custom_fields,
        banner_url,
        welcome_attachments,
        status,
        auto_approve,
        requires_approval
      ) VALUES (
        ${user.id},
        ${slug},
        ${title},
        ${description || null},
        ${event_type},
        ${category || null},
        ${start_date},
        ${end_date || null},
        ${timezone},
        ${location_type},
        ${venue_name || null},
        ${address || null},
        ${city || null},
        ${country || null},
        ${online_link || null},
        ${online_platform || null},
        ${max_attendees || null},
        ${is_free},
        ${price},
        ${currency},
        ${visibility},
        ${is_invite_only},
        ${JSON.stringify(finalFeatures)},
        ${finalThemeColor},
        ${welcome_message || null},
        ${JSON.stringify(custom_fields)},
        ${banner_url || null},
        ${JSON.stringify(welcome_attachments)},
        'draft',
        ${event_type === 'focused_event'},
        ${event_type === 'networking_event'}
      )
      RETURNING *
    `;

    // Add organizer as attendee with 'organizer' role
    await sql`
      INSERT INTO event_attendees (
        event_id,
        user_id,
        full_name,
        email,
        status,
        role,
        checked_in,
        payment_status
      ) VALUES (
        ${event.id},
        ${user.id},
        ${`${user.first_name} ${user.last_name}`},
        ${user.email},
        'approved',
        'organizer',
        false,
        'not_required'
      )
    `;

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        features: finalFeatures,
        images: [],
        custom_fields,
        welcome_attachments: [],
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
