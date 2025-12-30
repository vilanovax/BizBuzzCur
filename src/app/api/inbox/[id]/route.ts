import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/inbox/[id] - Get conversation with full context and relationship info
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
    const before = searchParams.get('before');

    // Get conversation with context and relationship info
    const [conversation] = await sql`
      SELECT
        c.*,
        cp.unread_count,
        cp.is_muted,
        cp.is_archived,
        cp.is_pinned,
        CASE
          WHEN c.participant_1_id = ${user.id} THEN c.participant_2_id
          ELSE c.participant_1_id
        END as other_user_id,
        u.first_name as other_first_name,
        u.last_name as other_last_name,
        u.avatar_url as other_avatar,
        u.email as other_email,
        -- Connection status
        con.status as connection_status,
        con.id as connection_id,
        con.requester_id as connection_requester_id,
        -- Context info
        CASE
          WHEN c.context_type = 'event' THEN e.title
          WHEN c.context_type = 'profile_share' THEN COALESCE(p.full_name, p.title)
          WHEN c.context_type = 'job_application' THEN j.title
          ELSE NULL
        END as context_name,
        CASE
          WHEN c.context_type = 'event' THEN e.slug
          WHEN c.context_type = 'job_application' THEN j.id::text
          ELSE NULL
        END as context_slug,
        -- Job application info
        ja.id as application_id,
        ja.status as application_status,
        ja.cover_message,
        ja.resume_url,
        ja.applied_at,
        j.company_id as job_company_id,
        comp.name as job_company_name,
        -- Contact info
        ct.id as contact_id,
        ct.notes as contact_notes,
        ct.tags as contact_tags,
        ct.is_favorite as is_favorite
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = ${user.id}
      JOIN users u ON u.id = CASE
        WHEN c.participant_1_id = ${user.id} THEN c.participant_2_id
        ELSE c.participant_1_id
      END
      LEFT JOIN connection_requests con ON (
        (con.requester_id = ${user.id} AND con.addressee_id = u.id)
        OR (con.requester_id = u.id AND con.addressee_id = ${user.id})
      ) AND con.status IN ('pending', 'accepted')
      LEFT JOIN events e ON c.context_type = 'event' AND c.context_id = e.id
      LEFT JOIN profiles p ON c.context_type = 'profile_share' AND c.context_id = p.id
      LEFT JOIN job_ads j ON c.context_type = 'job_application' AND c.context_id = j.id
      LEFT JOIN job_applications ja ON ja.conversation_id = c.id
      LEFT JOIN companies comp ON comp.id = j.company_id
      LEFT JOIN contacts ct ON ct.user_id = ${user.id} AND ct.contact_user_id = u.id
      WHERE c.id = ${conversationId}
        AND (c.participant_1_id = ${user.id} OR c.participant_2_id = ${user.id})
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

    // Determine relationship status
    let relationshipStatus = 'none';
    if (conversation.connection_status === 'accepted') {
      relationshipStatus = 'connected';
    } else if (conversation.connection_status === 'pending') {
      relationshipStatus = conversation.connection_requester_id === user.id
        ? 'pending_sent'
        : 'pending_received';
    }

    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        context_type: conversation.context_type,
        context_id: conversation.context_id,
        context_name: conversation.context_name,
        context_slug: conversation.context_slug,
        created_at: conversation.created_at,
        is_muted: conversation.is_muted,
        is_archived: conversation.is_archived,
        is_pinned: conversation.is_pinned,
        is_favorite: conversation.is_favorite,
        other_participant: {
          id: conversation.other_user_id,
          first_name: conversation.other_first_name,
          last_name: conversation.other_last_name,
          avatar_url: conversation.other_avatar,
          email: conversation.other_email,
        },
        relationship: {
          status: relationshipStatus,
          connection_id: conversation.connection_id,
        },
        contact: {
          id: conversation.contact_id,
          notes: conversation.contact_notes,
          tags: conversation.contact_tags || [],
        },
        job_application: conversation.application_id ? {
          id: conversation.application_id,
          status: conversation.application_status,
          cover_message: conversation.cover_message,
          resume_url: conversation.resume_url,
          applied_at: conversation.applied_at,
          job: {
            id: conversation.context_id,
            title: conversation.context_name,
            company_id: conversation.job_company_id,
            company_name: conversation.job_company_name,
          },
        } : null,
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
        })),
      }
    });
  } catch (error) {
    console.error('Get inbox conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get conversation' },
      { status: 500 }
    );
  }
}

// POST /api/inbox/[id] - Send a message (proxy to existing API)
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

    // Create notification
    await sql`
      INSERT INTO notifications (user_id, type, title, body, action_url, action_data, related_user_id)
      VALUES (
        ${otherUserId},
        'new_message',
        'پیام جدید',
        ${`${user.first_name} ${user.last_name}: ${preview}`},
        ${`/dashboard/inbox/${conversationId}`},
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

// PUT /api/inbox/[id] - Update conversation/contact settings
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
    const { is_muted, is_archived, is_pinned, notes, tags, is_favorite } = body;

    // Get conversation and other user
    const [conversation] = await sql`
      SELECT
        c.*,
        CASE
          WHEN c.participant_1_id = ${user.id} THEN c.participant_2_id
          ELSE c.participant_1_id
        END as other_user_id
      FROM conversations c
      WHERE c.id = ${conversationId}
        AND (c.participant_1_id = ${user.id} OR c.participant_2_id = ${user.id})
    `;

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Update conversation participant settings
    if (typeof is_muted === 'boolean' || typeof is_archived === 'boolean' || typeof is_pinned === 'boolean') {
      await sql`
        UPDATE conversation_participants
        SET
          is_muted = COALESCE(${typeof is_muted === 'boolean' ? is_muted : null}, is_muted),
          is_archived = COALESCE(${typeof is_archived === 'boolean' ? is_archived : null}, is_archived),
          is_pinned = COALESCE(${typeof is_pinned === 'boolean' ? is_pinned : null}, is_pinned)
        WHERE conversation_id = ${conversationId}
          AND user_id = ${user.id}
      `;
    }

    // Update contact notes/tags/favorite
    if (notes !== undefined || tags !== undefined || typeof is_favorite === 'boolean') {
      // Check if contact exists
      const [existingContact] = await sql`
        SELECT id FROM contacts
        WHERE user_id = ${user.id} AND contact_user_id = ${conversation.other_user_id}
      `;

      if (existingContact) {
        await sql`
          UPDATE contacts
          SET
            notes = COALESCE(${notes !== undefined ? notes : null}, notes),
            tags = COALESCE(${tags !== undefined ? tags : null}, tags),
            is_favorite = COALESCE(${typeof is_favorite === 'boolean' ? is_favorite : null}, is_favorite),
            updated_at = NOW()
          WHERE id = ${existingContact.id}
        `;
      } else {
        // Get other user info for contact name
        const [otherUser] = await sql`
          SELECT first_name, last_name FROM users WHERE id = ${conversation.other_user_id}
        `;
        // Create contact record
        await sql`
          INSERT INTO contacts (user_id, contact_user_id, name, source, notes, tags, is_favorite)
          VALUES (
            ${user.id},
            ${conversation.other_user_id},
            ${`${otherUser?.first_name || ''} ${otherUser?.last_name || ''}`.trim() || 'Unknown'},
            'direct',
            ${notes || null},
            ${tags || []},
            ${is_favorite || false}
          )
        `;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Updated successfully'
    });
  } catch (error) {
    console.error('Update inbox conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update' },
      { status: 500 }
    );
  }
}
