/**
 * Job Creation Event Tracking
 *
 * Telemetry exists to answer product questions, not to collect everything.
 *
 * Core Questions:
 * 1. Do companies successfully publish jobs?
 * 2. How many improve jobs after publishing?
 * 3. Does improving a job increase apply quality or conversion?
 * 4. Which modules actually matter?
 *
 * Privacy Rules:
 * - No candidate data
 * - No content text
 * - No behavioral inference about individuals
 * - Aggregate analysis only
 */

import type { TeamContext, LocationType, ApplyMethod } from '@/types/job';

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * Entry point for job creation
 */
export type JobCreationEntryPoint = 'dashboard' | 'jobs_tab' | 'company_page' | 'empty_state';

/**
 * Source of improvement click
 */
export type JobImproveSource = 'publish_success' | 'job_detail' | 'jobs_list';

/**
 * Professional job modules
 */
export type JobModule =
  | 'skills'
  | 'experience'
  | 'work_style'
  | 'team_snapshot'
  | 'hiring_preferences';

/**
 * Source of job view
 */
export type JobViewSource = 'job_board' | 'company_page' | 'event' | 'direct_link' | 'search';

// =============================================================================
// EVENT PAYLOADS
// =============================================================================

export interface JobCreationStartedPayload {
  companyId: string;
  entryPoint: JobCreationEntryPoint;
}

export interface JobPublishedPayload {
  jobId: string;
  companyId: string;
  publishType: 'quick';
  roleCategory?: string; // domain name
  workMode?: LocationType;
  teamContext?: TeamContext;
}

export interface JobImproveClickedPayload {
  jobId: string;
  companyId: string;
  source: JobImproveSource;
}

export interface JobModuleSavedPayload {
  jobId: string;
  companyId: string;
  module: JobModule;
}

export interface JobViewedPayload {
  jobId: string;
  source: JobViewSource;
  isImproved: boolean;
}

export interface ApplyClickedPayload {
  jobId: string;
  isImproved: boolean;
  applyMethod: ApplyMethod;
}

export interface ApplicationStartedPayload {
  jobId: string;
  fromImprovedJob: boolean;
}

// =============================================================================
// EVENT NAMES (snake_case as per convention)
// =============================================================================

export const JOB_EVENTS = {
  CREATION_STARTED: 'job_creation_started',
  PUBLISHED: 'job_published',
  IMPROVE_CLICKED: 'job_improve_clicked',
  MODULE_SAVED: 'job_module_saved',
  VIEWED: 'job_viewed',
  APPLY_CLICKED: 'apply_clicked',
  APPLICATION_STARTED: 'application_started',
} as const;

export type JobEventName = (typeof JOB_EVENTS)[keyof typeof JOB_EVENTS];

// =============================================================================
// EVENT TRACKING FUNCTIONS
// =============================================================================

/**
 * Generic track function interface
 * This should be implemented by the actual analytics provider (e.g., Mixpanel, Amplitude, PostHog)
 */
type TrackFunction = (eventName: string, payload: Record<string, unknown>) => void;

// Default no-op tracker (replaced at runtime)
let trackFn: TrackFunction = () => {};

/**
 * Initialize the analytics tracker
 * Call this once at app startup with your analytics provider
 */
export function initJobAnalytics(tracker: TrackFunction): void {
  trackFn = tracker;
}

/**
 * Track: Job creation flow started
 * Triggered when user enters Quick Job flow
 */
export function trackJobCreationStarted(payload: JobCreationStartedPayload): void {
  trackFn(JOB_EVENTS.CREATION_STARTED, {
    company_id: payload.companyId,
    entry_point: payload.entryPoint,
  });
}

/**
 * Track: Job published (Quick Job completed)
 * Triggered when Quick Job is published
 */
export function trackJobPublished(payload: JobPublishedPayload): void {
  trackFn(JOB_EVENTS.PUBLISHED, {
    job_id: payload.jobId,
    company_id: payload.companyId,
    publish_type: payload.publishType,
    role_category: payload.roleCategory || null,
    work_mode: payload.workMode || null,
    team_context: payload.teamContext || null,
  });
}

/**
 * Track: User clicked "Improve job details"
 * Triggered when user enters Phase 2
 */
export function trackJobImproveClicked(payload: JobImproveClickedPayload): void {
  trackFn(JOB_EVENTS.IMPROVE_CLICKED, {
    job_id: payload.jobId,
    company_id: payload.companyId,
    source: payload.source,
  });
}

/**
 * Track: Professional module saved
 * Triggered when any Phase 2 module is saved
 * One event per module save
 */
export function trackJobModuleSaved(payload: JobModuleSavedPayload): void {
  trackFn(JOB_EVENTS.MODULE_SAVED, {
    job_id: payload.jobId,
    company_id: payload.companyId,
    module: payload.module,
  });
}

/**
 * Track: Job detail page viewed
 * Triggered when job detail is viewed
 */
export function trackJobViewed(payload: JobViewedPayload): void {
  trackFn(JOB_EVENTS.VIEWED, {
    job_id: payload.jobId,
    source: payload.source,
    is_improved: payload.isImproved,
  });
}

/**
 * Track: Apply button clicked
 * Triggered when Apply CTA is clicked
 */
export function trackApplyClicked(payload: ApplyClickedPayload): void {
  trackFn(JOB_EVENTS.APPLY_CLICKED, {
    job_id: payload.jobId,
    is_improved: payload.isImproved,
    apply_method: payload.applyMethod,
  });
}

/**
 * Track: Application started (conversation created)
 * Triggered when a conversation is created for job application
 */
export function trackApplicationStarted(payload: ApplicationStartedPayload): void {
  trackFn(JOB_EVENTS.APPLICATION_STARTED, {
    job_id: payload.jobId,
    from_improved_job: payload.fromImprovedJob,
  });
}

// =============================================================================
// HELPER: Check if job is "improved"
// =============================================================================

/**
 * Check if a job has been improved (has ≥1 Phase 2 module filled)
 * Used for isImproved flag in events
 */
export function isJobImproved(job: {
  workstyle_expectations?: unknown;
  team_snapshot?: unknown;
  hiring_preferences?: unknown;
  required_skills?: string[];
  experience_level?: string;
}): boolean {
  return !!(
    job.workstyle_expectations ||
    job.team_snapshot ||
    job.hiring_preferences ||
    (job.required_skills && job.required_skills.length > 0) ||
    job.experience_level
  );
}

// =============================================================================
// FUNNEL DEFINITION (Reference)
// =============================================================================

/**
 * Job Creation Funnel:
 *
 * job_creation_started
 *   → job_published
 *     → job_improve_clicked
 *       → job_module_saved (per module)
 *         → [job_improved] (derived: ≥1 module saved)
 *           → job_viewed
 *             → apply_clicked
 *               → application_started
 *
 * KPIs (Derived - Do NOT Track Directly):
 *
 * A. Publish Success
 *    = job_published / job_creation_started
 *    Target ≥ 80%
 *
 * B. Improvement Adoption
 *    = job_improved / job_published
 *    Target ≥ 30%
 *
 * C. Apply Conversion Lift
 *    = apply_clicked (improved) vs apply_clicked (quick-only)
 *
 * D. Application Quality Proxy
 *    = application_started / apply_clicked
 *    (segmented by improved vs not)
 */
