/**
 * Executive Dashboard Service
 *
 * Aggregates analytics data for the Executive Job Quality Dashboard.
 * Company-scoped, time-based, no micromanagement.
 *
 * Purpose: Answer "Are our job posts attracting the right people?"
 */

import sql from '@/lib/db';
import type {
  ExecutiveDashboardData,
  JobQualityStatus,
  JobQualityOverview,
  PublishImproveFunnel,
  JobTypeComparison,
  ModuleImpactSummary,
  ModuleImpact,
  JobClarityTrend,
  GuidanceSection,
  AdoptionLevel,
  ImpactIndicator,
} from '@/types/executive-dashboard';
import { MODULE_DISPLAY_NAMES } from '@/types/executive-dashboard';

// =============================================================================
// MAIN SERVICE FUNCTION
// =============================================================================

/**
 * Get full executive dashboard data for a company
 */
export async function getExecutiveDashboardData(
  companyId: string,
  timeRange: 30 | 60 | 90 = 30
): Promise<ExecutiveDashboardData> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);

  // Previous period for trend comparison
  const prevEndDate = new Date(startDate);
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - timeRange);

  // Fetch all data in parallel
  const [currentKPIs, previousKPIs, moduleData, trendData] = await Promise.all([
    getCompanyKPIs(companyId, startDate, endDate),
    getCompanyKPIs(companyId, prevStartDate, prevEndDate),
    getCompanyModuleData(companyId, startDate, endDate),
    getImprovementTrend(companyId, timeRange),
  ]);

  // Build dashboard sections
  const qualityOverview = buildQualityOverview(currentKPIs, previousKPIs);
  const funnel = buildFunnel(currentKPIs, previousKPIs);
  const impactComparison = buildImpactComparison(currentKPIs);
  const moduleImpact = buildModuleImpact(moduleData, currentKPIs.published);
  const clarityTrend = buildClarityTrend(trendData, timeRange);
  const guidance = buildGuidance(currentKPIs, moduleData);

  return {
    companyId,
    timeRange: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    qualityOverview,
    funnel,
    impactComparison,
    moduleImpact,
    clarityTrend,
    guidance,
  };
}

// =============================================================================
// DATA FETCHING
// =============================================================================

interface CompanyKPIs {
  published: number;
  improved: number;
  withApplications: number;
  applicationsStarted: number;
  // Quick vs Improved breakdown
  quickJobViews: number;
  improvedJobViews: number;
  quickApplyClicks: number;
  improvedApplyClicks: number;
  quickApplications: number;
  improvedApplications: number;
  // Module counts
  workStyleCount: number;
  skillsCount: number;
  experienceCount: number;
  teamSnapshotCount: number;
}

