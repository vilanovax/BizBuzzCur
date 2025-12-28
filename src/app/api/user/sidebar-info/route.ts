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

    // Get first profile's photo, count of all profiles (excluding deleted), and trash count
    const [stats] = await sql<[{
      profile_count: number;
      first_profile_photo: string | null;
      trash_count: number;
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
        WHERE user_id = ${user.id} AND deleted_at IS NULL
      ),
      trash_count AS (
        SELECT COUNT(*)::int as count
        FROM profiles
        WHERE user_id = ${user.id} AND deleted_at IS NOT NULL
      )
      SELECT
        profile_count.count as profile_count,
        first_profile.photo_url as first_profile_photo,
        trash_count.count as trash_count
      FROM profile_count
      LEFT JOIN first_profile ON true
      CROSS JOIN trash_count
    `;

    return NextResponse.json({
      success: true,
      data: {
        profileCount: stats?.profile_count || 0,
        firstProfilePhoto: stats?.first_profile_photo || null,
        trashCount: stats?.trash_count || 0,
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
