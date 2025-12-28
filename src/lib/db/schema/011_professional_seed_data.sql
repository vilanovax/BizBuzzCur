-- Professional Taxonomy Seed Data
-- MVP: Finance + IT domains with specializations and skills

-- ============================================
-- PROFESSIONAL DOMAINS
-- ============================================
INSERT INTO professional_domains (slug, name_en, name_fa, description_en, description_fa, icon, color, display_order)
VALUES
  ('finance', 'Finance', 'مالی', 'Finance, accounting, banking, and related fields', 'امور مالی، حسابداری، بانکداری و حوزه‌های مرتبط', 'Wallet', '#059669', 1),
  ('it', 'IT', 'فناوری اطلاعات', 'Information technology, software development, and tech', 'فناوری اطلاعات، توسعه نرم‌افزار و تکنولوژی', 'Code', '#2563eb', 2)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SPECIALIZATIONS - FINANCE
-- ============================================
INSERT INTO specializations (domain_id, slug, name_en, name_fa, description_en, description_fa, display_order)
SELECT
  d.id,
  s.slug,
  s.name_en,
  s.name_fa,
  s.description_en,
  s.description_fa,
  s.display_order
FROM professional_domains d
CROSS JOIN (
  VALUES
    ('accounting', 'Accounting', 'حسابداری', 'Financial accounting and reporting', 'حسابداری مالی و گزارشگری', 1),
    ('audit', 'Audit', 'حسابرسی', 'Internal and external audit', 'حسابرسی داخلی و خارجی', 2),
    ('tax', 'Tax', 'مالیات', 'Tax planning and compliance', 'برنامه‌ریزی و تطابق مالیاتی', 3),
    ('insurance', 'Insurance', 'بیمه', 'Insurance and risk management', 'بیمه و مدیریت ریسک', 4),
    ('fintech', 'FinTech', 'فین‌تک', 'Financial technology and innovation', 'فناوری مالی و نوآوری', 5),
    ('banking', 'Banking', 'بانکداری', 'Banking and financial services', 'بانکداری و خدمات مالی', 6),
    ('treasury', 'Treasury & Cash Management', 'خزانه‌داری', 'Treasury operations and cash management', 'عملیات خزانه و مدیریت نقدینگی', 7),
    ('financial-management', 'Financial Management', 'مدیریت مالی', 'Corporate finance and financial planning', 'مالی شرکتی و برنامه‌ریزی مالی', 8),
    ('investment', 'Investment & Capital Market', 'سرمایه‌گذاری', 'Investment and capital markets', 'سرمایه‌گذاری و بازار سرمایه', 9),
    ('risk-compliance', 'Risk & Compliance', 'ریسک و انطباق', 'Risk management and regulatory compliance', 'مدیریت ریسک و انطباق مقرراتی', 10)
) AS s(slug, name_en, name_fa, description_en, description_fa, display_order)
WHERE d.slug = 'finance'
ON CONFLICT (domain_id, slug) DO NOTHING;

-- ============================================
-- SPECIALIZATIONS - IT
-- ============================================
INSERT INTO specializations (domain_id, slug, name_en, name_fa, description_en, description_fa, display_order)
SELECT
  d.id,
  s.slug,
  s.name_en,
  s.name_fa,
  s.description_en,
  s.description_fa,
  s.display_order
FROM professional_domains d
CROSS JOIN (
  VALUES
    ('backend', 'Backend Development', 'بک‌اند', 'Server-side development', 'توسعه سمت سرور', 1),
    ('frontend', 'Frontend Development', 'فرانت‌اند', 'Client-side development', 'توسعه سمت کاربر', 2),
    ('mobile', 'Mobile Development', 'موبایل', 'iOS and Android development', 'توسعه iOS و اندروید', 3),
    ('fullstack', 'Fullstack Development', 'فول‌استک', 'End-to-end development', 'توسعه سراسری', 4),
    ('devops', 'DevOps & Cloud', 'دوآپس و کلود', 'DevOps, cloud infrastructure', 'دوآپس، زیرساخت ابری', 5),
    ('data-ai', 'Data & AI', 'داده و هوش مصنوعی', 'Data science, ML, AI', 'علم داده، یادگیری ماشین، هوش مصنوعی', 6),
    ('security', 'Cybersecurity', 'امنیت سایبری', 'Information security', 'امنیت اطلاعات', 7),
    ('infrastructure', 'IT Infrastructure', 'زیرساخت', 'Network and systems administration', 'شبکه و مدیریت سیستم', 8),
    ('product-ux', 'Product & UX', 'محصول و UX', 'Product management and UX design', 'مدیریت محصول و طراحی تجربه کاربری', 9),
    ('qa-testing', 'QA & Testing', 'تست و کیفیت', 'Quality assurance and testing', 'تضمین کیفیت و تست', 10)
) AS s(slug, name_en, name_fa, description_en, description_fa, display_order)
WHERE d.slug = 'it'
ON CONFLICT (domain_id, slug) DO NOTHING;

