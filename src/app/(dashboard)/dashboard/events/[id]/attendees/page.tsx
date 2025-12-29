'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Search,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Mail,
  Phone,
  Building,
  Download,
  QrCode,
  UserCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { EventAttendee, AttendeeStatus } from '@/types/event';

interface AttendeeWithUser extends EventAttendee {
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

const STATUS_CONFIG: Record<AttendeeStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: { label: 'در انتظار', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: <Clock className="w-4 h-4" /> },
  approved: { label: 'تایید شده', color: 'text-green-600', bgColor: 'bg-green-100', icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: 'رد شده', color: 'text-red-600', bgColor: 'bg-red-100', icon: <XCircle className="w-4 h-4" /> },
  cancelled: { label: 'لغو شده', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <XCircle className="w-4 h-4" /> },
  waitlist: { label: 'لیست انتظار', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: <Clock className="w-4 h-4" /> },
};

export default function EventAttendeesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [attendees, setAttendees] = useState<AttendeeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<AttendeeStatus | 'all'>('all');
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendees();
  }, [eventId]);

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventId}/attendees`);
      const data = await res.json();

      if (data.success) {
        setAttendees(data.data);
      } else {
        setError(data.error || 'خطا در دریافت اطلاعات');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const updateAttendeeStatus = async (attendeeId: string, status: AttendeeStatus) => {
    setActionLoading(attendeeId);
    try {
      const res = await fetch(`/api/events/${eventId}/attendees/${attendeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        setAttendees(attendees.map(a =>
          a.id === attendeeId ? { ...a, status } : a
        ));
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const checkInAttendee = async (attendeeId: string) => {
    setActionLoading(attendeeId);
    try {
      const res = await fetch(`/api/events/${eventId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendee_id: attendeeId }),
      });

      const data = await res.json();
      if (data.success) {
        setAttendees(attendees.map(a =>
          a.id === attendeeId ? { ...a, checked_in: true, checked_in_at: new Date().toISOString() } : a
        ));
      }
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAttendees = attendees.filter(a => {
    const matchesSearch = !searchQuery ||
      a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: attendees.length,
    approved: attendees.filter(a => a.status === 'approved').length,
    pending: attendees.filter(a => a.status === 'pending').length,
    checkedIn: attendees.filter(a => a.checked_in).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/events/${eventId}`}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">مدیریت شرکت‌کنندگان</h1>
          <p className="text-sm text-muted-foreground">
            مشاهده و مدیریت ثبت‌نام‌ها
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 ml-2" />
          خروجی اکسل
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">کل ثبت‌نام</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">تایید شده</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">در انتظار</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.checkedIn}</p>
            <p className="text-xs text-muted-foreground">ورود کرده</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="جستجوی نام، ایمیل، شرکت..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'pending', 'approved', 'waitlist', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors',
                filterStatus === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {status === 'all' ? 'همه' : STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchAttendees} className="mt-4">
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      ) : filteredAttendees.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {attendees.length === 0 ? 'هنوز کسی ثبت‌نام نکرده' : 'نتیجه‌ای یافت نشد'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredAttendees.map((attendee) => {
            const statusConfig = STATUS_CONFIG[attendee.status];
            return (
              <Card key={attendee.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {attendee.photo_url || attendee.user?.avatar_url ? (
                        <img
                          src={attendee.photo_url || attendee.user?.avatar_url || ''}
                          alt={attendee.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-muted-foreground">
                          {attendee.full_name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{attendee.full_name}</h3>
                        <span className={cn('px-2 py-0.5 rounded text-xs flex items-center gap-1', statusConfig.bgColor, statusConfig.color)}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        {attendee.checked_in && (
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-600 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            ورود
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                        {attendee.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {attendee.email}
                          </span>
                        )}
                        {attendee.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {attendee.phone}
                          </span>
                        )}
                        {attendee.company && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {attendee.company}
                            {attendee.job_title && ` - ${attendee.job_title}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {attendee.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateAttendeeStatus(attendee.id, 'approved')}
                            disabled={actionLoading === attendee.id}
                          >
                            {actionLoading === attendee.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 ml-1" />
                                تایید
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAttendeeStatus(attendee.id, 'rejected')}
                            disabled={actionLoading === attendee.id}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {attendee.status === 'approved' && !attendee.checked_in && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => checkInAttendee(attendee.id)}
                          disabled={actionLoading === attendee.id}
                        >
                          {actionLoading === attendee.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <QrCode className="w-4 h-4 ml-1" />
                              ثبت ورود
                            </>
                          )}
                        </Button>
                      )}

                      {attendee.ticket_code && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {attendee.ticket_code}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
