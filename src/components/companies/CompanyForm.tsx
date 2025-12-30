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

type Step = 'basic' | 'details' | 'branding' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'basic', label: 'اطلاعات پایه' },
  { id: 'details', label: 'جزئیات' },
  { id: 'branding', label: 'برند' },
  { id: 'review', label: 'بررسی' },
];

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

interface CompanyFormProps {
  initialData?: Partial<Company>;
  companyId?: string;
  mode?: 'create' | 'edit';
}

export function CompanyForm({ initialData, companyId, mode = 'create' }: CompanyFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const nextStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
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

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  currentStepIndex > index
                    ? 'bg-primary text-primary-foreground'
                    : currentStepIndex === index
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {currentStepIndex > index ? <Check className="w-4 h-4" /> : index + 1}
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-12 sm:w-20 h-1 mx-2',
                    currentStepIndex > index ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {STEPS.map((step) => (
            <span key={step.id} className="text-center">{step.label}</span>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 'basic' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">اطلاعات پایه</h2>
                <p className="text-sm text-muted-foreground">نام و توضیحات شرکت</p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">نام شرکت *</label>
              <input
                type="text"
                placeholder="مثال: شرکت فناوری ایران"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <label className="text-sm font-medium">شعار (اختیاری)</label>
              <input
                type="text"
                placeholder="یک خط کوتاه درباره شرکت"
                value={formData.tagline || ''}
                onChange={(e) => updateFormData({ tagline: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">درباره شرکت</label>
              <textarea
                placeholder="توضیحات کامل‌تر درباره فعالیت‌های شرکت..."
                value={formData.description || ''}
                onChange={(e) => updateFormData({ description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <label className="text-sm font-medium">صنعت / حوزه فعالیت</label>
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

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <Button onClick={nextStep} disabled={!formData.name}>
                بعدی
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Details */}
      {currentStep === 'details' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">جزئیات شرکت</h2>
                <p className="text-sm text-muted-foreground">اندازه، نوع و موقعیت</p>
              </div>
            </div>

            {/* Company Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium">اندازه شرکت</label>
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
              <label className="text-sm font-medium">نوع شرکت</label>
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

            {/* Location */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                موقعیت
              </h4>
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
            </div>

            {/* Website & Contact */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" />
                اطلاعات تماس
              </h4>
              <div className="grid gap-4">
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
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                <ArrowRight className="w-4 h-4 ml-2" />
                قبلی
              </Button>
              <Button onClick={nextStep}>
                بعدی
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Branding */}
      {currentStep === 'branding' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">برند و ظاهر</h2>
                <p className="text-sm text-muted-foreground">لوگو و رنگ‌بندی</p>
              </div>
            </div>

            {/* Logo */}
            <ImageUpload
              value={formData.logo_url}
              onChange={(url) => updateFormData({ logo_url: url || '' })}
              label="لوگوی شرکت"
              aspectRatio="square"
              maxSize={5}
              enableCrop={true}
            />

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
              <label className="text-sm font-medium">رنگ برند</label>
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

            {/* Social Links */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                شبکه‌های اجتماعی
              </h4>
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
            </div>

            {/* CEO Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                نام مدیرعامل (اختیاری)
              </label>
              <input
                type="text"
                placeholder="نام و نام خانوادگی"
                value={formData.ceo_name || ''}
                onChange={(e) => updateFormData({ ceo_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                <ArrowRight className="w-4 h-4 ml-2" />
                قبلی
              </Button>
              <Button onClick={nextStep}>
                بعدی
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === 'review' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-semibold">بررسی نهایی</h2>

            {/* Summary */}
            <div className="space-y-4">
              {/* Company Preview */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt={formData.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: formData.brand_color || '#2563eb' }}
                  >
                    <Building2 className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{formData.name || 'بدون نام'}</h3>
                  {formData.tagline && (
                    <p className="text-sm text-muted-foreground">{formData.tagline}</p>
                  )}
                  {formData.industry && (
                    <span className="inline-block mt-1 text-xs bg-muted px-2 py-0.5 rounded">
                      {formData.industry}
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="grid gap-3 text-sm">
                {formData.company_size && (
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{COMPANY_SIZE_LABELS[formData.company_size]}</span>
                  </div>
                )}
                {formData.company_type && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{COMPANY_TYPE_LABELS[formData.company_type]}</span>
                  </div>
                )}
                {(formData.city || formData.country) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{[formData.city, formData.country].filter(Boolean).join('، ')}</span>
                  </div>
                )}
                {formData.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span dir="ltr">{formData.website}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                <ArrowRight className="w-4 h-4 ml-2" />
                ویرایش
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
