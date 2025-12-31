'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Briefcase,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Link as LinkIcon,
  User,
  ChevronDown,
  ChevronUp,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ImageUpload } from '@/components/ui/FileUpload';
import { cn } from '@/lib/utils/cn';
import type {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanySize,
  CompanyType,
} from '@/types/company';
import {
  COMPANY_SIZE_LABELS,
  COMPANY_TYPE_LABELS,
} from '@/types/company';

const INDUSTRIES = [
  'فناوری اطلاعات',
  'مالی و بانکداری',
  'بهداشت و درمان',
  'آموزش',
  'تجارت الکترونیک',
  'تولیدی',
  'خدمات',
  'رسانه و تبلیغات',
  'گردشگری',
  'ساختمان و عمران',
  'حمل و نقل',
  'کشاورزی',
  'انرژی',
  'سایر',
];

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  hint,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  hint?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
          {hint && (
            <span className="text-xs text-muted-foreground">({hint})</span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 space-y-4 bg-background">
          {children}
        </div>
      )}
    </div>
  );
}

interface CompanyFormProps {
  initialData?: Partial<Company>;
  companyId?: string;
  mode?: 'create' | 'edit';
}

export function CompanyForm({ initialData, companyId, mode = 'create' }: CompanyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Quick mode: only essential fields (name, tagline, logo)
  const [formMode, setFormMode] = useState<'quick' | 'full'>(mode === 'edit' ? 'full' : 'quick');

  // Form state
  const [formData, setFormData] = useState<CreateCompanyRequest & UpdateCompanyRequest>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    tagline: initialData?.tagline || '',
    description: initialData?.description || '',
    industry: initialData?.industry || '',
    company_size: initialData?.company_size || undefined,
    company_type: initialData?.company_type || undefined,
    founded_year: initialData?.founded_year || undefined,
    website: initialData?.website || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    city: initialData?.city || '',
    country: initialData?.country || 'ایران',
    logo_url: initialData?.logo_url || '',
    cover_image_url: initialData?.cover_image_url || '',
    brand_color: initialData?.brand_color || '#2563eb',
    linkedin_url: initialData?.linkedin_url || '',
    twitter_url: initialData?.twitter_url || '',
    instagram_url: initialData?.instagram_url || '',
    telegram_url: initialData?.telegram_url || '',
    ceo_name: initialData?.ceo_name || '',
  });

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = mode === 'edit' ? `/api/companies/${companyId}` : '/api/companies';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/dashboard/companies/${data.data.id}`);
      } else {
        setError(data.error || 'خطا در ذخیره شرکت');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  // Calculate completion percentage for motivation
  const filledFields = [
    formData.name,
    formData.tagline,
    formData.logo_url,
    formData.industry,
    formData.company_size,
    formData.city,
    formData.website,
  ].filter(Boolean).length;
  const completionPercent = Math.round((filledFields / 7) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Mode Toggle - Only in create mode */}
      {mode === 'create' && (
        <div className="flex items-center justify-center gap-2 p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => setFormMode('quick')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              formMode === 'quick'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Zap className="w-4 h-4" />
            شروع سریع
          </button>
          <button
            type="button"
            onClick={() => setFormMode('full')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              formMode === 'full'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="w-4 h-4" />
            پروفایل کامل
          </button>
        </div>
      )}

      {/* Quick Mode Hint */}
      {formMode === 'quick' && mode === 'create' && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            فقط نام و یک توضیح کوتاه کافیه! بقیه رو بعداً کامل می‌کنی
          </p>
        </div>
      )}

      {/* Completion Progress - Full mode or Edit mode */}
      {(formMode === 'full' || mode === 'edit') && (
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">تکمیل پروفایل</span>
            <span className="text-sm font-medium">{completionPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          {completionPercent < 50 && (
            <p className="text-xs text-muted-foreground mt-2">
              پروفایل کامل‌تر = اعتماد بیشتر کاربران
            </p>
          )}
        </div>
      )}

      {/* Main Form Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">
                {mode === 'edit' ? 'ویرایش شرکت' : 'ایجاد کسب‌وکار'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formMode === 'quick' ? 'در کمتر از ۶۰ ثانیه' : 'اطلاعات کامل شرکت'}
              </p>
            </div>
          </div>

          {/* === ESSENTIAL FIELDS (Always visible) === */}

          {/* Name - Required */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              نام شرکت / کسب‌وکار *
            </label>
            <input
              type="text"
              placeholder="مثال: استارتاپ فناوری ایران"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              نام رسمی یا برند تجاری
            </p>
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              شعار / توضیح کوتاه
            </label>
            <input
              type="text"
              placeholder="یک خط درباره کاری که انجام می‌دید..."
              value={formData.tagline || ''}
              onChange={(e) => updateFormData({ tagline: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-xs text-muted-foreground">
              این متن زیر نام شرکت نمایش داده می‌شود
            </p>
          </div>

          {/* Logo - Quick visual win */}
          <ImageUpload
            value={formData.logo_url}
            onChange={(url) => updateFormData({ logo_url: url || '' })}
            label="لوگو (اختیاری)"
            aspectRatio="square"
            maxSize={5}
            enableCrop={true}
          />

          {/* === OPTIONAL FIELDS (Collapsible in quick mode) === */}

          {formMode === 'full' || mode === 'edit' ? (
            // Full mode: Show all fields with collapsible sections
            <>
              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">درباره شرکت</label>
                <textarea
                  placeholder="توضیحات کامل‌تر درباره فعالیت‌ها، محصولات یا خدمات..."
                  value={formData.description || ''}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <label className="text-sm font-medium">حوزه فعالیت</label>
                <select
                  value={formData.industry || ''}
                  onChange={(e) => updateFormData({ industry: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">انتخاب کنید</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Size & Type */}
              <CollapsibleSection
                title="اندازه و نوع شرکت"
                icon={Users}
                hint="اختیاری"
              >
                {/* Company Size */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">اندازه تیم</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(COMPANY_SIZE_LABELS) as CompanySize[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updateFormData({ company_size: size })}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm border transition-colors',
                          formData.company_size === size
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-muted hover:border-primary/30'
                        )}
                      >
                        {COMPANY_SIZE_LABELS[size]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Type */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">نوع سازمان</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(COMPANY_TYPE_LABELS) as CompanyType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateFormData({ company_type: type })}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm border transition-colors',
                          formData.company_type === type
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-muted hover:border-primary/30'
                        )}
                      >
                        {COMPANY_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>

              {/* Location */}
              <CollapsibleSection
                title="موقعیت مکانی"
                icon={MapPin}
                hint="اختیاری"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">شهر</label>
                    <input
                      type="text"
                      placeholder="مثال: تهران"
                      value={formData.city || ''}
                      onChange={(e) => updateFormData({ city: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">کشور</label>
                    <input
                      type="text"
                      placeholder="مثال: ایران"
                      value={formData.country || ''}
                      onChange={(e) => updateFormData({ country: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* Contact Info */}
              <CollapsibleSection
                title="اطلاعات تماس"
                icon={Globe}
                hint="اختیاری"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">وبسایت</label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website || ''}
                      onChange={(e) => updateFormData({ website: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">ایمیل</label>
                      <input
                        type="email"
                        placeholder="info@example.com"
                        value={formData.email || ''}
                        onChange={(e) => updateFormData({ email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">تلفن</label>
                      <input
                        type="tel"
                        placeholder="021-12345678"
                        value={formData.phone || ''}
                        onChange={(e) => updateFormData({ phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Branding */}
              <CollapsibleSection
                title="برند و ظاهر"
                icon={Building2}
                hint="اختیاری"
              >
                {/* Cover Image */}
                <ImageUpload
                  value={formData.cover_image_url}
                  onChange={(url) => updateFormData({ cover_image_url: url || '' })}
                  label="تصویر کاور"
                  aspectRatio="banner"
                  maxSize={5}
                />

                {/* Brand Color */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">رنگ برند</label>
                  <div className="flex gap-3">
                    {['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#0891b2', '#4b5563'].map(
                      (color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateFormData({ brand_color: color })}
                          className={cn(
                            'w-10 h-10 rounded-full transition-all',
                            formData.brand_color === color
                              ? 'ring-2 ring-offset-2 ring-primary scale-110'
                              : 'hover:scale-105'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      )
                    )}
                  </div>
                </div>
              </CollapsibleSection>

              {/* Social Links */}
              <CollapsibleSection
                title="شبکه‌های اجتماعی"
                icon={LinkIcon}
                hint="اختیاری"
              >
                <div className="grid gap-3">
                  <input
                    type="url"
                    placeholder="LinkedIn"
                    value={formData.linkedin_url || ''}
                    onChange={(e) => updateFormData({ linkedin_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    dir="ltr"
                  />
                  <input
                    type="url"
                    placeholder="Twitter / X"
                    value={formData.twitter_url || ''}
                    onChange={(e) => updateFormData({ twitter_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    dir="ltr"
                  />
                  <input
                    type="url"
                    placeholder="Instagram"
                    value={formData.instagram_url || ''}
                    onChange={(e) => updateFormData({ instagram_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    dir="ltr"
                  />
                  <input
                    type="url"
                    placeholder="Telegram"
                    value={formData.telegram_url || ''}
                    onChange={(e) => updateFormData({ telegram_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    dir="ltr"
                  />
                </div>
              </CollapsibleSection>

              {/* CEO Name */}
              <CollapsibleSection
                title="اطلاعات مدیریت"
                icon={User}
                hint="اختیاری"
              >
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">نام مدیرعامل / بنیان‌گذار</label>
                  <input
                    type="text"
                    placeholder="نام و نام خانوادگی"
                    value={formData.ceo_name || ''}
                    onChange={(e) => updateFormData({ ceo_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </CollapsibleSection>
            </>
          ) : (
            // Quick mode: Show "add more later" hint
            <div className="text-center py-4">
              <button
                type="button"
                onClick={() => setFormMode('full')}
                className="text-sm text-primary hover:underline"
              >
                می‌خوای اطلاعات بیشتری اضافه کنی؟
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="sm:flex-1"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.name}
              className="sm:flex-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 ml-2" />
                  {mode === 'edit' ? 'ذخیره تغییرات' : 'ایجاد شرکت'}
                </>
              )}
            </Button>
          </div>

          {/* Quick mode hint */}
          {formMode === 'quick' && mode === 'create' && (
            <p className="text-xs text-center text-muted-foreground">
              بعد از ایجاد می‌تونی از صفحه شرکت بقیه اطلاعات رو کامل کنی
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
