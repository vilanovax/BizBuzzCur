'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CompanyForm } from '@/components/companies/CompanyForm';
import type { Company } from '@/types/company';

interface EditCompanyPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCompanyPage({ params }: EditCompanyPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
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
      } else {
        setError(data.error || 'خطا در دریافت اطلاعات شرکت');
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
          <p className="text-destructive">{error || 'شرکت یافت نشد'}</p>
          <Button variant="outline" onClick={() => router.push('/dashboard/companies')} className="mt-4">
            بازگشت به لیست
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/companies/${id}`}>
            <ArrowRight className="w-4 h-4 ml-1" />
            بازگشت
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ویرایش شرکت</h1>
          <p className="text-muted-foreground mt-1">{company.name}</p>
        </div>
      </div>

      {/* Form */}
      <CompanyForm initialData={company} companyId={id} mode="edit" />
    </div>
  );
}
