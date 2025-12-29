import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/messages/conversations - Get user's conversations
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
    const filter = searchParams.get('filter') || 'all'; // all, unread, archived

    let filterCondition = '';
    if (filter === 'unread') {
      filterCondition = 'AND cp.unread_count > 0';
    } else if (filter === 'archived') {
      filterCondition = 'AND cp.is_archived = true';
    } else {
      filterCondition = 'AND cp.is_archived = false';
    }

    const conversations = await sql`
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
        u.avatar_url as other_avatar
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = ${user.id}
      JOIN users u ON u.id = CASE
        WHEN c.participant_1_id = ${user.id} THEN c.participant_2_id
        ELSE c.participant_1_id
      END
      WHERE (c.participant_1_id = ${user.id} OR c.participant_2_id = ${user.id})
      ORDER BY cp.is_pinned DESC, c.last_message_at DESC NULLS LAST
    `;

    return NextResponse.json({
      success: true,
      data: conversations.map(c => ({
        id: c.id,
        context_type: c.context_type,
        context_id: c.context_id,
        last_message_at: c.last_message_at,
        last_message_preview: c.last_message_preview,
        unread_count: c.unread_count,
        is_muted: c.is_muted,
        is_archived: c.is_archived,
        is_pinned: c.is_pinned,
        created_at: c.created_at,
        other_participant: {
          id: c.other_user_id,
          first_name: c.other_first_name,
          last_name: c.other_last_name,
          avatar_url: c.other_avatar,
        }
      }))
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get conversations' },
      { status: 500 }
    );
  }
}

// POST /api/messages/conversations - Create or get existing conversation
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
    const { participant_id, context_type, context_id } = body;

    if (!participant_id) {
      return NextResponse.json(
        { success: false, error: 'participant_id is required' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const [existing] = await sql`
      SELECT * FROM conversations
      WHERE (participant_1_id = ${user.id} AND participant_2_id = ${participant_id})
         OR (participant_1_id = ${participant_id} AND participant_2_id = ${user.id})
    `;

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        isNew: false
      });
    }

    // Ensure participant_1_id < participant_2_id for consistency
    const [p1, p2] = user.id < participant_id
      ? [user.id, participant_id]
      : [participant_id, user.id];

    // Create new conversation
    const [conversation] = await sql`
      INSERT INTO conversations (participant_1_id, participant_2_id, context_type, context_id)
      VALUES (${p1}, ${p2}, ${context_type || null}, ${context_id || null})
      RETURNING *
    `;

    // Create participant records
    await sql`
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES
        (${conversation.id}, ${user.id}),
        (${conversation.id}, ${participant_id})
    `;

    return NextResponse.json({
      success: true,
      data: conversation,
      isNew: true
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
