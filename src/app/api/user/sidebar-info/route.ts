import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/user/sidebar-info - Get user's first profile avatar and profile count
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get first profile's photo, count of active profiles, trash count, events count, and inbox unread count
    const [stats] = await sql<[{
      profile_count: number;
      first_profile_photo: string | null;
      trash_count: number;
      event_count: number;
      inbox_unread_count: number;
    }]>`
      WITH first_profile AS (
        SELECT photo_url
        FROM profiles
        WHERE user_id = ${user.id} AND deleted_at IS NULL
        ORDER BY created_at ASC
        LIMIT 1
      ),
      profile_count AS (
        SELECT COUNT(*)::int as count
        FROM profiles
        WHERE user_id = ${user.id} AND deleted_at IS NULL AND is_public = true
      ),
      trash_count AS (
        SELECT COUNT(*)::int as count
        FROM profiles
        WHERE user_id = ${user.id} AND deleted_at IS NOT NULL
      ),
      event_count AS (
        SELECT COUNT(*)::int as count
        FROM events
        WHERE organizer_id = ${user.id}
          AND status IN ('draft', 'published', 'ongoing')
      ),
      inbox_unread AS (
        SELECT COALESCE(SUM(unread_count), 0)::int as count
        FROM conversation_participants
        WHERE user_id = ${user.id}
          AND is_archived = false
      )
      SELECT
        profile_count.count as profile_count,
        first_profile.photo_url as first_profile_photo,
        trash_count.count as trash_count,
        event_count.count as event_count,
        inbox_unread.count as inbox_unread_count
      FROM profile_count
      LEFT JOIN first_profile ON true
      CROSS JOIN trash_count
      CROSS JOIN event_count
      CROSS JOIN inbox_unread
    `;

    return NextResponse.json({
      success: true,
      data: {
        profileCount: stats?.profile_count || 0,
        firstProfilePhoto: stats?.first_profile_photo || null,
        trashCount: stats?.trash_count || 0,
        eventCount: stats?.event_count || 0,
        inboxUnreadCount: stats?.inbox_unread_count || 0,
      },
    });
  } catch (error) {
    console.error('Get sidebar info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get sidebar info' },
      { status: 500 }
    );
  }
}
