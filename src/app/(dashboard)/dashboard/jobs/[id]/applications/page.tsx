'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Users,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Search,
  MoreVertical,
  Star,
  Mail,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import {
  CandidateFitInsights,
  CandidateFitInsightsSkeleton,
} from '@/components/jobs/CandidateFitInsights';
import {
  TeamFitInsights,
  TeamFitInsightsSkeleton,
} from '@/components/jobs/TeamFitInsights';
import type {
  JobAdWithDetails,
  JobApplicationWithDetails,
  ApplicationStatus,
} from '@/types/job';
import { APPLICATION_STATUS_LABELS } from '@/types/job';
import type { CandidateFitResult } from '@/lib/services/candidate-match.service';
import type { TeamFitResult } from '@/lib/services/team-fit.service';
import { PremiumGate } from '@/components/premium/PremiumGate';
import type { PremiumTier } from '@/types/premium';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  reviewing: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-yellow-100 text-yellow-700',
  interviewing: 'bg-purple-100 text-purple-700',
  offered: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-500',
  hired: 'bg-emerald-100 text-emerald-700',
};

const STATUS_ICONS: Record<ApplicationStatus, typeof Clock> = {
  pending: Clock,
  reviewing: Search,
  shortlisted: Star,
  interviewing: Users,
  offered: Mail,
  rejected: XCircle,
  withdrawn: XCircle,
  hired: CheckCircle,
};