-- ============================================
-- SKILLS - FINANCE/ACCOUNTING
-- ============================================
INSERT INTO skills (slug, name_en, name_fa, category, suggested_domain_ids, popularity_score)
SELECT
  s.slug,
  s.name_en,
  s.name_fa,
  s.category::VARCHAR,
  ARRAY(SELECT id FROM professional_domains WHERE slug = 'finance'),
  s.popularity
FROM (
  VALUES
    ('ifrs', 'IFRS', 'استانداردهای بین‌المللی گزارشگری مالی', 'technical', 90),
    ('iranian-accounting-standards', 'Iranian Accounting Standards', 'استانداردهای حسابداری ایران', 'technical', 95),
    ('financial-statements', 'Financial Statements', 'صورت‌های مالی', 'technical', 95),
    ('cost-accounting', 'Cost Accounting', 'حسابداری صنعتی', 'technical', 85),
    ('management-accounting', 'Management Accounting', 'حسابداری مدیریت', 'technical', 80),
    ('accounting-software-rahkaran', 'Rahkaran Accounting', 'نرم‌افزار حسابداری رهکاران', 'tool', 70),
    ('accounting-software-sap', 'SAP FI/CO', 'SAP مالی', 'tool', 75),
    ('excel-advanced', 'Advanced Excel', 'اکسل پیشرفته', 'tool', 90),
    ('financial-analysis', 'Financial Analysis', 'تحلیل مالی', 'technical', 85)
) AS s(slug, name_en, name_fa, category, popularity)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SKILLS - FINANCE/TAX
-- ============================================
INSERT INTO skills (slug, name_en, name_fa, category, suggested_domain_ids, popularity_score)
SELECT
  s.slug,
  s.name_en,
  s.name_fa,
  s.category::VARCHAR,
  ARRAY(SELECT id FROM professional_domains WHERE slug = 'finance'),
  s.popularity
FROM (
  VALUES
    ('vat-law', 'VAT Law', 'قانون مالیات بر ارزش افزوده', 'technical', 85),
    ('direct-tax-law', 'Direct Tax Law', 'قانون مالیات‌های مستقیم', 'technical', 90),
    ('tax-returns', 'Tax Returns', 'اظهارنامه مالیاتی', 'technical', 85),
    ('tax-audit-preparation', 'Tax Audit Preparation', 'آماده‌سازی حسابرسی مالیاتی', 'technical', 75),
    ('transfer-pricing', 'Transfer Pricing', 'قیمت‌گذاری انتقالی', 'technical', 60),
    ('tax-planning', 'Tax Planning', 'برنامه‌ریزی مالیاتی', 'technical', 80)
) AS s(slug, name_en, name_fa, category, popularity)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SKILLS - FINANCE/FINTECH
-- ============================================
INSERT INTO skills (slug, name_en, name_fa, category, suggested_domain_ids, popularity_score)
SELECT
  s.slug,
  s.name_en,
  s.name_fa,
  s.category::VARCHAR,
  ARRAY(SELECT id FROM professional_domains WHERE slug = 'finance'),
  s.popularity
