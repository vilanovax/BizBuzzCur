'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Loader2,
  UserPlus,
  AlertCircle,
  Clock,
  User,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { EventType } from '@/types/event';

interface EventRegistrationProps {
  eventId: string;
  eventSlug: string;
  eventType: EventType;
  isFull: boolean;
  allowWaitlist: boolean;
  isRegistrationClosed: boolean;
  isPast: boolean;
  isFree: boolean;
}

type RegistrationMode = 'initial' | 'guest_form' | 'login_prompt';

export function EventRegistration({
  eventId,
  eventSlug,
  eventType,
  isFull,
  allowWaitlist,
  isRegistrationClosed,
  isPast,
  isFree,
}: EventRegistrationProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [mode, setMode] = useState<RegistrationMode>('initial');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    company: '',
    job_title: '',
  });

  // Check if user is already registered
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/registration-status`);
        const data = await res.json();

        if (data.success && data.data) {
          setIsRegistered(true);
          setRegistrationStatus(data.data.status);
          setIsGuest(data.data.is_guest || false);
        }
      } catch (err) {
        // User not logged in or not registered
      } finally {
        setCheckingStatus(false);
      }
    };

    checkRegistration();
  }, [eventId]);

  // Try to register as logged-in user
  const handleRegisterAsUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (data.success) {
        setIsRegistered(true);
        setRegistrationStatus(data.data.status);
        setIsGuest(false);
        router.refresh();
      } else if (res.status === 401) {
        // User not logged in, show options
        setMode('login_prompt');
      } else {
        setError(data.error || 'خطا در ثبت‌نام');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  // Submit guest registration
  const handleGuestRegister = async () => {
    if (!formData.full_name.trim()) {
      setError('نام الزامی است');
      return;
    }

    if (!formData.phone.trim() && !formData.email.trim()) {
      setError('موبایل یا ایمیل الزامی است');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          is_guest: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsRegistered(true);
        setRegistrationStatus(data.data.status);
        setIsGuest(true);
        setMode('initial');
        router.refresh();
      } else {
        setError(data.error || 'خطا در ثبت‌نام');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (checkingStatus) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show registered state
  if (isRegistered) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">
            {registrationStatus === 'approved'
              ? 'ثبت‌نام شما تایید شده'
              : registrationStatus === 'pending'
              ? 'ثبت‌نام شما در انتظار تایید'
              : registrationStatus === 'waitlist'
              ? 'در لیست انتظار هستید'
              : 'ثبت‌نام شده'}
          </span>
        </div>

        {isGuest && (
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              برای حفظ ارتباط‌ها و ادامه گفتگو
            </p>
            <a
              href={`/signup?redirect=/e/${eventSlug}`}
              className="text-sm text-primary hover:underline font-medium"
            >
              یک حساب رایگان بسازید
            </a>
          </div>
        )}

        {!isGuest && (
          <p className="text-xs text-center text-muted-foreground">
            جزئیات ثبت‌نام به ایمیل شما ارسال شده است
          </p>
        )}
      </div>
    );
  }

  // Show disabled states
  if (isPast) {
    return (
      <Button disabled className="w-full">
        ایونت برگزار شده
      </Button>
    );
  }

  if (isRegistrationClosed) {
    return (
      <Button disabled className="w-full">
        <Clock className="w-4 h-4 ml-2" />
        ثبت‌نام بسته شده
      </Button>
    );
  }

  if (isFull && !allowWaitlist) {
    return (
      <Button disabled className="w-full">
        ظرفیت تکمیل
      </Button>
    );
  }

  // Show login prompt (when user clicks register but is not logged in)
  if (mode === 'login_prompt') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-center text-muted-foreground">
          برای ثبت‌نام، وارد حساب کاربری شوید یا به عنوان مهمان ادامه دهید
        </p>

        <div className="space-y-2">
          <a href={`/login?redirect=/e/${eventSlug}`}>
            <Button className="w-full" variant="default">
              <LogIn className="w-4 h-4 ml-2" />
              ورود به حساب کاربری
            </Button>
          </a>

          <Button
            onClick={() => setMode('guest_form')}
            variant="outline"
            className="w-full"
          >
            <User className="w-4 h-4 ml-2" />
            ادامه به‌عنوان مهمان
          </Button>
        </div>

        <div className="text-center pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">حساب کاربری ندارید؟</p>
          <a
            href={`/signup?redirect=/e/${eventSlug}`}
            className="text-sm text-primary hover:underline"
          >
            ساخت حساب رایگان
          </a>
        </div>

        <button
          onClick={() => setMode('initial')}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          بازگشت
        </button>
      </div>
    );
  }

  // Show guest registration form
  if (mode === 'guest_form') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <User className="w-4 h-4" />
          <span>ورود به‌عنوان مهمان</span>
        </div>

        <div className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="نام *"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <input
              type="tel"
              placeholder="شماره موبایل *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground mt-1">یا</p>
          </div>
          <div>
            <input
              type="email"
              placeholder="ایمیل"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir="ltr"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setMode('initial');
              setError(null);
            }}
            className="flex-1"
          >
            انصراف
          </Button>
          <Button onClick={handleGuestRegister} disabled={loading} className="flex-1">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFull && allowWaitlist ? (
              'ثبت در لیست انتظار'
            ) : (
              'ورود به ایونت'
            )}
          </Button>
        </div>

        <div className="text-center pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            با ساخت حساب، دسترسی کامل‌تری خواهید داشت
          </p>
          <a
            href={`/signup?redirect=/e/${eventSlug}`}
            className="text-sm text-primary hover:underline"
          >
            ساخت حساب رایگان
          </a>
        </div>
      </div>
    );
  }

  // Show initial register button
  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <Button onClick={handleRegisterAsUser} disabled={loading} className="w-full" size="lg">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isFull && allowWaitlist ? (
          <>
            <Clock className="w-5 h-5 ml-2" />
            ثبت در لیست انتظار
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5 ml-2" />
            {isFree ? 'ثبت‌نام رایگان' : 'ثبت‌نام و پرداخت'}
          </>
        )}
      </Button>
    </div>
  );
}
