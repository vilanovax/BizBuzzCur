'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  User,
  Users,
  Globe,
  Lock,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Link as LinkIcon,
  ExternalLink,
  Calendar,
  GraduationCap,
  FileText,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ProfileVisibility, CTAType } from '@/types/profile';
import type { FieldVisibility } from '@/lib/profile/schemas/field-types';

// Preview modes
type PreviewMode = 'anonymous' | 'logged_in' | 'connected';

interface PreviewModeOption {
  value: PreviewMode;
  label: string;
  labelFa: string;
  icon: LucideIcon;
  description: string;
}

const PREVIEW_MODES: PreviewModeOption[] = [
  {
    value: 'anonymous',
    label: 'Anonymous',
    labelFa: 'ناشناس',
    icon: Globe,
    description: 'بازدیدکننده بدون حساب کاربری',
  },
  {
    value: 'logged_in',
    label: 'Logged In',
    labelFa: 'کاربر عادی',
    icon: User,
    description: 'کاربر وارد شده بدون اتصال',
  },
  {
    value: 'connected',
    label: 'Connected',
    labelFa: 'متصل',
    icon: Users,
    description: 'کاربر متصل به شما',
  },
];

// CTA button configurations
const CTA_CONFIG: Record<CTAType, { label: string; labelFa: string; icon: LucideIcon }> = {
  connect: { label: 'Connect', labelFa: 'اتصال', icon: Users },
  message: { label: 'Message', labelFa: 'پیام', icon: Mail },
  book_meeting: { label: 'Book Meeting', labelFa: 'رزرو جلسه', icon: Calendar },
  download_cv: { label: 'Download CV', labelFa: 'دانلود رزومه', icon: FileText },
  visit_website: { label: 'Visit Website', labelFa: 'مشاهده سایت', icon: ExternalLink },
  none: { label: '', labelFa: '', icon: User },
};

interface ProfileData {
  name?: string;
  title?: string;
  company?: string;
  bio?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  profilePhoto?: string;
  coverImage?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  socialLinks?: Record<string, string>;
  [key: string]: unknown;
}

interface ProfilePreviewProps {
  data: ProfileData;
  visibilityMap?: Record<string, FieldVisibility>;
  profileVisibility?: ProfileVisibility;
  themeColor?: string;
  ctaType?: CTAType;
  ctaUrl?: string;
  className?: string;
}

