'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

// Components
import { TemplateSelector } from '@/components/profile/TemplateSelector';
import { ProfileStepper, PROFILE_CREATION_STEPS } from '@/components/profile/ProfileStepper';
import { BlockBuilder } from '@/components/profile/BlockBuilder';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { QRCodeWithLogo } from '@/components/profile/QRCodeWithLogo';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { ImageUpload } from '@/components/ui/ImageUpload';

// Templates & Types
import { TEMPLATES, resolveTemplate, type ResolvedTemplate } from '@/lib/profile/templates/index';
import type { TemplateId, ProfileVisibility, CTAType } from '@/types/profile';
import type { FieldVisibility } from '@/lib/profile/schemas/field-types';

// Visibility options
const VISIBILITY_OPTIONS: { value: ProfileVisibility; label: string; description: string }[] = [
  { value: 'public', label: 'عمومی', description: 'همه می‌توانند ببینند' },
  { value: 'connections', label: 'اتصال‌ها', description: 'فقط افرادی که متصل شده‌اند' },
  { value: 'private', label: 'خصوصی', description: 'فقط خودتان می‌بینید' },
  { value: 'event_only', label: 'فقط رویداد', description: 'فقط در رویدادهای مرتبط' },
];

const CTA_OPTIONS: { value: CTAType; label: string }[] = [
  { value: 'connect', label: 'اتصال' },
  { value: 'message', label: 'پیام' },
  { value: 'book_meeting', label: 'رزرو جلسه' },
  { value: 'download_cv', label: 'دانلود رزومه' },
  { value: 'visit_website', label: 'مشاهده سایت' },
  { value: 'none', label: 'بدون دکمه' },
];

