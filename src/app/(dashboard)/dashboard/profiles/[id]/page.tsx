'use client';

import * as React from 'react';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Save,
  Loader2,
  ExternalLink,
  QrCode,
  Trash2,
  Copy,
  Eye,
  Settings,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

// Components
import { BlockBuilder } from '@/components/profile/BlockBuilder';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { QRCodeWithLogo } from '@/components/profile/QRCodeWithLogo';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { ImageUpload } from '@/components/ui/ImageUpload';

// Templates & Types
import { resolveTemplate, type ResolvedTemplate } from '@/lib/profile/templates/index';
import type { Profile, ProfileVisibility, CTAType, TemplateId } from '@/types/profile';
import type { FieldVisibility } from '@/lib/profile/schemas/field-types';

// Tabs
type TabId = 'content' | 'settings' | 'preview' | 'share';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'content', label: 'محتوا', icon: FileText },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
  { id: 'preview', label: 'پیش‌نمایش', icon: Eye },
  { id: 'share', label: 'اشتراک‌گذاری', icon: QrCode },
];

// Visibility options
const VISIBILITY_OPTIONS: { value: ProfileVisibility; label: string }[] = [
  { value: 'public', label: 'عمومی' },
  { value: 'connections', label: 'اتصال‌ها' },
  { value: 'private', label: 'خصوصی' },
  { value: 'event_only', label: 'فقط رویداد' },
];

const CTA_OPTIONS: { value: CTAType; label: string }[] = [
  { value: 'connect', label: 'اتصال' },
  { value: 'message', label: 'پیام' },
  { value: 'book_meeting', label: 'رزرو جلسه' },
  { value: 'download_cv', label: 'دانلود رزومه' },
  { value: 'visit_website', label: 'مشاهده سایت' },
  { value: 'none', label: 'بدون دکمه' },
];

