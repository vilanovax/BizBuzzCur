'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  Briefcase,
  MapPin,
  ExternalLink,
  MoreVertical,
  Edit,
  Eye,
  Share2,
  Power,
  Trash2,
  Check,
  AlertCircle,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import type { CompanyWithStats, CompanyRole } from '@/types/company';
import { COMPANY_ROLE_LABELS } from '@/types/company';

interface CompanyCardProps {
  company: CompanyWithStats;
  onClick?: () => void;
  onToggleActive?: (companyId: string, isActive: boolean) => void;
  onDelete?: (companyId: string) => void;
}

const ROLE_COLORS: Record<CompanyRole, string> = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-blue-100 text-blue-700',
  recruiter: 'bg-green-100 text-green-700',
  member: 'bg-gray-100 text-gray-700',
};

export function CompanyCard({ company, onClick, onToggleActive, onDelete }: CompanyCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/${company.slug || company.id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setMenuOpen(false);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Open public profile in new tab
    window.open(`/${company.slug || company.id}`, '_blank');
    setMenuOpen(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/dashboard/companies/${company.id}/edit`);
    setMenuOpen(false);
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleActive?.(company.id, !company.show_in_directory);
    setMenuOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('آیا از حذف این شرکت اطمینان دارید؟')) {
      onDelete?.(company.id);
    }
    setMenuOpen(false);
  };

  const canManage = company.user_role === 'owner' || company.user_role === 'admin';

  return (
    <div className="relative">
      <Link href={`/dashboard/companies/${company.id}`}>
        <Card
          className="group hover:shadow-md transition-all cursor-pointer h-full"
          onClick={onClick}
        >
          {/* Brand color bar */}
          <div
            className="h-1.5 w-full rounded-t-lg"
            style={{ backgroundColor: company.brand_color || '#2563eb' }}
          />

          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              {/* Logo */}
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-14 h-14 rounded-xl object-cover border"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: company.brand_color || '#2563eb' }}
                >
                  <Building2 className="w-7 h-7" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{company.name}</h3>
                {company.tagline && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {company.tagline}
                  </p>
                )}
                {company.industry && (
                  <span className="inline-block mt-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {company.industry}
                  </span>
                )}
              </div>

              {/* Role Badge & Menu */}
              <div className="flex items-center gap-2">
                {company.user_role && (
                  <span
                    className={cn(
                      'px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                      ROLE_COLORS[company.user_role]
                    )}
                  >
                    {COMPANY_ROLE_LABELS[company.user_role]}
                  </span>
                )}

                {/* More Options Button */}
                <button
                  onClick={handleMenuClick}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  title="گزینه‌های بیشتر"
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Location */}
            {(company.city || company.country) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {[company.city, company.country].filter(Boolean).join('، ')}
                </span>
              </div>
            )}

            {/* Status Indicators */}
            {canManage && (company.member_count === 0 || company.active_jobs_count === 0) && (
              <div className="mb-3 space-y-1.5">
                {company.member_count === 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>هنوز عضوی به تیم اضافه نشده</span>
                  </div>
                )}
                {company.active_jobs_count === 0 && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg">
                    <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>فرصت شغلی فعالی ندارید</span>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 pt-3 border-t text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{company.member_count || 0} عضو</span>
              </div>
              {company.active_jobs_count > 0 && (
                <div className="flex items-center gap-1.5 text-green-600">
                  <Briefcase className="w-4 h-4" />
                  <span>{company.active_jobs_count} فرصت شغلی</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {canManage && (
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/dashboard/companies/${company.id}`);
                  }}
                >
                  مدیریت
                  <ArrowLeft className="w-3 h-3 mr-1" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/dashboard/jobs/new?company=${company.id}`);
                  }}
                >
                  <Plus className="w-3 h-3 ml-1" />
                  آگهی
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-12 left-4 z-50 min-w-48 bg-background border rounded-xl shadow-lg py-1 animate-in fade-in-0 zoom-in-95"
        >
          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Share2 className="w-4 h-4 text-muted-foreground" />
            )}
            <span>{copied ? 'کپی شد!' : 'اشتراک‌گذاری'}</span>
          </button>

          {/* Preview */}
          <button
            onClick={handlePreview}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span>پیش‌نمایش</span>
          </button>

          {canManage && (
            <>
              <div className="h-px bg-border my-1" />

              {/* Edit */}
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <Edit className="w-4 h-4 text-muted-foreground" />
                <span>ویرایش</span>
              </button>

              {/* Toggle Active */}
              {onToggleActive && (
                <button
                  onClick={handleToggleActive}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <Power className={cn(
                    'w-4 h-4',
                    company.show_in_directory ? 'text-green-500' : 'text-muted-foreground'
                  )} />
                  <span>{company.show_in_directory ? 'غیرفعال کردن' : 'فعال کردن'}</span>
                </button>
              )}

              {/* Delete - only for owner */}
              {company.user_role === 'owner' && onDelete && (
                <>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
