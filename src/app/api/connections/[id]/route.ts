import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/connections/[id] - Get connection status with a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id: targetUserId } = await params;

    // Check connection request status
    const [request_status] = await sql`
      SELECT id, status, requester_id, addressee_id, created_at
      FROM connection_requests
      WHERE (requester_id = ${user?.id || ''} AND addressee_id = ${targetUserId})
         OR (requester_id = ${targetUserId} AND addressee_id = ${user?.id || ''})
      ORDER BY created_at DESC
      LIMIT 1
    `;

    // Check if already connected
    const [connection] = user ? await sql`
      SELECT id FROM contacts
      WHERE user_id = ${user.id} AND contact_user_id = ${targetUserId}
    ` : [null];

    return NextResponse.json({
      success: true,
      data: {
        isLoggedIn: !!user,
        isConnected: !!connection,
        connectionRequest: request_status ? {
          id: request_status.id,
          status: request_status.status,
          isRequester: request_status.requester_id === user?.id,
          created_at: request_status.created_at,
        } : null
      }
    });
  } catch (error) {
    console.error('Get connection status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get connection status' },
      { status: 500 }
    );
  }
}

// PUT /api/connections/[id] - Accept or reject connection request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: requestId } = await params;
    const body = await request.json();
    const { action } = body; // 'accept' | 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get the request
    const [connectionRequest] = await sql`
      SELECT * FROM connection_requests
      WHERE id = ${requestId} AND addressee_id = ${user.id} AND status = 'pending'
    `;

    if (!connectionRequest) {
      return NextResponse.json(
        { success: false, error: 'Connection request not found or already processed' },
        { status: 404 }
      );
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    // Update request status
    await sql`
      UPDATE connection_requests
      SET status = ${newStatus}, responded_at = NOW()
      WHERE id = ${requestId}
    `;

    if (action === 'accept') {
      // Get requester info
      const [requester] = await sql`
        SELECT id, first_name, last_name, avatar_url, email
        FROM users WHERE id = ${connectionRequest.requester_id}
      `;

      const [requesterProfile] = await sql`
        SELECT headline, company, phone
        FROM profiles
        WHERE user_id = ${connectionRequest.requester_id}
          AND is_public = true AND deleted_at IS NULL
        LIMIT 1
      `;

      // Get current user info
      const [currentUserProfile] = await sql`
        SELECT headline, company, phone
        FROM profiles
        WHERE user_id = ${user.id}
          AND is_public = true AND deleted_at IS NULL
        LIMIT 1
      `;

      // Create mutual contacts
      // Contact for current user (addressee)
      await sql`
        INSERT INTO contacts (user_id, contact_user_id, name, email, company, job_title, photo_url, source, source_id)
        VALUES (
          ${user.id},
          ${connectionRequest.requester_id},
          ${`${requester.first_name} ${requester.last_name}`},
          ${requester.email},
          ${requesterProfile?.company || null},
          ${requesterProfile?.headline || null},
          ${requester.avatar_url},
          'profile_share',
          ${requestId}
        )
        ON CONFLICT (user_id, contact_user_id) DO NOTHING
      `;

      // Contact for requester
      await sql`
        INSERT INTO contacts (user_id, contact_user_id, name, email, company, job_title, photo_url, source, source_id)
        VALUES (
          ${connectionRequest.requester_id},
          ${user.id},
          ${`${user.first_name} ${user.last_name}`},
          ${user.email},
          ${currentUserProfile?.company || null},
          ${currentUserProfile?.headline || null},
          ${user.avatar_url},
          'profile_share',
          ${requestId}
        )
        ON CONFLICT (user_id, contact_user_id) DO NOTHING
      `;

      // Create notification for requester
      await sql`
        INSERT INTO notifications (user_id, type, title, body, action_url, action_data, related_user_id)
        VALUES (
          ${connectionRequest.requester_id},
          'connection_accepted',
          'درخواست ارتباط پذیرفته شد',
          ${`${user.first_name} ${user.last_name} درخواست ارتباط شما را پذیرفت`},
          '/dashboard/network',
          ${JSON.stringify({ request_id: requestId })},
          ${user.id}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      data: { status: newStatus }
    });
  } catch (error) {
    console.error('Process connection request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process connection request' },
      { status: 500 }
    );
  }
}

// DELETE /api/connections/[id] - Remove connection or cancel request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Try to delete as connection request first
    const requestResult = await sql`
      DELETE FROM connection_requests
      WHERE id = ${id}
        AND (requester_id = ${user.id} OR addressee_id = ${user.id})
        AND status = 'pending'
      RETURNING id
    `;

    if (requestResult.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Connection request cancelled'
      });
    }

    // Try to delete as contact (remove connection)
    const contactResult = await sql`
      DELETE FROM contacts
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING contact_user_id
    `;

    if (contactResult.length > 0) {
      // Also remove the reverse connection
      await sql`
        DELETE FROM contacts
        WHERE user_id = ${contactResult[0].contact_user_id}
          AND contact_user_id = ${user.id}
      `;

      return NextResponse.json({
        success: true,
        message: 'Connection removed'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Connection not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Delete connection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}
