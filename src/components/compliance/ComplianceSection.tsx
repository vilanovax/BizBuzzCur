'use client';

/**
 * Compliance Section Component
 *
 * Expandable accordion section for compliance information.
 *
 * Design Principles:
 * - Text-first layout
 * - Neutral, calming colors
 * - No alarming icons
 * - Clear, readable content
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Database,
  ShieldOff,
  Lightbulb,
  Scale,
  Lock,
  AlertCircle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ComplianceSection as ComplianceSectionType, ComplianceSectionId } from '@/types/compliance';

interface ComplianceSectionProps {
  section: ComplianceSectionType;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Icon mapping for sections
 */
const SECTION_ICONS: Record<ComplianceSectionId, React.ElementType> = {
  what_we_use: Database,
  what_we_dont_use: ShieldOff,
  how_insights_work: Lightbulb,
  bias_safeguards: Scale,
  privacy_control: Lock,
  limitations: AlertCircle,
};

/**
 * Compliance Section Accordion
 */
export function ComplianceSection({
  section,
  defaultExpanded = false,
  className,
}: ComplianceSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const IconComponent = SECTION_ICONS[section.id];

  return (
    <div
      className={cn(
        'rounded-lg border bg-background overflow-hidden transition-shadow',
        expanded && 'shadow-sm',
        className
      )}
    >
      {/* Header - Clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-right hover:bg-muted/30 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-4.5 h-4.5 text-muted-foreground" />
          </div>
          <span className="font-medium">{section.title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Content - Expandable */}
      {expanded && (
        <div className="px-4 pb-4 border-t bg-muted/10">
          <div className="pt-4">
            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4">
              {section.description}
            </p>

            {/* Items list */}
            <ul className="space-y-2.5 mb-4">
              {section.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Note - highlighted */}
            {section.note && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm text-foreground/80">
                  {section.note}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for ComplianceSection
 */
export function ComplianceSectionSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-background p-4 animate-pulse',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted" />
        <div className="w-40 h-5 rounded bg-muted" />
      </div>
    </div>
  );
}

export default ComplianceSection;
