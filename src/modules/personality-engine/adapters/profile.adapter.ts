/**
 * Profile Adapter
 *
 * Transforms profile-related data between BizBuzz and the engine.
 */

import type { Signal } from '../contracts/signal.schema';

/**
 * Profile insight derived from signals
 */
export interface ProfileInsight {
  /** Signal category this insight belongs to */
  category: string;
  /** User-friendly title (Persian) */
  title: string;
  /** Description of the insight (Persian) */
  description: string;
  /** Strength of this trait (0-100) */
  strength: number;
  /** Whether this is a notable trait worth highlighting */
  isNotable: boolean;
}

/**
 * Profile work style summary
 */
export interface WorkStyleSummary {
  /** Primary work style traits */
  primaryTraits: string[];
  /** Preferred collaboration mode */
  collaborationMode: 'independent' | 'team_oriented' | 'balanced';
  /** Decision making approach */
  decisionApproach: 'analytical' | 'intuitive' | 'balanced';
  /** Work environment preference */
  environmentPreference: 'structured' | 'flexible' | 'balanced';
}

/**
 * Adapter for profile-related transformations
 */
export const ProfileAdapter = {
  /**
   * Generate profile insights from signals
   */
  generateInsights(signals: Signal[]): ProfileInsight[] {
    const insights: ProfileInsight[] = [];

    for (const signal of signals) {
      // Only create insights for notable signals
      if (Math.abs(signal.value) < 0.3) continue;

      const insight = signalToInsight(signal);
      if (insight) {
        insights.push(insight);
      }
    }

    // Sort by strength and limit to top insights
    return insights
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 8);
  },

  /**
   * Generate work style summary from signals
   */
  generateWorkStyleSummary(signals: Signal[]): WorkStyleSummary {
    const signalMap = new Map(signals.map((s) => [s.id, s]));

    return {
      primaryTraits: extractPrimaryTraits(signals),
      collaborationMode: determineCollaborationMode(signalMap),
      decisionApproach: determineDecisionApproach(signalMap),
      environmentPreference: determineEnvironmentPreference(signalMap),
    };
  },

  /**
   * Get signals relevant for profile display
   */
  getDisplayableSignals(signals: Signal[]): Signal[] {
    // Filter to signals worth showing on profile
    return signals.filter((s) => {
      // Must have decent confidence
      if (s.confidence < 0.5) return false;
      // Must be notable (not neutral)
      if (Math.abs(s.value) < 0.2) return false;
      return true;
    });
  },
};

/**
 * Convert a signal to a user-friendly insight
 */
function signalToInsight(signal: Signal): ProfileInsight | null {
  const strength = Math.round(Math.abs(signal.value) * 100);
  const isPositive = signal.value > 0;

  // Map signals to Persian descriptions
  const insightMap: Record<string, { pos: { title: string; desc: string }; neg: { title: string; desc: string } }> = {
    leadership_tendency: {
      pos: { title: 'رهبری طبیعی', desc: 'تمایل به هدایت تیم و تصمیم‌گیری' },
      neg: { title: 'پشتیبانی تیم', desc: 'ترجیح نقش حمایتی و همکاری' },
    },
    collaboration_style: {
      pos: { title: 'تیم‌محور', desc: 'انرژی‌گرفتن از کار گروهی' },
      neg: { title: 'مستقل', desc: 'بهترین عملکرد در کار فردی' },
    },
    decision_style: {
      pos: { title: 'تحلیل‌گر', desc: 'تصمیم‌گیری مبتنی بر داده و منطق' },
      neg: { title: 'شهودی', desc: 'تصمیم‌گیری سریع بر اساس تجربه' },
    },
    risk_tolerance: {
      pos: { title: 'ریسک‌پذیر', desc: 'راحتی با عدم قطعیت و چالش' },
      neg: { title: 'محتاط', desc: 'ترجیح رویکرد محافظه‌کارانه' },
    },
    structure_preference: {
      pos: { title: 'ساختارمند', desc: 'ترجیح فرآیندها و قوانین مشخص' },
      neg: { title: 'انعطاف‌پذیر', desc: 'سازگاری با تغییرات' },
    },
    pace_preference: {
      pos: { title: 'پرسرعت', desc: 'رشد در محیط‌های پویا' },
      neg: { title: 'متعادل', desc: 'ترجیح ریتم کاری ثابت' },
    },
    achievement_drive: {
      pos: { title: 'نتیجه‌محور', desc: 'تمرکز بر دستیابی به اهداف' },
      neg: { title: 'فرآیندمحور', desc: 'ارزش‌گذاری بر مسیر و تجربه' },
    },
    autonomy_need: {
      pos: { title: 'استقلال‌طلب', desc: 'ترجیح آزادی عمل' },
      neg: { title: 'راهنمایی‌پذیر', desc: 'استقبال از هدایت' },
    },
    social_energy: {
      pos: { title: 'اجتماعی', desc: 'انرژی از تعامل با دیگران' },
      neg: { title: 'درون‌گرا', desc: 'تمرکز در سکوت' },
    },
  };

  const mapping = insightMap[signal.id];
  if (!mapping) return null;

  const { title, desc } = isPositive ? mapping.pos : mapping.neg;

  return {
    category: signal.category,
    title,
    description: desc,
    strength,
    isNotable: strength >= 50,
  };
}

/**
 * Extract primary personality traits
 */
function extractPrimaryTraits(signals: Signal[]): string[] {
  const traits: string[] = [];

  const strongSignals = signals
    .filter((s) => Math.abs(s.value) >= 0.4 && s.confidence >= 0.5)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 4);

  for (const signal of strongSignals) {
    const trait = signalToTrait(signal);
    if (trait) traits.push(trait);
  }

  return traits;
}

/**
 * Convert signal to a single trait word
 */
function signalToTrait(signal: Signal): string | null {
  const traitMap: Record<string, { pos: string; neg: string }> = {
    leadership_tendency: { pos: 'رهبر', neg: 'پشتیبان' },
    collaboration_style: { pos: 'تیم‌ساز', neg: 'مستقل' },
    decision_style: { pos: 'تحلیل‌گر', neg: 'شهودی' },
    risk_tolerance: { pos: 'جسور', neg: 'محتاط' },
    achievement_drive: { pos: 'هدف‌محور', neg: 'فرآیندمحور' },
  };

  const mapping = traitMap[signal.id];
  if (!mapping) return null;

  return signal.value > 0 ? mapping.pos : mapping.neg;
}

function determineCollaborationMode(
  signals: Map<string, Signal>
): 'independent' | 'team_oriented' | 'balanced' {
  const collab = signals.get('collaboration_style');
  if (!collab) return 'balanced';

  if (collab.value > 0.3) return 'team_oriented';
  if (collab.value < -0.3) return 'independent';
  return 'balanced';
}

function determineDecisionApproach(
  signals: Map<string, Signal>
): 'analytical' | 'intuitive' | 'balanced' {
  const decision = signals.get('decision_style');
  if (!decision) return 'balanced';

  if (decision.value > 0.3) return 'analytical';
  if (decision.value < -0.3) return 'intuitive';
  return 'balanced';
}

function determineEnvironmentPreference(
  signals: Map<string, Signal>
): 'structured' | 'flexible' | 'balanced' {
  const structure = signals.get('structure_preference');
  if (!structure) return 'balanced';

  if (structure.value > 0.3) return 'structured';
  if (structure.value < -0.3) return 'flexible';
  return 'balanced';
}
