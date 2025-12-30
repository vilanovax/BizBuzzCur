'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Briefcase,
  MapPin,
  Clock,
  Users,
  DollarSign,
  FileText,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type {
  JobAd,
  CreateJobRequest,
  UpdateJobRequest,
  EmploymentType,
  LocationType,
  ExperienceLevel,
  JobStatus,
} from '@/types/job';
import {
  EMPLOYMENT_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  JOB_STATUS_LABELS,
} from '@/types/job';

type Step = 'basic' | 'details' | 'requirements' | 'review';

const STEPS: { id: Step; label: string }[] = [
  { id: 'basic', label: 'اطلاعات پایه' },
  { id: 'details', label: 'جزئیات' },
  { id: 'requirements', label: 'نیازمندی‌ها' },
  { id: 'review', label: 'بررسی' },
];

interface JobFormProps {
  initialData?: Partial<JobAd>;
  jobId?: string;
  mode?: 'create' | 'edit';
}

interface CompanyOption {
  id: string;
  name: string;
  logo_url?: string | null;
}

export function JobForm({ initialData, jobId, mode = 'create' }: JobFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCompanyId = searchParams.get('company_id');

  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Form state
  const [formData, setFormData] = useState<CreateJobRequest & UpdateJobRequest>({
    company_id: initialData?.company_id || preselectedCompanyId || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    employment_type: initialData?.employment_type || undefined,
    location_type: initialData?.location_type || undefined,
    location: initialData?.location || '',
    experience_level: initialData?.experience_level || undefined,
    required_skills: initialData?.required_skills || [],
    preferred_skills: initialData?.preferred_skills || [],
    status: initialData?.status || 'draft',
  });

  // Skills input
  const [requiredSkillInput, setRequiredSkillInput] = useState('');
  const [preferredSkillInput, setPreferredSkillInput] = useState('');

  // Fetch user's companies
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await fetch('/api/companies/my');
      const data = await res.json();

      if (data.success) {
        // Filter to companies where user can post jobs (owner, admin, recruiter)
        const adminCompanies = data.data.filter(
          (c: { user_role?: string }) =>
            c.user_role === 'owner' || c.user_role === 'admin' || c.user_role === 'recruiter'
        );
        setCompanies(adminCompanies);

        // If only one company and no preselected, auto-select it
        if (adminCompanies.length === 1 && !preselectedCompanyId && !initialData?.company_id) {
          setFormData((prev) => ({ ...prev, company_id: adminCompanies[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const addSkill = (type: 'required' | 'preferred') => {
    const input = type === 'required' ? requiredSkillInput : preferredSkillInput;
    const skills = type === 'required' ? formData.required_skills : formData.preferred_skills;

    if (input.trim() && !skills?.includes(input.trim())) {
      updateFormData({
        [type === 'required' ? 'required_skills' : 'preferred_skills']: [
          ...(skills || []),
          input.trim(),
        ],
      });
      if (type === 'required') {
        setRequiredSkillInput('');
      } else {
        setPreferredSkillInput('');
      }
    }
  };

  const removeSkill = (type: 'required' | 'preferred', skill: string) => {
    const skills = type === 'required' ? formData.required_skills : formData.preferred_skills;
    updateFormData({
      [type === 'required' ? 'required_skills' : 'preferred_skills']: skills?.filter(
        (s) => s !== skill
      ),
    });
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

  const handleSubmit = async (publishImmediately = false) => {
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        status: publishImmediately ? 'published' : formData.status,
      };

      const url = mode === 'edit' ? `/api/jobs/${jobId}` : '/api/jobs';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/dashboard/companies/${formData.company_id}`);
      } else {
        setError(data.error || 'خطا در ذخیره آگهی');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
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
            <span key={step.id} className="text-center">
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 'basic' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">اطلاعات پایه</h2>
                <p className="text-sm text-muted-foreground">عنوان و شرکت</p>
              </div>
            </div>

            {/* Company Selection */}
            {companies.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">شرکت *</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => updateFormData({ company_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">انتخاب شرکت</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {companies.length === 1 && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
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
              <label className="text-sm font-medium">عنوان شغل *</label>
              <input
                type="text"
                placeholder="مثال: طراح UI/UX"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">توضیحات</label>
              <textarea
                placeholder="توضیحات کامل درباره این موقعیت شغلی..."
                value={formData.description || ''}
                onChange={(e) => updateFormData({ description: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <Button onClick={nextStep} disabled={!formData.company_id || !formData.title}>
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
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">جزئیات شغل</h2>
                <p className="text-sm text-muted-foreground">نوع همکاری و محل کار</p>
              </div>
            </div>

            {/* Employment Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع همکاری</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateFormData({ employment_type: type })}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm border transition-colors',
                      formData.employment_type === type
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted hover:border-primary/30'
                    )}
                  >
                    {EMPLOYMENT_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">نوع حضور</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(LOCATION_TYPE_LABELS) as LocationType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateFormData({ location_type: type })}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm border transition-colors',
                      formData.location_type === type
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted hover:border-primary/30'
                    )}
                  >
                    {LOCATION_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                محل کار (اختیاری)
              </label>
              <input
                type="text"
                placeholder="مثال: تهران، ونک"
                value={formData.location || ''}
                onChange={(e) => updateFormData({ location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium">سطح تجربه</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(EXPERIENCE_LEVEL_LABELS) as ExperienceLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateFormData({ experience_level: level })}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm border transition-colors',
                      formData.experience_level === level
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted hover:border-primary/30'
                    )}
                  >
                    {EXPERIENCE_LEVEL_LABELS[level]}
                  </button>
                ))}
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

      {/* Step 3: Requirements */}
      {currentStep === 'requirements' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">مهارت‌ها</h2>
                <p className="text-sm text-muted-foreground">مهارت‌های مورد نیاز</p>
              </div>
            </div>

            {/* Required Skills */}
            <div className="space-y-2">
              <label className="text-sm font-medium">مهارت‌های ضروری</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مهارت را وارد کنید"
                  value={requiredSkillInput}
                  onChange={(e) => setRequiredSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill('required');
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button type="button" variant="outline" onClick={() => addSkill('required')}>
                  افزودن
                </Button>
              </div>
              {formData.required_skills && formData.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.required_skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill('required', skill)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preferred Skills */}
            <div className="space-y-2">
              <label className="text-sm font-medium">مهارت‌های مطلوب (اختیاری)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مهارت را وارد کنید"
                  value={preferredSkillInput}
                  onChange={(e) => setPreferredSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill('preferred');
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Button type="button" variant="outline" onClick={() => addSkill('preferred')}>
                  افزودن
                </Button>
              </div>
              {formData.preferred_skills && formData.preferred_skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.preferred_skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill('preferred', skill)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
              {/* Job Preview */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  {selectedCompany?.logo_url ? (
                    <img
                      src={selectedCompany.logo_url}
                      alt={selectedCompany.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{formData.title || 'بدون عنوان'}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCompany?.name}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  {formData.employment_type && (
                    <span className="px-2 py-1 bg-background rounded">
                      {EMPLOYMENT_TYPE_LABELS[formData.employment_type]}
                    </span>
                  )}
                  {formData.location_type && (
                    <span className="px-2 py-1 bg-background rounded">
                      {LOCATION_TYPE_LABELS[formData.location_type]}
                    </span>
                  )}
                  {formData.experience_level && (
                    <span className="px-2 py-1 bg-background rounded">
                      {EXPERIENCE_LEVEL_LABELS[formData.experience_level]}
                    </span>
                  )}
                </div>

                {formData.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{formData.location}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {(formData.required_skills?.length || formData.preferred_skills?.length) && (
                <div className="space-y-2">
                  {formData.required_skills && formData.required_skills.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">مهارت‌های ضروری: </span>
                      <span className="text-sm text-muted-foreground">
                        {formData.required_skills.join('، ')}
                      </span>
                    </div>
                  )}
                  {formData.preferred_skills && formData.preferred_skills.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">مهارت‌های مطلوب: </span>
                      <span className="text-sm text-muted-foreground">
                        {formData.preferred_skills.join('، ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Description Preview */}
              {formData.description && (
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {formData.description}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
              <div className="flex gap-3">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowRight className="w-4 h-4 ml-2" />
                  ویرایش
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ذخیره پیش‌نویس'}
                </Button>
              </div>
              <Button onClick={() => handleSubmit(true)} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 ml-2" />
                    {mode === 'edit' ? 'ذخیره و انتشار' : 'انتشار آگهی'}
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
