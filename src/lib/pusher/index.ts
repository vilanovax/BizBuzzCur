import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
let pusherServer: Pusher | null = null;

export const getPusherServer = (): Pusher => {
  if (!pusherServer) {
    if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
      throw new Error('Pusher server configuration is missing');
    }

    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER || 'eu',
      useTLS: true,
    });
  }

  return pusherServer;
};

// Client-side Pusher instance
let pusherClient: PusherClient | null = null;

export const getPusherClient = (): PusherClient => {
  if (!pusherClient) {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
      throw new Error('Pusher client configuration is missing');
    }

    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
    });
  }

  return pusherClient;
};

// Channel naming conventions
export const getChannelNames = {
  // Private user channel for notifications and presence
  user: (userId: string) => `private-user-${userId}`,

  // Conversation channel for real-time messages
  conversation: (conversationId: string) => `private-conversation-${conversationId}`,

  // Presence channel for online status
  presence: (userId: string) => `presence-user-${userId}`,
};

// Event names
export const PUSHER_EVENTS = {
  // Message events
  NEW_MESSAGE: 'new-message',
  MESSAGE_READ: 'message-read',
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',

  // Connection events
  CONNECTION_REQUEST: 'connection-request',
  CONNECTION_ACCEPTED: 'connection-accepted',

  // Notification events
  NEW_NOTIFICATION: 'new-notification',
  NOTIFICATION_READ: 'notification-read',

  // Profile events
  PROFILE_VIEWED: 'profile-viewed',
};

// Helper to trigger events
export const triggerEvent = async (
  channel: string,
  event: string,
  data: Record<string, unknown>
) => {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error('Pusher trigger error:', error);
  }
};
