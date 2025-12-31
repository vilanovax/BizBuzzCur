'use client';

/**
 * Company Compliance & Transparency Page
 *
 * Accessible to company owners and admins.
 * Explains data usage, safeguards, and limitations.
 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CompliancePage } from '@/components/compliance/CompliancePage';
import type { CompanyWithStats } from '@/types/company';
import { canManageCompany } from '@/types/company';

interface CompliancePageRouteProps {
  params: Promise<{ id: string }>;
}

export default function CompliancePageRoute({ params }: CompliancePageRouteProps) {
  const { id } = use(params);
  const router = useRouter();
  const [company, setCompany] = useState<CompanyWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/companies/${id}`);
      const data = await res.json();

      if (data.success) {
        setCompany(data.data);

        // Check permission
        if (!canManageCompany(data.data.user_role)) {
          setError('دسترسی غیرمجاز');
        }
      } else {
        setError(data.error || 'خطا در دریافت اطلاعات');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive mb-4">{error || 'شرکت یافت نشد'}</p>
          <Button variant="outline" onClick={() => router.push('/dashboard/companies')}>
            بازگشت به لیست شرکت‌ها
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/companies/${id}`}>
            <ArrowRight className="w-4 h-4 ml-1" />
            {company.name}
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">شفافیت و انطباق</span>
      </div>

      {/* Compliance content */}
      <CompliancePage
        companyName={company.name}
        lastUpdated="2024-01-15"
      />
    </div>
  );
}
