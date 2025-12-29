'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  QrCode,
  ExternalLink,
  Briefcase,
  FileText,
  Users,
  Building2,
  Power,
  PowerOff,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { QRCodeModal } from '@/components/profile/QRCodeModal';
import { ProfilePreviewModal } from '@/components/profile/ProfilePreviewModal';
import { cn } from '@/lib/utils/cn';
import type { Profile, ProfileType } from '@/types/profile';

const PROFILE_TYPE_CONFIG: Record<ProfileType, { icon: React.ElementType; label: string; color: string }> = {
  business_card: { icon: Briefcase, label: 'کارت ویزیت', color: '#2563eb' },
  resume: { icon: FileText, label: 'رزومه', color: '#7c3aed' },
  event: { icon: Users, label: 'رویداد', color: '#059669' },
  company: { icon: Building2, label: 'شرکت', color: '#0891b2' },
};

// ProfileCard Component
interface ProfileCardProps {
  profile: Profile;
  typeConfig: { icon: React.ElementType; label: string; color: string };
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  setPreviewProfile: (profile: Profile) => void;
  setQrModalProfile: (profile: Profile) => void;
  duplicateProfile: (id: string) => void;
  toggleProfileStatus: (id: string, currentStatus: boolean) => void;
  deleteProfile: (id: string) => void;
  shareProfile: (profile: Profile) => void;
}

