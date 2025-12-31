'use client';

/**
 * Premium Gate Component
 *
 * Soft upsell component that shows premium value without blocking.
 *
 * Design Principles:
 * - Never block basic functionality
 * - Show value, not restrictions
 * - Outcome-focused messaging
 * - Appears after meaningful usage
 */

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import {
  PREMIUM_CTA_COPY,
  TIER_LABELS,
  type PremiumTier,
  type PremiumFeature,
} from '@/types/premium';

interface PremiumGateProps {
  /** Current user's tier */
  currentTier: PremiumTier;
  /** Feature being gated */
  feature: PremiumFeature;
  /** Required tier for this feature */
  requiredTier: PremiumTier;
  /** Custom title override */
  title?: string;
  /** Custom description override */
  description?: string;
  /** Whether to show as inline (compact) or card (prominent) */
  variant?: 'inline' | 'card' | 'banner';
  /** Children to show when user has access */
  children?: React.ReactNode;
  /** Callback when upgrade is clicked */
  onUpgradeClick?: () => void;
  /** Optional CSS class */
  className?: string;
}

/**
 * Feature-specific messaging
 */
const FEATURE_MESSAGES: Record<string, { title: string; description: string }> = {
  team_fit_detailed: {
    title: 'مشاهده الگوهای تیمی کامل',
    description: 'با ارتقا، الگوهای کاری تیم و نحوه تکمیل آن توسط کاندیدا را ببینید.',
  },
  candidate_insights_expanded: {
    title: 'دریافت تحلیل کامل‌تر',
    description: 'با ارتقا، زمینه بیشتری درباره هماهنگی کاندیدا با نقش دریافت کنید.',
  },
  kpi_trends: {
    title: 'مشاهده روند تصمیم‌گیری',
    description: 'ببینید چگونه تصمیمات استخدامی شما در طول زمان تغییر می‌کند.',
  },
  job_alignment_insights: {
    title: 'بهینه‌سازی آگهی‌های شغلی',
    description: 'بفهمید کدام آگهی‌ها کاندیداهای هماهنگ‌تر جذب می‌کنند.',
  },
  team_org_patterns: {
    title: 'بینش‌های سازمانی',
    description: 'الگوهای کاری در سطح سازمان و واحدها را مشاهده کنید.',
  },
};

/**
 * Inline premium indicator - minimal, non-intrusive
 */
function InlineGate({
  title,
  description,
  requiredTier,
  onUpgradeClick,
  className,
}: {
  title: string;
  description: string;
  requiredTier: PremiumTier;
  onUpgradeClick?: () => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('rounded-lg border border-primary/20 bg-primary/5 p-3', className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-right"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            {TIER_LABELS[requiredTier]}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-primary/10">
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          <Button size="sm" onClick={onUpgradeClick}>
            {PREMIUM_CTA_COPY.primary}
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Card premium gate - more prominent, for major features
 */
function CardGate({
  title,
  description,
  requiredTier,
  onUpgradeClick,
  className,
}: {
  title: string;
  description: string;
  requiredTier: PremiumTier;
  onUpgradeClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-5',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{title}</h4>
            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {TIER_LABELS[requiredTier]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>

          {/* Value props */}
          <ul className="space-y-1.5 mb-4">
            {PREMIUM_CTA_COPY.valueProps.slice(0, 2).map((prop, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <Check className="w-3.5 h-3.5 text-primary" />
                <span>{prop}</span>
              </li>
            ))}
          </ul>

          <Button onClick={onUpgradeClick}>
            {PREMIUM_CTA_COPY.primary}
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Banner premium gate - subtle top banner
 */
function BannerGate({
  title,
  onUpgradeClick,
  className,
}: {
  title: string;
  onUpgradeClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2 rounded-lg bg-primary/5 border border-primary/20',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm">{title}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={onUpgradeClick}>
        {PREMIUM_CTA_COPY.secondary}
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
      </Button>
    </div>
  );
}

/**
 * Main PremiumGate component
 *
 * Usage:
 * <PremiumGate
 *   currentTier="free"
 *   feature="team_fit_detailed"
 *   requiredTier="starter"
 *   variant="inline"
 * >
 *   <DetailedTeamFitInsights />
 * </PremiumGate>
 */
export function PremiumGate({
  currentTier,
  feature,
  requiredTier,
  title,
  description,
  variant = 'inline',
  children,
  onUpgradeClick,
  className,
}: PremiumGateProps) {
  // Check if user has access
  const tierOrder: PremiumTier[] = ['free', 'starter', 'professional', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);
  const hasAccess = currentIndex >= requiredIndex;

  // If user has access, show children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Get messaging
  const featureMessage = FEATURE_MESSAGES[feature];
  const displayTitle = title || featureMessage?.title || PREMIUM_CTA_COPY.primary;
  const displayDescription = description || featureMessage?.description || PREMIUM_CTA_COPY.secondary;

  // Handle upgrade click
  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Default: navigate to pricing page (future)
      window.location.href = '/pricing';
    }
  };

  // Render based on variant
  switch (variant) {
    case 'card':
      return (
        <CardGate
          title={displayTitle}
          description={displayDescription}
          requiredTier={requiredTier}
          onUpgradeClick={handleUpgrade}
          className={className}
        />
      );
    case 'banner':
      return (
        <BannerGate
          title={displayTitle}
          onUpgradeClick={handleUpgrade}
          className={className}
        />
      );
    default:
      return (
        <InlineGate
          title={displayTitle}
          description={displayDescription}
          requiredTier={requiredTier}
          onUpgradeClick={handleUpgrade}
          className={className}
        />
      );
  }
}

/**
 * Hook to check premium access
 */
export function usePremiumAccess(
  currentTier: PremiumTier,
  requiredTier: PremiumTier
): boolean {
  const tierOrder: PremiumTier[] = ['free', 'starter', 'professional', 'enterprise'];
  return tierOrder.indexOf(currentTier) >= tierOrder.indexOf(requiredTier);
}

export default PremiumGate;
