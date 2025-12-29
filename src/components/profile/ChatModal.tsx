'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, UserPlus } from 'lucide-react';

interface ProfileData {
  id: string;
  slug: string;
  title: string;
  full_name: string | null;
  headline: string | null;
  photo_url: string | null;
  theme_color: string | null;
  user_id: string;
}

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  is_mine: boolean;
  created_at: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  ownerId: string;
  isGuest: boolean;
}

export function ChatModal({ isOpen, onClose, profile, ownerId, isGuest }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '' });
  const [showGuestForm, setShowGuestForm] = useState(isGuest);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load or create conversation
  useEffect(() => {
    if (!isOpen || isGuest) return;

    const initConversation = async () => {
      setLoading(true);
      try {
        // Create or get existing conversation
        const res = await fetch('/api/messages/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participant_id: ownerId,
            context_type: 'profile_share',
            context_id: profile.id,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setConversationId(data.data.id);

          // Load messages
          const messagesRes = await fetch(`/api/messages/conversations/${data.data.id}`);
          const messagesData = await messagesRes.json();
          if (messagesData.success) {
            setMessages(messagesData.data.messages);
          }
        }
      } catch (error) {
        console.error('Error initializing conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    initConversation();
  }, [isOpen, isGuest, ownerId, profile.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    if (isGuest) {
      // For guests, redirect to signup with message context
      const message = encodeURIComponent(newMessage);
      window.location.href = `/auth/signup?redirect=/p/${profile.slug}&message=${message}`;
      return;
    }

    if (!conversationId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle guest form submit
  const handleGuestSubmit = () => {
    if (!guestInfo.name || !guestInfo.email) return;

    // Store guest info in localStorage
    localStorage.setItem('bizbuzz_guest_info', JSON.stringify(guestInfo));
    setShowGuestForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: profile.theme_color || '#2563eb' }}
            >
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.full_name || ''}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                profile.full_name?.charAt(0) || 'U'
              )}
            </div>
            <div>
              <h3 className="font-semibold">{profile.full_name || 'کاربر'}</h3>
              {profile.headline && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {profile.headline}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Form */}
        {isGuest && showGuestForm && (
          <div className="p-4 bg-muted/50 border-b">
            <p className="text-sm text-muted-foreground mb-3">
              برای ارسال پیام، لطفاً اطلاعات خود را وارد کنید:
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="نام شما"
                value={guestInfo.name}
                onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="email"
                placeholder="ایمیل شما"
                value={guestInfo.email}
                onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
              <button
                onClick={handleGuestSubmit}
                disabled={!guestInfo.name || !guestInfo.email}
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50"
              >
                ادامه
              </button>
            </div>
            <div className="mt-3 pt-3 border-t text-center">
              <a
                href={`/auth/signup?redirect=/p/${profile.slug}`}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                یا یک حساب BizBuzz بسازید
              </a>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                اولین پیام خود را ارسال کنید
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_mine ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    message.is_mine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.is_mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(message.created_at).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={isGuest ? 'پیام خود را بنویسید...' : 'پیام...'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-4 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={(isGuest && showGuestForm) || sending}
            />
            <button
              onClick={handleSend}
              disabled={(isGuest && showGuestForm) || !newMessage.trim() || sending}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 flex items-center justify-center"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {isGuest && !showGuestForm && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              برای ذخیره گفتگو،{' '}
              <a href={`/auth/signup?redirect=/p/${profile.slug}`} className="text-primary hover:underline">
                حساب بسازید
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
