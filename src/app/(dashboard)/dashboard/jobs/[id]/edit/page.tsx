'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { JobForm } from '@/components/jobs/JobForm';
import type { JobAd } from '@/types/job';

function EditJobContent() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();

      if (data.success) {
        // Check if user has permission to edit
        if (!data.data.can_edit) {
          setError('شما اجازه ویرایش این آگهی را ندارید');
          return;
        }
        setJob(data.data);
      } else {
        setError(data.error || 'خطا در دریافت اطلاعات آگهی');
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

  if (error || !job) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive">{error || 'آگهی یافت نشد'}</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            بازگشت
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/jobs/${jobId}`}>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ویرایش آگهی</h1>
          <p className="text-muted-foreground mt-1">{job.title}</p>
        </div>
      </div>

      {/* Form */}
      <JobForm initialData={job} jobId={jobId} mode="edit" />
    </div>
  );
}

export default function EditJobPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <EditJobContent />
    </Suspense>
  );
}
