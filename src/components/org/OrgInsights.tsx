'use client';

/**
 * Org-Level Intelligence Component
 *
 * Displays aggregated organizational insights for company owners/admins.
 *
 * Design Principles:
 * - Aggregated data only, no individual exposure
 * - Text-based, no charts or scores
 * - Calm, professional tone
 * - Supports reflection and planning, not enforcement
 * - Never shows rankings or comparisons between individuals
 */

import { useState } from 'react';
import {
  Building2,
  Users,
  ArrowLeftRight,
  Briefcase,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type {
  OrgIntelligenceResult,
  UnitSummary,
  CrossUnitPattern,
  HiringImplication,
} from '@/types/org-intelligence';
import {
  ORG_INTELLIGENCE_COPY,
  WORK_STYLE_CATEGORY_LABELS,
  PATTERN_TYPE_LABELS,
} from '@/types/org-intelligence';

interface OrgInsightsProps {
  /** Org intelligence result from analyzeOrgIntelligence service */
  result: OrgIntelligenceResult;
  /** Optional CSS class */
  className?: string;
}

/**
 * Unit Summary Card - Collapsible
 */
function UnitSummaryCard({
  unit,
  defaultExpanded = false,
}: {
  unit: UnitSummary;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-lg border bg-background/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-right hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{unit.unitName}</span>
          <span className="text-xs text-muted-foreground">
            ({unit.memberCount} نفر)
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t">
          {!unit.hasEnoughData ? (
            <p className="text-sm text-muted-foreground py-3">
              {ORG_INTELLIGENCE_COPY.insufficientData}
            </p>
          ) : (
            <div className="pt-3 space-y-3">
              {/* Tendencies */}
              {unit.tendencies.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    ویژگی‌های غالب:
                  </span>
                  <ul className="mt-1.5 space-y-1.5">
                    {unit.tendencies.map((tendency, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 mt-2 flex-shrink-0" />
                        <span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-1">
                            {WORK_STYLE_CATEGORY_LABELS[tendency.category]}
                          </span>
                          {tendency.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Collaboration Pattern */}
              {unit.collaborationPattern && (
                <div className="pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    الگوی همکاری:
                  </span>
                  <p className="text-sm mt-1">
                    {unit.collaborationPattern.description}
                  </p>
                </div>
              )}

              {/* Confidence Note */}
              {unit.confidenceNote && (
                <div className="flex items-start gap-2 pt-2">
                  <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {unit.confidenceNote}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Cross-Unit Pattern Item
 */
function CrossUnitPatternItem({ pattern }: { pattern: CrossUnitPattern }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 mt-2 flex-shrink-0" />
      <div>
        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground ml-1">
          {PATTERN_TYPE_LABELS[pattern.type]}
        </span>
        <span>{pattern.description}</span>
        <span className="text-xs text-muted-foreground mr-1">
          ({pattern.unitNames.join('، ')})
        </span>
      </div>
    </div>
  );
}

/**
 * Hiring Implication Item
 */
function HiringImplicationItem({
  implication,
}: {
  implication: HiringImplication;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0',
          implication.priority === 'suggestion'
            ? 'bg-primary/60'
            : 'bg-muted-foreground/40'
        )}
      />
      <div>
        <span>{implication.description}</span>
        {implication.unitNames && implication.unitNames.length > 0 && (
          <span className="text-xs text-muted-foreground mr-1">
            ({implication.unitNames.join('، ')})
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Main OrgInsights Component
 */
export function OrgInsights({ result, className }: OrgInsightsProps) {
  const {
    hasOrgData,
    orgOverview,
    unitSummaries,
    crossUnitPatterns,
    hiringImplications,
    confidenceNote,
    totalMembersAnalyzed,
    unitsWithData,
  } = result;

  // Empty state
  if (!hasOrgData) {
    return (
      <div
        className={cn(
          'rounded-xl border bg-muted/30 p-6 text-center',
          className
        )}
      >
        <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          {ORG_INTELLIGENCE_COPY.noDataYet}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">{ORG_INTELLIGENCE_COPY.sectionLabel}</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{totalMembersAnalyzed} نفر تحلیل شده</span>
          <span>•</span>
          <span>{unitsWithData} واحد</span>
        </div>
      </div>

      {/* Org Overview */}
      <div className="rounded-xl border bg-muted/30 p-4">
        <p className="text-sm leading-relaxed">{orgOverview}</p>
      </div>

      {/* Unit Summaries */}
      {unitSummaries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {ORG_INTELLIGENCE_COPY.unitSummariesLabel}
            </span>
          </div>
          <div className="space-y-2">
            {unitSummaries.map((unit) => (
              <UnitSummaryCard
                key={unit.unitId}
                unit={unit}
                defaultExpanded={unitSummaries.length <= 3}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cross-Unit Patterns */}
      {crossUnitPatterns.length > 0 && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {ORG_INTELLIGENCE_COPY.crossUnitLabel}
            </span>
          </div>
          <div className="space-y-2">
            {crossUnitPatterns.map((pattern, idx) => (
              <CrossUnitPatternItem key={idx} pattern={pattern} />
            ))}
          </div>
        </div>
      )}

      {/* Hiring Implications */}
      {hiringImplications.length > 0 && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {ORG_INTELLIGENCE_COPY.hiringLabel}
            </span>
          </div>
          <div className="space-y-2">
            {hiringImplications.map((implication, idx) => (
              <HiringImplicationItem key={idx} implication={implication} />
            ))}
          </div>
        </div>
      )}

      {/* Confidence Note */}
      {confidenceNote && (
        <div className="flex items-start gap-2 px-1">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-xs text-muted-foreground">{confidenceNote}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for OrgInsights
 */
export function OrgInsightsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-muted" />
          <div className="w-32 h-5 rounded bg-muted" />
        </div>
        <div className="w-28 h-4 rounded bg-muted" />
      </div>

      {/* Overview */}
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="w-full h-4 rounded bg-muted mb-2" />
        <div className="w-3/4 h-4 rounded bg-muted" />
      </div>

      {/* Unit cards */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-background/50 p-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted" />
              <div className="w-24 h-4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrgInsights;
