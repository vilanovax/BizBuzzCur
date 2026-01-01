'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { JobQualityDashboard } from '@/components/executive-dashboard';

interface JobQualityPageProps {
  params: Promise<{ id: string }>;
}

export default function JobQualityPage({ params }: JobQualityPageProps) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/companies/${id}`}>
            <ArrowRight className="w-4 h-4 ml-1" />
            بازگشت به شرکت
          </Link>
        </Button>
      </div>

      {/* Dashboard */}
      <JobQualityDashboard companyId={id} />
    </div>
  );
}
