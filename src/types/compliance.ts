/**
 * Compliance & Transparency Types
 *
 * Provides type definitions and copy for the company trust layer.
 *
 * This is NOT:
 * - A legal document replacement
 * - A certification claim
 * - A technical specification
 *
 * This IS:
 * - A clarity and trust layer
 * - Support for HR/Legal/Procurement review
 * - Plain-language explanation of data practices
 */

/**
 * Compliance section identifiers
 */
export type ComplianceSectionId =
  | 'what_we_use'
  | 'what_we_dont_use'
  | 'how_insights_work'
  | 'bias_safeguards'
  | 'privacy_control'
  | 'limitations';

/**
 * Compliance section structure
 */
export interface ComplianceSection {
  id: ComplianceSectionId;
  title: string;
  description: string;
  items: string[];
  note?: string;
}

/**
 * Compliance page metadata
 */
export interface CompliancePageMeta {
  lastUpdated: string;
  version: string;
}

/**
 * All compliance copy - Persian
 */
export const COMPLIANCE_COPY = {
  // Page header
  pageTitle: 'شفافیت و انطباق',
  pageSubtitle: 'توضیحات کامل درباره نحوه استفاده از داده‌ها و تولید بینش‌ها',

  // Intro text
  intro: 'این صفحه برای کمک به تیم‌های منابع انسانی، حقوقی و تدارکات طراحی شده است تا درک روشنی از نحوه کار BizBuzz داشته باشند.',

  // Print button
  printButton: 'نسخه قابل چاپ',

  // Sections
  sections: {
    what_we_use: {
      id: 'what_we_use' as ComplianceSectionId,
      title: 'اطلاعاتی که BizBuzz استفاده می‌کند',
      description: 'ما از اطلاعات زیر برای تولید بینش‌های کاری استفاده می‌کنیم:',
      items: [
        'ترجیحات کاری کلی (سیگنال‌های انتزاعی)',
        'مهارت‌ها و تجربیات ارائه‌شده توسط کاربران',
        'زمینه شغل و تیم تعریف‌شده توسط شرکت',
        'اطلاعات پروفایل حرفه‌ای',
      ],
      note: 'ما از سیگنال‌های ترجیحات کاری کلی برای توضیح ارتباط شغلی و تعادل تیمی استفاده می‌کنیم.',
    },
    what_we_dont_use: {
      id: 'what_we_dont_use' as ComplianceSectionId,
      title: 'اطلاعاتی که BizBuzz هرگز استفاده نمی‌کند',
      description: 'ما هرگز از اطلاعات زیر استفاده نمی‌کنیم:',
      items: [
        'برچسب‌های شخصیتی یا تشخیص‌های روان‌شناختی',
        'ویژگی‌های شخصی حساس',
        'تصمیم‌گیری خودکار استخدام',
        'امتیازدهی یا رتبه‌بندی افراد',
        'منابع داده پنهان',
      ],
      note: 'BizBuzz هرگز تصمیم نمی‌گیرد که چه کسی استخدام شود. تمام تصمیمات توسط انسان‌ها گرفته می‌شوند.',
    },
    how_insights_work: {
      id: 'how_insights_work' as ComplianceSectionId,
      title: 'نحوه تولید بینش‌ها',
      description: 'بینش‌ها با ترکیب موارد زیر تولید می‌شوند:',
      items: [
        'الگوهای جمع‌بندی‌شده (نه داده‌های فردی)',
        'تطبیق زمینه‌ای با موقعیت شغلی',
        'سیگنال‌های آگاه از سطح اطمینان',
        'تحلیل روندها و توازن تیمی',
      ],
      note: 'بینش‌ها برای پشتیبانی از گفتگو طراحی شده‌اند، نه جایگزینی قضاوت انسانی.',
    },
    bias_safeguards: {
      id: 'bias_safeguards' as ComplianceSectionId,
      title: 'حفاظت‌های سوگیری و عدالت',
      description: 'BizBuzz شامل حفاظت‌های زیر است:',
      items: [
        'آستانه‌های جمع‌بندی (حداقل ۵ نفر برای بینش‌های سازمانی)',
        'عدم افشای اطلاعات فردی',
        'هشدارهای نرم به جای پرچم‌های خطر',
        'نظارت منظم بر الگوهای تصمیم‌گیری',
      ],
      note: 'BizBuzz اتکای بیش از حد به هر سیگنال خاص را رصد کرده و تصمیم‌گیری متوازن را تشویق می‌کند.',
    },
    privacy_control: {
      id: 'privacy_control' as ComplianceSectionId,
      title: 'حریم خصوصی و کنترل داده',
      description: 'ما از اصول زیر پیروی می‌کنیم:',
      items: [
        'دسترسی مبتنی بر نقش (فقط افراد مجاز)',
        'حداقل‌سازی داده',
        'بینش‌های جمع‌بندی‌شده (نه فردی)',
        'استفاده اختیاری از ویژگی‌های پیشرفته',
      ],
      note: 'فقط نقش‌های مجاز شرکت می‌توانند بینش‌های جمع‌بندی‌شده را مشاهده کنند. داده‌های فردی هرگز افشا نمی‌شوند.',
    },
    limitations: {
      id: 'limitations' as ComplianceSectionId,
      title: 'درک محدودیت‌ها',
      description: 'لطفاً توجه داشته باشید:',
      items: [
        'بینش‌ها جهت‌دهنده هستند، نه قطعی',
        'هشدار داده محدود در صورت کمبود اطلاعات',
        'بدون تضمین پیش‌بینی عملکرد',
        'یک ورودی در کنار سایر ورودی‌های تصمیم‌گیری',
      ],
      note: 'این بینش‌ها یکی از ورودی‌های متعدد هستند. آن‌ها عملکرد یا نتایج را پیش‌بینی نمی‌کنند.',
    },
  } as Record<ComplianceSectionId, ComplianceSection>,

  // Footer
  footer: {
    designedFor: 'طراحی‌شده برای پشتیبانی از شیوه‌های استخدام عادلانه و شفاف.',
    lastUpdated: 'آخرین به‌روزرسانی:',
    questions: 'سوالی دارید؟',
    contactSupport: 'با پشتیبانی تماس بگیرید',
  },

  // Tooltips
  tooltips: {
    whatWeUse: 'اطلاعاتی که برای تولید بینش‌ها استفاده می‌شود',
    whatWeDontUse: 'اطلاعاتی که هرگز جمع‌آوری یا استفاده نمی‌شود',
    howInsightsWork: 'فرآیند تولید بینش‌ها به زبان ساده',
    biasSafeguards: 'اقدامات حفاظتی در برابر سوگیری',
    privacyControl: 'نحوه مدیریت و حفاظت از داده‌ها',
    limitations: 'محدودیت‌ها و نکات مهم',
  },
};

/**
 * Section order for display
 */
export const COMPLIANCE_SECTION_ORDER: ComplianceSectionId[] = [
  'what_we_use',
  'what_we_dont_use',
  'how_insights_work',
  'bias_safeguards',
  'privacy_control',
  'limitations',
];

/**
 * Section icons mapping (for UI)
 */
export const COMPLIANCE_SECTION_ICONS: Record<ComplianceSectionId, string> = {
  what_we_use: 'Database',
  what_we_dont_use: 'ShieldOff',
  how_insights_work: 'Lightbulb',
  bias_safeguards: 'Scale',
  privacy_control: 'Lock',
  limitations: 'AlertCircle',
};
