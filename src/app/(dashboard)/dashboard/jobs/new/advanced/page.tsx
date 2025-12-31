'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { JobForm } from '@/components/jobs/JobForm';

function AdvancedJobContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/companies">
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">آگهی استخدام پیشرفته</h1>
            <p className="text-muted-foreground mt-1">
              فرم کامل با جزئیات بیشتر
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href="/dashboard/jobs/new">
            <Zap className="w-4 h-4 ml-2" />
            فرم سریع
          </Link>
        </Button>
      </div>

      {/* Advanced Form */}
      <JobForm mode="create" />
    </div>
  );
}

export default function AdvancedJobPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdvancedJobContent />
    </Suspense>
  );
}
