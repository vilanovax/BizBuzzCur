/**
 * Signal Description Adapter
 *
 * Generates human-readable descriptions of signals in Persian.
 * Used for UI display across BizBuzz.
 */

import type { Signal, SignalId, SignalCategory } from '../contracts/signal.schema';

/**
 * Localized signal description
 */
export interface SignalDescription {
  /** Signal identifier */
  id: SignalId;
  /** Category name in Persian */
  categoryName: string;
  /** Signal name in Persian */
  name: string;
  /** Short description based on value */
  shortDescription: string;
  /** Longer description with context */
  fullDescription: string;
  /** Icon suggestion (lucide icon name) */
  icon: string;
  /** Color suggestion for UI */
  color: string;
}

/**
 * Category names in Persian
 */
const CATEGORY_NAMES: Record<SignalCategory, string> = {
  work_style: 'سبک کار',
  collaboration: 'همکاری',
  decision_making: 'تصمیم‌گیری',
  motivation: 'انگیزه',
  environment: 'محیط کار',
  growth: 'رشد و توسعه',
};

/**
 * Category icons
 */
const CATEGORY_ICONS: Record<SignalCategory, string> = {
  work_style: 'Briefcase',
  collaboration: 'Users',
  decision_making: 'GitBranch',
  motivation: 'Target',
  environment: 'Building2',
  growth: 'TrendingUp',
};

/**
 * Signal names and descriptions in Persian
 */
const SIGNAL_DESCRIPTIONS: Record<
  SignalId,
  {
    name: string;
    icon: string;
    descriptions: {
      strong_negative: string;
      negative: string;
      neutral: string;
      positive: string;
      strong_positive: string;
    };
  }