export default function JobApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobAdWithDetails | null>(null);
  const [applications, setApplications] = useState<JobApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expandedInsights, setExpandedInsights] = useState<string | null>(null);
  const [fitInsightsCache, setFitInsightsCache] = useState<Record<string, CandidateFitResult>>({});
  const [teamFitCache, setTeamFitCache] = useState<Record<string, TeamFitResult>>({});
  const [loadingInsights, setLoadingInsights] = useState<string | null>(null);
  const [loadingTeamFit, setLoadingTeamFit] = useState<string | null>(null);
  const [premiumTier, setPremiumTier] = useState<PremiumTier>('free');
  const [isPremiumLimited, setIsPremiumLimited] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch job details
      const jobRes = await fetch(`/api/jobs/${jobId}`);
      const jobData = await jobRes.json();

      if (!jobData.success) {
        setError(jobData.error || 'خطا در دریافت اطلاعات آگهی');
        return;
      }

      if (!jobData.is_admin) {
        setError('شما اجازه مشاهده درخواست‌ها را ندارید');
        return;
      }

      setJob(jobData.data);

      // Fetch applications
      const appsRes = await fetch(`/api/jobs/${jobId}/applications`);
      const appsData = await appsRes.json();

      if (appsData.success) {
        setApplications(appsData.data || []);
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  // Fetch fit insights for an application
  const fetchFitInsights = useCallback(async (applicationId: string) => {
    // Check cache first
    if (fitInsightsCache[applicationId]) {
      return;
    }

    setLoadingInsights(applicationId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/applications/${applicationId}/match`);
      const data = await res.json();

      if (data.success) {
        setFitInsightsCache((prev) => ({
          ...prev,
          [applicationId]: data.data,
        }));
        // Track if premium limited
        if (data.meta?.isPremiumLimited) {
          setIsPremiumLimited((prev) => ({
            ...prev,
            [`candidate_${applicationId}`]: true,
          }));
        }
      }
    } catch (err) {
      console.error('Fit insights error:', err);
    } finally {
      setLoadingInsights(null);
    }
  }, [jobId, fitInsightsCache]);

  // Fetch team fit insights for an application
  const fetchTeamFit = useCallback(async (applicationId: string) => {
    // Check cache first
    if (teamFitCache[applicationId]) {
      return;
    }

    setLoadingTeamFit(applicationId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/applications/${applicationId}/team-fit`);
      const data = await res.json();

      if (data.success) {
        setTeamFitCache((prev) => ({
          ...prev,
          [applicationId]: data.data,
        }));
        // Track if premium limited
        if (data.meta?.isPremiumLimited) {
          setIsPremiumLimited((prev) => ({
            ...prev,
            [`team_${applicationId}`]: true,
          }));
        }
      }
    } catch (err) {
      console.error('Team fit error:', err);
    } finally {
      setLoadingTeamFit(null);
    }
  }, [jobId, teamFitCache]);

  // Toggle insights expansion
  const toggleInsights = useCallback((applicationId: string) => {
    if (expandedInsights === applicationId) {
      setExpandedInsights(null);
    } else {
      setExpandedInsights(applicationId);
      // Fetch both insights in parallel if not cached
      if (!fitInsightsCache[applicationId]) {
        fetchFitInsights(applicationId);
      }
      if (!teamFitCache[applicationId]) {
        fetchTeamFit(applicationId);
      }
    }
  }, [expandedInsights, fitInsightsCache, teamFitCache, fetchFitInsights, fetchTeamFit]);

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    setUpdatingStatus(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (err) {
      console.error('Status change error:', err);
    } finally {
      setUpdatingStatus(null);
      setSelectedApp(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      `${app.applicant.first_name} ${app.applicant.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      app.applicant.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

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
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/jobs/${jobId}`}>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">درخواست‌های شغلی</h1>
          <p className="text-muted-foreground mt-1">{job.title}</p>
        </div>
        <div className="text-left">
          <span className="text-2xl font-bold">{applications.length}</span>
          <p className="text-sm text-muted-foreground">کل درخواست‌ها</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="جستجوی متقاضی..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-colors',
              filterStatus === 'all'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-muted hover:border-primary/30'
            )}
          >
            همه ({applications.length})
          </button>
          {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((status) => {
            const count = statusCounts[status] || 0;
            if (count === 0) return null;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-colors',
                  filterStatus === status
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-muted hover:border-primary/30'
                )}
              >
                {APPLICATION_STATUS_LABELS[status]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">
              {applications.length === 0
                ? 'هنوز درخواستی ثبت نشده'
                : 'درخواستی یافت نشد'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {applications.length === 0
                ? 'وقتی کسی برای این آگهی درخواست بدهد، اینجا نمایش داده می‌شود'
                : 'فیلترها را تغییر دهید'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const StatusIcon = STATUS_ICONS[app.status];

            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    {app.applicant.avatar_url ? (
                      <img
                        src={app.applicant.avatar_url}
                        alt={`${app.applicant.first_name} ${app.applicant.last_name}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {app.applicant.first_name} {app.applicant.last_name}
                        </h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1',
                            STATUS_COLORS[app.status]
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {APPLICATION_STATUS_LABELS[app.status]}
                        </span>
                      </div>

                      {app.applicant.email && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {app.applicant.email}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(app.applied_at).toLocaleDateString('fa-IR')}
                        </span>
                        {app.cover_message && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            پیام همراه
                          </span>
                        )}
                        {app.resume_url && (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            رزومه
                          </a>
                        )}
                      </div>

                      {/* Cover Message */}
                      {app.cover_message && (
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                          {app.cover_message}
                        </p>
                      )}

                      {/* Fit Insights Toggle */}
                      <button
                        onClick={() => toggleInsights(app.id)}
                        className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {expandedInsights === app.id ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                        <span>بینش‌های تطابق</span>
                      </button>

                      {/* Insights Content */}
                      {expandedInsights === app.id && (
                        <div className="mt-3 space-y-3">
                          {/* Candidate Fit Insights */}
                          {loadingInsights === app.id ? (
                            <CandidateFitInsightsSkeleton />
                          ) : fitInsightsCache[app.id] ? (
                            <>
                              <CandidateFitInsights
                                fitResult={fitInsightsCache[app.id]}
                                showLabel={true}
                              />
                              {/* Premium upsell for expanded candidate insights */}
                              {isPremiumLimited[`candidate_${app.id}`] && (
                                <PremiumGate
                                  currentTier={premiumTier}
                                  feature="candidate_insights_expanded"
                                  requiredTier="starter"
                                  variant="inline"
                                />
                              )}
                            </>
                          ) : null}

                          {/* Team Fit Insights */}
                          {loadingTeamFit === app.id ? (
                            <TeamFitInsightsSkeleton />
                          ) : teamFitCache[app.id] ? (
                            <>
                              <TeamFitInsights
                                result={teamFitCache[app.id]}
                                showLabel={true}
                              />
                              {/* Premium upsell for detailed team insights */}
                              {isPremiumLimited[`team_${app.id}`] && (
                                <PremiumGate
                                  currentTier={premiumTier}
                                  feature="team_fit_detailed"
                                  requiredTier="starter"
                                  variant="inline"
                                />
                              )}
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {app.conversation_id && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/inbox/${app.conversation_id}`}>
                            <MessageSquare className="w-4 h-4 ml-1" />
                            پیام
                          </Link>
                        </Button>
                      )}

                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setSelectedApp(selectedApp === app.id ? null : app.id)
                          }
                          disabled={updatingStatus === app.id}
                        >
                          {updatingStatus === app.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </Button>

                        {selectedApp === app.id && (
                          <div className="absolute top-full left-0 mt-1 z-50 min-w-48 bg-background border rounded-xl shadow-lg py-1">
                            <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                              تغییر وضعیت
                            </div>
                            {(
                              Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]
                            ).map((status) => {
                              if (status === app.status) return null;
                              const Icon = STATUS_ICONS[status];
                              return (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(app.id, status)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                                >
                                  <Icon
                                    className={cn(
                                      'w-4 h-4',
                                      STATUS_COLORS[status].replace('bg-', 'text-').split(' ')[1]
                                    )}
                                  />
                                  <span>{APPLICATION_STATUS_LABELS[status]}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
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
