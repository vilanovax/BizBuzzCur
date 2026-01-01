import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  sendConnectionRequest,
  getPendingRequests,
  acceptConnectionRequest,
  declineConnectionRequest,
} from '@/lib/services/network-graph.service';

/**
 * GET /api/network/requests
 * Get pending connection requests
 */
export async function GET(request: NextRequest) {
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

    const requests = await getPendingRequests(profile.id);

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Get requests error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get requests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/network/requests
 * Send connection request
 *
 * Body:
 * {
 *   toProfileId: string
 *   message?: string
 *   introducerProfileId?: string
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
    const { toProfileId, message, introducerProfileId } = body;

    if (!toProfileId) {
      return NextResponse.json(
        { success: false, error: 'toProfileId is required' },
        { status: 400 }
      );
    }

    // Verify target profile exists
    const [targetProfile] = await sql<ProfileRow[]>`
      SELECT id FROM profiles
      WHERE id = ${toProfileId} AND deleted_at IS NULL
    `;

    if (!targetProfile) {
      return NextResponse.json(
        { success: false, error: 'Target profile not found' },
        { status: 404 }
      );
    }

    const connectionRequest = await sendConnectionRequest(
      profile.id,
      toProfileId,
      message,
      introducerProfileId
    );

    return NextResponse.json({
      success: true,
      data: connectionRequest,
    });
  } catch (error) {
    console.error('Send request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send request' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/network/requests
 * Accept or decline a connection request
 *
 * Body:
 * {
 *   requestId: string
 *   action: 'accept' | 'decline'
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, error: 'requestId and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      const edge = await acceptConnectionRequest(requestId);
      if (!edge) {
        return NextResponse.json(
          { success: false, error: 'Request not found or already processed' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: edge,
      });
    } else {
      const success = await declineConnectionRequest(requestId);
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Request not found or already processed' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Request declined',
      });
    }
  } catch (error) {
    console.error('Process request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
