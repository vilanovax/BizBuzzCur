'use client';

/**
 * Quick Job Form
 *
 * 2-step wizard for creating a job in ≤ 4 minutes.
 *
 * Step 1: Role Basics (title, summary, domain, location, team context)
 * Step 2: Apply Method (BizBuzz or external)
 *
 * Design Principles:
 * - Speed over completeness
 * - No blocking validation beyond minimum
 * - Immediately publishable result
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Briefcase,
  MapPin,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Building2,
  MessageSquare,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type {
  LocationType,
  TeamContext,
  ApplyMethod,
  QuickJobRequest,
} from '@/types/job';
import {
  LOCATION_TYPE_LABELS,
  TEAM_CONTEXT_LABELS,
  TEAM_CONTEXT_DESCRIPTIONS,
  QUICK_JOB_COPY,
} from '@/types/job';

type Step = 'role' | 'apply';

interface QuickJobFormProps {
  /** Called when job is created successfully */
  onComplete?: (jobId: string) => void;
  /** Pre-selected company ID */
  companyId?: string;
  /** Optional CSS class */
  className?: string;
}

interface CompanyOption {
  id: string;
  name: string;
  logo_url?: string | null;
}

interface DomainOption {
  id: string;
  name_fa: string;
  name_en: string;
}