FROM (
  VALUES
    ('payment-systems', 'Payment Systems', 'سیستم‌های پرداخت', 'technical', 80),
    ('digital-wallets', 'Digital Wallets', 'کیف پول دیجیتال', 'technical', 75),
    ('banking-apis', 'Banking APIs', 'APIهای بانکی', 'technical', 70),
    ('shaparak-compliance', 'Shaparak Compliance', 'انطباق شاپرک', 'technical', 75),
    ('central-bank-regulations', 'Central Bank Regulations', 'مقررات بانک مرکزی', 'technical', 70),
    ('risk-scoring', 'Risk Scoring', 'امتیازدهی ریسک', 'technical', 65),
    ('psp-integration', 'PSP Integration', 'یکپارچه‌سازی درگاه پرداخت', 'technical', 70)
) AS s(slug, name_en, name_fa, category, popularity)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SKILLS - IT/BACKEND
-- ============================================
INSERT INTO skills (slug, name_en, name_fa, category, suggested_domain_ids, popularity_score)
SELECT
  s.slug,
  s.name_en,
  s.name_fa,
  s.category::VARCHAR,
  ARRAY(SELECT id FROM professional_domains WHERE slug = 'it'),
  s.popularity
FROM (
  VALUES
    ('nodejs', 'Node.js', 'Node.js', 'technical', 95),
    ('java', 'Java', 'جاوا', 'technical', 90),
    ('dotnet', '.NET', 'دات‌نت', 'technical', 85),
    ('python', 'Python', 'پایتون', 'technical', 95),
    ('golang', 'Go', 'گو', 'technical', 80),
    ('rest-api-design', 'REST API Design', 'طراحی REST API', 'technical', 90),
    ('graphql', 'GraphQL', 'GraphQL', 'technical', 75),
    ('postgresql', 'PostgreSQL', 'PostgreSQL', 'technical', 90),
    ('mysql', 'MySQL', 'MySQL', 'technical', 85),
    ('mongodb', 'MongoDB', 'MongoDB', 'technical', 80),
    ('redis', 'Redis', 'Redis', 'technical', 80),
    ('microservices', 'Microservices Architecture', 'معماری میکروسرویس', 'methodology', 85),
    ('message-queues', 'Message Queues (RabbitMQ/Kafka)', 'صف‌های پیام', 'technical', 75)
) AS s(slug, name_en, name_fa, category, popularity)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SKILLS - IT/FRONTEND
-- ============================================
INSERT INTO skills (slug, name_en, name_fa, category, suggested_domain_ids, popularity_score)
SELECT
  s.slug,
  s.name_en,
  s.name_fa,
  s.category::VARCHAR,
  ARRAY(SELECT id FROM professional_domains WHERE slug = 'it'),
  s.popularity
FROM (
  VALUES
    ('react', 'React', 'ری‌اکت', 'technical', 95),
    ('nextjs', 'Next.js', 'Next.js', 'technical', 90),
    ('vue', 'Vue.js', 'Vue.js', 'technical', 80),
    ('angular', 'Angular', 'انگولار', 'technical', 75),
    ('typescript', 'TypeScript', 'تایپ‌اسکریپت', 'technical', 95),
    ('javascript', 'JavaScript', 'جاوااسکریپت', 'technical', 98),
    ('html-css', 'HTML/CSS', 'HTML/CSS', 'technical', 98),
    ('tailwindcss', 'Tailwind CSS', 'Tailwind CSS', 'technical', 85),
    ('sass', 'Sass/SCSS', 'Sass', 'technical', 70),
    ('webpack', 'Webpack', 'Webpack', 'tool', 70),
    ('responsive-design', 'Responsive Design', 'طراحی واکنشگرا', 'technical', 90)
) AS s(slug, name_en, name_fa, category, popularity)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SKILLS - IT/MOBILE
-- ============================================
INSERT INTO skills (slug, name_en, name_fa, category, suggested_domain_ids, popularity_score)
SELECT
  s.slug,
  s.name_en,
  s.name_fa,
  s.category::VARCHAR,
  ARRAY(SELECT id FROM professional_domains WHERE slug = 'it'),
  s.popularity
