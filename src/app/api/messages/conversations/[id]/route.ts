import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/messages/conversations/[id] - Get messages in a conversation
export async function GET(
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

    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // cursor for pagination

    // Verify user is participant
    const [conversation] = await sql`
      SELECT * FROM conversations
      WHERE id = ${conversationId}
        AND (participant_1_id = ${user.id} OR participant_2_id = ${user.id})
    `;

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages
    let messages;
    if (before) {
      messages = await sql`
        SELECT
          m.*,
          u.first_name as sender_first_name,
          u.last_name as sender_last_name,
          u.avatar_url as sender_avatar
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ${conversationId}
          AND m.deleted_at IS NULL
          AND m.created_at < ${before}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      messages = await sql`
        SELECT
          m.*,
          u.first_name as sender_first_name,
          u.last_name as sender_last_name,
          u.avatar_url as sender_avatar
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ${conversationId}
          AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    }

    // Mark messages as read
    await sql`
      UPDATE messages
      SET is_read = true, read_at = NOW()
      WHERE conversation_id = ${conversationId}
        AND sender_id != ${user.id}
        AND is_read = false
    `;

    // Reset unread count
    await sql`
      UPDATE conversation_participants
      SET unread_count = 0, last_read_at = NOW()
      WHERE conversation_id = ${conversationId}
        AND user_id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        messages: messages.reverse().map(m => ({
          id: m.id,
          content: m.content,
          message_type: m.message_type,
          attachments: m.attachments,
          metadata: m.metadata,
          is_read: m.is_read,
          created_at: m.created_at,
          sender: {
            id: m.sender_id,
            first_name: m.sender_first_name,
            last_name: m.sender_last_name,
            avatar_url: m.sender_avatar,
          },
          is_mine: m.sender_id === user.id,
        }))
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}

// POST /api/messages/conversations/[id] - Send a message
export async function POST(
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

    const { id: conversationId } = await params;
    const body = await request.json();
    const { content, message_type = 'text', attachments = [], metadata = {} } = body;

    if (!content?.trim() && attachments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Verify user is participant
    const [conversation] = await sql`
      SELECT * FROM conversations
      WHERE id = ${conversationId}
        AND (participant_1_id = ${user.id} OR participant_2_id = ${user.id})
    `;

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Create message
    const [message] = await sql`
      INSERT INTO messages (conversation_id, sender_id, content, message_type, attachments, metadata)
      VALUES (${conversationId}, ${user.id}, ${content}, ${message_type}, ${JSON.stringify(attachments)}, ${JSON.stringify(metadata)})
      RETURNING *
    `;

    // Update conversation
    const preview = content?.substring(0, 100) || (attachments.length > 0 ? '📎 پیوست' : '');
    await sql`
      UPDATE conversations
      SET last_message_id = ${message.id},
          last_message_at = ${message.created_at},
          last_message_preview = ${preview},
          updated_at = NOW()
      WHERE id = ${conversationId}
    `;

    // Update unread count for other participant
    const otherUserId = conversation.participant_1_id === user.id
      ? conversation.participant_2_id
      : conversation.participant_1_id;

    await sql`
      UPDATE conversation_participants
      SET unread_count = unread_count + 1
      WHERE conversation_id = ${conversationId}
        AND user_id = ${otherUserId}
    `;

    // Create notification for other user
    await sql`
      INSERT INTO notifications (user_id, type, title, body, action_url, action_data, related_user_id)
      VALUES (
        ${otherUserId},
        'new_message',
        'پیام جدید',
        ${`${user.first_name} ${user.last_name}: ${preview}`},
        ${`/dashboard/messages/${conversationId}`},
        ${JSON.stringify({ conversation_id: conversationId, message_id: message.id })},
        ${user.id}
      )
    `;

    return NextResponse.json({
      success: true,
      data: {
        ...message,
        sender: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url,
        },
        is_mine: true,
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// PUT /api/messages/conversations/[id] - Update conversation settings
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

    const { id: conversationId } = await params;
    const body = await request.json();
    const { is_muted, is_archived, is_pinned, notifications_enabled } = body;

    // Update participant settings
    const hasUpdates =
      typeof is_muted === 'boolean' ||
      typeof is_archived === 'boolean' ||
      typeof is_pinned === 'boolean' ||
      typeof notifications_enabled === 'boolean';

    if (!hasUpdates) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Build dynamic update
    const updateIsMuted = typeof is_muted === 'boolean' ? is_muted : null;
    const updateIsArchived = typeof is_archived === 'boolean' ? is_archived : null;
    const updateIsPinned = typeof is_pinned === 'boolean' ? is_pinned : null;
    const updateNotifications = typeof notifications_enabled === 'boolean' ? notifications_enabled : null;

    await sql`
      UPDATE conversation_participants
      SET
        is_muted = COALESCE(${updateIsMuted}, is_muted),
        is_archived = COALESCE(${updateIsArchived}, is_archived),
        is_pinned = COALESCE(${updateIsPinned}, is_pinned),
        notifications_enabled = COALESCE(${updateNotifications}, notifications_enabled)
      WHERE conversation_id = ${conversationId}
        AND user_id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      message: 'Conversation updated'
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
