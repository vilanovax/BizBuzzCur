'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CompanyForm } from '@/components/companies/CompanyForm';

export default function NewCompanyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/companies">
            <ArrowRight className="w-4 h-4 ml-1" />
            بازگشت
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ایجاد شرکت جدید</h1>
          <p className="text-muted-foreground mt-1">
            کسب‌وکار خود را ثبت کنید
          </p>
        </div>
      </div>

      {/* Form */}
      <CompanyForm mode="create" />
    </div>
  );
}
