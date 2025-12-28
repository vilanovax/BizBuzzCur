import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { Profile } from '@/types/profile';

// GET /api/profiles/trash - List deleted profiles
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profiles = await sql<Profile[]>`
      SELECT * FROM profiles
      WHERE user_id = ${user.id} AND deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('List trash error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list trash' },
      { status: 500 }
    );
  }
}

// POST /api/profiles/trash - Bulk operations (restore or delete permanently)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ids } = body as { action: 'restore' | 'delete' | 'empty'; ids?: string[] };

    if (action === 'empty') {
      // Empty entire trash
      await sql`
        DELETE FROM profiles
        WHERE user_id = ${user.id} AND deleted_at IS NOT NULL
      `;

      return NextResponse.json({
        success: true,
        message: 'Trash emptied successfully',
      });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No profile IDs provided' },
        { status: 400 }
      );
    }

    if (action === 'restore') {
      // Restore profiles from trash
      await sql`
        UPDATE profiles
        SET deleted_at = NULL
        WHERE id = ANY(${ids}::uuid[]) AND user_id = ${user.id} AND deleted_at IS NOT NULL
      `;

      return NextResponse.json({
        success: true,
        message: `${ids.length} profile(s) restored`,
      });
    }

    if (action === 'delete') {
      // Permanently delete profiles
      await sql`
        DELETE FROM profiles
        WHERE id = ANY(${ids}::uuid[]) AND user_id = ${user.id} AND deleted_at IS NOT NULL
      `;

      return NextResponse.json({
        success: true,
        message: `${ids.length} profile(s) permanently deleted`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Trash operation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform trash operation' },
      { status: 500 }
    );
  }
}
