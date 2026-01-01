/**
 * Job Analytics Service (Server-side)
 *
 * Stores job creation events in the database for internal analysis.
 * This is the server-side implementation that writes to PostgreSQL.
 *
 * For client-side tracking, use job-events.ts with an external provider.
 */

import sql from '@/lib/db';
import type {
  JobCreationStartedPayload,
  JobPublishedPayload,
  JobImproveClickedPayload,
  JobModuleSavedPayload,
  JobViewedPayload,
  ApplyClickedPayload,
  ApplicationStartedPayload,
  JobEventName,
} from './job-events';
import { JOB_EVENTS, isJobImproved } from './job-events';

// =============================================================================
// DATABASE EVENT RECORDING
// =============================================================================

interface RecordEventOptions {
  eventName: JobEventName;
  jobId?: string;
  companyId?: string;
  payload?: Record<string, unknown>;
  isImproved?: boolean;
  module?: string;
  sessionId?: string;
}

/**
 * Record an event to the database
 */
async function recordEvent(options: RecordEventOptions): Promise<void> {
  try {
    await sql`
      INSERT INTO job_analytics_events (
        event_name,
        job_id,
        company_id,
        payload,
        is_improved,
        module,
        session_id
      ) VALUES (
        ${options.eventName},
        ${options.jobId || null},
        ${options.companyId || null},
        ${options.payload ? JSON.stringify(options.payload) : '{}'},
        ${options.isImproved || false},
        ${options.module || null},
        ${options.sessionId || null}
      )
    `;
  } catch (error) {
    // Don't throw - analytics should never break the app
    console.error('Failed to record analytics event:', error);
  }
}

// =============================================================================
// EVENT TRACKING FUNCTIONS (Server-side)
// =============================================================================

/**
 * Record: Job creation flow started
 */
export async function recordJobCreationStarted(
  payload: JobCreationStartedPayload,
  sessionId?: string
): Promise<void> {
  await recordEvent({
    eventName: JOB_EVENTS.CREATION_STARTED,
    companyId: payload.companyId,
    payload: { entry_point: payload.entryPoint },
    sessionId,
  });
}

/**
 * Record: Job published
 */
export async function recordJobPublished(
  payload: JobPublishedPayload,
  sessionId?: string
): Promise<void> {
  await recordEvent({
    eventName: JOB_EVENTS.PUBLISHED,
    jobId: payload.jobId,
    companyId: payload.companyId,
    payload: {
      publish_type: payload.publishType,
      role_category: payload.roleCategory,
      work_mode: payload.workMode,
      team_context: payload.teamContext,
    },
    sessionId,
  });
}

/**
 * Record: User clicked "Improve job details"
 */
export async function recordJobImproveClicked(
  payload: JobImproveClickedPayload,
  sessionId?: string
): Promise<void> {
  await recordEvent({
    eventName: JOB_EVENTS.IMPROVE_CLICKED,
    jobId: payload.jobId,
    companyId: payload.companyId,
    payload: { source: payload.source },
    sessionId,
  });
}

/**
 * Record: Professional module saved
 */
export async function recordJobModuleSaved(
  payload: JobModuleSavedPayload,
  sessionId?: string
): Promise<void> {
  await recordEvent({
    eventName: JOB_EVENTS.MODULE_SAVED,
    jobId: payload.jobId,
    companyId: payload.companyId,
    module: payload.module,
    sessionId,
  });
}

/**
 * Record: Job viewed
 */
export async function recordJobViewed(
  payload: JobViewedPayload,
  sessionId?: string
): Promise<void> {
  await recordEvent({
    eventName: JOB_EVENTS.VIEWED,
    jobId: payload.jobId,
    payload: { source: payload.source },
    isImproved: payload.isImproved,
    sessionId,
  });
}

/**
 * Record: Apply clicked
 */
export async function recordApplyClicked(
  payload: ApplyClickedPayload,
  sessionId?: string
): Promise<void> {
  await recordEvent({
    eventName: JOB_EVENTS.APPLY_CLICKED,
    jobId: payload.jobId,
    payload: { apply_method: payload.applyMethod },
    isImproved: payload.isImproved,
    sessionId,
  });
}