FROM (
  VALUES
    ('react-native', 'React Native', 'ری‌اکت نیتیو', 'technical', 85),
    ('flutter', 'Flutter', 'فلاتر', 'technical', 85),
    ('swift', 'Swift', 'سوئیفت', 'technical', 75),
    ('kotlin', 'Kotlin', 'کاتلین', 'technical', 80),
    ('ios-development', 'iOS Development', 'توسعه iOS', 'technical', 80),
    ('android-development', 'Android Development', 'توسعه اندروید', 'technical', 85)
) AS s(slug, name_en, name_fa, category, popularity)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SKILLS - IT/DEVOPS
-- ============================================
INSERT INTO skills (slug, name_en, name_fa, category, suggested_domain_ids, popularity_score)
SELECT
  s.slug,
  s.name_en,
  s.name_fa,
  s.category::VARCHAR,
  ARRAY(SELECT id FROM professional_domains WHERE slug = 'it'),
  s.popularity
FROM (
  VALUES
    ('docker', 'Docker', 'داکر', 'tool', 95),
    ('kubernetes', 'Kubernetes', 'کوبرنتیز', 'tool', 90),
    ('ci-cd', 'CI/CD', 'CI/CD', 'methodology', 90),
    ('jenkins', 'Jenkins', 'جنکینز', 'tool', 80),
    ('github-actions', 'GitHub Actions', 'GitHub Actions', 'tool', 85),
    ('gitlab-ci', 'GitLab CI', 'GitLab CI', 'tool', 80),
    ('linux', 'Linux Administration', 'مدیریت لینوکس', 'technical', 90),
    ('aws', 'AWS', 'AWS', 'tool', 90),
    ('azure', 'Azure', 'Azure', 'tool', 80),
    ('gcp', 'Google Cloud', 'Google Cloud', 'tool', 75),
    ('terraform', 'Terraform', 'Terraform', 'tool', 80),
    ('ansible', 'Ansible', 'Ansible', 'tool', 75),
    ('monitoring', 'Monitoring (Prometheus/Grafana)', 'مانیتورینگ', 'tool', 80),
    ('nginx', 'Nginx', 'Nginx', 'tool', 85)
) AS s(slug, name_en, name_fa, category, popularity)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SKILLS - IT/DATA & AI
-- ============================================
INSERT INTO skills (slug, name_en, name_fa, category, suggested_domain_ids, popularity_score)
SELECT
  s.slug,
  s.name_en,
  s.name_fa,
  s.category::VARCHAR,
  ARRAY(SELECT id FROM professional_domains WHERE slug = 'it'),
  s.popularity
