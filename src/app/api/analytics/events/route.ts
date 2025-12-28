import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { AnalyticsEvent, EventBatch } from '@/types/analytics';

// POST /api/analytics/events - Track single or batch events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get user if authenticated (optional - some events may be anonymous)
    const user = await getCurrentUser().catch(() => null);

    // Handle batch or single event
    const events: AnalyticsEvent[] = body.events || [body];

    // Validate and insert events
    const insertedIds: string[] = [];

    for (const event of events) {
      // Validate required fields
      if (!event.event_name) {
        continue; // Skip invalid events silently
      }

      const properties = event.properties || {};

      // Ensure user_id is set (from auth or from properties)
      const userId = user?.id || properties.user_id || null;

      // Insert event
      const [inserted] = await sql<{ id: string }[]>`
        INSERT INTO analytics_events (
          event_name,
          user_id,
          source,
          entry_app,
          session_id,
          properties,
          event_timestamp
        )
        VALUES (
          ${event.event_name},
          ${userId},
          ${properties.source || 'unknown'},
          ${properties.entry_app || 'bizbuzz'},
          ${properties.session_id || null},
          ${JSON.stringify(properties)},
          ${properties.timestamp || new Date().toISOString()}
        )
        RETURNING id
      `;

      if (inserted) {
        insertedIds.push(inserted.id);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        tracked: insertedIds.length,
        ids: insertedIds,
      },
    });
  } catch (error) {
    // Log error but don't fail - analytics should be non-blocking
    console.error('Analytics tracking error:', error);

    // Return success anyway to not block the client
    return NextResponse.json({
      success: true,
      data: { tracked: 0, ids: [] },
    });
  }
}

// GET /api/analytics/events - Get events (admin only, for debugging)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.user_role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventName = searchParams.get('event_name');
    const userId = searchParams.get('user_id');
    const source = searchParams.get('source');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);

    const events = await sql`
      SELECT *
      FROM analytics_events
      WHERE 1=1
        ${eventName ? sql`AND event_name = ${eventName}` : sql``}
        ${userId ? sql`AND user_id = ${userId}::uuid` : sql``}
        ${source ? sql`AND source = ${source}` : sql``}
      ORDER BY event_timestamp DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