/**
 * Record: Application started
 */
export async function recordApplicationStarted(
  payload: ApplicationStartedPayload,
  sessionId?: string
): Promise<void> {
  await recordEvent({
    eventName: JOB_EVENTS.APPLICATION_STARTED,
    jobId: payload.jobId,
    isImproved: payload.fromImprovedJob,
    sessionId,
  });
}

// =============================================================================
// KPI QUERIES (For Internal Dashboard)
// =============================================================================

export interface JobAnalyticsKPIs {
  // Funnel metrics
  creationStarted: number;
  published: number;
  publishSuccessRate: number; // published / creationStarted

  // Improvement metrics
  jobsImproved: number;
  improvementAdoptionRate: number; // jobsImproved / published

  // Module breakdown
  modulesSaved: {
    skills: number;
    experience: number;
    work_style: number;
    team_snapshot: number;
    hiring_preferences: number;
  };

  // Apply metrics
  jobViews: number;
  improvedJobViews: number;
  applyClicks: number;
  improvedApplyClicks: number;
  applications: number;
  improvedApplications: number;

  // Conversion rates
  applyConversionRate: number; // applyClicks / jobViews
  improvedApplyConversionRate: number;
  applicationRate: number; // applications / applyClicks
  improvedApplicationRate: number;

  // Lift
  applyLiftPercent: number; // (improvedRate - quickRate) / quickRate * 100
}

/**
 * Get KPIs for a date range
 */
export async function getJobAnalyticsKPIs(
  startDate: Date,
  endDate: Date
): Promise<JobAnalyticsKPIs> {
  const [result] = await sql<[{
    creation_started: string;
    published: string;
    jobs_improved: string;
    skills_saved: string;
    experience_saved: string;
    work_style_saved: string;
    team_snapshot_saved: string;
    hiring_prefs_saved: string;
    job_views: string;
    improved_job_views: string;
    apply_clicks: string;
    improved_apply_clicks: string;
    applications: string;
    improved_applications: string;
  }]>`
    SELECT
      COUNT(*) FILTER (WHERE event_name = 'job_creation_started') as creation_started,
      COUNT(*) FILTER (WHERE event_name = 'job_published') as published,
      COUNT(DISTINCT job_id) FILTER (WHERE event_name = 'job_module_saved') as jobs_improved,
      COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'skills') as skills_saved,
      COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'experience') as experience_saved,
      COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'work_style') as work_style_saved,
      COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'team_snapshot') as team_snapshot_saved,
      COUNT(*) FILTER (WHERE event_name = 'job_module_saved' AND module = 'hiring_preferences') as hiring_prefs_saved,
      COUNT(*) FILTER (WHERE event_name = 'job_viewed') as job_views,
      COUNT(*) FILTER (WHERE event_name = 'job_viewed' AND is_improved = TRUE) as improved_job_views,
      COUNT(*) FILTER (WHERE event_name = 'apply_clicked') as apply_clicks,
      COUNT(*) FILTER (WHERE event_name = 'apply_clicked' AND is_improved = TRUE) as improved_apply_clicks,
      COUNT(*) FILTER (WHERE event_name = 'application_started') as applications,
      COUNT(*) FILTER (WHERE event_name = 'application_started' AND is_improved = TRUE) as improved_applications
    FROM job_analytics_events
    WHERE event_timestamp >= ${startDate.toISOString()}
      AND event_timestamp < ${endDate.toISOString()}
  `;

  const creationStarted = parseInt(result.creation_started) || 0;
  const published = parseInt(result.published) || 0;
  const jobsImproved = parseInt(result.jobs_improved) || 0;
  const jobViews = parseInt(result.job_views) || 0;
  const improvedJobViews = parseInt(result.improved_job_views) || 0;
  const applyClicks = parseInt(result.apply_clicks) || 0;
  const improvedApplyClicks = parseInt(result.improved_apply_clicks) || 0;
  const applications = parseInt(result.applications) || 0;
  const improvedApplications = parseInt(result.improved_applications) || 0;

  // Calculate rates
  const quickJobViews = jobViews - improvedJobViews;
  const quickApplyClicks = applyClicks - improvedApplyClicks;
  const quickApplications = applications - improvedApplications;

  const applyConversionRate = jobViews > 0 ? applyClicks / jobViews : 0;
  const improvedApplyConversionRate = improvedJobViews > 0 ? improvedApplyClicks / improvedJobViews : 0;
  const quickApplyConversionRate = quickJobViews > 0 ? quickApplyClicks / quickJobViews : 0;

  const applicationRate = applyClicks > 0 ? applications / applyClicks : 0;
  const improvedApplicationRate = improvedApplyClicks > 0 ? improvedApplications / improvedApplyClicks : 0;

  // Lift calculation
  const applyLiftPercent = quickApplyConversionRate > 0
    ? ((improvedApplyConversionRate - quickApplyConversionRate) / quickApplyConversionRate) * 100
    : 0;

  return {
    creationStarted,
    published,
    publishSuccessRate: creationStarted > 0 ? published / creationStarted : 0,
    jobsImproved,
    improvementAdoptionRate: published > 0 ? jobsImproved / published : 0,
    modulesSaved: {
      skills: parseInt(result.skills_saved) || 0,
      experience: parseInt(result.experience_saved) || 0,
      work_style: parseInt(result.work_style_saved) || 0,
      team_snapshot: parseInt(result.team_snapshot_saved) || 0,
      hiring_preferences: parseInt(result.hiring_prefs_saved) || 0,
    },
    jobViews,
    improvedJobViews,
    applyClicks,
    improvedApplyClicks,
    applications,
    improvedApplications,
    applyConversionRate,
    improvedApplyConversionRate,
    applicationRate,
    improvedApplicationRate,
    applyLiftPercent,
  };
}

