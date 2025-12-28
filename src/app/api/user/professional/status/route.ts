import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { UserProfessionalStatus, SetUserStatusInput } from '@/types/professional';

// GET /api/user/professional/status - Get user's professional status
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
    const profileId = searchParams.get('profile_id');

    // Get status (either profile-specific or global)
    const [status] = await sql<UserProfessionalStatus[]>`
      SELECT ups.*,
        json_build_object(
          'id', ps.id,
          'slug', ps.slug,
          'name_en', ps.name_en,
          'name_fa', ps.name_fa,
          'description_en', ps.description_en,
          'description_fa', ps.description_fa,
          'icon', ps.icon,
          'color', ps.color,
          'status_type', ps.status_type,
          'display_order', ps.display_order,
          'is_active', ps.is_active
        ) as status
      FROM user_professional_status ups
      JOIN professional_statuses ps ON ups.status_id = ps.id
      WHERE ups.user_id = ${user.id}
        AND ${profileId ? sql`ups.profile_id = ${profileId}` : sql`ups.profile_id IS NULL`}
    `;

    return NextResponse.json({
      success: true,
      data: status || null,
    });
  } catch (error) {
    console.error('Get user status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user status' },
      { status: 500 }
    );
  }
}

// POST /api/user/professional/status - Set user's professional status
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SetUserStatusInput = await request.json();
    const {
      status_id,
      profile_id,
      visibility = 'public',
      custom_message,
      expires_at,
    } = body;

    if (!status_id) {
      return NextResponse.json(
        { success: false, error: 'status_id is required' },
        { status: 400 }
      );
    }

    // Validate visibility
    const validVisibilities = ['public', 'connections', 'event_only', 'private'];
    if (!validVisibilities.includes(visibility)) {
      return NextResponse.json(
        { success: false, error: 'Invalid visibility' },
        { status: 400 }
      );
    }

    // Verify status exists
    const [statusExists] = await sql`
      SELECT id FROM professional_statuses WHERE id = ${status_id} AND is_active = true
    `;
    if (!statusExists) {
      return NextResponse.json(
        { success: false, error: 'Status not found' },
        { status: 404 }
      );
    }

    // If profile_id is provided, verify it exists and belongs to user
    if (profile_id) {
      const [profileExists] = await sql`
        SELECT id FROM profiles WHERE id = ${profile_id} AND user_id = ${user.id}
      `;
      if (!profileExists) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        );
      }
    }

    // Upsert user status (one per profile or one global)
    const [userStatus] = await sql<UserProfessionalStatus[]>`
      INSERT INTO user_professional_status (
        user_id, status_id, profile_id, visibility, custom_message, expires_at
      )
      VALUES (
        ${user.id},
        ${status_id},
        ${profile_id ?? null},
        ${visibility},
        ${custom_message ?? null},
        ${expires_at ?? null}
      )
      ON CONFLICT (user_id, profile_id)
      DO UPDATE SET
        status_id = ${status_id},
        visibility = ${visibility},
        custom_message = ${custom_message ?? null},
        expires_at = ${expires_at ?? null},
        updated_at = NOW()
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: userStatus,
    });
  } catch (error) {
    console.error('Set user status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set user status' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/professional/status - Remove user's professional status
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
    const profileId = searchParams.get('profile_id');

    // Delete status (either profile-specific or global)
    await sql`
      DELETE FROM user_professional_status
      WHERE user_id = ${user.id}
        AND ${profileId ? sql`profile_id = ${profileId}` : sql`profile_id IS NULL`}
    `;

    return NextResponse.json({
      success: true,
      message: 'Status removed successfully',
    });
  } catch (error) {
    console.error('Remove user status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove user status' },
      { status: 500 }
    );
  }
}
