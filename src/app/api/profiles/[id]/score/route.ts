import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  calculateProfileScore,
  getProfileScoreSummary,
  getContextScore,
} from '@/lib/services/profile-score.service';
import type { ProfileVersionContext } from '@/types/profile-version';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/profiles/[id]/score
 * Get profile strength and completeness score
 *
 * Query params:
 * - summary=true: Return only summary (lighter payload)
 * - context=network|team|investor|job|public: Get score for specific context
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
    const summaryOnly = searchParams.get('summary') === 'true';
    const context = searchParams.get('context') as ProfileVersionContext | null;

    // Get specific context score
    if (context) {
      const validContexts: ProfileVersionContext[] = ['public', 'network', 'team', 'investor', 'job', 'custom'];
      if (!validContexts.includes(context)) {
        return NextResponse.json(
          { success: false, error: 'Invalid context' },
          { status: 400 }
        );
      }

      const contextScore = await getContextScore(profileId, context);
      return NextResponse.json({
        success: true,
        data: contextScore,
      });
    }

    // Get summary only
    if (summaryOnly) {
      const summary = await getProfileScoreSummary(profileId);
      return NextResponse.json({
        success: true,
        data: summary,
      });
    }

    // Get full score
    const score = await calculateProfileScore(profileId);

    return NextResponse.json({
      success: true,
      data: score,
    });
  } catch (error) {
    console.error('Profile score error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate profile score' },
      { status: 500 }
    );
  }
}
