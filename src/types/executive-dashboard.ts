/**
 * Executive Job Quality Dashboard Types
 *
 * For executives and decision-makers.
 * NOT an operational dashboard.
 * NOT a real-time monitoring tool.
 *
 * Purpose: Answer "Are our job posts attracting the right people?"
 */

// =============================================================================
// JOB QUALITY INDEX
// =============================================================================

/**
 * Qualitative labels only - no scores, no percentages
 */
export type JobQualityStatus = 'improving' | 'stable' | 'needs_attention';

export interface JobQualityOverview {
  /** Qualitative status label */
  status: JobQualityStatus;
  /** Supporting context (never a score) */
  context: string;
}

// =============================================================================
// PUBLISH → IMPROVE FUNNEL
// =============================================================================

export interface FunnelStep {
  /** Step name for display */
  name: string;
  /** Absolute count */
  count: number;
  /** Trend compared to previous period: up, down, stable */
  trend: 'up' | 'down' | 'stable';
  /** Optional: percentage change (for internal use, not displayed) */
  changePercent?: number;
}

export interface PublishImproveFunnel {
  steps: FunnelStep[];
  /** Copy for the funnel section */
  copy: string;
}

// =============================================================================
// IMPACT OF IMPROVEMENT
// =============================================================================

export interface JobTypeComparison {
  /** Quick jobs (no Phase 2 data) */
  quickJobs: {
    avgAppliesPerJob: number;
    applicationStartedRate: number;
    avgTimeToFirstApplication: number | null; // in hours
  };
  /** Improved jobs (has Phase 2 data) */
  improvedJobs: {
    avgAppliesPerJob: number;
    applicationStartedRate: number;
    avgTimeToFirstApplication: number | null; // in hours
  };
  /** Whether improvement shows positive impact */
  showsPositiveImpact: boolean;
  /** Copy to display */
  copy: string;
}

// =============================================================================
// MODULE IMPACT SUMMARY
// =============================================================================

export type AdoptionLevel = 'low' | 'medium' | 'high';
export type ImpactIndicator = 'positive' | 'neutral' | 'unknown';

export interface ModuleImpact {
  /** Module identifier */
  module: string;
  /** Display name (Persian) */
  displayName: string;
  /** Adoption level across jobs */
  adoptionLevel: AdoptionLevel;
  /** Impact on outcomes */
  impactIndicator: ImpactIndicator;
}

export interface ModuleImpactSummary {
  modules: ModuleImpact[];
  /** Copy for the section */
  copy: string;
}

// =============================================================================
// TREND OVER TIME
// =============================================================================

export interface TrendDataPoint {
  /** Date label (e.g., "۱۵ آذر") */
  date: string;
  /** Value for this date */
  value: number;
}

export interface JobClarityTrend {
  /** Trend data points */
  data: TrendDataPoint[];
  /** Time range: 30, 60, or 90 days */
  timeRange: 30 | 60 | 90;
  /** Copy for the section */
  copy: string;
}

// =============================================================================
// GUIDANCE & RECOMMENDATIONS
// =============================================================================

export interface Recommendation {
  /** Recommendation text (Persian) */
  text: string;
  /** Optional: action to take */
  action?: string;
}

export interface GuidanceSection {
  /** Auto-generated insights (1-2 max) */
  recommendations: Recommendation[];
}

// =============================================================================
// FULL DASHBOARD DATA
// =============================================================================

export interface ExecutiveDashboardData {
  /** Company ID */
  companyId: string;
  /** Time range for the data */
  timeRange: {
    startDate: string;
    endDate: string;
  };
  /** 1. Job Quality Overview */
  qualityOverview: JobQualityOverview;
  /** 2. Publish → Improve Funnel */
  funnel: PublishImproveFunnel;
  /** 3. Impact of Improvement */
  impactComparison: JobTypeComparison;
  /** 4. Module Impact Summary */
  moduleImpact: ModuleImpactSummary;
  /** 5. Trend Over Time */
  clarityTrend: JobClarityTrend;
  /** 6. Guidance & Recommendations */
  guidance: GuidanceSection;
}

// =============================================================================
// LABELS (Persian)
// =============================================================================

export const JOB_QUALITY_STATUS_LABELS: Record<JobQualityStatus, string> = {
  improving: 'در حال بهبود',
  stable: 'ثابت',
  needs_attention: 'نیاز به توجه',
};

export const ADOPTION_LEVEL_LABELS: Record<AdoptionLevel, string> = {
  low: 'پایین',
  medium: 'متوسط',
  high: 'بالا',
};

export const IMPACT_INDICATOR_LABELS: Record<ImpactIndicator, string> = {
  positive: 'مثبت',
  neutral: 'خنثی',
  unknown: 'نامشخص',
};

export const MODULE_DISPLAY_NAMES: Record<string, string> = {
  work_style: 'انتظارات سبک کاری',
  skills: 'مهارت‌ها',
  experience: 'سطح تجربه',
  team_snapshot: 'اطلاعات تیم',
  hiring_preferences: 'تنظیمات استخدام',
};

// =============================================================================
// DASHBOARD COPY (Persian)
// =============================================================================

export const EXECUTIVE_DASHBOARD_COPY = {
  header: {
    title: 'کیفیت آگهی‌های شغلی',
    subtitle: 'وضعیت کلی شفافیت و اثربخشی آگهی‌های استخدامی شما',
    badge: 'نمای مدیریتی',
  },
  qualityOverview: {
    title: 'شاخص کیفیت آگهی',
    description: 'شفافیت و اثربخشی کلی آگهی‌های شغلی شما',
  },
  funnel: {
    title: 'مسیر انتشار تا بهبود',
    description: 'جایی که کیفیت آگهی‌ها شفاف‌تر می‌شود',
  },
  impact: {
    title: 'تأثیر بهبود آگهی',
    description: 'آگهی‌های با جزئیات بیشتر، متقاضیان مرتبط‌تری جذب می‌کنند',
  },
  modules: {
    title: 'تأثیر ماژول‌ها',
    description: 'کدام جزئیات بیشترین تفاوت را ایجاد می‌کنند',
  },
  trend: {
    title: 'روند شفافیت آگهی‌ها',
    description: 'درصد آگهی‌های بهبودیافته در طول زمان',
  },
  guidance: {
    title: 'توصیه‌ها',
    description: 'پیشنهادات برای بهبود کیفیت آگهی‌ها',
  },
  emptyState: {
    title: 'داده‌ای برای نمایش وجود ندارد',
    description: 'هنوز آگهی شغلی منتشر نشده یا داده کافی جمع‌آوری نشده است.',
  },
};
