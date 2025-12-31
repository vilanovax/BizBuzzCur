/**
 * DISC Lite Questions - Persian (Farsi)
 *
 * Each question presents two work-style options.
 * User picks the one that feels more natural to them.
 */

export interface DiscQuestionFA {
  id: string;
  /** The scenario or context */
  scenario: string;
  /** First option (maps to value: 1) */
  optionA: string;
  /** Second option (maps to value: 2) */
  optionB: string;
}

/**
 * Persian DISC questions
 * Designed to be:
 * - Work-focused (not personal)
 * - Neutral (no right/wrong)
 * - Quick to answer
 */
export const DISC_QUESTIONS_FA: DiscQuestionFA[] = [
  // D vs S contrasts (5 questions)
  {
    id: 'disc_1',
    scenario: 'وقتی با یک چالش کاری مواجه می‌شوم:',
    optionA: 'سریع تصمیم می‌گیرم و وارد عمل می‌شوم',
    optionB: 'اول شرایط را بررسی می‌کنم و بعد اقدام می‌کنم',
  },
  {
    id: 'disc_2',
    scenario: 'در جلسات تیمی معمولاً:',
    optionA: 'برای تصمیم‌گیری سریع فشار می‌آورم',
    optionB: 'مطمئن می‌شوم همه راحت هستند',
  },
  {
    id: 'disc_3',
    scenario: 'وقتی اختلاف‌نظر پیش می‌آید:',
    optionA: 'مستقیم به موضوع می‌پردازم',
    optionB: 'دنبال نقطه مشترک می‌گردم',
  },
  {
    id: 'disc_4',
    scenario: 'انگیزه اصلی من در کار:',
    optionA: 'رسیدن به نتیجه و موفقیت',
    optionB: 'حفظ هماهنگی و آرامش تیم',
  },
  {
    id: 'disc_5',
    scenario: 'سبک ارتباطی من:',
    optionA: 'مستقیم و کوتاه',
    optionB: 'صبورانه و حمایتی',
  },

  // I vs C contrasts (5 questions)
  {
    id: 'disc_6',
    scenario: 'وقتی پروژه جدیدی شروع می‌کنم:',
    optionA: 'اول انرژی و هیجان ایجاد می‌کنم',
    optionB: 'اول نیازمندی‌ها را تحلیل می‌کنم',
  },
  {
    id: 'disc_7',
    scenario: 'تصمیم‌هایم بیشتر بر اساس:',
    optionA: 'حس درونی و نظرات دیگران',
    optionB: 'داده‌ها و تحلیل دقیق',
  },
  {
    id: 'disc_8',
    scenario: 'در جلسات کاری معمولاً:',
    optionA: 'انرژی گروه را بالا می‌برم',
    optionB: 'یادداشت دقیق برمی‌دارم',
  },
  {
    id: 'disc_9',
    scenario: 'برایم مهم‌تر است:',
    optionA: 'قدردانی و همکاری تیمی',
    optionB: 'دقت و کیفیت کار',
  },
  {
    id: 'disc_10',
    scenario: 'وقتی ایده‌ای را توضیح می‌دهم:',
    optionA: 'از داستان و هیجان استفاده می‌کنم',
    optionB: 'فقط به حقایق و منطق می‌پردازم',
  },

  // D vs I contrasts (3 questions)
  {
    id: 'disc_11',
    scenario: 'وقتی رهبری می‌کنم:',
    optionA: 'روی نتیجه تمرکز دارم',
    optionB: 'روی انگیزه‌دادن به تیم تمرکز دارم',
  },
  {
    id: 'disc_12',
    scenario: 'محیط کاری ایده‌آل من:',
    optionA: 'رقابتی و چالش‌برانگیز',
    optionB: 'صمیمی و سرگرم‌کننده',
  },
  {
    id: 'disc_13',
    scenario: 'انرژی من بیشتر از این می‌آید:',
    optionA: 'برنده‌شدن و دستیابی به اهداف',
    optionB: 'ارتباط با افراد',
  },

  // S vs C contrasts (3 questions)
  {
    id: 'disc_14',
    scenario: 'ترجیح می‌دهم کارم:',
    optionA: 'قابل پیش‌بینی و با ثبات باشد',
    optionB: 'جزئی و پیچیده باشد',
  },
  {
    id: 'disc_15',
    scenario: 'وقتی به همکاران کمک می‌کنم:',
    optionA: 'حمایت عاطفی می‌کنم',
    optionB: 'راه‌حل عملی ارائه می‌دهم',
  },
  {
    id: 'disc_16',
    scenario: 'معروفم به اینکه:',
    optionA: 'قابل اعتماد و وفادارم',
    optionB: 'دقیق و منظمم',
  },

  // Mixed contrasts (4 questions)
  {
    id: 'disc_17',
    scenario: 'تحت فشار:',
    optionA: 'کنترل را به‌دست می‌گیرم',
    optionB: 'آرام و ثابت می‌مانم',
  },
  {
    id: 'disc_18',
    scenario: 'با تغییرات:',
    optionA: 'با هیجان استقبال می‌کنم',
    optionB: 'با دقت ارزیابی می‌کنم',
  },
  {
    id: 'disc_19',
    scenario: 'نقش ایده‌آل من:',
    optionA: 'تصمیم‌گیری‌های مهم',
    optionB: 'کمک به موفقیت تیم',
  },
  {
    id: 'disc_20',
    scenario: 'بازخورد را ترجیح می‌دهم:',
    optionA: 'سریع و مستقیم',
    optionB: 'مفصل و سازنده',
  },
];

