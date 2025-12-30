'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Briefcase,
  MapPin,
  Clock,
  Users,
  Edit,
  Eye,
  Share2,
  Check,
  Power,
  MoreVertical,
  Loader2,
  Calendar,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { JobAdWithDetails, JobStatus } from '@/types/job';
import {
  EMPLOYMENT_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  JOB_STATUS_LABELS,
} from '@/types/job';

const STATUS_COLORS: Record<JobStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-700',
  filled: 'bg-blue-100 text-blue-700',
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobAdWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();

      if (data.success) {
        setJob(data.data);
        setIsAdmin(data.is_admin || false);
      } else {
        setError(data.error || 'خطا در دریافت اطلاعات آگهی');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!job) return;
    const url = `${window.location.origin}/jobs/${job.id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setMenuOpen(false);
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setJob((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
    } catch (err) {
      console.error('Status change error:', err);
    }
    setMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive">{error || 'آگهی یافت نشد'}</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="w-5 h-5" />
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            {job.company?.logo_url ? (
              <img
                src={job.company.logo_url}
                alt={job.company.name}
                className="w-14 h-14 rounded-xl object-cover border"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-primary" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <Link
                href={`/dashboard/companies/${job.company_id}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {job.company?.name}
              </Link>
            </div>

            {/* Status Badge */}
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                STATUS_COLORS[job.status]
              )}
            >
              {JOB_STATUS_LABELS[job.status]}
            </span>
          </div>
        </div>

        {/* Actions */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/jobs/${job.id}/applications`}>
                <Users className="w-4 h-4 ml-2" />
                درخواست‌ها ({job.application_count || 0})
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/jobs/${job.id}/edit`}>
                <Edit className="w-4 h-4 ml-2" />
                ویرایش
              </Link>
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>

              {menuOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 min-w-48 bg-background border rounded-xl shadow-lg py-1">
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Share2 className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>{copied ? 'کپی شد!' : 'اشتراک‌گذاری'}</span>
                  </button>

                  <div className="h-px bg-border my-1" />

                  {job.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange('published')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    >
                      <Power className="w-4 h-4 text-green-500" />
                      <span>انتشار</span>
                    </button>
                  )}

                  {job.status === 'published' && (
                    <button
                      onClick={() => handleStatusChange('paused')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    >
                      <Power className="w-4 h-4 text-yellow-500" />
                      <span>توقف موقت</span>
                    </button>
                  )}

                  {job.status === 'paused' && (
                    <button
                      onClick={() => handleStatusChange('published')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    >
                      <Power className="w-4 h-4 text-green-500" />
                      <span>فعال‌سازی مجدد</span>
                    </button>
                  )}

                  {(job.status === 'published' || job.status === 'paused') && (
                    <>
                      <button
                        onClick={() => handleStatusChange('filled')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      >
                        <Check className="w-4 h-4 text-blue-500" />
                        <span>پر شده (استخدام شد)</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange('closed')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      >
                        <Power className="w-4 h-4 text-red-500" />
                        <span>بستن آگهی</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {job.employment_type && (
                  <span className="px-3 py-1 bg-muted rounded-full text-sm">
                    <Clock className="w-3.5 h-3.5 inline ml-1" />
                    {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
                  </span>
                )}
                {job.location_type && (
                  <span className="px-3 py-1 bg-muted rounded-full text-sm">
                    <MapPin className="w-3.5 h-3.5 inline ml-1" />
                    {LOCATION_TYPE_LABELS[job.location_type]}
                  </span>
                )}
                {job.experience_level && (
                  <span className="px-3 py-1 bg-muted rounded-full text-sm">
                    <Users className="w-3.5 h-3.5 inline ml-1" />
                    {EXPERIENCE_LEVEL_LABELS[job.experience_level]}
                  </span>
                )}
              </div>

              {/* Location */}
              {job.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
              )}

              {/* Description */}
              {job.description && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    توضیحات شغل
                  </h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                    {job.description}
                  </div>
                </div>
              )}

              {/* Required Skills */}
              {job.required_skills && job.required_skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">مهارت‌های ضروری</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Skills */}
              {job.preferred_skills && job.preferred_skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">مهارت‌های مطلوب</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.preferred_skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          {isAdmin && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">آمار آگهی</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">تعداد درخواست‌ها</span>
                    <span className="font-semibold">{job.application_count || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">تاریخ ایجاد</span>
                    <span className="text-sm">
                      {new Date(job.created_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>

                  {job.published_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">تاریخ انتشار</span>
                      <span className="text-sm">
                        {new Date(job.published_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  )}

                  {job.expires_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">تاریخ انقضا</span>
                      <span className="text-sm">
                        {new Date(job.expires_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Card */}
          <Card>
            <CardContent className="p-6">
              <Link
                href={`/dashboard/companies/${job.company_id}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                {job.company?.logo_url ? (
                  <img
                    src={job.company.logo_url}
                    alt={job.company.name}
                    className="w-12 h-12 rounded-xl object-cover border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <h4 className="font-semibold">{job.company?.name}</h4>
                  <span className="text-sm text-muted-foreground">مشاهده شرکت</span>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