/**
 * Get module impact analysis
 * Shows which modules correlate with higher conversion
 */
export async function getModuleImpactAnalysis(
  startDate: Date,
  endDate: Date
): Promise<Array<{
  module: string;
  jobsWithModule: number;
  applyClicks: number;
  applications: number;
  applyRate: number;
  applicationRate: number;
}>> {
  const results = await sql<Array<{
    module: string;
    jobs_with_module: string;
    apply_clicks: string;
    applications: string;
  }>>`
    WITH module_jobs AS (
      SELECT DISTINCT job_id, module
      FROM job_analytics_events
      WHERE event_name = 'job_module_saved'
        AND event_timestamp >= ${startDate.toISOString()}
        AND event_timestamp < ${endDate.toISOString()}
    ),
    job_metrics AS (
      SELECT
        job_id,
        COUNT(*) FILTER (WHERE event_name = 'apply_clicked') as apply_clicks,
        COUNT(*) FILTER (WHERE event_name = 'application_started') as applications
      FROM job_analytics_events
      WHERE event_timestamp >= ${startDate.toISOString()}
        AND event_timestamp < ${endDate.toISOString()}
      GROUP BY job_id
    )
    SELECT
      mj.module,
      COUNT(DISTINCT mj.job_id) as jobs_with_module,
      COALESCE(SUM(jm.apply_clicks), 0) as apply_clicks,
      COALESCE(SUM(jm.applications), 0) as applications
    FROM module_jobs mj
    LEFT JOIN job_metrics jm ON jm.job_id = mj.job_id
    GROUP BY mj.module
    ORDER BY apply_clicks DESC
  `;

  return results.map((r) => {
    const jobsWithModule = parseInt(r.jobs_with_module) || 0;
    const applyClicks = parseInt(r.apply_clicks) || 0;
    const applications = parseInt(r.applications) || 0;

    return {
      module: r.module,
      jobsWithModule,
      applyClicks,
      applications,
      applyRate: jobsWithModule > 0 ? applyClicks / jobsWithModule : 0,
      applicationRate: applyClicks > 0 ? applications / applyClicks : 0,
    };
  });
}

// Re-export the isJobImproved helper
export { isJobImproved };
