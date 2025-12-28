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

    // Get first profile's photo and count of all profiles
    const [stats] = await sql<[{
      profile_count: number;
      first_profile_photo: string | null;
    }]>`
      WITH first_profile AS (
        SELECT photo_url
        FROM profiles
        WHERE user_id = ${user.id}
        ORDER BY created_at ASC
        LIMIT 1
      ),
      profile_count AS (
        SELECT COUNT(*)::int as count
        FROM profiles
        WHERE user_id = ${user.id}
      )
      SELECT
        profile_count.count as profile_count,
        first_profile.photo_url as first_profile_photo
      FROM profile_count
      LEFT JOIN first_profile ON true
    `;

    return NextResponse.json({
      success: true,
      data: {
        profileCount: stats?.profile_count || 0,
        firstProfilePhoto: stats?.first_profile_photo || null,
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
