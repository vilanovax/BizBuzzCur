'use client';

/**
 * Candidate Fit Insights Component
 *
 * Displays "Why this candidate?" insights for hiring teams.
 *
 * Design Principles:
 * - Text-based, no charts or graphs
 * - Bulleted format for easy scanning
 * - Calm, professional tone
 * - No colors implying good/bad (no green/red)
 * - Never shows scores, percentages, or rankings
 * - Framed as context, not recommendation
 */

import { Lightbulb, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { CandidateFitResult } from '@/lib/services/candidate-match.service';

interface CandidateFitInsightsProps {
  /** Fit result from matchCandidate service */
  fitResult: CandidateFitResult;
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
  label: 'بینش‌های تطابق',
  labelTooltip: 'این اطلاعات برای کمک به تصمیم‌گیری شماست، نه جایگزین آن',
  strengthsLabel: 'نقاط قوت بالقوه',
  considerationsLabel: 'نکات قابل توجه',
  signalsNote: 'بر اساس ترجیحات کاری',
  skillsNote: 'بر اساس مهارت‌ها',
  applicationNote: 'بر اساس درخواست',
};

export function CandidateFitInsights({
  fitResult,
  className,
  showLabel = true,
}: CandidateFitInsightsProps) {
  const { fitSummary, strengths, considerations, confidenceNote, insightType } = fitResult;

  // Don't render if no meaningful insights
  if (strengths.length === 0 && considerations.length === 0) {
    return null;
  }

  // Get insight source note
  const getSourceNote = () => {
    switch (insightType) {
      case 'signals':
        return COPY.signalsNote;
      case 'skills':
        return COPY.skillsNote;
      case 'application':
        return COPY.applicationNote;
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-muted/30 p-4',
        className
      )}
    >
      {/* Header */}
      {showLabel && (
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {COPY.label}
          </span>
          <span className="text-xs text-muted-foreground/60">
            ({getSourceNote()})
          </span>
        </div>
      )}

      {/* Summary */}
      <p className="text-sm mb-4">{fitSummary}</p>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="mb-3">
          <ul className="space-y-1.5">
            {strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 mt-2 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Considerations - Framed as opportunities, not blockers */}
      {considerations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 mb-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {COPY.considerationsLabel}
            </span>
          </div>
          <ul className="space-y-1.5">
            {considerations.map((consideration, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-2 flex-shrink-0" />
                <span>{consideration}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence note - Only shown when confidence is low */}
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
 * Skeleton loader for CandidateFitInsights
 */
export function CandidateFitInsightsSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-muted/30 p-4 animate-pulse',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded bg-muted" />
        <div className="w-24 h-4 rounded bg-muted" />
      </div>
      <div className="w-full h-4 rounded bg-muted mb-4" />
      <div className="space-y-2">
        <div className="w-3/4 h-4 rounded bg-muted" />
        <div className="w-2/3 h-4 rounded bg-muted" />
      </div>
    </div>
  );
}

export default CandidateFitInsights;