export function ProfilePreview({
  data,
  visibilityMap = {},
  profileVisibility = 'public',
  themeColor = '#2563eb',
  ctaType = 'connect',
  ctaUrl,
  className,
}: ProfilePreviewProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('anonymous');

  // Check if a field should be visible based on mode
  const isFieldVisible = (fieldKey: string, defaultVisibility: FieldVisibility = 'public'): boolean => {
    const visibility = visibilityMap[fieldKey] || defaultVisibility;

    switch (visibility) {
      case 'public':
        return true;
      case 'masked':
        return true; // Will show masked version
      case 'after_connect':
        return previewMode === 'connected';
      case 'hidden':
        return false;
      default:
        return true;
    }
  };

  // Mask sensitive data
  const maskValue = (value: string, fieldKey: string): string => {
    const visibility = visibilityMap[fieldKey] || 'public';
    if (visibility !== 'masked') return value;

    if (fieldKey === 'phone') {
      // Mask phone: show first 4 and last 2 digits
      if (value.length > 6) {
        return value.slice(0, 4) + '****' + value.slice(-2);
      }
      return '****';
    }

    if (fieldKey === 'email') {
      // Mask email: show first 2 chars and domain
      const [local, domain] = value.split('@');
      if (local && domain) {
        return local.slice(0, 2) + '***@' + domain;
      }
      return '***@***';
    }

    // Generic masking
    if (value.length > 4) {
      return value.slice(0, 2) + '***' + value.slice(-2);
    }
    return '***';
  };

  // Check if profile is viewable
  const isProfileViewable = (): boolean => {
    switch (profileVisibility) {
      case 'public':
        return true;
      case 'connections':
        return previewMode === 'connected';
      case 'private':
        return false;
      case 'event_only':
        return previewMode !== 'anonymous';
      default:
        return true;
    }
  };

  const ctaConfig = CTA_CONFIG[ctaType];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preview Mode Selector */}
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm font-medium text-foreground mb-3">نمایش به عنوان:</p>
        <div className="flex flex-wrap gap-2">
          {PREVIEW_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setPreviewMode(mode.value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  previewMode === mode.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-muted'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{mode.labelFa}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {PREVIEW_MODES.find((m) => m.value === previewMode)?.description}
        </p>
      </div>

      {/* Profile Preview Card */}
      <div className="bg-card rounded-xl overflow-hidden border shadow-sm">
        {/* Locked State */}
        {!isProfileViewable() && (
          <div className="p-8 text-center">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-2">پروفایل خصوصی</h3>
            <p className="text-sm text-muted-foreground">
              {profileVisibility === 'connections'
                ? 'این پروفایل فقط برای اتصال‌ها قابل مشاهده است'
                : profileVisibility === 'private'
                  ? 'این پروفایل خصوصی است'
                  : 'این پروفایل فقط در رویدادها قابل مشاهده است'}
            </p>
          </div>
        )}

        {/* Profile Content */}
        {isProfileViewable() && (
          <>
            {/* Cover Image */}
            {data.coverImage && (
              <div
                className="h-32 bg-cover bg-center"
                style={{ backgroundImage: `url(${data.coverImage})` }}
              />
            )}
            {!data.coverImage && (
              <div
                className="h-32"
                style={{ backgroundColor: themeColor + '20' }}
              />
            )}

            {/* Profile Header */}
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="-mt-12 mb-4">
                {data.profilePhoto ? (
                  <img
                    src={data.profilePhoto}
                    alt={data.name || 'Profile'}
                    className="w-24 h-24 rounded-full border-4 border-card object-cover"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full border-4 border-card flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: themeColor }}
                  >
                    {data.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              {/* Name & Title */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  {data.name || 'نام کاربر'}
                </h2>
                {isFieldVisible('title') && data.title && (
                  <p className="text-muted-foreground">{data.title}</p>
                )}
                {isFieldVisible('company') && data.company && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Building className="w-3 h-3" />
                    {data.company}
                  </p>
                )}
              </div>

              {/* Bio */}
              {isFieldVisible('bio') && data.bio && (
                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                  {data.bio}
                </p>
              )}

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {isFieldVisible('email') && data.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{maskValue(data.email, 'email')}</span>
                  </div>
                )}
                {isFieldVisible('phone') && data.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span dir="ltr">{maskValue(data.phone, 'phone')}</span>
                  </div>
                )}
                {isFieldVisible('website') && data.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={data.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {data.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {isFieldVisible('location') && data.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{data.location}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {isFieldVisible('skills') && data.skills && data.skills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    مهارت‌ها
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs rounded-full"
                        style={{
                          backgroundColor: themeColor + '20',
                          color: themeColor,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {isFieldVisible('experience') && data.experience && data.experience.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    سوابق کاری
                  </h4>
                  <div className="space-y-3">
                    {data.experience.slice(0, 3).map((exp, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-muted-foreground">{exp.company}</p>
                        <p className="text-xs text-muted-foreground">
                          {exp.startDate} - {exp.current ? 'اکنون' : exp.endDate}
                        </p>
                      </div>
                    ))}
                    {data.experience.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{data.experience.length - 3} مورد دیگر
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Education */}
              {isFieldVisible('education') && data.education && data.education.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    تحصیلات
                  </h4>
                  <div className="space-y-2">
                    {data.education.slice(0, 2).map((edu, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{edu.degree}</p>
                        <p className="text-muted-foreground">
                          {edu.institution} - {edu.year}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {isFieldVisible('social_links') && data.socialLinks && Object.keys(data.socialLinks).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(data.socialLinks).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      {platform}
                    </a>
                  ))}
                </div>
              )}

              {/* CTA Button */}
              {ctaType !== 'none' && (
                <button
                  type="button"
                  className="w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: themeColor }}
                >
                  <ctaConfig.icon className="w-5 h-5" />
                  {ctaConfig.labelFa}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Visibility Legend */}
      <div className="bg-muted/30 rounded-lg p-4">
        <p className="text-sm font-medium text-foreground mb-2">راهنمای نمایش:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>عمومی - همه می‌بینند</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>نصفه - بخشی نمایش داده می‌شود</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>بعد از اتصال - فقط متصل‌ها</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-500" />
            <span>مخفی - نمایش داده نمی‌شود</span>
          </div>
        </div>
      </div>
    </div>
  );
}
