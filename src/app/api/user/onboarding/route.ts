import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/user/onboarding - Check onboarding status
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has completed onboarding
    const [status] = await sql<{
      onboarding_completed: boolean;
      onboarding_skipped_at: string | null;
      onboarding_completed_at: string | null;
    }[]>`
      SELECT
        COALESCE(onboarding_completed, false) as onboarding_completed,
        onboarding_skipped_at,
        onboarding_completed_at
      FROM users
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      data: {
        completed: status?.onboarding_completed || false,
        skipped: !!status?.onboarding_skipped_at,
        completedAt: status?.onboarding_completed_at,
        skippedAt: status?.onboarding_skipped_at,
      },
    });
  } catch (error) {
    console.error('Get onboarding status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get onboarding status' },
      { status: 500 }
    );
  }
}

// POST /api/user/onboarding - Update onboarding status
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
    const { completed, skipped } = body;

    if (completed) {
      await sql`
        UPDATE users
        SET
          onboarding_completed = true,
          onboarding_completed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${user.id}
      `;
    } else if (skipped) {
      await sql`
        UPDATE users
        SET
          onboarding_skipped_at = NOW(),
          updated_at = NOW()
        WHERE id = ${user.id}
      `;
    }

    return NextResponse.json({
      success: true,
      message: completed ? 'Onboarding completed' : 'Onboarding skipped',
    });
  } catch (error) {
    console.error('Update onboarding status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update onboarding status' },
      { status: 500 }
    );
  }
}
