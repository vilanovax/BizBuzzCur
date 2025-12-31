'use client';

/**
 * Team Fit Insights Component
 *
 * Displays aggregated team-level insights for hiring managers.
 *
 * Design Principles:
 * - Aggregated data only, no individual exposure
 * - Text-based, no charts implying good/bad
 * - Calm, professional tone
 * - Decision-support, not decision-making
 * - Never shows scores, percentages, or rankings
 */

import { Users, Lightbulb, Info, AlertCircle, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TeamFitResult } from '@/lib/services/team-fit.service';

interface TeamFitInsightsProps {
  /** Team fit result from analyzeTeamFit service */
  result: TeamFitResult;
  /** Optional CSS class */
  className?: string;
  /** Whether to show the header label */
  showLabel?: boolean;
}

/**
 * Copy for the component
 * All in Persian to match the app
 */
const COPY = {
  label: 'بینش‌های تیمی',
  labelTooltip: 'این اطلاعات جمع‌بندی شده از تیم فعلی برای کمک به تصمیم‌گیری شماست',
  teamStrengthsLabel: 'ویژگی‌های تیم فعلی',
  teamGapsLabel: 'فرصت‌های تنوع',
  candidateLabel: 'نقش متقاضی',
  teamSizeLabel: (n: number) => `بر اساس ${n} عضو تیم`,
};

export function TeamFitInsights({
  result,
  className,
  showLabel = true,
}: TeamFitInsightsProps) {
  const {
    hasTeamData,
    teamOverview,
    teamStrengths,
    teamGaps,
    candidateContribution,
    confidenceNote,
    teamSizeAnalyzed,
  } = result;

  return (
    <div
      className={cn(
        'rounded-xl border bg-muted/30 p-4',
        className
      )}
    >
      {/* Header */}
      {showLabel && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {COPY.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground/60">
            {COPY.teamSizeLabel(teamSizeAnalyzed)}
          </span>
        </div>
      )}

      {/* Team Overview */}
      <p className="text-sm mb-4">{teamOverview}</p>

      {/* Team Strengths */}
      {hasTeamData && teamStrengths.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {COPY.teamStrengthsLabel}
            </span>
          </div>
          <ul className="space-y-1.5">
            {teamStrengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 mt-2 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Team Gaps / Balance Areas */}
      {hasTeamData && teamGaps.length > 0 && (
        <div className="mb-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 mb-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {COPY.teamGapsLabel}
            </span>
          </div>
          <ul className="space-y-1.5">
            {teamGaps.map((gap, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-2 flex-shrink-0" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Candidate Contribution */}
      <div className="pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 mb-2">
          <UserPlus className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">
            {COPY.candidateLabel}
          </span>
        </div>
        <p className="text-sm">{candidateContribution}</p>
      </div>

      {/* Confidence note - Only shown when data is limited */}
      {confidenceNote && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-xs text-muted-foreground">
              {confidenceNote}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for TeamFitInsights
 */
export function TeamFitInsightsSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-muted/30 p-4 animate-pulse',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted" />
          <div className="w-20 h-4 rounded bg-muted" />
        </div>
        <div className="w-24 h-3 rounded bg-muted" />
      </div>
      <div className="w-full h-4 rounded bg-muted mb-4" />
      <div className="space-y-2 mb-4">
        <div className="w-3/4 h-4 rounded bg-muted" />
        <div className="w-2/3 h-4 rounded bg-muted" />
      </div>
      <div className="pt-3 border-t border-border/50">
        <div className="w-1/2 h-4 rounded bg-muted" />
      </div>
    </div>
  );
}

export default TeamFitInsights;
