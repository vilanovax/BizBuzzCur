'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Search, Loader2, Users, Briefcase, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CompanyCard } from '@/components/companies/CompanyCard';
import type { CompanyWithStats } from '@/types/company';

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/companies/my');
      const data = await res.json();

      if (data.success) {
        setCompanies(data.data);
      } else {
        setError(data.error || 'خطا در دریافت شرکت‌ها');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (companyId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_in_directory: isActive }),
      });
      const data = await res.json();

      if (data.success) {
        // Update local state
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === companyId ? { ...c, show_in_directory: isActive } : c
          )
        );
      }
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  const handleDelete = async (companyId: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        // Remove from local state
        setCompanies((prev) => prev.filter((c) => c.id !== companyId));
      } else {
        alert(data.error || 'خطا در حذف شرکت');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('خطا در حذف شرکت');
    }
  };

  const filteredCompanies = companies.filter((company) =>
    !searchQuery ||
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals for stats
  const totalMembers = companies.reduce((sum, c) => sum + (c.member_count || 0), 0);
  const totalJobs = companies.reduce((sum, c) => sum + (c.active_jobs_count || 0), 0);

  // Single company mode - redirect to company detail
  // Commented for now, can enable later
  // useEffect(() => {
  //   if (!loading && companies.length === 1) {
  //     router.push(`/dashboard/companies/${companies[0].id}`);
  //   }
  // }, [loading, companies, router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">شرکت‌های من</h1>
          <p className="text-muted-foreground mt-1">
            مرکز مدیریت کسب‌وکار، تیم و فرصت‌های شغلی
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button asChild>
            <Link href="/dashboard/companies/new">
              <Plus className="w-4 h-4 ml-2" />
              شرکت جدید
            </Link>
          </Button>
          <span className="text-xs text-muted-foreground">
            استارت‌آپ، شرکت یا کسب‌وکار آزاد
          </span>
        </div>
      </div>

      {/* Smart Banner - What you can do here */}
      {companies.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">مرکز عملیات کسب‌وکار شما</p>
              <p className="text-xs text-muted-foreground mt-1">
                تیم بسازید، فرصت شغلی منتشر کنید و پروفایل‌ها را متصل کنید
              </p>
            </div>
            {/* Quick Stats */}
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{companies.length} شرکت</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{totalMembers} عضو</span>
              </div>
              {totalJobs > 0 && (
                <div className="flex items-center gap-1.5 text-green-600">
                  <Briefcase className="w-4 h-4" />
                  <span>{totalJobs} فرصت فعال</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - When companies exist */}
      {companies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/companies/${companies[0]?.id}`}>
              <Users className="w-4 h-4 ml-2" />
              مدیریت تیم
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/jobs/new">
              <Briefcase className="w-4 h-4 ml-2" />
              آگهی شغلی جدید
            </Link>
          </Button>
        </div>
      )}

      {/* Search - Only when multiple companies */}
      {companies.length > 1 && (
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="جستجوی شرکت..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={fetchCompanies} className="mt-4">
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      ) : filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            {companies.length === 0 ? (
              <>
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">مرکز عملیات کسب‌وکار</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  با ایجاد شرکت، می‌توانید تیم بسازید، فرصت شغلی منتشر کنید و پروفایل حرفه‌ای داشته باشید
                </p>

                {/* Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-lg mx-auto text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>ساخت و مدیریت تیم</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>انتشار فرصت شغلی</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>پروفایل حرفه‌ای</span>
                  </div>
                </div>

                <Button size="lg" asChild>
                  <Link href="/dashboard/companies/new">
                    <Plus className="w-5 h-5 ml-2" />
                    ایجاد اولین شرکت
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  رایگان • بدون نیاز به ثبت رسمی
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">شرکتی با این نام یافت نشد</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
