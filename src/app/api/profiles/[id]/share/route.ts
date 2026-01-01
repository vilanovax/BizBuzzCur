import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  getShareDecision,
  getAllVersionsWithScores,
  getQuickShareDecision,
} from '@/lib/services/share-decision.service';
import type { ShareContext, ShareIntent, AudienceType, ShareChannel } from '@/types/share-decision';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/profiles/[id]/share
 * Get share decision recommendation
 *
 * Body:
 * {
 *   intent: 'introduce' | 'network' | 'collaborate' | 'pitch' | 'discover'
 *   audienceType?: 'person' | 'team' | 'investor' | 'community' | 'recruiter'
 *   channel: 'link' | 'dm' | 'email' | 'qr' | 'social'
 *   targetId?: string
 *   urgency?: 'low' | 'medium' | 'high'
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
    const [profile] = await sql<[{ user_id: string; slug: string }]>`
      SELECT user_id, slug FROM profiles
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

    // Validate intent
    const validIntents: ShareIntent[] = ['introduce', 'network', 'collaborate', 'pitch', 'discover'];
    if (!body.intent || !validIntents.includes(body.intent)) {
      return NextResponse.json(
        { success: false, error: 'Invalid intent' },
        { status: 400 }
      );
    }

    // Validate channel
    const validChannels: ShareChannel[] = ['link', 'dm', 'email', 'qr', 'social'];
    if (!body.channel || !validChannels.includes(body.channel)) {
      return NextResponse.json(
        { success: false, error: 'Invalid channel' },
        { status: 400 }
      );
    }

    // Validate audience type if provided
    const validAudienceTypes: AudienceType[] = ['person', 'team', 'investor', 'community', 'recruiter'];
    if (body.audienceType && !validAudienceTypes.includes(body.audienceType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid audience type' },
        { status: 400 }
      );
    }

    const context: ShareContext = {
      intent: body.intent,
      audienceType: body.audienceType,
      channel: body.channel,
      targetId: body.targetId,
      urgency: body.urgency,
    };

    const decision = await getShareDecision(profileId, profile.slug, context);

    return NextResponse.json({
      success: true,
      data: decision,
    });
  } catch (error) {
    console.error('Share decision error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get share decision' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profiles/[id]/share
 * Get quick share decision (default intent: introduce, channel: link)
 * Also returns all versions with scores for comparison
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
    const [profile] = await sql<[{ user_id: string; slug: string }]>`
      SELECT user_id, slug FROM profiles
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

    // Get quick decision
    const decision = await getQuickShareDecision(profileId, profile.slug);

    // Also get all versions with scores for the default context
    const allVersions = await getAllVersionsWithScores(profileId, {
      intent: 'introduce',
      channel: 'link',
    });

    return NextResponse.json({
      success: true,
      data: {
        decision,
        allVersions: allVersions.map((v) => ({
          id: v.version.id,
          name: v.version.name,
          context: v.version.context,
          score: v.score,
          isDefault: v.version.is_default,
          slug: v.version.slug,
        })),
      },
    });
  } catch (error) {
    console.error('Quick share error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get share options' },
      { status: 500 }
    );
  }
}
