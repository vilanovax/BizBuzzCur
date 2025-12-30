'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Building2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CompanyCard } from '@/components/companies/CompanyCard';
import type { CompanyWithStats } from '@/types/company';

export default function CompaniesPage() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">شرکت‌های من</h1>
          <p className="text-muted-foreground mt-1">
            مدیریت کسب‌وکارها و تیم‌های خود
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/companies/new">
            <Plus className="w-4 h-4 ml-2" />
            شرکت جدید
          </Link>
        </Button>
      </div>

      {/* Search */}
      {companies.length > 0 && (
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
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">هنوز شرکتی ندارید</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  برای ایجاد فرصت‌های شغلی و مدیریت تیم، اول یک شرکت بسازید
                </p>
                <Button asChild>
                  <Link href="/dashboard/companies/new">
                    <Plus className="w-4 h-4 ml-2" />
                    ایجاد شرکت
                  </Link>
                </Button>
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
