'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, UserPlus, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EventRegistrationProps {
  eventId: string;
  eventSlug: string;
  isFull: boolean;
  allowWaitlist: boolean;
  isRegistrationClosed: boolean;
  isPast: boolean;
  isFree: boolean;
}

export function EventRegistration({
  eventId,
  eventSlug,
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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
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
        }
      } catch (err) {
        // User not logged in or not registered
      } finally {
        setCheckingStatus(false);
      }
    };

    checkRegistration();
  }, [eventId]);

  const handleRegister = async () => {
    // If not showing form, show it first for guest users
    if (!showForm) {
      // Try to register directly for logged-in users
      setLoading(true);
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
          router.refresh();
        } else if (res.status === 401) {
          // User not logged in, show form
          setShowForm(true);
        } else {
          setError(data.error || 'خطا در ثبت‌نام');
        }
      } catch (err) {
        setError('خطا در اتصال به سرور');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Submit form for guest registration
    if (!formData.full_name || !formData.email) {
      setError('نام و ایمیل الزامی است');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setIsRegistered(true);
        setRegistrationStatus(data.data.status);
        setShowForm(false);
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
        <p className="text-xs text-center text-muted-foreground">
          جزئیات ثبت‌نام به ایمیل شما ارسال شده است
        </p>
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

  // Show registration form for guests
  if (showForm) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="نام و نام خانوادگی *"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="ایمیل *"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir="ltr"
            />
          </div>
          <div>
            <input
              type="tel"
              placeholder="شماره تماس"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="شرکت"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="text"
              placeholder="سمت"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            onClick={() => setShowForm(false)}
            className="flex-1"
          >
            انصراف
          </Button>
          <Button onClick={handleRegister} disabled={loading} className="flex-1">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFull && allowWaitlist ? (
              'ثبت در لیست انتظار'
            ) : (
              'ثبت‌نام'
            )}
          </Button>
        </div>

        <div className="text-center pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            برای ذخیره اطلاعات و دسترسی آسان‌تر
          </p>
          <a
            href={`/auth/signup?redirect=/e/${eventSlug}`}
            className="text-sm text-primary hover:underline"
          >
            حساب کاربری بسازید
          </a>
        </div>
      </div>
    );
  }

  // Show register button
  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <Button onClick={handleRegister} disabled={loading} className="w-full" size="lg">
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
