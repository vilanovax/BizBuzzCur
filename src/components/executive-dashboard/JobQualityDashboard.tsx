'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Minus, BarChart3, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type {
  ExecutiveDashboardData,
  JobQualityStatus,
  FunnelStep,
  ModuleImpact,
  AdoptionLevel,
  ImpactIndicator,
} from '@/types/executive-dashboard';
import {
  JOB_QUALITY_STATUS_LABELS,
  ADOPTION_LEVEL_LABELS,
  IMPACT_INDICATOR_LABELS,
  EXECUTIVE_DASHBOARD_COPY,
} from '@/types/executive-dashboard';

interface JobQualityDashboardProps {
  companyId: string;
}

export function JobQualityDashboard({ companyId }: JobQualityDashboardProps) {
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<30 | 60 | 90>(30);

  useEffect(() => {
    fetchDashboardData();
  }, [companyId, timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/companies/${companyId}/job-quality?timeRange=${timeRange}`);
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'خطا در دریافت اطلاعات');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">{EXECUTIVE_DASHBOARD_COPY.emptyState.title}</h3>
          <p className="text-muted-foreground text-sm">
            {EXECUTIVE_DASHBOARD_COPY.emptyState.description}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{EXECUTIVE_DASHBOARD_COPY.header.title}</h2>
            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
              {EXECUTIVE_DASHBOARD_COPY.header.badge}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {EXECUTIVE_DASHBOARD_COPY.header.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days as 30 | 60 | 90)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                timeRange === days
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              {days} روز
            </button>
          ))}
        </div>
      </div>

      {/* 1. Quality Overview */}
      <QualityOverviewCard
        status={data.qualityOverview.status}
        context={data.qualityOverview.context}
      />

      {/* 2 & 3. Funnel + Impact (side by side on large screens) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FunnelCard steps={data.funnel.steps} copy={data.funnel.copy} />
        <ImpactComparisonCard comparison={data.impactComparison} />
      </div>

      {/* 4 & 5. Modules + Trend (side by side) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ModuleImpactCard modules={data.moduleImpact.modules} copy={data.moduleImpact.copy} />
        <ClarityTrendCard trend={data.clarityTrend} />
      </div>

      {/* 6. Guidance */}
      <GuidanceCard recommendations={data.guidance.recommendations} />
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function QualityOverviewCard({
  status,
  context,
}: {
  status: JobQualityStatus;
  context: string;
}) {
  const statusConfig = {
    improving: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    stable: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: <Minus className="w-5 h-5" />,
    },
    needs_attention: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: <TrendingDown className="w-5 h-5" />,
    },
  };

  const config = statusConfig[status];

  return (
    <Card className={cn(config.bg, config.border)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {EXECUTIVE_DASHBOARD_COPY.qualityOverview.title}
            </p>
            <div className="flex items-center gap-2">
              <span className={cn('text-lg font-semibold', config.text)}>
                {JOB_QUALITY_STATUS_LABELS[status]}
              </span>
              <span className={config.text}>{config.icon}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{context}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelCard({ steps, copy }: { steps: FunnelStep[]; copy: string }) {
  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{EXECUTIVE_DASHBOARD_COPY.funnel.title}</CardTitle>
        <CardDescription>{copy}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{step.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{step.count}</span>
                    <TrendIcon trend={step.trend} />
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(step.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ImpactComparisonCard({
  comparison,
}: {
  comparison: ExecutiveDashboardData['impactComparison'];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{EXECUTIVE_DASHBOARD_COPY.impact.title}</CardTitle>
        <CardDescription>{comparison.copy}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Quick Jobs */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">آگهی سریع</p>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold">{comparison.quickJobs.avgAppliesPerJob}</p>
                <p className="text-xs text-muted-foreground">میانگین کلیک</p>
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {Math.round(comparison.quickJobs.applicationStartedRate * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">نرخ درخواست</p>
              </div>
            </div>
          </div>

          {/* Improved Jobs */}
          <div
            className={cn(
              'p-4 rounded-lg',
              comparison.showsPositiveImpact
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-muted/50'
            )}
          >
            <p className="text-sm text-muted-foreground mb-3">آگهی بهبودیافته</p>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold">{comparison.improvedJobs.avgAppliesPerJob}</p>
                <p className="text-xs text-muted-foreground">میانگین کلیک</p>
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {Math.round(comparison.improvedJobs.applicationStartedRate * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">نرخ درخواست</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleImpactCard({ modules, copy }: { modules: ModuleImpact[]; copy: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{EXECUTIVE_DASHBOARD_COPY.modules.title}</CardTitle>
        <CardDescription>{copy}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-3 text-xs text-muted-foreground pb-2 border-b">
            <span>ماژول</span>
            <span className="text-center">استفاده</span>
            <span className="text-center">تأثیر</span>
          </div>

          {/* Rows */}
          {modules.map((module) => (
            <div key={module.module} className="grid grid-cols-3 py-2 items-center">
              <span className="text-sm">{module.displayName}</span>
              <span className="text-center">
                <AdoptionBadge level={module.adoptionLevel} />
              </span>
              <span className="text-center">
                <ImpactBadge indicator={module.impactIndicator} />
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ClarityTrendCard({ trend }: { trend: ExecutiveDashboardData['clarityTrend'] }) {
  const maxValue = Math.max(...trend.data.map((d) => d.value), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{EXECUTIVE_DASHBOARD_COPY.trend.title}</CardTitle>
        <CardDescription>{trend.copy}</CardDescription>
      </CardHeader>
      <CardContent>
        {trend.data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            داده‌ای برای نمایش وجود ندارد
          </p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {trend.data.map((point, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${point.date}: ${point.value}%`}
              >
                <div
                  className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                  style={{ height: `${(point.value / maxValue) * 100}%`, minHeight: '4px' }}
                />
                {index % Math.ceil(trend.data.length / 5) === 0 && (
                  <span className="text-[10px] text-muted-foreground">{point.date}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GuidanceCard({
  recommendations,
}: {
  recommendations: ExecutiveDashboardData['guidance']['recommendations'];
}) {
  if (recommendations.length === 0) return null;

  return (
    <Card className="bg-amber-50/50 border-amber-200/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          {EXECUTIVE_DASHBOARD_COPY.guidance.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="text-amber-600 mt-0.5">•</span>
              <span>{rec.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') {
    return <TrendingUp className="w-4 h-4 text-emerald-600" />;
  }
  if (trend === 'down') {
    return <TrendingDown className="w-4 h-4 text-amber-600" />;
  }
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function AdoptionBadge({ level }: { level: AdoptionLevel }) {
  const config = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <span className={cn('px-2 py-0.5 text-xs rounded-full', config[level])}>
      {ADOPTION_LEVEL_LABELS[level]}
    </span>
  );
}

function ImpactBadge({ indicator }: { indicator: ImpactIndicator }) {
  const config = {
    positive: 'bg-emerald-100 text-emerald-600',
    neutral: 'bg-gray-100 text-gray-600',
    unknown: 'bg-gray-100 text-gray-400',
  };

  return (
    <span className={cn('px-2 py-0.5 text-xs rounded-full', config[indicator])}>
      {IMPACT_INDICATOR_LABELS[indicator]}
    </span>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

export function JobQualityDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-muted rounded w-48 animate-pulse" />
      <div className="h-24 bg-muted rounded-xl animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
