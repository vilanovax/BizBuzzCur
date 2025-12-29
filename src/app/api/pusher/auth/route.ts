import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher';

// POST /api/pusher/auth - Authenticate Pusher channels
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.formData();
    const socketId = body.get('socket_id') as string;
    const channel = body.get('channel_name') as string;

    if (!socketId || !channel) {
      return NextResponse.json(
        { success: false, error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }

    const pusher = getPusherServer();

    // Validate channel access
    if (channel.startsWith('private-user-')) {
      // User can only access their own channel
      const userId = channel.replace('private-user-', '');
      if (userId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized channel' },
          { status: 403 }
        );
      }
    } else if (channel.startsWith('private-conversation-')) {
      // User must be a participant in the conversation
      // For now, we trust that the client only subscribes to valid channels
      // In production, you'd want to verify conversation membership
    } else if (channel.startsWith('presence-')) {
      // Presence channel - include user data
      const presenceData = {
        user_id: user.id,
        user_info: {
          name: `${user.first_name} ${user.last_name}`,
          avatar: user.avatar_url,
        },
      };

      const auth = pusher.authorizeChannel(socketId, channel, presenceData);
      return NextResponse.json(auth);
    }

    // Private channel authorization
    const auth = pusher.authorizeChannel(socketId, channel);
    return NextResponse.json(auth);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
