'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Search,
  QrCode,
  CheckCircle,
  XCircle,
  User,
  Loader2,
  AlertCircle,
  Users,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { EventAttendee } from '@/types/event';

interface CheckInStats {
  total_approved: number;
  checked_in: number;
  not_checked_in: number;
}

interface RecentCheckIn {
  id: string;
  full_name: string;
  photo_url: string | null;
  avatar_url: string | null;
  checked_in_at: string;
}

export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<RecentCheckIn[]>([]);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    attendee?: EventAttendee;
  } | null>(null);

  useEffect(() => {
    fetchStats();
  }, [eventId]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/check-in`);
      const data = await res.json();

      if (data.success) {
        setStats(data.data.stats);
        setRecentCheckins(data.data.recentCheckins);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const handleCheckIn = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/events/${eventId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_code: searchQuery.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: 'ورود با موفقیت ثبت شد',
          attendee: data.attendee,
        });
        setSearchQuery('');
        fetchStats();
      } else {
        setResult({
          success: false,
          message: data.error || 'خطا در ثبت ورود',
          attendee: data.attendee,
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: 'خطا در اتصال به سرور',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/events/${eventId}`}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">ثبت ورود</h1>
          <p className="text-sm text-muted-foreground">
            کد بلیت را وارد کنید یا QR Code را اسکن کنید
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total_approved}</p>
              <p className="text-xs text-muted-foreground">تایید شده</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{stats.checked_in}</p>
              <p className="text-xs text-muted-foreground">ورود کرده</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold">{stats.not_checked_in}</p>
              <p className="text-xs text-muted-foreground">در انتظار</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Check-in Input */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-primary" />
            </div>

            <div className="w-full space-y-4">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="کد بلیت را وارد کنید..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckIn()}
                  className="w-full pr-12 pl-4 py-4 text-center text-lg font-mono border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  dir="ltr"
                />
              </div>

              <Button
                onClick={handleCheckIn}
                disabled={loading || !searchQuery.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 ml-2" />
                    ثبت ورود
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className={cn(
          'border-2',
          result.success ? 'border-green-500' : 'border-red-500'
        )}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center',
                result.success ? 'bg-green-100' : 'bg-red-100'
              )}>
                {result.success ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>

              <div className="flex-1">
                <p className={cn(
                  'font-semibold text-lg',
                  result.success ? 'text-green-600' : 'text-red-600'
                )}>
                  {result.message}
                </p>
                {result.attendee && (
                  <div className="mt-2">
                    <p className="font-medium">{result.attendee.full_name}</p>
                    {result.attendee.company && (
                      <p className="text-sm text-muted-foreground">
                        {result.attendee.company}
                        {result.attendee.job_title && ` - ${result.attendee.job_title}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Check-ins */}
      {recentCheckins.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">ورودهای اخیر</h3>
            <div className="space-y-3">
              {recentCheckins.map((checkin) => (
                <div key={checkin.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {checkin.photo_url || checkin.avatar_url ? (
                      <img
                        src={checkin.photo_url || checkin.avatar_url || ''}
                        alt={checkin.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{checkin.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(checkin.checked_in_at).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Check-in Link */}
      <div className="text-center">
        <Link
          href={`/dashboard/events/${eventId}/attendees`}
          className="text-sm text-primary hover:underline"
        >
          ثبت ورود دستی از لیست شرکت‌کنندگان
        </Link>
      </div>
    </div>
  );
}