FROM (
  VALUES
    ('machine-learning', 'Machine Learning', 'یادگیری ماشین', 'technical', 90),
    ('deep-learning', 'Deep Learning', 'یادگیری عمیق', 'technical', 85),
    ('nlp', 'NLP', 'پردازش زبان طبیعی', 'technical', 80),
    ('data-analysis', 'Data Analysis', 'تحلیل داده', 'technical', 90),
    ('pandas', 'Pandas', 'Pandas', 'tool', 85),
    ('numpy', 'NumPy', 'NumPy', 'tool', 85),
    ('tensorflow', 'TensorFlow', 'TensorFlow', 'tool', 80),
    ('pytorch', 'PyTorch', 'PyTorch', 'tool', 80),
    ('sql', 'SQL', 'SQL', 'technical', 95),
    ('power-bi', 'Power BI', 'Power BI', 'tool', 75),
    ('tableau', 'Tableau', 'Tableau', 'tool', 70)
) AS s(slug, name_en, name_fa, category, popularity)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- PROFESSIONAL STATUSES
-- ============================================
INSERT INTO professional_statuses (slug, name_en, name_fa, description_en, description_fa, icon, color, status_type, display_order)
VALUES
  ('open-to-work', 'Open to Work', 'آماده همکاری', 'Actively looking for job opportunities', 'فعالانه به دنبال فرصت شغلی', 'Briefcase', '#059669', 'availability', 1),
  ('consulting', 'Open for Consulting', 'مشاوره می‌دهم', 'Available for consulting projects', 'آماده پروژه‌های مشاوره', 'MessageCircle', '#2563eb', 'offering', 2),
  ('freelance', 'Freelancing', 'فریلنسر', 'Taking freelance projects', 'پروژه‌های فریلنس می‌پذیرم', 'User', '#7c3aed', 'availability', 3),
  ('hiring', 'Hiring', 'استخدام می‌کنم', 'Looking to hire talent', 'به دنبال جذب نیرو', 'UserPlus', '#ea580c', 'seeking', 4),
  ('not-available', 'Not Available', 'در دسترس نیستم', 'Not looking for opportunities', 'فعلاً به دنبال فرصت نیستم', 'XCircle', '#6b7280', 'availability', 5),
  ('open-to-connect', 'Open to Connect', 'آماده شبکه‌سازی', 'Open to networking and connections', 'آماده ارتباط و شبکه‌سازی', 'Users', '#0891b2', 'availability', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- LINK SKILLS TO SPECIALIZATIONS (Suggestions)
-- ============================================

-- Finance/Accounting skills
INSERT INTO skill_specialization_suggestions (skill_id, specialization_id, relevance_score)
SELECT s.id, sp.id, 90
FROM skills s, specializations sp
WHERE s.slug IN ('ifrs', 'iranian-accounting-standards', 'financial-statements', 'cost-accounting', 'management-accounting', 'accounting-software-rahkaran', 'accounting-software-sap', 'excel-advanced', 'financial-analysis')
AND sp.slug = 'accounting'
ON CONFLICT DO NOTHING;

-- Finance/Tax skills
INSERT INTO skill_specialization_suggestions (skill_id, specialization_id, relevance_score)
SELECT s.id, sp.id, 90
FROM skills s, specializations sp
WHERE s.slug IN ('vat-law', 'direct-tax-law', 'tax-returns', 'tax-audit-preparation', 'transfer-pricing', 'tax-planning')
AND sp.slug = 'tax'
ON CONFLICT DO NOTHING;

-- Finance/FinTech skills
INSERT INTO skill_specialization_suggestions (skill_id, specialization_id, relevance_score)
SELECT s.id, sp.id, 90
FROM skills s, specializations sp
WHERE s.slug IN ('payment-systems', 'digital-wallets', 'banking-apis', 'shaparak-compliance', 'central-bank-regulations', 'risk-scoring', 'psp-integration')
AND sp.slug = 'fintech'
ON CONFLICT DO NOTHING;

-- IT/Backend skills
INSERT INTO skill_specialization_suggestions (skill_id, specialization_id, relevance_score)
SELECT s.id, sp.id, 90
FROM skills s, specializations sp
WHERE s.slug IN ('nodejs', 'java', 'dotnet', 'python', 'golang', 'rest-api-design', 'graphql', 'postgresql', 'mysql', 'mongodb', 'redis', 'microservices', 'message-queues')
AND sp.slug = 'backend'
ON CONFLICT DO NOTHING;

-- IT/Frontend skills
INSERT INTO skill_specialization_suggestions (skill_id, specialization_id, relevance_score)
SELECT s.id, sp.id, 90
FROM skills s, specializations sp
WHERE s.slug IN ('react', 'nextjs', 'vue', 'angular', 'typescript', 'javascript', 'html-css', 'tailwindcss', 'sass', 'webpack', 'responsive-design')
AND sp.slug = 'frontend'
ON CONFLICT DO NOTHING;

-- IT/Mobile skills
INSERT INTO skill_specialization_suggestions (skill_id, specialization_id, relevance_score)
SELECT s.id, sp.id, 90
FROM skills s, specializations sp
WHERE s.slug IN ('react-native', 'flutter', 'swift', 'kotlin', 'ios-development', 'android-development')
AND sp.slug = 'mobile'
ON CONFLICT DO NOTHING;

-- IT/DevOps skills
INSERT INTO skill_specialization_suggestions (skill_id, specialization_id, relevance_score)
SELECT s.id, sp.id, 90
FROM skills s, specializations sp
WHERE s.slug IN ('docker', 'kubernetes', 'ci-cd', 'jenkins', 'github-actions', 'gitlab-ci', 'linux', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'monitoring', 'nginx')
AND sp.slug = 'devops'
ON CONFLICT DO NOTHING;

-- IT/Data & AI skills
INSERT INTO skill_specialization_suggestions (skill_id, specialization_id, relevance_score)
SELECT s.id, sp.id, 90
FROM skills s, specializations sp
WHERE s.slug IN ('machine-learning', 'deep-learning', 'nlp', 'data-analysis', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'sql', 'power-bi', 'tableau')
AND sp.slug = 'data-ai'
ON CONFLICT DO NOTHING;