async function getCompanyKPIs(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<CompanyKPIs> {
  const [result] = await sql<[{
    published: string;
    improved: string;
    with_applications: string;
    applications_started: string;
    quick_job_views: string;
    improved_job_views: string;
    quick_apply_clicks: string;
    improved_apply_clicks: string;
    quick_applications: string;
    improved_applications: string;
    work_style_count: string;
    skills_count: string;
    experience_count: string;
    team_snapshot_count: string;
  }]>`
    SELECT
      COUNT(*) FILTER (WHERE event_name = 'job_published') as published,
      COUNT(DISTINCT job_id) FILTER (WHERE event_name = 'job_module_saved') as improved,
      COUNT(DISTINCT job_id) FILTER (WHERE event_name = 'application_started') as with_applications,
      COUNT(*) FILTER (WHERE event_name = 'application_started') as applications_started,
      COUNT(*) FILTER (WHERE event_name = 'job_viewed' AND is_improved = FALSE) as quick_job_views,
      COUNT(*) FILTER (WHERE event_name = 'job_viewed' AND is_improved = TRUE) as improved_job_views,
      COUNT(*) FILTER (WHERE event_name = 'apply_clicked' AND is_improved = FALSE) as quick_apply_clicks,
      COUNT(*) FILTER (WHERE event_name = 'apply_clicked' AND is_improved = TRUE) as improved_apply_clicks,
      COUNT(*) FILTER (WHERE event_name = 'application_started' AND is_improved = FALSE) as quick_applications,
      COUNT(*) FILTER (WHERE event_name = 'application_started' AND is_improved = TRUE) as improved_applications,
      COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'work_style') as work_style_count,
      COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'skills') as skills_count,
      COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'experience') as experience_count,
      COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'team_snapshot') as team_snapshot_count
    FROM job_analytics_events
    WHERE company_id = ${companyId}
      AND event_timestamp >= ${startDate.toISOString()}
      AND event_timestamp < ${endDate.toISOString()}
  `;

  return {
    published: parseInt(result.published) || 0,
    improved: parseInt(result.improved) || 0,
    withApplications: parseInt(result.with_applications) || 0,
    applicationsStarted: parseInt(result.applications_started) || 0,
    quickJobViews: parseInt(result.quick_job_views) || 0,
    improvedJobViews: parseInt(result.improved_job_views) || 0,
    quickApplyClicks: parseInt(result.quick_apply_clicks) || 0,
    improvedApplyClicks: parseInt(result.improved_apply_clicks) || 0,
    quickApplications: parseInt(result.quick_applications) || 0,
    improvedApplications: parseInt(result.improved_applications) || 0,
    workStyleCount: parseInt(result.work_style_count) || 0,
    skillsCount: parseInt(result.skills_count) || 0,
    experienceCount: parseInt(result.experience_count) || 0,
    teamSnapshotCount: parseInt(result.team_snapshot_count) || 0,
  };
}

interface ModuleData {
  module: string;
  jobCount: number;
  applyClicks: number;
  applications: number;
}

async function getCompanyModuleData(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<ModuleData[]> {
  const results = await sql<Array<{
    module: string;
    job_count: string;
    apply_clicks: string;
    applications: string;
  }>>`
    WITH module_jobs AS (
      SELECT DISTINCT job_id, module
      FROM job_analytics_events
      WHERE company_id = ${companyId}
        AND event_name = 'job_module_saved'
        AND event_timestamp >= ${startDate.toISOString()}
        AND event_timestamp < ${endDate.toISOString()}
    ),
    job_metrics AS (
      SELECT
        job_id,
        COUNT(*) FILTER (WHERE event_name = 'apply_clicked') as apply_clicks,
        COUNT(*) FILTER (WHERE event_name = 'application_started') as applications
      FROM job_analytics_events
      WHERE company_id = ${companyId}
        AND event_timestamp >= ${startDate.toISOString()}
        AND event_timestamp < ${endDate.toISOString()}
      GROUP BY job_id
    )
    SELECT
      mj.module,
      COUNT(DISTINCT mj.job_id) as job_count,
      COALESCE(SUM(jm.apply_clicks), 0) as apply_clicks,
      COALESCE(SUM(jm.applications), 0) as applications
    FROM module_jobs mj
    LEFT JOIN job_metrics jm ON jm.job_id = mj.job_id
    GROUP BY mj.module
  `;

  return results.map((r) => ({
    module: r.module,
    jobCount: parseInt(r.job_count) || 0,
    applyClicks: parseInt(r.apply_clicks) || 0,
    applications: parseInt(r.applications) || 0,
  }));
}

interface TrendDataPoint {
  date: string;
  improved: number;
  published: number;
}

async function getImprovementTrend(
  companyId: string,
  days: number
): Promise<TrendDataPoint[]> {
  // Calculate the start date for the trend
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await sql<Array<{
    date: string;
    improved: string;
    published: string;
  }>>`
    SELECT
      DATE(event_timestamp) as date,
      COUNT(DISTINCT job_id) FILTER (WHERE event_name = 'job_module_saved') as improved,
      COUNT(*) FILTER (WHERE event_name = 'job_published') as published
    FROM job_analytics_events
    WHERE company_id = ${companyId}
      AND event_timestamp >= ${startDate.toISOString()}
    GROUP BY DATE(event_timestamp)
    ORDER BY date
  `;

  return results.map((r) => ({
    date: r.date,
    improved: parseInt(r.improved) || 0,
    published: parseInt(r.published) || 0,
  }));
}

// =============================================================================
// SECTION BUILDERS
// =============================================================================

function buildQualityOverview(
  current: CompanyKPIs,
  previous: CompanyKPIs
): JobQualityOverview {
  // Calculate composite score (internal only)
  const currentScore = calculateQualityScore(current);
  const previousScore = calculateQualityScore(previous);

  // Determine status
  let status: JobQualityStatus;
  let context: string;

  if (current.published === 0) {
    status = 'stable';
    context = 'هنوز آگهی منتشر نشده';
  } else if (currentScore > previousScore + 5) {
    status = 'improving';
    context = 'کیفیت آگهی‌ها نسبت به دوره قبل بهتر شده';
  } else if (currentScore < previousScore - 5) {
    status = 'needs_attention';
    context = 'کیفیت آگهی‌ها کاهش یافته';
  } else {
    status = 'stable';
    context = 'کیفیت آگهی‌ها ثابت مانده';
  }

  return { status, context };
}

function calculateQualityScore(kpis: CompanyKPIs): number {
  if (kpis.published === 0) return 0;

  // Weighted combination:
  // - 40% improvement rate
  // - 30% work style module usage
  // - 30% application rate
  const improvementRate = kpis.improved / kpis.published;
  const workStyleRate = kpis.workStyleCount / kpis.published;
  const applicationRate = kpis.applicationsStarted > 0
    ? Math.min(kpis.applicationsStarted / kpis.published, 1)
    : 0;

  return (improvementRate * 40) + (workStyleRate * 30) + (applicationRate * 30);
}

function buildFunnel(current: CompanyKPIs, previous: CompanyKPIs): PublishImproveFunnel {
  const getTrend = (curr: number, prev: number): 'up' | 'down' | 'stable' => {
    if (prev === 0) return 'stable';
    const change = (curr - prev) / prev;
    if (change > 0.05) return 'up';
    if (change < -0.05) return 'down';
    return 'stable';
  };

  return {
    steps: [
      {
        name: 'آگهی منتشر شده',
        count: current.published,
        trend: getTrend(current.published, previous.published),
      },
      {
        name: 'آگهی بهبود یافته',
        count: current.improved,
        trend: getTrend(current.improved, previous.improved),
      },
      {
        name: 'آگهی با درخواست',
        count: current.withApplications,
        trend: getTrend(current.withApplications, previous.withApplications),
      },
      {
        name: 'درخواست ارسال شده',
        count: current.applicationsStarted,
        trend: getTrend(current.applicationsStarted, previous.applicationsStarted),
      },
    ],
    copy: 'جایی که کیفیت آگهی‌ها شفاف‌تر می‌شود.',
  };
}

function buildImpactComparison(kpis: CompanyKPIs): JobTypeComparison {
  // Calculate metrics for quick jobs
  const quickJobCount = kpis.published - kpis.improved;
  const quickAvgApplies = quickJobCount > 0 ? kpis.quickApplyClicks / quickJobCount : 0;
  const quickAppRate = kpis.quickApplyClicks > 0
    ? kpis.quickApplications / kpis.quickApplyClicks
    : 0;

  // Calculate metrics for improved jobs
  const improvedAvgApplies = kpis.improved > 0 ? kpis.improvedApplyClicks / kpis.improved : 0;
  const improvedAppRate = kpis.improvedApplyClicks > 0
    ? kpis.improvedApplications / kpis.improvedApplyClicks
    : 0;

  const showsPositiveImpact = improvedAvgApplies > quickAvgApplies || improvedAppRate > quickAppRate;

  let copy: string;
  if (kpis.improved === 0) {
    copy = 'داده‌ای برای مقایسه وجود ندارد. آگهی‌ها را بهبود دهید تا نتایج را ببینید.';
  } else if (showsPositiveImpact) {
    copy = 'آگهی‌های با جزئیات بیشتر، متقاضیان مرتبط‌تری جذب می‌کنند.';
  } else {
    copy = 'در حال جمع‌آوری داده برای تحلیل بهتر هستیم.';
  }

  return {
    quickJobs: {
      avgAppliesPerJob: Math.round(quickAvgApplies * 10) / 10,
      applicationStartedRate: Math.round(quickAppRate * 100) / 100,
      avgTimeToFirstApplication: null, // Future: calculate from timestamps
    },
    improvedJobs: {
      avgAppliesPerJob: Math.round(improvedAvgApplies * 10) / 10,
      applicationStartedRate: Math.round(improvedAppRate * 100) / 100,
      avgTimeToFirstApplication: null,
    },
    showsPositiveImpact,
    copy,
  };
}

function buildModuleImpact(
  moduleData: ModuleData[],
  totalPublished: number
): ModuleImpactSummary {
  const modules: ModuleImpact[] = ['work_style', 'skills', 'experience', 'team_snapshot'].map(
    (moduleName) => {
      const data = moduleData.find((m) => m.module === moduleName);
      const jobCount = data?.jobCount || 0;
      const applyClicks = data?.applyClicks || 0;

      // Determine adoption level
      let adoptionLevel: AdoptionLevel;
      if (totalPublished === 0) {
        adoptionLevel = 'low';
      } else {
        const adoptionRate = jobCount / totalPublished;
        if (adoptionRate >= 0.5) adoptionLevel = 'high';
        else if (adoptionRate >= 0.2) adoptionLevel = 'medium';
        else adoptionLevel = 'low';
      }

      // Determine impact (simplified - in production would compare with baseline)
      let impactIndicator: ImpactIndicator;
      if (jobCount < 3) {
        impactIndicator = 'unknown';
      } else if (applyClicks > 0) {
        impactIndicator = 'positive';
      } else {
        impactIndicator = 'neutral';
      }

      return {
        module: moduleName,
        displayName: MODULE_DISPLAY_NAMES[moduleName] || moduleName,
        adoptionLevel,
        impactIndicator,
      };
    }
  );

  return {
    modules,
    copy: 'کدام جزئیات بیشترین تفاوت را ایجاد می‌کنند.',
  };
}

function buildClarityTrend(
  trendData: TrendDataPoint[],
  timeRange: 30 | 60 | 90
): JobClarityTrend {
  // Convert to display format with Persian dates
  const data = trendData.map((point) => {
    const date = new Date(point.date);
    const persianDate = date.toLocaleDateString('fa-IR', { day: 'numeric', month: 'short' });
    const value = point.published > 0 ? Math.round((point.improved / point.published) * 100) : 0;
    return { date: persianDate, value };
  });

  return {
    data,
    timeRange,
    copy: 'درصد آگهی‌های بهبودیافته در طول زمان.',
  };
}

function buildGuidance(kpis: CompanyKPIs, moduleData: ModuleData[]): GuidanceSection {
  const recommendations: { text: string; action?: string }[] = [];

  // Check improvement rate
  if (kpis.published > 0 && kpis.improved / kpis.published < 0.3) {
    recommendations.push({
      text: 'بیشتر آگهی‌ها به‌سرعت منتشر می‌شوند اما جزئیات بیشتری اضافه نمی‌شود.',
      action: 'بهبود آگهی‌ها',
    });
  }

  // Check work style module usage
  const workStyleData = moduleData.find((m) => m.module === 'work_style');
  if (workStyleData && workStyleData.applyClicks > 0 && kpis.workStyleCount < kpis.improved * 0.5) {
    recommendations.push({
      text: 'افزودن انتظارات سبک کاری با درخواست‌های باکیفیت‌تر همراه است.',
    });
  }

  // If no recommendations, add a positive one
  if (recommendations.length === 0 && kpis.published > 0) {
    if (kpis.improved / kpis.published >= 0.3) {
      recommendations.push({
        text: 'شما بیش از ۳۰٪ آگهی‌ها را بهبود داده‌اید. ادامه دهید!',
      });
    } else {
      recommendations.push({
        text: 'جزئیات بیشتر در آگهی‌ها به جذب متقاضیان مناسب‌تر کمک می‌کند.',
      });
    }
  }

  return {
    recommendations: recommendations.slice(0, 2), // Max 2 recommendations
  };
}