export default function NewProfilePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);

  // Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId | null>(null);
  const [resolvedTemplate, setResolvedTemplate] = useState<ResolvedTemplate | null>(null);

  // Step 1: Naming
  const [profileTitle, setProfileTitle] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Step 2: Content (managed by BlockBuilder)
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [visibilityMap, setVisibilityMap] = useState<Record<string, FieldVisibility>>({});

  // Step 3: Settings
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('public');
  const [themeColor, setThemeColor] = useState('#2563eb');
  const [ctaType, setCtaType] = useState<CTAType>('connect');
  const [ctaUrl, setCtaUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState<string>('');

  // Step 5: Publish result
  const [profileUrl, setProfileUrl] = useState<string>('');

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId as TemplateId);
    const resolved = resolveTemplate(templateId as TemplateId);
    if (resolved) {
      setResolvedTemplate(resolved);
      setThemeColor(resolved.defaults.themeColor);
      setCtaType(resolved.defaults.ctaType);
      setProfileVisibility(resolved.defaults.visibility);

      // Set default visibility for fields
      const defaultVisibility: Record<string, FieldVisibility> = {};
      resolved.resolvedSections.forEach((section) => {
        section.fields.forEach((field) => {
          defaultVisibility[field.schema.key] = field.visibility;
        });
      });
      setVisibilityMap(defaultVisibility);
    }
    setCurrentStep(1);
  };

  // Handle form value change
  const handleValueChange = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  // Handle visibility change
  const handleVisibilityChange = (key: string, visibility: FieldVisibility) => {
    setVisibilityMap((prev) => ({ ...prev, [key]: visibility }));
  };

  // Navigate steps
  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!selectedTemplateId;
      case 1:
        return !!profileTitle.trim();
      case 2:
        return true; // Content is optional based on template
      case 3:
        return true; // Settings have defaults
      case 4:
        return true; // Preview is just for viewing
      default:
        return false;
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step <= 5) {
      setCurrentStep(step);
    }
  };

  // Save profile
  const saveProfile = async () => {
    if (!selectedTemplateId || !resolvedTemplate) return;

    setSaving(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: profileTitle,
          profile_type: resolvedTemplate.profileType,
          template_id: selectedTemplateId,
          internal_notes: internalNotes || undefined,
          full_name: formValues.full_name as string || undefined,
          headline: formValues.headline as string || undefined,
          bio: formValues.bio as string || undefined,
          email: formValues.email as string || undefined,
          phone: formValues.phone as string || undefined,
          website: formValues.website as string || undefined,
          job_title: formValues.job_title as string || undefined,
          company: formValues.company as string || undefined,
          social_links: formValues.social_links as Record<string, string> || undefined,
          theme_color: themeColor,
          visibility: profileVisibility,
          phone_visibility: visibilityMap.phone || 'full',
          email_visibility: visibilityMap.email || 'full',
          cta_type: ctaType,
          cta_url: ctaUrl || undefined,
          expires_at: expiresAt || undefined,
          is_public: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCreatedProfileId(data.data.id);
        setProfileUrl(`${window.location.origin}/${data.data.slug}`);
        setCurrentStep(5);
      } else {
        alert(data.error || 'خطا در ذخیره پروفایل');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('خطا در اتصال به سرور');
    } finally {
      setSaving(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold">قالب پروفایل را انتخاب کنید</h2>
              <p className="text-muted-foreground mt-2">
                هر قالب برای یک هدف خاص طراحی شده است
              </p>
            </div>
            <TemplateSelector
              templates={TEMPLATES}
              selectedId={selectedTemplateId}
              onSelect={handleTemplateSelect}
            />
          </div>
        );

      case 1:
        return (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold">نام‌گذاری پروفایل</h2>
              <p className="text-muted-foreground mt-2">
                این نام فقط برای شما قابل مشاهده است
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  عنوان پروفایل <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={profileTitle}
                  onChange={(e) => setProfileTitle(e.target.value)}
                  placeholder="مثلاً: کارت ویزیت اصلی، رزومه شرکت X"
                  className="w-full px-4 py-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  یادداشت داخلی (اختیاری)
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="یادداشتی برای خودتان..."
                  rows={3}
                  className="w-full px-4 py-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Profile photo */}
              <ImageUpload
                value={formValues.photo_url as string}
                onChange={(url) => handleValueChange('photo_url', url)}
                label="Profile Photo"
                labelFa="عکس پروفایل"
                type="profile_photo"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold">محتوای پروفایل</h2>
              <p className="text-muted-foreground mt-2">
                اطلاعاتی که می‌خواهید نمایش دهید را وارد کنید
              </p>
            </div>

            {resolvedTemplate && (
              <BlockBuilder
                sections={resolvedTemplate.resolvedSections}
                values={formValues}
                onChange={handleValueChange}
                onVisibilityChange={handleVisibilityChange}
                visibilityMap={visibilityMap}
              />
            )}
          </div>
        );

      case 3:
        return (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold">تنظیمات نمایش</h2>
              <p className="text-muted-foreground mt-2">
                ظاهر و دسترسی پروفایل را تنظیم کنید
              </p>
            </div>

            {/* Theme Color */}
            <ColorPicker
              value={themeColor}
              onChange={setThemeColor}
            />

            {/* Visibility */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">سطح دسترسی</label>
              <div className="grid grid-cols-2 gap-3">
                {VISIBILITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProfileVisibility(option.value)}
                    className={cn(
                      'p-4 rounded-xl border text-right transition-all',
                      profileVisibility === option.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    )}
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Type */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">دکمه اقدام اصلی (CTA)</label>
              <div className="flex flex-wrap gap-2">
                {CTA_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCtaType(option.value)}
                    className={cn(
                      'px-4 py-2 rounded-lg border text-sm transition-all',
                      ctaType === option.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:border-primary/50'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA URL (if needed) */}
            {(ctaType === 'visit_website' || ctaType === 'book_meeting') && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  لینک {ctaType === 'visit_website' ? 'سایت' : 'رزرو جلسه'}
                </label>
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className="w-full px-4 py-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            {/* Expiration */}
            <div>
              <label className="block text-sm font-medium mb-2">
                تاریخ انقضا (اختیاری)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-1">
                پروفایل بعد از این تاریخ غیرفعال می‌شود
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold mb-4">پیش‌نمایش پروفایل</h2>
              <ProfilePreview
                data={{
                  name: formValues.full_name as string,
                  title: formValues.headline as string,
                  company: formValues.company as string,
                  bio: formValues.bio as string,
                  email: formValues.email as string,
                  phone: formValues.phone as string,
                  website: formValues.website as string,
                  profilePhoto: formValues.photo_url as string,
                  skills: formValues.skills as string[],
                  socialLinks: formValues.social_links as Record<string, string>,
                }}
                visibilityMap={visibilityMap}
                profileVisibility={profileVisibility}
                themeColor={themeColor}
                ctaType={ctaType}
              />
            </div>

            <div className="lg:sticky lg:top-4">
              <Card>
                <CardHeader>
                  <CardTitle>خلاصه پروفایل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">عنوان:</span>
                    <span className="font-medium">{profileTitle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">قالب:</span>
                    <span className="font-medium">{resolvedTemplate?.nameFa}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">دسترسی:</span>
                    <span className="font-medium">
                      {VISIBILITY_OPTIONS.find((v) => v.value === profileVisibility)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CTA:</span>
                    <span className="font-medium">
                      {CTA_OPTIONS.find((c) => c.value === ctaType)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">رنگ:</span>
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: themeColor }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="max-w-xl mx-auto text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">پروفایل با موفقیت ایجاد شد!</h2>
              <p className="text-muted-foreground mt-2">
                حالا می‌توانید پروفایل خود را به اشتراک بگذارید
              </p>
            </div>

            <QRCodeWithLogo
              value={profileUrl}
              profileName={profileTitle}
              size={256}
            />

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push(`/dashboard/profiles/${createdProfileId}`)}
              >
                ویرایش پروفایل
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/profiles')}>
                بازگشت به لیست
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stepper */}
      {currentStep < 5 && (
        <ProfileStepper
          steps={PROFILE_CREATION_STEPS}
          currentStep={currentStep}
          onStepClick={goToStep}
        />
      )}

      {/* Content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            قبلی
          </Button>

          {currentStep === 4 ? (
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                <>
                  ایجاد پروفایل
                  <Check className="w-4 h-4 mr-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => goToStep(currentStep + 1)}
              disabled={!canGoNext()}
            >
              بعدی
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
