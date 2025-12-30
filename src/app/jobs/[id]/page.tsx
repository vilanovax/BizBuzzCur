'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Briefcase,
  MapPin,
  Clock,
  Users,
  Globe,
  CheckCircle,
  MessageSquare,
  Loader2,
  ArrowRight,
  Sparkles,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { JobAdWithDetails } from '@/types/job';
import {
  EMPLOYMENT_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  COMPANY_SIZE_LABELS,
} from '@/types/job';
import { COMPANY_SIZE_LABELS as COMPANY_SIZES } from '@/types/company';

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id: jobId } = use(params);
  const router = useRouter();

  const [job, setJob] = useState<JobAdWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverMessage, setCoverMessage] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchJob();
    checkAuth();
  }, [jobId]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setIsLoggedIn(!!data.user);
    } catch {
      setIsLoggedIn(false);
    }
  };

  const fetchJob = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();

      if (data.success) {
        setJob(data.data);
      } else {
        setError(data.error || 'آگهی یافت نشد');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/jobs/${jobId}`);
      return;
    }
    setShowApplyModal(true);
  };

  const handleApply = async () => {
    setIsApplying(true);
    setApplyError(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_message: coverMessage.trim() || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Redirect to conversation
        router.push(`/dashboard/inbox/${data.data.conversation_id}`);
      } else {
        setApplyError(data.error || 'خطا در ارسال درخواست');
      }
    } catch (err) {
      setApplyError('خطا در اتصال به سرور');
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-destructive mb-4">{error || 'آگهی یافت نشد'}</p>
            <Button variant="outline" onClick={() => router.back()}>
              بازگشت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowRight className="w-4 h-4 ml-1" />
            بازگشت
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {job.company?.logo_url ? (
                    <img
                      src={job.company.logo_url}
                      alt={job.company.name}
                      className="w-16 h-16 rounded-xl object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-1">{job.title}</h1>
                    <Link
                      href={`/${job.company?.slug || job.company_id}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {job.company?.name}
                    </Link>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job.employment_type && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded-full text-xs">
                          <Clock className="w-3 h-3" />
                          {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
                        </span>
                      )}
                      {job.location_type && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded-full text-xs">
                          <MapPin className="w-3 h-3" />
                          {LOCATION_TYPE_LABELS[job.location_type]}
                        </span>
                      )}
                      {job.experience_level && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded-full text-xs">
                          <Users className="w-3 h-3" />
                          {EXPERIENCE_LEVEL_LABELS[job.experience_level]}
                        </span>
                      )}
                    </div>

                    {job.location && (
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Context Box - Why User Sees This */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">چرا این آگهی را می‌بینید؟</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.domain?.name_fa
                        ? `این موقعیت در حوزه ${job.domain.name_fa} است که با تخصص شما مرتبط است.`
                        : 'شما از طریق صفحه شرکت به این آگهی دسترسی پیدا کردید.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            {job.description && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold mb-4">درباره این موقعیت</h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                    {job.description}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {((job.required_skills && job.required_skills.length > 0) ||
              (job.preferred_skills && job.preferred_skills.length > 0)) && (
              <Card>
                <CardContent className="p-6 space-y-4">
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
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {job.has_applied ? (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-1">درخواست ارسال شده</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      شما قبلاً برای این موقعیت درخواست داده‌اید
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/dashboard/inbox">
                        <MessageSquare className="w-4 h-4 ml-2" />
                        مشاهده گفتگو
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold mb-2">علاقه‌مند هستید؟</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      با ارسال درخواست، گفتگویی با تیم استخدام این شرکت آغاز می‌شود.
                    </p>
                    <Button className="w-full" onClick={handleApplyClick}>
                      <Send className="w-4 h-4 ml-2" />
                      ارسال درخواست
                    </Button>
                    {!isLoggedIn && (
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        برای ارسال درخواست، ابتدا وارد حساب کاربری شوید
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Company Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">درباره شرکت</h3>
                <Link
                  href={`/${job.company?.slug || job.company_id}`}
                  className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
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
                    {job.company?.industry && (
                      <span className="text-xs text-muted-foreground">
                        {job.company.industry}
                      </span>
                    )}
                  </div>
                </Link>

                {job.company?.tagline && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {job.company.tagline}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {job.company?.company_size && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{COMPANY_SIZES[job.company.company_size]}</span>
                    </div>
                  )}
                  {(job.company?.city || job.company?.country) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {[job.company?.city, job.company?.country]
                          .filter(Boolean)
                          .join('، ')}
                      </span>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href={`/${job.company?.slug || job.company_id}`}>
                    مشاهده صفحه شرکت
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isApplying && setShowApplyModal(false)}
          />
          <Card className="relative z-10 w-full max-w-lg mx-4">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">ارسال درخواست</h2>
              <p className="text-sm text-muted-foreground mb-4">
                با ارسال درخواست، گفتگویی با تیم استخدام{' '}
                <span className="font-medium text-foreground">{job.company?.name}</span>{' '}
                آغاز می‌شود.
              </p>

              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <span className="font-medium">{job.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  پروفایل و اطلاعات حرفه‌ای شما با تیم استخدام به اشتراک گذاشته می‌شود.
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium">
                  پیام همراه (اختیاری)
                </label>
                <textarea
                  value={coverMessage}
                  onChange={(e) => setCoverMessage(e.target.value)}
                  placeholder="چرا به این موقعیت علاقه‌مندید؟ چه تجربه‌ای برای این نقش دارید؟"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  disabled={isApplying}
                />
              </div>

              {applyError && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm mb-4">
                  {applyError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowApplyModal(false)}
                  disabled={isApplying}
                >
                  انصراف
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleApply}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      ارسال درخواست
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