export function QuickJobForm({
  onComplete,
  companyId: preselectedCompanyId,
  className,
}: QuickJobFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCompanyId = searchParams.get('company_id');
  const initialCompanyId = preselectedCompanyId || urlCompanyId || '';

  const [step, setStep] = useState<Step>('role');
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<QuickJobRequest>({
    company_id: initialCompanyId,
    title: '',
    role_summary: '',
    domain_id: undefined,
    location_type: 'onsite',
    team_context: 'small_team',
    apply_method: 'bizbuzz',
    external_apply_url: undefined,
  });

  const copy = QUICK_JOB_COPY;

  // Fetch user's companies
  useEffect(() => {
    fetchCompanies();
    fetchDomains();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await fetch('/api/companies/my');
      const data = await res.json();

      if (data.success) {
        const adminCompanies = data.data.filter(
          (c: { user_role?: string }) =>
            c.user_role === 'owner' || c.user_role === 'admin' || c.user_role === 'recruiter'
        );
        setCompanies(adminCompanies);

        // Auto-select if only one company
        if (adminCompanies.length === 1 && !initialCompanyId) {
          setFormData((prev) => ({ ...prev, company_id: adminCompanies[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/taxonomy/domains');
      const data = await res.json();
      if (data.success) {
        setDomains(data.data);
      }
    } catch (err) {
      console.error('Error fetching domains:', err);
    }
  };

  const updateFormData = (updates: Partial<QuickJobRequest>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const clearedErrors = { ...errors };
    Object.keys(updates).forEach((key) => delete clearedErrors[key]);
    setErrors(clearedErrors);
  };

  // Validate Step 1
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_id) {
      newErrors.company_id = 'شرکت را انتخاب کنید';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'عنوان شغل الزامی است';
    }
    if (!formData.role_summary.trim()) {
      newErrors.role_summary = 'توضیح کوتاه نقش الزامی است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (formData.apply_method === 'external_link' && !formData.external_apply_url?.trim()) {
      newErrors.external_apply_url = 'آدرس صفحه درخواست الزامی است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep2 = () => {
    if (validateStep1()) {
      setStep('apply');
    }
  };

  // Handle form submission
  const handleSubmit = async (publishImmediately = true) => {
    if (!validateStep2()) return;

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        status: publishImmediately ? 'published' : 'draft',
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (data.success) {
        if (onComplete) {
          onComplete(data.data.id);
        } else {
          // Navigate to job page with success state
          router.push(`/dashboard/jobs/${data.data.id}?created=true`);
        }
      } else {
        setErrors({ submit: data.error || 'خطا در ایجاد آگهی' });
      }
    } catch (err) {
      setErrors({ submit: 'خطا در اتصال به سرور' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCompany = companies.find((c) => c.id === formData.company_id);

  if (loadingCompanies) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">ابتدا یک شرکت ایجاد کنید</h3>
          <p className="text-muted-foreground text-sm mb-6">
            برای ایجاد آگهی استخدام، باید ابتدا شرکت خود را ثبت کنید
          </p>
          <Button onClick={() => router.push('/dashboard/companies/new')}>
            ایجاد شرکت
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Step 1: Role Basics
  if (step === 'role') {
    return (
      <div className={cn('max-w-lg mx-auto', className)}>
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-1">{copy.step1.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.step1.subtitle}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-1 rounded-full bg-primary" />
          <div className="w-8 h-1 rounded-full bg-muted" />
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Company Selection */}
            {companies.length > 1 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">شرکت *</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => updateFormData({ company_id: e.target.value })}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20',
                    errors.company_id && 'border-destructive'
                  )}
                >
                  <option value="">انتخاب شرکت</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors.company_id && (
                  <p className="text-xs text-destructive">{errors.company_id}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                {selectedCompany?.logo_url ? (
                  <img
                    src={selectedCompany.logo_url}
                    alt={selectedCompany.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                )}
                <span className="font-medium">{selectedCompany?.name}</span>
              </div>
            )}

            {/* Job Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{copy.fields.title.label} *</label>
              <input
                type="text"
                placeholder={copy.fields.title.placeholder}
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border bg-background',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20',
                  errors.title && 'border-destructive'
                )}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Role Summary */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{copy.fields.role_summary.label} *</label>
              <textarea
                placeholder={copy.fields.role_summary.placeholder}
                value={formData.role_summary}
                onChange={(e) => updateFormData({ role_summary: e.target.value })}
                rows={3}
                maxLength={500}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border bg-background resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20',
                  errors.role_summary && 'border-destructive'
                )}
              />
              <p className="text-xs text-muted-foreground">{copy.fields.role_summary.helper}</p>
              {errors.role_summary && (
                <p className="text-xs text-destructive">{errors.role_summary}</p>
              )}
            </div>

            {/* Domain (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{copy.fields.domain.label}</label>
              <select
                value={formData.domain_id || ''}
                onChange={(e) => updateFormData({ domain_id: e.target.value || undefined })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{copy.fields.domain.placeholder}</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name_fa}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {copy.fields.location_type.label}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(LOCATION_TYPE_LABELS) as LocationType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateFormData({ location_type: type })}
                    className={cn(
                      'px-3 py-2.5 rounded-xl text-sm border transition-all',
                      formData.location_type === type
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-muted hover:border-primary/30'
                    )}
                  >
                    {LOCATION_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Context */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                {copy.fields.team_context.label}
              </label>
              <div className="space-y-2">
                {(Object.keys(TEAM_CONTEXT_LABELS) as TeamContext[]).map((ctx) => (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => updateFormData({ team_context: ctx })}
                    className={cn(
                      'w-full p-3 rounded-xl border text-right transition-all',
                      formData.team_context === ctx
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'font-medium text-sm',
                        formData.team_context === ctx && 'text-primary'
                      )}>
                        {TEAM_CONTEXT_LABELS[ctx]}
                      </span>
                      {formData.team_context === ctx && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {TEAM_CONTEXT_DESCRIPTIONS[ctx]}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="pt-4">
              <Button onClick={goToStep2} className="w-full">
                بعدی
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Apply Method
  return (
    <div className={cn('max-w-lg mx-auto', className)}>
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold mb-1">{copy.step2.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.step2.subtitle}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-8 h-1 rounded-full bg-primary" />
        <div className="w-8 h-1 rounded-full bg-primary" />
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Apply Method Options */}
          <div className="space-y-3">
            {/* BizBuzz Apply */}
            <button
              type="button"
              onClick={() => updateFormData({ apply_method: 'bizbuzz', external_apply_url: undefined })}
              className={cn(
                'w-full p-4 rounded-xl border text-right transition-all',
                formData.apply_method === 'bizbuzz'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-muted hover:border-primary/30'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  formData.apply_method === 'bizbuzz' ? 'bg-primary/10' : 'bg-muted'
                )}>
                  <MessageSquare className={cn(
                    'w-5 h-5',
                    formData.apply_method === 'bizbuzz' ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'font-medium',
                      formData.apply_method === 'bizbuzz' && 'text-primary'
                    )}>
                      {copy.fields.apply_method.bizbuzz.title}
                    </span>
                    {formData.apply_method === 'bizbuzz' && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <Sparkles className="w-3 h-3" />
                        پیشنهادی
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {copy.fields.apply_method.bizbuzz.description}
                  </p>
                </div>
              </div>
            </button>

            {/* External Link */}
            <button
              type="button"
              onClick={() => updateFormData({ apply_method: 'external_link' })}
              className={cn(
                'w-full p-4 rounded-xl border text-right transition-all',
                formData.apply_method === 'external_link'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-muted hover:border-primary/30'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  formData.apply_method === 'external_link' ? 'bg-primary/10' : 'bg-muted'
                )}>
                  <ExternalLink className={cn(
                    'w-5 h-5',
                    formData.apply_method === 'external_link' ? 'text-primary' : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1">
                  <span className={cn(
                    'font-medium',
                    formData.apply_method === 'external_link' && 'text-primary'
                  )}>
                    {copy.fields.apply_method.external.title}
                  </span>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {copy.fields.apply_method.external.description}
                  </p>
                </div>
              </div>
            </button>

            {/* External URL Input */}
            {formData.apply_method === 'external_link' && (
              <div className="pr-13 space-y-2">
                <input
                  type="url"
                  placeholder={copy.fields.apply_method.external.placeholder}
                  value={formData.external_apply_url || ''}
                  onChange={(e) => updateFormData({ external_apply_url: e.target.value })}
                  dir="ltr"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-background text-left',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20',
                    errors.external_apply_url && 'border-destructive'
                  )}
                />
                {errors.external_apply_url && (
                  <p className="text-xs text-destructive">{errors.external_apply_url}</p>
                )}
              </div>
            )}
          </div>

          {/* Job Preview Summary */}
          <div className="p-4 bg-muted/50 rounded-xl space-y-2">
            <p className="text-sm font-medium">پیش‌نمایش آگهی:</p>
            <div className="flex items-center gap-3">
              {selectedCompany?.logo_url ? (
                <img
                  src={selectedCompany.logo_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <p className="font-medium">{formData.title}</p>
                <p className="text-xs text-muted-foreground">{selectedCompany?.name}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-background rounded">
                {LOCATION_TYPE_LABELS[formData.location_type]}
              </span>
              <span className="px-2 py-1 bg-background rounded">
                {TEAM_CONTEXT_LABELS[formData.team_context]}
              </span>
            </div>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {errors.submit}
            </div>
          )}

          {/* Helper text */}
          <p className="text-xs text-muted-foreground text-center">
            {copy.publish.helper}
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep('role')}>
              <ArrowRight className="w-4 h-4 ml-2" />
              قبلی
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  در حال انتشار...
                </>
              ) : (
                <>
                  {copy.publish.cta}
                  <Check className="w-4 h-4 mr-2" />
                </>
              )}
            </Button>
          </div>

          {/* Save as draft */}
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {copy.publish.draft}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuickJobForm;
