'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Check,
  Loader2,
  User,
  Briefcase,
  Calendar,
  FileText,
  Building2,
  Clock,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { Profile, ProfileType } from '@/types/profile';

const PROFILE_TYPE_CONFIG: Record<ProfileType, { icon: React.ElementType; label: string; color: string }> = {
  business_card: { icon: Briefcase, label: 'کارت ویزیت', color: '#2563eb' },
  resume: { icon: FileText, label: 'رزومه', color: '#7c3aed' },
  event: { icon: Calendar, label: 'رویداد', color: '#059669' },
  company: { icon: Building2, label: 'شرکت', color: '#0891b2' },
};

// TrashProfileCard Component
interface TrashProfileCardProps {
  profile: Profile;
  typeConfig: { icon: React.ElementType; label: string; color: string };
  isSelected: boolean;
  onSelect: () => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onRestore: () => void;
  onDelete: () => void;
  actionLoading: boolean;
  formatDeletedAt: (dateStr: string) => string;
}

function TrashProfileCard({
  profile,
  typeConfig,
  isSelected,
  onSelect,
  openMenuId,
  setOpenMenuId,
  onRestore,
  onDelete,
  actionLoading,
  formatDeletedAt,
}: TrashProfileCardProps) {
  const TypeIcon = typeConfig.icon;

  return (
    <Card className="group relative hover:shadow-md transition-shadow opacity-70 grayscale">
      {/* Color bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: '#9ca3af' }}
      />

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                isSelected
                  ? 'bg-primary border-primary text-white'
                  : 'border-muted-foreground/30 hover:border-muted-foreground/50'
              )}
            >
              {isSelected && <Check className="w-3 h-3" />}
            </button>

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
                      onRestore();
                      setOpenMenuId(null);
                    }}
                    disabled={actionLoading}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    بازیابی
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setOpenMenuId(null);
                    }}
                    disabled={actionLoading}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف دائم
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
            <Clock className="w-3 h-3" />
            حذف شده {profile.deleted_at ? formatDeletedAt(profile.deleted_at) : ''}
          </div>

          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
              در سطل آشغال
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrashPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchTrash = async () => {
    try {
      const res = await fetch('/api/profiles/trash');
      const data = await res.json();
      if (data.success) {
        setProfiles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch trash:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleSelectAll = () => {
    if (selectedIds.length === profiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(profiles.map((p) => p.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleRestore = async (ids: string[]) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/profiles/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', ids }),
      });
      const data = await res.json();
      if (data.success) {
        setProfiles((prev) => prev.filter((p) => !ids.includes(p.id)));
        setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      }
    } catch (error) {
      console.error('Failed to restore:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async (ids: string[]) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/profiles/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids }),
      });
      const data = await res.json();
      if (data.success) {
        setProfiles((prev) => prev.filter((p) => !ids.includes(p.id)));
        setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleEmptyTrash = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/profiles/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'empty' }),
      });
      const data = await res.json();
      if (data.success) {
        setProfiles([]);
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('Failed to empty trash:', error);
    } finally {
      setActionLoading(false);
      setShowEmptyConfirm(false);
    }
  };

  const formatDeletedAt = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} دقیقه پیش`;
      }
      return `${diffHours} ساعت پیش`;
    }
    if (diffDays === 1) return 'دیروز';
    if (diffDays < 7) return `${diffDays} روز پیش`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} هفته پیش`;
    return `${Math.floor(diffDays / 30)} ماه پیش`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">سطل آشغال</h1>
            <p className="text-sm text-muted-foreground">
              {profiles.length} پروفایل حذف شده
            </p>
          </div>
        </div>

        {profiles.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowEmptyConfirm(true)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-4 h-4 ml-2" />
            خالی کردن سطل
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length} مورد انتخاب شده
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRestore(selectedIds)}
            disabled={actionLoading}
          >
            <RotateCcw className="w-4 h-4 ml-2" />
            بازیابی
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm('bulk')}
            disabled={actionLoading}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 ml-2" />
            حذف دائم
          </Button>
        </div>
      )}

      {/* Empty State */}
      {profiles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">سطل آشغال خالی است</h3>
            <p className="text-muted-foreground mb-4">
              پروفایل‌های حذف شده در اینجا نمایش داده می‌شوند
            </p>
            <Button onClick={() => router.push('/dashboard/profiles')}>
              بازگشت به پروفایل‌ها
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-3 px-1">
            <button
              onClick={handleSelectAll}
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                selectedIds.length === profiles.length
                  ? 'bg-primary border-primary text-white'
                  : 'border-muted-foreground/30 hover:border-muted-foreground/50'
              )}
            >
              {selectedIds.length === profiles.length && <Check className="w-3 h-3" />}
            </button>
            <span className="text-sm text-muted-foreground">انتخاب همه</span>
          </div>

          {/* Profile Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => {
              const typeConfig = PROFILE_TYPE_CONFIG[profile.profile_type] || PROFILE_TYPE_CONFIG.business_card;

              return (
                <TrashProfileCard
                  key={profile.id}
                  profile={profile}
                  typeConfig={typeConfig}
                  isSelected={selectedIds.includes(profile.id)}
                  onSelect={() => handleSelect(profile.id)}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  onRestore={() => handleRestore([profile.id])}
                  onDelete={() => setShowDeleteConfirm(profile.id)}
                  actionLoading={actionLoading}
                  formatDeletedAt={formatDeletedAt}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Empty Trash Confirmation Modal */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEmptyConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold">خالی کردن سطل آشغال</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              آیا مطمئن هستید که می‌خواهید تمام {profiles.length} پروفایل را به طور دائم حذف کنید؟
              این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowEmptyConfirm(false)}>
                انصراف
              </Button>
              <Button
                variant="destructive"
                onClick={handleEmptyTrash}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Trash2 className="w-4 h-4 ml-2" />
                )}
                حذف همه
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold">حذف دائم</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              {showDeleteConfirm === 'bulk'
                ? `آیا مطمئن هستید که می‌خواهید ${selectedIds.length} پروفایل انتخاب شده را به طور دائم حذف کنید؟`
                : 'آیا مطمئن هستید که می‌خواهید این پروفایل را به طور دائم حذف کنید؟'
              }
              {' '}این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                انصراف
              </Button>
              <Button
                variant="destructive"
                onClick={() => handlePermanentDelete(showDeleteConfirm === 'bulk' ? selectedIds : [showDeleteConfirm])}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Trash2 className="w-4 h-4 ml-2" />
                )}
                حذف دائم
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
