'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Briefcase,
  Building2,
  MapPin,
  ChevronLeft,
  Search,
} from 'lucide-react';
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType } from '@/types/job';

interface Job {
  id: string;
  title: string;
  location: string | null;
  employmentType: EmploymentType | null;
  companyName: string;
  companyLogo: string | null;
}

interface JobsWidgetProps {
  jobs: Job[];
  totalCount: number;
}

export function JobsWidget({ jobs, totalCount }: JobsWidgetProps) {
  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-5 w-5" />
            فرصت‌های شغلی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              فرصت شغلی جدیدی وجود ندارد
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              هویت حرفه‌ای خود را تکمیل کنید تا پیشنهادهای مرتبط ببینید
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/dashboard/identity">
                تکمیل هویت حرفه‌ای
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-5 w-5" />
            فرصت‌های شغلی
            {totalCount > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                ({totalCount} موقعیت)
              </span>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/jobs" className="flex items-center gap-1">
              همه
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  className="h-10 w-10 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{job.title}</h4>
                <p className="text-xs text-muted-foreground">{job.companyName}</p>
                <div className="flex items-center gap-2 mt-1">
                  {job.employmentType && (
                    <span className="text-xs text-muted-foreground">
                      {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </span>
                  )}
                </div>
              </div>
              <ChevronLeft className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
