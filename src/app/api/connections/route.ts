import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/connections - Get user's connections and pending requests
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
    const type = searchParams.get('type') || 'all'; // all, pending, sent

    if (type === 'pending') {
      // Get pending requests received by user
      const requests = await sql`
        SELECT
          cr.*,
          u.id as requester_id,
          u.first_name as requester_first_name,
          u.last_name as requester_last_name,
          u.avatar_url as requester_avatar,
          p.headline as requester_headline,
          p.company as requester_company
        FROM connection_requests cr
        JOIN users u ON u.id = cr.requester_id
        LEFT JOIN profiles p ON p.user_id = cr.requester_id AND p.is_public = true AND p.deleted_at IS NULL
        WHERE cr.addressee_id = ${user.id}
          AND cr.status = 'pending'
        ORDER BY cr.created_at DESC
      `;

      return NextResponse.json({
        success: true,
        data: requests.map(r => ({
          id: r.id,
          message: r.message,
          status: r.status,
          created_at: r.created_at,
          requester: {
            id: r.requester_id,
            first_name: r.requester_first_name,
            last_name: r.requester_last_name,
            avatar_url: r.requester_avatar,
            headline: r.requester_headline,
            company: r.requester_company,
          }
        }))
      });
    }

    if (type === 'sent') {
      // Get requests sent by user
      const requests = await sql`
        SELECT
          cr.*,
          u.id as addressee_id,
          u.first_name as addressee_first_name,
          u.last_name as addressee_last_name,
          u.avatar_url as addressee_avatar
        FROM connection_requests cr
        JOIN users u ON u.id = cr.addressee_id
        WHERE cr.requester_id = ${user.id}
          AND cr.status = 'pending'
        ORDER BY cr.created_at DESC
      `;

      return NextResponse.json({
        success: true,
        data: requests.map(r => ({
          id: r.id,
          message: r.message,
          status: r.status,
          created_at: r.created_at,
          addressee: {
            id: r.addressee_id,
            first_name: r.addressee_first_name,
            last_name: r.addressee_last_name,
            avatar_url: r.addressee_avatar,
          }
        }))
      });
    }

    // Get all accepted connections
    const connections = await sql`
      SELECT
        c.*,
        u.id as contact_id,
        u.first_name,
        u.last_name,
        u.avatar_url,
        p.headline,
        p.company,
        p.slug as profile_slug
      FROM contacts c
      JOIN users u ON u.id = c.contact_user_id
      LEFT JOIN profiles p ON p.user_id = c.contact_user_id AND p.is_public = true AND p.deleted_at IS NULL
      WHERE c.user_id = ${user.id}
        AND c.contact_user_id IS NOT NULL
      ORDER BY c.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: connections.map(c => ({
        id: c.id,
        notes: c.notes,
        tags: c.tags,
        is_favorite: c.is_favorite,
        created_at: c.created_at,
        contact: {
          id: c.contact_id,
          first_name: c.first_name,
          last_name: c.last_name,
          avatar_url: c.avatar_url,
          headline: c.headline,
          company: c.company,
          profile_slug: c.profile_slug,
        }
      }))
    });
  } catch (error) {
    console.error('Get connections error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get connections' },
      { status: 500 }
    );
  }
}

// POST /api/connections - Send a connection request
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
    const { addressee_id, message, profile_id } = body;

    if (!addressee_id) {
      return NextResponse.json(
        { success: false, error: 'addressee_id is required' },
        { status: 400 }
      );
    }

    // Can't connect to yourself
    if (addressee_id === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot connect to yourself' },
        { status: 400 }
      );
    }

    // Check if request already exists
    const [existing] = await sql`
      SELECT id, status FROM connection_requests
      WHERE (requester_id = ${user.id} AND addressee_id = ${addressee_id})
         OR (requester_id = ${addressee_id} AND addressee_id = ${user.id})
    `;

    if (existing) {
      if (existing.status === 'pending') {
        return NextResponse.json(
          { success: false, error: 'Connection request already pending' },
          { status: 400 }
        );
      }
      if (existing.status === 'accepted') {
        return NextResponse.json(
          { success: false, error: 'Already connected' },
          { status: 400 }
        );
      }
      if (existing.status === 'blocked') {
        return NextResponse.json(
          { success: false, error: 'Cannot send request' },
          { status: 400 }
        );
      }
    }

    // Check if already connected via contacts
    const [existingContact] = await sql`
      SELECT id FROM contacts
      WHERE user_id = ${user.id} AND contact_user_id = ${addressee_id}
    `;

    if (existingContact) {
      return NextResponse.json(
        { success: false, error: 'Already connected' },
        { status: 400 }
      );
    }

    // Create connection request
    const [connectionRequest] = await sql`
      INSERT INTO connection_requests (requester_id, addressee_id, message)
      VALUES (${user.id}, ${addressee_id}, ${message || null})
      RETURNING *
    `;

    // Create notification for addressee
    await sql`
      INSERT INTO notifications (user_id, type, title, body, action_url, action_data, related_user_id, related_profile_id)
      VALUES (
        ${addressee_id},
        'connection_request',
        'درخواست ارتباط جدید',
        ${`${user.first_name} ${user.last_name} می‌خواهد با شما ارتباط برقرار کند`},
        '/dashboard/network?tab=pending',
        ${JSON.stringify({ request_id: connectionRequest.id })},
        ${user.id},
        ${profile_id || null}
      )
    `;

    return NextResponse.json({
      success: true,
      data: connectionRequest
    });
  } catch (error) {
    console.error('Send connection request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send connection request' },
      { status: 500 }
    );
  }
}
