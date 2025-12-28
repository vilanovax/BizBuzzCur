'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Check,
  X,
  Loader2,
  User,
  Briefcase,
  Calendar,
  FileText,
  Building2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Profile, ProfileType } from '@/types/profile';

const PROFILE_TYPE_CONFIG: Record<ProfileType, { icon: React.ElementType; label: string; color: string }> = {
  business_card: { icon: Briefcase, label: 'کارت ویزیت', color: 'text-blue-500' },
  resume: { icon: FileText, label: 'رزومه', color: 'text-green-500' },
  event: { icon: Calendar, label: 'رویداد', color: 'text-purple-500' },
  company: { icon: Building2, label: 'شرکت', color: 'text-orange-500' },
};

export default function TrashPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
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
        <Card className="p-12 text-center">
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
        </Card>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-3 px-4">
            <button
              onClick={handleSelectAll}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                selectedIds.length === profiles.length
                  ? 'bg-primary border-primary text-white'
                  : 'border-muted-foreground/30 hover:border-muted-foreground/50'
              }`}
            >
              {selectedIds.length === profiles.length && <Check className="w-3 h-3" />}
            </button>
            <span className="text-sm text-muted-foreground">انتخاب همه</span>
          </div>

          {/* Profile List */}
          <div className="space-y-3">
            {profiles.map((profile) => {
              const typeConfig = PROFILE_TYPE_CONFIG[profile.profile_type] || PROFILE_TYPE_CONFIG.business_card;
              const TypeIcon = typeConfig.icon;

              return (
                <Card key={profile.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleSelect(profile.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        selectedIds.includes(profile.id)
                          ? 'bg-primary border-primary text-white'
                          : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                      }`}
                    >
                      {selectedIds.includes(profile.id) && <Check className="w-3 h-3" />}
                    </button>

                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 opacity-60 grayscale"
                      style={{ backgroundColor: profile.theme_color || '#e5e7eb' }}
                    >
                      {profile.photo_url ? (
                        <img
                          src={profile.photo_url}
                          alt={profile.full_name || 'Profile'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white/80" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {profile.title}
                        </h3>
                        <span className={`flex items-center gap-1 text-xs ${typeConfig.color}`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          {typeConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {profile.full_name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        حذف شده {profile.deleted_at ? formatDeletedAt(profile.deleted_at) : ''}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore([profile.id])}
                        disabled={actionLoading}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      >
                        <RotateCcw className="w-4 h-4 ml-1" />
                        بازیابی
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(profile.id)}
                        disabled={actionLoading}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
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