/**
 * Get a subset of questions for quick test (12 questions)
 * Returns a balanced mix covering all dimension pairs
 */
export function getQuickTestQuestions(): DiscQuestionFA[] {
  // Select 12 questions with good coverage
  const quickIds = [
    'disc_1', 'disc_3', 'disc_5',  // D vs S
    'disc_6', 'disc_8', 'disc_10', // I vs C
    'disc_11', 'disc_13',         // D vs I
    'disc_14', 'disc_16',         // S vs C
    'disc_17', 'disc_18',         // Mixed
  ];

  return DISC_QUESTIONS_FA.filter(q => quickIds.includes(q.id));
}

/**
 * Test intro copy
 *
 * UX Principles (from DISC Lite prompt):
 * - Optional (never forced)
 * - Fast (max 5 minutes)
 * - No personality labels shown
 * - No "test" language
 * - No correct or incorrect answers
 */
export const DISC_TEST_COPY = {
  // Pre-test trust screen
  title: 'بیایید بفهمیم چطور دوست دارید کار کنید',
  subtitle: 'پیشنهادهای شغلی دقیق‌تر دریافت کنید',
  description: 'با پاسخ به چند سوال ساده، فرصت‌های شغلی متناسب‌تر با سبک کاری شما را پیدا می‌کنیم.',

  // Trust points (show as bullets)
  trustPoints: [
    'این یک آزمون شخصیت نیست',
    'هیچ برچسب یا امتیازی نمایش داده نمی‌شود',
    'فقط برای بهبود پیشنهادات شغلی استفاده می‌شود',
  ],

  duration: 'حدود ۵ دقیقه',
  privacy: 'محرمانه',
  startButton: 'شروع',
  skipText: 'شاید بعداً',

  // Question screen
  questionInstruction: 'کدام گزینه بیشتر شبیه شماست؟',
  progressText: (current: number, total: number) => `سوال ${current} از ${total}`,
  timeRemaining: (questionsLeft: number) => {
    const minutes = Math.ceil(questionsLeft * 0.4); // ~25 seconds per question
    return `حدود ${minutes} دقیقه مانده`;
  },

  // Completion screen
  completionTitle: 'ممنون! این به ما کمک می‌کند فرصت‌های بهتری پیشنهاد دهیم',
  completionSubtitle: 'بر اساس پاسخ‌های شما:',
  completionButton: 'استفاده برای پیشنهادات شغلی',
  editLater: 'ویرایش بعداً',
};

/**
 * Qualitative insights based on signal patterns
 * These are shown on completion screen
 * NEVER show DISC letters or percentages
 */
export const WORKSTYLE_INSIGHTS = {
  // High D signals
  decisive: 'ترجیح می‌دهید سریع تصمیم بگیرید',
  resultsOriented: 'روی نتایج تمرکز دارید',
  directCommunication: 'سبک ارتباطی مستقیم دارید',

  // High I signals
  collaborative: 'از کار تیمی انرژی می‌گیرید',
  enthusiastic: 'انرژی مثبت به تیم منتقل می‌کنید',
  peopleOriented: 'ارتباطات برایتان مهم است',

  // High S signals
  steady: 'ثبات و پایداری را ترجیح می‌دهید',
  supportive: 'حمایت از همکاران برایتان مهم است',
  patientApproach: 'رویکرد صبورانه‌ای دارید',

  // High C signals
  analytical: 'تحلیل دقیق برایتان مهم است',
  detailOriented: 'به جزئیات توجه می‌کنید',
  qualityFocused: 'کیفیت کار را اولویت می‌دانید',
};
