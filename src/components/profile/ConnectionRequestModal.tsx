'use client';

import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';

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

interface ConnectionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  ownerId: string;
  onSuccess: () => void;
}

export function ConnectionRequestModal({
  isOpen,
  onClose,
  profile,
  ownerId,
  onSuccess,
}: ConnectionRequestModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressee_id: ownerId,
          message: message || null,
          profile_id: profile.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'خطا در ارسال درخواست');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">درخواست ارتباط</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Profile Preview */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
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
              <h4 className="font-medium">{profile.full_name || 'کاربر'}</h4>
              {profile.headline && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {profile.headline}
                </p>
              )}
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              پیام شما (اختیاری)
            </label>
            <textarea
              placeholder="دلیل درخواست ارتباط خود را بنویسید..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              یک پیام شخصی شانس پذیرش درخواست شما را افزایش می‌دهد.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border hover:bg-muted transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                ارسال درخواست
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
