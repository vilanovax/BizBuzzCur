import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { Profile } from '@/types/profile';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/profiles/trash/[id] - Restore single profile from trash
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [restored] = await sql<Profile[]>`
      UPDATE profiles
      SET deleted_at = NULL
      WHERE id = ${id} AND user_id = ${user.id} AND deleted_at IS NOT NULL
      RETURNING id
    `;

    if (!restored) {
      return NextResponse.json(
        { success: false, error: 'Profile not found in trash' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile restored successfully',
    });
  } catch (error) {
    console.error('Restore profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/profiles/trash/[id] - Permanently delete single profile
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [deleted] = await sql<Profile[]>`
      DELETE FROM profiles
      WHERE id = ${id} AND user_id = ${user.id} AND deleted_at IS NOT NULL
      RETURNING id
    `;

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Profile not found in trash' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile permanently deleted',
    });
  } catch (error) {
    console.error('Permanent delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
}
