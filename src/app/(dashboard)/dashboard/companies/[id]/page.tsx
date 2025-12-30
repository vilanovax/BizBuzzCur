'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  MapPin,
  Globe,
  Users,
  Briefcase,
  Edit,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  Loader2,
  Settings,
  MessageSquare,
  MoreVertical,
  Eye,
  Share2,
  Trash2,
  Power,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils/cn';
import type { CompanyWithStats, CompanyRole } from '@/types/company';
import {
  COMPANY_ROLE_LABELS,
  COMPANY_SIZE_LABELS,
  COMPANY_TYPE_LABELS,
  canManageCompany,
} from '@/types/company';
import type { JobAd } from '@/types/job';
import { JOB_STATUS_LABELS, EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from '@/types/job';

type Tab = 'overview' | 'jobs' | 'settings';

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [company, setCompany] = useState<CompanyWithStats | null>(null);
  const [jobs, setJobs] = useState<JobAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [togglingJob, setTogglingJob] = useState<string | null>(null);
  const [deletingJob, setDeletingJob] = useState<string | null>(null);
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);

  const isAdmin = canManageCompany(company?.user_role);

  // Toggle job status (published <-> draft)
  const toggleJobStatus = async (jobId: string, currentStatus: string) => {
    setTogglingJob(jobId);
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus as any } : j));
      }
    } catch (err) {
      console.error('Error toggling job status:', err);
    } finally {
      setTogglingJob(null);
    }
  };

  // Delete job
  const deleteJob = async (jobId: string) => {
    if (!confirm('آیا از حذف این آگهی اطمینان دارید؟')) return;
    setDeletingJob(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setJobs(jobs.filter(j => j.id !== jobId));
      }
    } catch (err) {
      console.error('Error deleting job:', err);
    } finally {
      setDeletingJob(null);
    }
  };

  // Copy share link
  const copyShareLink = (jobId: string) => {
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(url);
    setCopiedJobId(jobId);
    setTimeout(() => setCopiedJobId(null), 2000);
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs();
    }
  }, [activeTab, id]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/companies/${id}`);
      const data = await res.json();

      if (data.success) {
        setCompany(data.data);
      } else {
        setError(data.error || 'خطا در دریافت اطلاعات شرکت');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`/api/companies/${id}/jobs?include_all=${isAdmin}`);
      const data = await res.json();

      if (data.success) {
        setJobs(data.data);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  // Tabs configuration based on role
  const tabs: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'overview', label: 'درباره', icon: <Building2 className="w-4 h-4" /> },
    { id: 'jobs', label: 'فرصت‌های شغلی', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'settings', label: 'تنظیمات', icon: <Settings className="w-4 h-4" />, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive">{error || 'شرکت یافت نشد'}</p>
          <Button variant="outline" onClick={() => router.push('/dashboard/companies')} className="mt-4">
            بازگشت به لیست
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/companies">
            <ArrowRight className="w-4 h-4 ml-1" />
            شرکت‌ها
          </Link>
        </Button>
      </div>

      {/* Company Header */}
      <Card>
        {/* Cover Image */}
        {company.cover_image_url && (
          <div className="h-32 sm:h-48 w-full overflow-hidden rounded-t-lg">
            <img
              src={company.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Brand color bar if no cover */}
        {!company.cover_image_url && (
          <div
            className="h-2 w-full rounded-t-lg"
            style={{ backgroundColor: company.brand_color || '#2563eb' }}
          />
        )}

        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Logo */}
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-20 h-20 rounded-xl object-cover border -mt-12 sm:-mt-16 bg-white"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center text-white -mt-12 sm:-mt-16 border-4 border-background"
                style={{ backgroundColor: company.brand_color || '#2563eb' }}
              >
                <Building2 className="w-10 h-10" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">{company.name}</h1>
                  {company.tagline && (
                    <p className="text-muted-foreground mt-1">{company.tagline}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {company.user_role && (
                    <span className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
                      {COMPANY_ROLE_LABELS[company.user_role]}
                    </span>
                  )}
                  {isAdmin && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/companies/${id}/edit`}>
                        <Edit className="w-4 h-4 ml-2" />
                        ویرایش
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                {company.industry && (
                  <span className="bg-muted px-2 py-1 rounded">{company.industry}</span>
                )}
                {(company.city || company.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {[company.city, company.country].filter(Boolean).join('، ')}
                  </span>
                )}
                {company.company_size && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {COMPANY_SIZE_LABELS[company.company_size]}
                  </span>
                )}
                {company.active_jobs_count > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Briefcase className="w-4 h-4" />
                    {company.active_jobs_count} فرصت فعال
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1 overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {company.description && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">درباره شرکت</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {company.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Active Jobs Preview */}
            {company.active_jobs_count > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      فرصت‌های شغلی فعال
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('jobs')}>
                      مشاهده همه
                    </Button>
                  </div>
                  <p className="text-muted-foreground">
                    {company.active_jobs_count} موقعیت شغلی فعال در این شرکت
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">اطلاعات تماس</h3>

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="truncate" dir="ltr">{company.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                )}

                {company.email && (
                  <a
                    href={`mailto:${company.email}`}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Mail className="w-4 h-4" />
                    <span dir="ltr">{company.email}</span>
                  </a>
                )}

                {company.phone && (
                  <a
                    href={`tel:${company.phone}`}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{company.phone}</span>
                  </a>
                )}

                {!company.website && !company.email && !company.phone && (
                  <p className="text-sm text-muted-foreground">اطلاعات تماسی ثبت نشده</p>
                )}
              </CardContent>
            </Card>

            {/* Company Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">جزئیات</h3>

                {company.company_type && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">نوع شرکت</span>
                    <span>{COMPANY_TYPE_LABELS[company.company_type]}</span>
                  </div>
                )}

                {company.company_size && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">اندازه</span>
                    <span>{COMPANY_SIZE_LABELS[company.company_size]}</span>
                  </div>
                )}

                {company.founded_year && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">سال تأسیس</span>
                    <span>{company.founded_year}</span>
                  </div>
                )}

                {company.member_count > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">اعضای تیم</span>
                    <span>{company.member_count} نفر</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            {(company.linkedin_url || company.twitter_url || company.instagram_url || company.telegram_url) && (
              <Card>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold">شبکه‌های اجتماعی</h3>
                  <div className="flex flex-wrap gap-2">
                    {company.linkedin_url && (
                      <a
                        href={company.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-sm bg-muted rounded-lg hover:bg-muted/80"
                      >
                        LinkedIn
                      </a>
                    )}
                    {company.twitter_url && (
                      <a
                        href={company.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-sm bg-muted rounded-lg hover:bg-muted/80"
                      >
                        Twitter
                      </a>
                    )}
                    {company.instagram_url && (
                      <a
                        href={company.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-sm bg-muted rounded-lg hover:bg-muted/80"
                      >
                        Instagram
                      </a>
                    )}
                    {company.telegram_url && (
                      <a
                        href={company.telegram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-sm bg-muted rounded-lg hover:bg-muted/80"
                      >
                        Telegram
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">فرصت‌های شغلی</h2>
            {isAdmin && (
              <Button asChild>
                <Link href={`/dashboard/jobs/new?company_id=${id}`}>
                  <Briefcase className="w-4 h-4 ml-2" />
                  آگهی جدید
                </Link>
              </Button>
            )}
          </div>

          {/* Jobs List */}
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">فرصت شغلی فعالی وجود ندارد</h3>
                <p className="text-muted-foreground text-sm">
                  {isAdmin
                    ? 'اولین آگهی استخدام خود را ایجاد کنید'
                    : 'در حال حاضر موقعیت شغلی فعالی در این شرکت وجود ندارد'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{job.title}</h3>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs',
                              job.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : job.status === 'draft'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-red-100 text-red-700'
                            )}
                          >
                            {JOB_STATUS_LABELS[job.status]}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {job.employment_type && (
                            <span>{EMPLOYMENT_TYPE_LABELS[job.employment_type]}</span>
                          )}
                          {job.location_type && (
                            <span>{LOCATION_TYPE_LABELS[job.location_type]}</span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/jobs/${job.id}/applications`}>
                              <MessageSquare className="w-4 h-4 ml-1" />
                              درخواست‌ها
                            </Link>
                          </Button>
                        )}

                        {/* Three-dot menu */}
                        <DropdownMenu
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          }
                        >
                          {/* Preview */}
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/jobs/${job.id}`)}>
                            <Eye className="w-4 h-4" />
                            پیش‌نمایش
                          </DropdownMenuItem>

                          {/* Share Link */}
                          <DropdownMenuItem onClick={() => copyShareLink(job.id)}>
                            {copiedJobId === job.id ? (
                              <>
                                <Check className="w-4 h-4 text-green-600" />
                                کپی شد!
                              </>
                            ) : (
                              <>
                                <Share2 className="w-4 h-4" />
                                اشتراک‌گذاری
                              </>
                            )}
                          </DropdownMenuItem>

                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />

                              {/* Edit */}
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/jobs/${job.id}/edit`)}>
                                <Edit className="w-4 h-4" />
                                ویرایش
                              </DropdownMenuItem>

                              {/* Toggle Active/Inactive */}
                              <DropdownMenuItem
                                onClick={() => toggleJobStatus(job.id, job.status)}
                                disabled={togglingJob === job.id}
                              >
                                <Power className="w-4 h-4" />
                                {togglingJob === job.id
                                  ? 'در حال تغییر...'
                                  : job.status === 'published'
                                  ? 'غیرفعال کردن'
                                  : 'فعال کردن'}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Delete */}
                              <DropdownMenuItem
                                onClick={() => deleteJob(job.id)}
                                variant="danger"
                                disabled={deletingJob === job.id}
                              >
                                <Trash2 className="w-4 h-4" />
                                {deletingJob === job.id ? 'در حال حذف...' : 'حذف'}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && isAdmin && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">تنظیمات شرکت</h3>
              <div className="space-y-4">
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/companies/${id}/edit`}>
                    <Edit className="w-4 h-4 ml-2" />
                    ویرایش اطلاعات شرکت
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