> = {
  structure_preference: {
    name: 'ساختارپذیری',
    icon: 'LayoutGrid',
    descriptions: {
      strong_negative: 'ترجیح قوی برای انعطاف‌پذیری و خلاقیت',
      negative: 'راحتی با محیط‌های غیررسمی و انعطاف‌پذیر',
      neutral: 'تعادل بین ساختار و انعطاف',
      positive: 'ترجیح برای فرآیندها و قوانین مشخص',
      strong_positive: 'نیاز قوی به ساختار و نظم',
    },
  },
  pace_preference: {
    name: 'ریتم کار',
    icon: 'Gauge',
    descriptions: {
      strong_negative: 'ترجیح قوی برای محیط آرام و متعادل',
      negative: 'راحتی با ریتم کاری ثابت و قابل پیش‌بینی',
      neutral: 'انعطاف در ریتم کاری',
      positive: 'رشد در محیط‌های پویا و پرسرعت',
      strong_positive: 'شکوفایی در محیط‌های بسیار پرسرعت',
    },
  },
  detail_orientation: {
    name: 'جزئی‌نگری',
    icon: 'Search',
    descriptions: {
      strong_negative: 'تمرکز قوی بر تصویر بزرگ و استراتژی',
      negative: 'ترجیح دید کلی بر جزئیات',
      neutral: 'تعادل بین جزئیات و کلیات',
      positive: 'توجه خوب به جزئیات',
      strong_positive: 'دقت بسیار بالا در جزئیات',
    },
  },
  task_approach: {
    name: 'رویکرد به وظایف',
    icon: 'ListTodo',
    descriptions: {
      strong_negative: 'توانایی قوی در چندوظیفه‌ای',
      negative: 'راحتی با انجام چند کار همزمان',
      neutral: 'انعطاف در مدیریت وظایف',
      positive: 'ترجیح تمرکز بر یک کار',
      strong_positive: 'تمرکز عمیق روی یک وظیفه',
    },
  },
  collaboration_style: {
    name: 'سبک همکاری',
    icon: 'Users',
    descriptions: {
      strong_negative: 'بهترین عملکرد در کار فردی',
      negative: 'ترجیح کار مستقل',
      neutral: 'انعطاف در کار تیمی و فردی',
      positive: 'رشد در محیط تیمی',
      strong_positive: 'شکوفایی در کار گروهی',
    },
  },
  communication_style: {
    name: 'سبک ارتباطی',
    icon: 'MessageCircle',
    descriptions: {
      strong_negative: 'ارتباط بسیار دیپلماتیک و ملایم',
      negative: 'ترجیح ارتباط غیرمستقیم و محتاطانه',
      neutral: 'تعادل در سبک ارتباطی',
      positive: 'ارتباط صریح و مستقیم',
      strong_positive: 'ارتباط بسیار رک و بی‌پرده',
    },
  },
  conflict_approach: {
    name: 'مدیریت تعارض',
    icon: 'Scale',
    descriptions: {
      strong_negative: 'اولویت قوی برای حفظ هماهنگی',
      negative: 'ترجیح اجتناب از تعارض',
      neutral: 'تعادل در مواجهه با تعارض',
      positive: 'آمادگی برای مواجهه مستقیم',
      strong_positive: 'پذیرش و حل فعال تعارض',
    },
  },
  leadership_tendency: {
    name: 'گرایش رهبری',
    icon: 'Crown',
    descriptions: {
      strong_negative: 'ترجیح قوی برای نقش پشتیبانی',
      negative: 'راحتی در نقش‌های حمایتی',
      neutral: 'انعطاف بین رهبری و پشتیبانی',
      positive: 'تمایل به هدایت و رهبری',
      strong_positive: 'رهبری طبیعی و قوی',
    },
  },
  decision_style: {
    name: 'سبک تصمیم‌گیری',
    icon: 'GitBranch',
    descriptions: {
      strong_negative: 'تصمیم‌گیری بسیار شهودی',
      negative: 'اتکا به تجربه و احساس',
      neutral: 'ترکیب تحلیل و شهود',
      positive: 'رویکرد تحلیلی به تصمیم‌گیری',
      strong_positive: 'تصمیم‌گیری کاملاً داده‌محور',
    },
  },
  risk_tolerance: {
    name: 'ریسک‌پذیری',
    icon: 'Rocket',
    descriptions: {
      strong_negative: 'رویکرد بسیار محتاطانه',
      negative: 'ترجیح ایمنی و ثبات',
      neutral: 'تعادل در ریسک‌پذیری',
      positive: 'راحتی با عدم قطعیت',
      strong_positive: 'استقبال از چالش و ریسک',
    },
  },
  change_adaptability: {
    name: 'انطباق با تغییر',
    icon: 'RefreshCcw',
    descriptions: {
      strong_negative: 'ترجیح قوی برای ثبات',
      negative: 'نیاز به زمان برای تطبیق',
      neutral: 'انعطاف در مواجهه با تغییر',
      positive: 'استقبال از تغییرات',
      strong_positive: 'شکوفایی در محیط‌های متغیر',
    },
  },
  achievement_drive: {
    name: 'انگیزه موفقیت',
    icon: 'Target',
    descriptions: {
      strong_negative: 'تمرکز قوی بر فرآیند و تجربه',
      negative: 'ارزش‌گذاری بر مسیر',
      neutral: 'تعادل بین نتیجه و فرآیند',
      positive: 'تمرکز بر دستاوردها',
      strong_positive: 'هدف‌محوری بسیار قوی',
    },
  },
  recognition_need: {
    name: 'نیاز به قدردانی',
    icon: 'Award',
    descriptions: {
      strong_negative: 'ترجیح قوی برای قدردانی خصوصی',
      negative: 'راحتی بدون توجه عمومی',
      neutral: 'انعطاف در نوع قدردانی',
      positive: 'انگیزه از تقدیر عمومی',
      strong_positive: 'نیاز قوی به شناخته شدن',
    },
  },
  autonomy_need: {
    name: 'نیاز به استقلال',
    icon: 'Compass',
    descriptions: {
      strong_negative: 'ترجیح قوی برای راهنمایی',
      negative: 'راحتی با هدایت و ساختار',
      neutral: 'تعادل بین استقلال و راهنمایی',
      positive: 'ترجیح آزادی عمل',
      strong_positive: 'نیاز قوی به استقلال کامل',
    },
  },
  social_energy: {
    name: 'انرژی اجتماعی',
    icon: 'Zap',
    descriptions: {
      strong_negative: 'شارژ قوی از تنهایی',
      negative: 'ترجیح محیط‌های آرام',
      neutral: 'تعادل اجتماعی',
      positive: 'انرژی از تعامل اجتماعی',
      strong_positive: 'شکوفایی در جمع',
    },
  },
  noise_tolerance: {
    name: 'تحمل محیط',
    icon: 'Volume2',
    descriptions: {
      strong_negative: 'نیاز قوی به سکوت',
      negative: 'ترجیح محیط آرام',
      neutral: 'انعطاف در محیط کاری',
      positive: 'راحتی با محیط شلوغ',
      strong_positive: 'رشد در محیط‌های پویا و پرانرژی',
    },
  },
  routine_preference: {
    name: 'ترجیح روتین',
    icon: 'Calendar',
    descriptions: {
      strong_negative: 'نیاز قوی به تنوع و تجربیات جدید',
      negative: 'ترجیح تغییر و تنوع',
      neutral: 'تعادل بین روتین و تنوع',
      positive: 'راحتی با برنامه ثابت',
      strong_positive: 'ترجیح قوی برای ثبات و پیش‌بینی‌پذیری',
    },
  },
};

