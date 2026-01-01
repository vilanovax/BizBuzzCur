import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  getConnections,
  getConnectionSuggestions,
  getNetworkHealthScore,
} from '@/lib/services/network-graph.service';

/**
 * GET /api/network
 * Get user's network (connections, suggestions, health)
 *
 * Query params:
 * - type: 'connections' | 'suggestions' | 'health'
 * - limit: number (for suggestions)
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'connections';
    const limit = parseInt(searchParams.get('limit') || '10');

    switch (type) {
      case 'connections': {
        const connections = await getConnections(profile.id);
        return NextResponse.json({
          success: true,
          data: connections,
        });
      }

      case 'suggestions': {
        const suggestions = await getConnectionSuggestions(profile.id, limit);
        return NextResponse.json({
          success: true,
          data: suggestions,
        });
      }

      case 'health': {
        const health = await getNetworkHealthScore(profile.id);
        return NextResponse.json({
          success: true,
          data: health,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Network error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get network data' },
      { status: 500 }
    );
  }
}
