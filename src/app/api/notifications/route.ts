import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/notifications - Get user's notifications
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread') === 'true';

    let notifications;
    if (unreadOnly) {
      notifications = await sql`
        SELECT
          n.*,
          u.first_name as related_first_name,
          u.last_name as related_last_name,
          u.avatar_url as related_avatar
        FROM notifications n
        LEFT JOIN users u ON u.id = n.related_user_id
        WHERE n.user_id = ${user.id}
          AND n.is_read = false
          AND (n.expires_at IS NULL OR n.expires_at > NOW())
        ORDER BY n.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      notifications = await sql`
        SELECT
          n.*,
          u.first_name as related_first_name,
          u.last_name as related_last_name,
          u.avatar_url as related_avatar
        FROM notifications n
        LEFT JOIN users u ON u.id = n.related_user_id
        WHERE n.user_id = ${user.id}
          AND (n.expires_at IS NULL OR n.expires_at > NOW())
        ORDER BY n.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Get unread count
    const [{ count: unreadCount }] = await sql<[{ count: number }]>`
      SELECT COUNT(*)::int as count
      FROM notifications
      WHERE user_id = ${user.id}
        AND is_read = false
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          action_url: n.action_url,
          action_data: n.action_data,
          is_read: n.is_read,
          created_at: n.created_at,
          related_user: n.related_user_id ? {
            id: n.related_user_id,
            first_name: n.related_first_name,
            last_name: n.related_last_name,
            avatar_url: n.related_avatar,
          } : null,
        })),
        unreadCount,
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notification_ids, mark_all } = body;

    if (mark_all) {
      await sql`
        UPDATE notifications
        SET is_read = true, read_at = NOW()
        WHERE user_id = ${user.id} AND is_read = false
      `;
    } else if (notification_ids && notification_ids.length > 0) {
      await sql`
        UPDATE notifications
        SET is_read = true, read_at = NOW()
        WHERE user_id = ${user.id}
          AND id = ANY(${notification_ids}::uuid[])
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Mark notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      await sql`
        DELETE FROM notifications
        WHERE user_id = ${user.id}
      `;
    } else if (notificationId) {
      await sql`
        DELETE FROM notifications
        WHERE user_id = ${user.id} AND id = ${notificationId}
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications deleted'
    });
  } catch (error) {
    console.error('Delete notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