/**
 * Adapter for generating human-readable signal descriptions
 */
export const SignalDescriptionAdapter = {
  /**
   * Get description for a single signal
   */
  describeSignal(signal: Signal): SignalDescription {
    const config = SIGNAL_DESCRIPTIONS[signal.id];
    const valueCategory = getValueCategory(signal.value);

    return {
      id: signal.id,
      categoryName: CATEGORY_NAMES[signal.category],
      name: config?.name || signal.id,
      shortDescription: config?.descriptions[valueCategory] || '',
      fullDescription: generateFullDescription(signal, config),
      icon: config?.icon || CATEGORY_ICONS[signal.category],
      color: getColorForValue(signal.value),
    };
  },

  /**
   * Describe multiple signals grouped by category
   */
  describeSignals(signals: Signal[]): Map<SignalCategory, SignalDescription[]> {
    const grouped = new Map<SignalCategory, SignalDescription[]>();

    for (const signal of signals) {
      const description = this.describeSignal(signal);
      const existing = grouped.get(signal.category) || [];
      existing.push(description);
      grouped.set(signal.category, existing);
    }

    return grouped;
  },

  /**
   * Get category name in Persian
   */
  getCategoryName(category: SignalCategory): string {
    return CATEGORY_NAMES[category];
  },

  /**
   * Get all category names
   */
  getAllCategoryNames(): Record<SignalCategory, string> {
    return { ...CATEGORY_NAMES };
  },
};

/**
 * Determine value category based on signal value
 */
function getValueCategory(
  value: number
): 'strong_negative' | 'negative' | 'neutral' | 'positive' | 'strong_positive' {
  if (value <= -0.6) return 'strong_negative';
  if (value <= -0.2) return 'negative';
  if (value < 0.2) return 'neutral';
  if (value < 0.6) return 'positive';
  return 'strong_positive';
}

/**
 * Generate full description with strength indicator
 */
function generateFullDescription(
  signal: Signal,
  config: (typeof SIGNAL_DESCRIPTIONS)[SignalId] | undefined
): string {
  if (!config) return '';

  const strength = Math.round(Math.abs(signal.value) * 100);
  const confidence = Math.round(signal.confidence * 100);
  const valueCategory = getValueCategory(signal.value);
  const baseDesc = config.descriptions[valueCategory];

  return `${baseDesc} (قوت: ${strength}٪، اطمینان: ${confidence}٪)`;
}

/**
 * Get color based on signal value for UI
 */
function getColorForValue(value: number): string {
  // Neutral values
  if (Math.abs(value) < 0.2) return '#6b7280'; // gray

  // Blue for structured/analytical pole, green for flexible/social pole
  if (value > 0) return '#2563eb'; // blue
  return '#059669'; // green
}