interface EditProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('content');
  const [hasChanges, setHasChanges] = useState(false);

  // Template
  const [resolvedTemplate, setResolvedTemplate] = useState<ResolvedTemplate | null>(null);

  // Form State
  const [profileTitle, setProfileTitle] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [visibilityMap, setVisibilityMap] = useState<Record<string, FieldVisibility>>({});

  // Settings
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('public');
  const [themeColor, setThemeColor] = useState('#2563eb');
  const [ctaType, setCtaType] = useState<CTAType>('connect');
  const [ctaUrl, setCtaUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Fetch profile
  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/profiles/${id}`);
      const data = await res.json();

      if (data.success) {
        const p = data.data as Profile;
        setProfile(p);

        // Populate form
        setProfileTitle(p.title);
        setInternalNotes(p.internal_notes || '');
        setThemeColor(p.theme_color || '#2563eb');
        setProfileVisibility(p.visibility || 'public');
        setCtaType(p.cta_type || 'connect');
        setCtaUrl(p.cta_url || '');
        setIsPublic(p.is_public);

        // Set form values from profile
        setFormValues({
          full_name: p.full_name,
          headline: p.headline,
          bio: p.bio,
          email: p.email,
          phone: p.phone,
          website: p.website,
          job_title: p.job_title,
          company: p.company,
          photo_url: p.photo_url,
          cover_url: p.cover_url,
          social_links: p.social_links,
          custom_fields: p.custom_fields,
        });

        // Set visibility map (convert 'full' to 'public' for FieldVisibility type)
        const mapVisibility = (v: string): FieldVisibility => {
          if (v === 'full') return 'public';
          return v as FieldVisibility;
        };
        setVisibilityMap({
          phone: mapVisibility(p.phone_visibility || 'full'),
          email: mapVisibility(p.email_visibility || 'full'),
        });

        // Resolve template
        if (p.template_id) {
          const resolved = resolveTemplate(p.template_id);
          if (resolved) {
            setResolvedTemplate(resolved);
          }
        }
      } else {
        setError(data.error || 'پروفایل یافت نشد');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  // Handle changes
  const handleValueChange = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleVisibilityChange = (key: string, visibility: FieldVisibility) => {
    setVisibilityMap((prev) => ({ ...prev, [key]: visibility }));
    setHasChanges(true);
  };

  // Save profile
  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: profileTitle,
          internal_notes: internalNotes || null,
          full_name: formValues.full_name || null,
          headline: formValues.headline || null,
          bio: formValues.bio || null,
          email: formValues.email || null,
          phone: formValues.phone || null,
          website: formValues.website || null,
          job_title: formValues.job_title || null,
          company: formValues.company || null,
          photo_url: formValues.photo_url || null,
          cover_url: formValues.cover_url || null,
          social_links: formValues.social_links || null,
          custom_fields: formValues.custom_fields || null,
          theme_color: themeColor,
          visibility: profileVisibility,
          phone_visibility: visibilityMap.phone || 'full',
          email_visibility: visibilityMap.email || 'full',
          cta_type: ctaType,
          cta_url: ctaUrl || null,
          is_public: isPublic,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setProfile(data.data);
        setHasChanges(false);
      } else {
        alert(data.error || 'خطا در ذخیره');
      }
    } catch (err) {
      alert('خطا در اتصال به سرور');
    } finally {
      setSaving(false);
    }
  };

  // Delete profile
  const deleteProfile = async () => {
    if (!confirm('آیا از حذف این پروفایل مطمئن هستید؟ این عمل قابل برگشت نیست.')) return;

    try {
      const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        router.push('/dashboard/profiles');
      } else {
        alert(data.error || 'خطا در حذف');
      }
    } catch (err) {
      alert('خطا در اتصال به سرور');
    }
  };

  // Duplicate profile
  const duplicateProfile = async () => {
    try {
      const res = await fetch(`/api/profiles/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        router.push(`/dashboard/profiles/${data.data.id}`);
      }
    } catch (err) {
      alert('خطا در کپی پروفایل');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error || 'پروفایل یافت نشد'}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/profiles">بازگشت</Link>
        </Button>
      </div>
    );
  }

  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${profile.slug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/profiles">
              <ArrowRight className="w-4 h-4 ml-2" />
              بازگشت
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{profile.title}</h1>
            <p className="text-sm text-muted-foreground">
              {resolvedTemplate?.nameFa || 'پروفایل'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={duplicateProfile}>
            <Copy className="w-4 h-4 ml-2" />
            کپی
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${profile.slug}`} target="_blank">
              <ExternalLink className="w-4 h-4 ml-2" />
              مشاهده
            </Link>
          </Button>
          <Button onClick={saveProfile} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            ذخیره
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Title & Notes */}
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات پایه</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">عنوان پروفایل</label>
                  <input
                    type="text"
                    value={profileTitle}
                    onChange={(e) => {
                      setProfileTitle(e.target.value);
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">یادداشت داخلی</label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => {
                      setInternalNotes(e.target.value);
                      setHasChanges(true);
                    }}
                    rows={2}
                    className="w-full px-4 py-2 border rounded-lg bg-background resize-none"
                  />
                </div>
                <ImageUpload
                  value={formValues.photo_url as string}
                  onChange={(url) => handleValueChange('photo_url', url)}
                  labelFa="عکس پروفایل"
                  type="profile_photo"
                />
              </CardContent>
            </Card>

            {/* Block Builder */}
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
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ظاهر</CardTitle>
              </CardHeader>
              <CardContent>
                <ColorPicker
                  value={themeColor}
                  onChange={(color) => {
                    setThemeColor(color);
                    setHasChanges(true);
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>دسترسی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Public toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">وضعیت انتشار</p>
                    <p className="text-sm text-muted-foreground">
                      {isPublic ? 'پروفایل فعال و قابل مشاهده است' : 'پروفایل پیش‌نویس است'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsPublic(!isPublic);
                      setHasChanges(true);
                    }}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      isPublic ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        isPublic ? 'translate-x-1' : 'translate-x-6'
                      )}
                    />
                  </button>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium mb-2">سطح دسترسی</label>
                  <div className="flex flex-wrap gap-2">
                    {VISIBILITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setProfileVisibility(option.value);
                          setHasChanges(true);
                        }}
                        className={cn(
                          'px-4 py-2 rounded-lg border text-sm',
                          profileVisibility === option.value
                            ? 'border-primary bg-primary/10'
                            : ''
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>دکمه اقدام (CTA)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {CTA_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setCtaType(option.value);
                        setHasChanges(true);
                      }}
                      className={cn(
                        'px-4 py-2 rounded-lg border text-sm',
                        ctaType === option.value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : ''
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {(ctaType === 'visit_website' || ctaType === 'book_meeting') && (
                  <input
                    type="url"
                    value={ctaUrl}
                    onChange={(e) => {
                      setCtaUrl(e.target.value);
                      setHasChanges(true);
                    }}
                    placeholder="https://..."
                    dir="ltr"
                    className="w-full px-4 py-2 border rounded-lg bg-background"
                  />
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">منطقه خطر</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={deleteProfile}>
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف پروفایل
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="max-w-xl mx-auto">
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
                socialLinks: formValues.social_links as Record<string, string>,
              }}
              visibilityMap={visibilityMap}
              profileVisibility={profileVisibility}
              themeColor={themeColor}
              ctaType={ctaType}
            />
          </div>
        )}

        {/* Share Tab */}
        {activeTab === 'share' && (
          <div className="max-w-xl mx-auto space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>QR Code</CardTitle>
              </CardHeader>
              <CardContent>
                <QRCodeWithLogo
                  value={profileUrl}
                  profileName={profile.title}
                  size={256}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>لینک پروفایل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={profileUrl}
                    readOnly
                    dir="ltr"
                    className="flex-1 px-4 py-2 border rounded-lg bg-muted text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(profileUrl);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
