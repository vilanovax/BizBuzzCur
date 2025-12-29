'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageCircle,
  UserPlus,
  Bookmark,
  Calendar,
  Download,
  ExternalLink,
  Check,
  Clock,
  Loader2,
} from 'lucide-react';
import { ChatModal } from './ChatModal';
import { ConnectionRequestModal } from './ConnectionRequestModal';

interface ProfileData {
  id: string;
  slug: string;
  title: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  theme_color: string | null;
  cta_type: string;
  cta_url: string | null;
  user_id: string;
}

interface ProfileActionsProps {
  profile: ProfileData;
  ownerId: string;
}

type ConnectionStatus = {
  isLoggedIn: boolean;
  isConnected: boolean;
  connectionRequest: {
    id: string;
    status: string;
    isRequester: boolean;
    created_at: string;
  } | null;
};

export function ProfileActions({ profile, ownerId }: ProfileActionsProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Check connection status
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (authLoading) return;

      try {
        const res = await fetch(`/api/connections/${ownerId}`);
        const data = await res.json();
        if (data.success) {
          setConnectionStatus(data.data);
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkConnectionStatus();
  }, [ownerId, authLoading]);

  // Check if user is viewing their own profile
  const isOwnProfile = user?.id === ownerId;

  // Determine visitor type
  const getVisitorType = (): 'guest' | 'logged_in' | 'connected' => {
    if (!isAuthenticated) return 'guest';
    if (connectionStatus?.isConnected) return 'connected';
    return 'logged_in';
  };

  const visitorType = getVisitorType();

  // Handle send message
  const handleSendMessage = () => {
    if (!isAuthenticated) {
      // For guests, show chat modal with limited functionality
      setShowChat(true);
      return;
    }
    setShowChat(true);
  };

  // Handle connection request
  const handleConnect = () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = `/login?redirect=/${profile.slug}`;
      return;
    }
    setShowConnectionModal(true);
  };

  // Handle bookmark
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/${profile.slug}`;
      return;
    }

    setActionLoading(true);
    try {
      // Toggle bookmark (save as contact without full connection)
      const res = await fetch('/api/contacts/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile.id,
          user_id: ownerId,
        }),
      });

      if (res.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle accept connection
  const handleAcceptConnection = async () => {
    if (!connectionStatus?.connectionRequest) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/connections/${connectionStatus.connectionRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (res.ok) {
        setConnectionStatus({
          ...connectionStatus,
          isConnected: true,
          connectionRequest: null,
        });
      }
    } catch (error) {
      console.error('Accept connection error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // CTA button config
  const ctaConfig: Record<string, { label: string; icon: typeof MessageCircle } | null> = {
    connect: { label: 'درخواست ارتباط', icon: UserPlus },
    message: { label: 'ارسال پیام', icon: MessageCircle },
    book_meeting: { label: 'رزرو جلسه', icon: Calendar },
    download_cv: { label: 'دانلود رزومه', icon: Download },
    visit_website: { label: 'مشاهده سایت', icon: ExternalLink },
    none: null,
  };

  const cta = ctaConfig[profile.cta_type];

  // Don't show actions on own profile
  if (isOwnProfile) {
    return (
      <div className="px-6 py-4 border-t">
        <p className="text-center text-sm text-muted-foreground">
          این پروفایل شماست
        </p>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="px-6 py-6 border-t">
        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-6 border-t space-y-3">
        {/* Primary CTA - Send Message */}
        <button
          onClick={handleSendMessage}
          className="w-full py-4 rounded-xl font-medium text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
          style={{ backgroundColor: profile.theme_color || '#2563eb' }}
        >
          <MessageCircle className="w-5 h-5" />
          ارسال پیام
        </button>

        {/* Secondary Actions */}
        <div className="flex gap-3">
          {/* Connection Status */}
          {connectionStatus?.isConnected ? (
            <button
              disabled
              className="flex-1 py-3 rounded-xl font-medium bg-green-100 text-green-700 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              متصل
            </button>
          ) : connectionStatus?.connectionRequest?.status === 'pending' ? (
            connectionStatus.connectionRequest.isRequester ? (
              <button
                disabled
                className="flex-1 py-3 rounded-xl font-medium bg-amber-100 text-amber-700 flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                در انتظار تأیید
              </button>
            ) : (
              <button
                onClick={handleAcceptConnection}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl font-medium bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:bg-primary/90"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    پذیرش ارتباط
                  </>
                )}
              </button>
            )
          ) : (
            <button
              onClick={handleConnect}
              className="flex-1 py-3 rounded-xl font-medium border-2 border-primary text-primary hover:bg-primary/5 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              درخواست ارتباط
            </button>
          )}

          {/* Bookmark (only for logged in users) */}
          {isAuthenticated && (
            <button
              onClick={handleBookmark}
              disabled={actionLoading}
              className={`px-4 py-3 rounded-xl border-2 transition-colors ${
                bookmarked
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'border-muted hover:bg-muted'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Custom CTA (if different from message) */}
        {cta && profile.cta_type !== 'message' && profile.cta_type !== 'connect' && (
          <a
            href={profile.cta_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl font-medium border border-muted hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <cta.icon className="w-4 h-4" />
            {cta.label}
          </a>
        )}

        {/* Visitor Type Indicator (for debugging, can be removed) */}
        {/* <p className="text-xs text-center text-muted-foreground">
          نوع بازدیدکننده: {visitorType}
        </p> */}
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        profile={profile}
        ownerId={ownerId}
        isGuest={!isAuthenticated}
      />

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        profile={profile}
        ownerId={ownerId}
        onSuccess={() => {
          setConnectionStatus({
            ...connectionStatus!,
            connectionRequest: {
              id: '',
              status: 'pending',
              isRequester: true,
              created_at: new Date().toISOString(),
            },
          });
        }}
      />
    </>
  );
}
