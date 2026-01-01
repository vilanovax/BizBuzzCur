import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  getCoachAdvice,
  getInstantCoachAdvice,
  getGoalBasedCoachAdvice,
  getWeeklyCoachReport,
} from '@/lib/services/profile-coach.service';
import type { CoachGoal, CoachMode, CoachTrigger } from '@/types/profile-coach';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/profiles/[id]/coach
 * Get coach advice for a profile
 *
 * Query params:
 * - mode: 'instant' | 'goal_based' | 'weekly'
 * - trigger: 'pre_share' | 'post_share' | 'manual' | etc.
 * - goal: 'growth' | 'network' | 'visibility' | 'trust'
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get profile and verify ownership
    const [profile] = await sql<[{ user_id: string }]>`
      SELECT user_id FROM profiles
      WHERE id = ${profileId} AND deleted_at IS NULL
    `;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') as CoachMode) || 'instant';
    const trigger = (searchParams.get('trigger') as CoachTrigger) || 'manual';
    const goal = searchParams.get('goal') as CoachGoal | undefined;

    // Validate mode
    const validModes: CoachMode[] = ['instant', 'goal_based', 'weekly'];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode' },
        { status: 400 }
      );
    }

    // Handle weekly report
    if (mode === 'weekly') {
      const report = await getWeeklyCoachReport(profileId);
      return NextResponse.json({
        success: true,
        data: report,
      });
    }

    // Handle goal-based
    if (mode === 'goal_based' && goal) {
      const validGoals: CoachGoal[] = ['growth', 'network', 'visibility', 'trust'];
      if (!validGoals.includes(goal)) {
        return NextResponse.json(
          { success: false, error: 'Invalid goal' },
          { status: 400 }
        );
      }
      const advice = await getGoalBasedCoachAdvice(profileId, goal);
      return NextResponse.json({
        success: true,
        data: advice,
      });
    }

    // Default: instant advice
    const advice = await getCoachAdvice({
      profileId,
      mode,
      trigger,
      userGoal: goal,
    });

    return NextResponse.json({
      success: true,
      data: advice,
    });
  } catch (error) {
    console.error('Coach advice error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get coach advice' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profiles/[id]/coach
 * Get coach advice with share context
 *
 * Body:
 * {
 *   mode: 'instant' | 'goal_based' | 'weekly'
 *   trigger: 'pre_share' | 'post_share' | 'manual' | etc.
 *   goal?: 'growth' | 'network' | 'visibility' | 'trust'
 *   shareContext?: {
 *     intent: string
 *     audienceType?: string
 *     versionId?: string
 *   }
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get profile and verify ownership
    const [profile] = await sql<[{ user_id: string }]>`
      SELECT user_id FROM profiles
      WHERE id = ${profileId} AND deleted_at IS NULL
    `;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { mode, trigger, goal, shareContext } = body;

    // Validate
    const validModes: CoachMode[] = ['instant', 'goal_based', 'weekly'];
    if (mode && !validModes.includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode' },
        { status: 400 }
      );
    }

    // Handle instant with share context
    if (mode === 'instant' && shareContext) {
      const advice = await getInstantCoachAdvice(
        profileId,
        trigger === 'pre_share' ? 'pre_share' : 'post_share',
        shareContext
      );
      return NextResponse.json({
        success: true,
        data: advice,
      });
    }

    // General advice
    const advice = await getCoachAdvice({
      profileId,
      mode: mode || 'instant',
      trigger: trigger || 'manual',
      userGoal: goal,
      recentShareContext: shareContext,
    });

    return NextResponse.json({
      success: true,
      data: advice,
    });
  } catch (error) {
    console.error('Coach advice error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get coach advice' },
      { status: 500 }
    );
  }
}
