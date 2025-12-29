import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { UpdateEventInput } from '@/types/event';
import { FOCUSED_EVENT_FEATURES, NETWORKING_EVENT_FEATURES } from '@/types/event';

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const [event] = await sql`
      SELECT
        e.*,
        u.first_name as organizer_first_name,
        u.last_name as organizer_last_name,
        u.avatar_url as organizer_avatar
      FROM events e
      JOIN users u ON u.id = e.organizer_id
      WHERE e.id = ${id}
    `;

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check access - owner or public/published event
    const isOwner = user?.id === event.organizer_id;
    const isPublished = event.status === 'published' || event.status === 'ongoing';
    const isPublicOrUnlisted = event.visibility === 'public' || event.visibility === 'unlisted';

    if (!isOwner && !(isPublished && isPublicOrUnlisted)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get attendee count
    const [{ count: attendee_count }] = await sql<[{ count: number }]>`
      SELECT COUNT(*)::int as count
      FROM event_attendees
      WHERE event_id = ${id} AND status = 'approved'
    `;

    // Get speakers
    const speakers = await sql`
      SELECT * FROM event_speakers
      WHERE event_id = ${id}
      ORDER BY display_order ASC
    `;

    // Get attendees preview (first 5)
    const attendees_preview = await sql`
      SELECT
        ea.*,
        u.first_name,
        u.last_name,
        u.avatar_url
      FROM event_attendees ea
      LEFT JOIN users u ON u.id = ea.user_id
      WHERE ea.event_id = ${id} AND ea.status = 'approved'
      ORDER BY ea.registered_at DESC
      LIMIT 5
    `;

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        features: event.features || (event.event_type === 'focused_event' ? FOCUSED_EVENT_FEATURES : NETWORKING_EVENT_FEATURES),
        images: event.images || [],
        custom_fields: event.custom_fields || [],
        welcome_attachments: event.welcome_attachments || [],
        organizer: {
          id: event.organizer_id,
          first_name: event.organizer_first_name,
          last_name: event.organizer_last_name,
          avatar_url: event.organizer_avatar,
        },
        speakers,
        attendees_preview: attendees_preview.map(a => ({
          ...a,
          user: a.user_id ? {
            id: a.user_id,
            first_name: a.first_name,
            last_name: a.last_name,
            avatar_url: a.avatar_url,
          } : null,
        })),
        attendee_count,
        isOwner,
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get event' },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check ownership
    const [existing] = await sql`
      SELECT * FROM events WHERE id = ${id} AND organizer_id = ${user.id}
    `;

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    const body: UpdateEventInput = await request.json();
    const {
      title,
      description,
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
      status,
      banner_url,
      logo_url,
      welcome_attachments,
    } = body;

    // Build update object
    const [updated] = await sql`
      UPDATE events SET
        title = COALESCE(${title ?? null}, title),
        description = COALESCE(${description ?? null}, description),
        category = COALESCE(${category ?? null}, category),
        start_date = COALESCE(${start_date ?? null}, start_date),
        end_date = COALESCE(${end_date ?? null}, end_date),
        timezone = COALESCE(${timezone ?? null}, timezone),
        location_type = COALESCE(${location_type ?? null}, location_type),
        venue_name = COALESCE(${venue_name ?? null}, venue_name),
        address = COALESCE(${address ?? null}, address),
        city = COALESCE(${city ?? null}, city),
        country = COALESCE(${country ?? null}, country),
        online_link = COALESCE(${online_link ?? null}, online_link),
        online_platform = COALESCE(${online_platform ?? null}, online_platform),
        max_attendees = COALESCE(${max_attendees ?? null}, max_attendees),
        is_free = COALESCE(${is_free ?? null}, is_free),
        price = COALESCE(${price ?? null}, price),
        currency = COALESCE(${currency ?? null}, currency),
        visibility = COALESCE(${visibility ?? null}, visibility),
        is_invite_only = COALESCE(${is_invite_only ?? null}, is_invite_only),
        features = COALESCE(${features ? JSON.stringify(features) : null}, features),
        theme_color = COALESCE(${theme_color ?? null}, theme_color),
        welcome_message = COALESCE(${welcome_message ?? null}, welcome_message),
        custom_fields = COALESCE(${custom_fields ? JSON.stringify(custom_fields) : null}, custom_fields),
        status = COALESCE(${status ?? null}, status),
        banner_url = COALESCE(${banner_url ?? null}, banner_url),
        logo_url = COALESCE(${logo_url ?? null}, logo_url),
        welcome_attachments = COALESCE(${welcome_attachments ? JSON.stringify(welcome_attachments) : null}, welcome_attachments),
        published_at = CASE
          WHEN ${status ?? null} = 'published' AND published_at IS NULL THEN NOW()
          ELSE published_at
        END,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        features: updated.features || (updated.event_type === 'focused_event' ? FOCUSED_EVENT_FEATURES : NETWORKING_EVENT_FEATURES),
        images: updated.images || [],
        custom_fields: updated.custom_fields || [],
        welcome_attachments: updated.welcome_attachments || [],
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check ownership and delete
    const result = await sql`
      DELETE FROM events
      WHERE id = ${id} AND organizer_id = ${user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
