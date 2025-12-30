'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, StickyNote, Tag, UserPlus } from 'lucide-react';
import { ConversationHeader } from '@/components/inbox/ConversationHeader';
import { MessageBubble } from '@/components/inbox/MessageBubble';
import { MessageInput } from '@/components/inbox/MessageInput';
import { NotesPanel } from '@/components/inbox/NotesPanel';
import { TagsPanel } from '@/components/inbox/TagsPanel';
import { Button } from '@/components/ui/Button';

interface Message {
  id: string;
  content: string;
  message_type: string;
  attachments: Array<{ type: string; url: string; name: string; size?: number }>;
  is_read: boolean;
  created_at: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  is_mine: boolean;
}

interface ConversationData {
  id: string;
  context_type: string | null;
  context_id: string | null;
  context_name: string | null;
  context_slug: string | null;
  created_at: string;
  is_muted: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  is_favorite: boolean;
  other_participant: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    email: string | null;
  };
  relationship: {
    status: string;
    connection_id: string | null;
  };
  contact: {
    id: string | null;
    notes: string | null;
    tags: string[];
  };
  messages: Message[];
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showTagsPanel, setShowTagsPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const res = await fetch(`/api/inbox/${conversationId}`);
        const data = await res.json();

        if (data.success) {
          setConversation(data.data);
        } else {
          router.push('/dashboard/inbox');
        }
      } catch (error) {
        console.error('Failed to fetch conversation:', error);
        router.push('/dashboard/inbox');
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId, router]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // Send message
  const handleSendMessage = async (
    content: string,
    attachments?: Array<{ type: string; url: string; name: string; size?: number }>
  ) => {
    if (!conversation) return;

    setSending(true);
    try {
      const res = await fetch(`/api/inbox/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          attachments: attachments || [],
        }),
      });

      const data = await res.json();

      if (data.success) {
        setConversation({
          ...conversation,
          messages: [...conversation.messages, data.data],
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  // Toggle actions
  const handleToggleMute = async () => {
    if (!conversation) return;

    try {
      await fetch(`/api/inbox/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_muted: !conversation.is_muted }),
      });

      setConversation({ ...conversation, is_muted: !conversation.is_muted });
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const handleTogglePin = async () => {
    if (!conversation) return;

    try {
      await fetch(`/api/inbox/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !conversation.is_pinned }),
      });

      setConversation({ ...conversation, is_pinned: !conversation.is_pinned });
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!conversation) return;

    try {
      await fetch(`/api/inbox/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !conversation.is_favorite }),
      });

      setConversation({ ...conversation, is_favorite: !conversation.is_favorite });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // Save notes
  const handleSaveNotes = async (notes: string) => {
    if (!conversation) return;

    await fetch(`/api/inbox/${conversationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });

    setConversation({
      ...conversation,
      contact: { ...conversation.contact, notes },
    });
  };

  // Save tags
  const handleSaveTags = async (tags: string[]) => {
    if (!conversation) return;

    await fetch(`/api/inbox/${conversationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });

    setConversation({
      ...conversation,
      contact: { ...conversation.contact, tags },
    });
  };

  // Request connection
  const handleRequestConnect = async () => {
    if (!conversation) return;

    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressee_id: conversation.other_participant.id,
          message: `درخواست ارتباط از طریق ${conversation.context_name || 'گفتگو'}`,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setConversation({
          ...conversation,
          relationship: {
            status: 'pending_sent',
            connection_id: data.data.id,
          },
        });
      }
    } catch (error) {
      console.error('Failed to request connection:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const isConnected = conversation.relationship.status === 'connected';
  const participantName = `${conversation.other_participant.first_name} ${conversation.other_participant.last_name}`;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <ConversationHeader
        conversation={conversation}
        onToggleMute={handleToggleMute}
        onTogglePin={handleTogglePin}
        onToggleFavorite={handleToggleFavorite}
        onRequestConnect={conversation.relationship.status === 'none' ? handleRequestConnect : undefined}
      />

      {/* Relationship actions bar (for connected users) */}
      {isConnected && (
        <div className="flex-shrink-0 px-4 py-2 border-b bg-accent/30">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNotesPanel(true)}
              className="text-muted-foreground"
            >
              <StickyNote className="w-4 h-4 ml-1" />
              {conversation.contact.notes ? 'ویرایش نوت' : 'افزودن نوت'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTagsPanel(true)}
              className="text-muted-foreground"
            >
              <Tag className="w-4 h-4 ml-1" />
              {conversation.contact.tags.length > 0
                ? `${conversation.contact.tags.length} برچسب`
                : 'افزودن برچسب'}
            </Button>
          </div>
        </div>
      )}

      {/* Notes preview */}
      {isConnected && conversation.contact.notes && (
        <div className="flex-shrink-0 px-4 py-2 border-b bg-yellow-50 dark:bg-yellow-900/10">
          <button
            onClick={() => setShowNotesPanel(true)}
            className="flex items-start gap-2 text-right w-full"
          >
            <StickyNote className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200 line-clamp-2">
              {conversation.contact.notes}
            </p>
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversation.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-2">هنوز پیامی ارسال نشده</p>
            <p className="text-sm text-muted-foreground">
              اولین پیام را بنویسید
            </p>
          </div>
        ) : (
          <>
            {conversation.messages.map((message, index) => {
              const prevMessage = conversation.messages[index - 1];
              const showAvatar =
                !prevMessage ||
                prevMessage.sender.id !== message.sender.id ||
                new Date(message.created_at).getTime() -
                  new Date(prevMessage.created_at).getTime() >
                  5 * 60 * 1000;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  showAvatar={showAvatar}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={sending}
        showAttachments={isConnected}
        placeholder={
          isConnected
            ? 'پیام خود را بنویسید...'
            : 'پیام خود را بنویسید... (بدون پیوست)'
        }
      />

      {/* Soft conversion prompt for non-connected */}
      {!isConnected && conversation.messages.length >= 2 && (
        <div className="flex-shrink-0 px-4 py-3 border-t bg-primary/5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              برای ذخیره این ارتباط، درخواست اتصال ارسال کنید
            </p>
            <Button size="sm" onClick={handleRequestConnect}>
              <UserPlus className="w-4 h-4 ml-1" />
              درخواست ارتباط
            </Button>
          </div>
        </div>
      )}

      {/* Notes Panel */}
      <NotesPanel
        isOpen={showNotesPanel}
        onClose={() => setShowNotesPanel(false)}
        initialNotes={conversation.contact.notes}
        onSave={handleSaveNotes}
        participantName={participantName}
      />

      {/* Tags Panel */}
      <TagsPanel
        isOpen={showTagsPanel}
        onClose={() => setShowTagsPanel(false)}
        initialTags={conversation.contact.tags}
        onSave={handleSaveTags}
        participantName={participantName}
      />
    </div>
  );
}