function ProfileCard({
  profile,
  typeConfig,
  openMenuId,
  setOpenMenuId,
  setPreviewProfile,
  setQrModalProfile,
  duplicateProfile,
  toggleProfileStatus,
  deleteProfile,
  shareProfile,
}: ProfileCardProps) {
  const TypeIcon = typeConfig.icon;

  return (
    <Card
      className={cn(
        "group relative hover:shadow-md transition-shadow cursor-pointer",
        !profile.is_public && "opacity-60 grayscale"
      )}
      onClick={() => setPreviewProfile(profile)}
    >
      {/* Color bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: profile.is_public ? (profile.theme_color || typeConfig.color) : '#9ca3af' }}
      />

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.title}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: profile.theme_color || typeConfig.color }}
              >
                {profile.title.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-semibold line-clamp-1">{profile.title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TypeIcon className="w-3 h-3" />
                {typeConfig.label}
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpenMenuId(openMenuId === profile.id ? null : profile.id)}
              className="p-1.5 rounded hover:bg-muted transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>

            {openMenuId === profile.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpenMenuId(null)}
                />
                <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 border rounded-lg shadow-lg py-1 min-w-[140px]">
                  <button
                    onClick={() => {
                      setPreviewProfile(profile);
                      setOpenMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Eye className="w-4 h-4" />
                    پیش‌نمایش
                  </button>
                  <button
                    onClick={() => {
                      setQrModalProfile(profile);
                      setOpenMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <QrCode className="w-4 h-4" />
                    نمایش QR
                  </button>
                  <button
                    onClick={() => {
                      shareProfile(profile);
                      setOpenMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Share2 className="w-4 h-4" />
                    اشتراک‌گذاری
                  </button>
                  <Link
                    href={`/dashboard/profiles/${profile.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Edit className="w-4 h-4" />
                    ویرایش
                  </Link>
                  <button
                    onClick={() => duplicateProfile(profile.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Copy className="w-4 h-4" />
                    کپی
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => toggleProfileStatus(profile.id, profile.is_public)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm",
                      profile.is_public
                        ? "text-orange-600 hover:bg-orange-50"
                        : "text-green-600 hover:bg-green-50"
                    )}
                  >
                    {profile.is_public ? (
                      <>
                        <PowerOff className="w-4 h-4" />
                        غیرفعال کردن
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4" />
                        فعال کردن
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        {profile.headline && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {profile.headline}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            {profile.view_count || 0} بازدید
          </div>

          <div className="flex items-center gap-1">
            <span
              className={cn(
                'px-2 py-0.5 rounded text-xs',
                profile.is_public
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              {profile.is_public ? 'فعال' : 'پیش‌نویس'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ProfileType | 'all'>('all');
  const [showInactive, setShowInactive] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [qrModalProfile, setQrModalProfile] = useState<Profile | null>(null);
  const [previewProfile, setPreviewProfile] = useState<Profile | null>(null);

  // Load showInactive from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bizbuzz_show_inactive_profiles');
    if (saved !== null) {
      setShowInactive(saved === 'true');
    }
  }, []);

  // Save showInactive to localStorage when it changes
  const handleShowInactiveChange = (checked: boolean) => {
    setShowInactive(checked);
    localStorage.setItem('bizbuzz_show_inactive_profiles', String(checked));
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profiles');
      const data = await res.json();

      if (data.success) {
        setProfiles(data.data);
      } else {
        setError(data.error || 'خطا در دریافت پروفایل‌ها');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const duplicateProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/profiles/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setProfiles([data.data, ...profiles]);
        setOpenMenuId(null);
      }
    } catch (err) {
      console.error('Duplicate error:', err);
    }
  };

  const deleteProfile = async (id: string) => {
    if (!confirm('آیا از حذف این پروفایل مطمئن هستید؟')) return;

    try {
      const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setProfiles(profiles.filter((p) => p.id !== id));
        setOpenMenuId(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleProfileStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !currentStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setProfiles(profiles.map((p) =>
          p.id === id ? { ...p, is_public: !currentStatus } : p
        ));
        setOpenMenuId(null);
      }
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const shareProfile = async (profile: Profile) => {
    const profileUrl = `${window.location.origin}/${profile.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: profile.title,
          text: profile.headline || `پروفایل ${profile.title}`,
          url: profileUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(profileUrl);
        }
      }
    } else {
      copyToClipboard(profileUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('لینک پروفایل کپی شد!');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      !searchQuery ||
      profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || profile.profile_type === filterType;

    const matchesStatus = showInactive || profile.is_public;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Group profiles by type (only when filterType is 'all')
  const groupedProfiles = filterType === 'all'
    ? Object.entries(PROFILE_TYPE_CONFIG).reduce((acc, [type]) => {
        const profilesOfType = filteredProfiles.filter(p => p.profile_type === type);
        if (profilesOfType.length > 0) {
          acc[type as ProfileType] = profilesOfType;
        }
        return acc;
      }, {} as Record<ProfileType, Profile[]>)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">پروفایل‌های من</h1>
          <p className="text-muted-foreground mt-1">
            مدیریت و ساخت پروفایل‌های دیجیتال
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/profiles/new">
            <Plus className="w-4 h-4 ml-2" />
            پروفایل جدید
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="جستجوی پروفایل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                'px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors',
                filterType === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              همه
            </button>
            {Object.entries(PROFILE_TYPE_CONFIG).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setFilterType(type as ProfileType)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2',
                  filterType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                <config.icon className="w-3 h-3" />
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Show Inactive Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => handleShowInactiveChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-muted-foreground">
              نمایش پروفایل‌های غیرفعال
            </span>
          </label>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchProfiles} className="mt-4">
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      ) : filteredProfiles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            {profiles.length === 0 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">هنوز پروفایلی ندارید</h3>
                <p className="text-muted-foreground mb-4">
                  اولین پروفایل دیجیتال خود را بسازید
                </p>
                <Button asChild>
                  <Link href="/dashboard/profiles/new">
                    <Plus className="w-4 h-4 ml-2" />
                    ایجاد پروفایل
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">پروفایلی با این معیارها یافت نشد</p>
            )}
          </CardContent>
        </Card>
      ) : groupedProfiles && filterType === 'all' ? (
        // Grouped view when showing all types
        <div className="space-y-8">
          {Object.entries(groupedProfiles).map(([type, profilesOfType], index) => {
            const typeConfig = PROFILE_TYPE_CONFIG[type as ProfileType];
            const TypeIcon = typeConfig.icon;

            return (
              <div key={type}>
                {/* Divider with section header */}
                {index > 0 && <hr className="mb-8 border-border" />}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: typeConfig.color }}
                  >
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-semibold">{typeConfig.label}</h2>
                  <span className="text-sm text-muted-foreground">
                    ({profilesOfType.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profilesOfType.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      typeConfig={typeConfig}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      setPreviewProfile={setPreviewProfile}
                      setQrModalProfile={setQrModalProfile}
                      duplicateProfile={duplicateProfile}
                      toggleProfileStatus={toggleProfileStatus}
                      deleteProfile={deleteProfile}
                      shareProfile={shareProfile}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat view when filtering by type
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((profile) => {
            const typeConfig = PROFILE_TYPE_CONFIG[profile.profile_type];
            return (
              <ProfileCard
                key={profile.id}
                profile={profile}
                typeConfig={typeConfig}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                setPreviewProfile={setPreviewProfile}
                setQrModalProfile={setQrModalProfile}
                duplicateProfile={duplicateProfile}
                toggleProfileStatus={toggleProfileStatus}
                deleteProfile={deleteProfile}
                shareProfile={shareProfile}
              />
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={!!qrModalProfile}
        onClose={() => setQrModalProfile(null)}
        profileSlug={qrModalProfile?.slug || ''}
        profileTitle={qrModalProfile?.title || ''}
        themeColor={qrModalProfile?.theme_color || undefined}
      />

      {/* Profile Preview Modal */}
      <ProfilePreviewModal
        isOpen={!!previewProfile}
        onClose={() => setPreviewProfile(null)}
        profile={previewProfile}
      />
    </div>
  );
}
