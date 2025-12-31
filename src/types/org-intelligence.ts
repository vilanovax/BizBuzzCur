/**
 * Org-Level Intelligence Types
 *
 * Provides aggregated, department- and unit-level insights
 * about work styles, collaboration patterns, and team balance.
 *
 * This is NOT:
 * - Individual analytics
 * - Performance measurement
 * - Organizational surveillance
 *
 * This IS:
 * - Organizational insight layer for better team design
 * - Aggregated and non-judgmental
 * - Decision-support for org planning
 */

/**
 * Minimum sample size for meaningful aggregation
 */
export const MIN_UNIT_SAMPLE_SIZE = 5;

/**
 * Time window for signal relevance (in months)
 */
export const SIGNAL_TIME_WINDOW_MONTHS = 12;

/**
 * Work style tendency derived from aggregated signals
 */
export interface WorkStyleTendency {
  /** Human-readable description of the tendency */
  description: string;
  /** Category of work style */
  category: 'work_style' | 'collaboration' | 'decision_making' | 'motivation' | 'environment';
  /** Strength of tendency (qualitative, not a score) */
  strength: 'moderate' | 'strong';
}

/**
 * Collaboration pattern for a unit
 */
export interface CollaborationPattern {
  /** Pattern description */
  description: string;
  /** Type of pattern */
  type: 'communication' | 'decision' | 'teamwork' | 'leadership';
}

/**
 * Unit (Department) summary
 */
export interface UnitSummary {
  /** Unit/Department ID */
  unitId: string;
  /** Unit/Department name */
  unitName: string;
  /** Number of members with signal data */
  memberCount: number;
  /** Whether there's enough data for insights */
  hasEnoughData: boolean;
  /** Dominant work-style tendencies (2-3 max) */
  tendencies: WorkStyleTendency[];
  /** Collaboration pattern */
  collaborationPattern?: CollaborationPattern;
  /** Confidence note if data is limited */
  confidenceNote?: string;
}

/**
 * Cross-unit pattern (differences or complementarities)
 */
export interface CrossUnitPattern {
  /** Pattern description */
  description: string;
  /** Units involved */
  unitNames: string[];
  /** Type of pattern */
  type: 'similarity' | 'complement' | 'difference';
}

/**
 * Hiring implication derived from org patterns
 */
export interface HiringImplication {
  /** Implication description (uses "may", "could", "consider") */
  description: string;
  /** Related unit(s) */
  unitNames?: string[];
  /** Priority level */
  priority: 'suggestion' | 'consideration';
}

/**
 * Complete org intelligence result
 */
export interface OrgIntelligenceResult {
  /** Whether org has enough data overall */
  hasOrgData: boolean;
  /** Top-level organization summary */
  orgOverview: string;
  /** Per-department/unit summaries */
  unitSummaries: UnitSummary[];
  /** Cross-unit patterns (optional) */
  crossUnitPatterns: CrossUnitPattern[];
  /** Hiring implications (optional) */
  hiringImplications: HiringImplication[];
  /** Confidence note (if data is limited) */
  confidenceNote?: string;
  /** Total members analyzed */
  totalMembersAnalyzed: number;
  /** Number of units with sufficient data */
  unitsWithData: number;
}

/**
 * Org context for intelligence analysis
 */
export interface OrgContext {
  /** Company ID */
  companyId: string;
  /** Company name */
  companyName?: string;
  /** Company size category */
  companySize?: string;
  /** Industry */
  industry?: string;
}

/**
 * Copy for Org Intelligence UI
 */
export const ORG_INTELLIGENCE_COPY = {
  // Section labels
  sectionLabel: 'بینش‌های سازمانی',
  unitSummariesLabel: 'خلاصه واحدها',
  crossUnitLabel: 'الگوهای میان‌واحدی',
  hiringLabel: 'نکات استخدامی',

  // Empty states
  noDataYet: 'بینش‌های سازمانی با رشد تیم‌ها نمایش داده خواهند شد.',
  insufficientData: 'داده کافی برای تحلیل موجود نیست.',
  needMoreMembers: (needed: number) => `حداقل ${needed} عضو با پروفایل کاری برای تحلیل لازم است.`,

  // Confidence notes
  limitedData: 'این بینش‌ها بر اساس داده‌های جمع‌آوری شده هستند و باید به عنوان راهنمای جهت‌دار تفسیر شوند.',
  partialData: 'برخی واحدها داده کافی ندارند و در تحلیل لحاظ نشده‌اند.',

  // Tooltips
  orgOverviewTooltip: 'خلاصه کلی از سبک‌های کاری در سازمان',
  unitSummaryTooltip: 'ویژگی‌های کاری غالب در این واحد',
  crossUnitTooltip: 'تفاوت‌ها و مکمل‌های میان واحدها',
};

/**
 * Work style category labels (Persian)
 */
export const WORK_STYLE_CATEGORY_LABELS: Record<WorkStyleTendency['category'], string> = {
  work_style: 'سبک کار',
  collaboration: 'همکاری',
  decision_making: 'تصمیم‌گیری',
  motivation: 'انگیزش',
  environment: 'محیط کار',
};

/**
 * Pattern type labels (Persian)
 */
export const PATTERN_TYPE_LABELS: Record<CrossUnitPattern['type'], string> = {
  similarity: 'شباهت',
  complement: 'مکمل',
  difference: 'تفاوت',
};
