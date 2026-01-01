import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getNetworkDecision } from '@/lib/services/network-graph.service';
import type { NetworkIntent } from '@/types/network-graph';

/**
 * POST /api/network/decide
 * Get network decision recommendation
 *
 * Body:
 * {
 *   intent: 'connect' | 'introduce' | 'collaborate' | 'mentor'
 *   targetProfileId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile
    type ProfileRow = { id: string };
    const [profile] = await sql<ProfileRow[]>`
      SELECT id FROM profiles
      WHERE user_id = ${user.id} AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { intent, targetProfileId } = body;

    // Validate intent
    const validIntents: NetworkIntent[] = ['connect', 'introduce', 'collaborate', 'mentor'];
    if (!intent || !validIntents.includes(intent)) {
      return NextResponse.json(
        { success: false, error: 'Invalid intent' },
        { status: 400 }
      );
    }

    if (!targetProfileId) {
      return NextResponse.json(
        { success: false, error: 'targetProfileId is required' },
        { status: 400 }
      );
    }

    // Verify target profile exists
    const [targetProfile] = await sql<ProfileRow[]>`
      SELECT id FROM profiles
      WHERE id = ${targetProfileId} AND deleted_at IS NULL
    `;

    if (!targetProfile) {
      return NextResponse.json(
        { success: false, error: 'Target profile not found' },
        { status: 404 }
      );
    }

    const decision = await getNetworkDecision(profile.id, {
      intent,
      targetProfileId,
    });

    return NextResponse.json({
      success: true,
      data: decision,
    });
  } catch (error) {
    console.error('Network decide error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get decision' },
      { status: 500 }
    );
  }
}
