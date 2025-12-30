'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  Users,
  Sparkles,
  Filter,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import {
  EMPLOYMENT_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  type EmploymentType,
  type LocationType,
  type ExperienceLevel,
} from '@/types/job';

interface DiscoverJob {
  id: string;
  title: string;
  description?: string;
  employment_type?: EmploymentType;
  location_type?: LocationType;
  location?: string;
  experience_level?: ExperienceLevel;
  required_skills: string[];
  is_featured: boolean;
  published_at: string;
  has_applied: boolean;
  relevance_score: number;
  match_reasons: {
    domain: boolean;
    specialization: boolean;
    event: boolean;
  };
  company: {
    id: string;
    name: string;
    logo_url?: string;
    slug: string;
    industry?: string;
  };
  domain?: {
    name_fa: string;
    name_en: string;
  };
  specialization?: {
    name_fa: string;
    name_en: string;
  };
}

export default function JobDiscoveryPage() {
  const [jobs, setJobs] = useState<DiscoverJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [locationType, setLocationType] = useState<LocationType | ''>('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>('');

  useEffect(() => {
    fetchJobs();
  }, [employmentType, locationType, experienceLevel]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (employmentType) params.set('employment_type', employmentType);
      if (locationType) params.set('location_type', locationType);
      if (experienceLevel) params.set('experience_level', experienceLevel);

      const res = await fetch(`/api/jobs/discover?${params}`);
      const data = await res.json();

      if (data.success) {
        setJobs(data.data);
      } else {
        setError(data.error || 'خطا در دریافت فرصت‌های شغلی');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setEmploymentType('');
    setLocationType('');
    setExperienceLevel('');
  };

  const hasFilters = employmentType || locationType || experienceLevel;

  const getMatchReason = (job: DiscoverJob): string | null => {
    if (job.match_reasons.domain && job.domain) {
      return `مرتبط با حوزه ${job.domain.name_fa}`;
    }
    if (job.match_reasons.specialization && job.specialization) {
      return `مرتبط با تخصص ${job.specialization.name_fa}`;
    }
    if (job.match_reasons.event) {
      return 'از رویدادهای شما';
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">فرصت‌های شغلی</h1>
          <p className="text-muted-foreground mt-1">
            موقعیت‌های شغلی متناسب با پروفایل و تجربه شما
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(showFilters && 'border-primary text-primary')}
        >
          <Filter className="w-4 h-4 ml-2" />
          فیلترها
          {hasFilters && (
            <span className="mr-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              !
            </span>
          )}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              {/* Employment Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع همکاری</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType | '')}
                  className="px-3 py-2 border rounded-lg bg-background text-sm"
                >
                  <option value="">همه</option>
                  {(Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]).map((type) => (
                    <option key={type} value={type}>
                      {EMPLOYMENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">نوع حضور</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as LocationType | '')}
                  className="px-3 py-2 border rounded-lg bg-background text-sm"
                >
                  <option value="">همه</option>
                  {(Object.keys(LOCATION_TYPE_LABELS) as LocationType[]).map((type) => (
                    <option key={type} value={type}>
                      {LOCATION_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">سطح تجربه</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel | '')}
                  className="px-3 py-2 border rounded-lg bg-background text-sm"
                >
                  <option value="">همه</option>
                  {(Object.keys(EXPERIENCE_LEVEL_LABELS) as ExperienceLevel[]).map((level) => (
                    <option key={level} value={level}>
                      {EXPERIENCE_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
              </div>

              {hasFilters && (
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    پاک کردن فیلترها
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
            <Button variant="outline" onClick={fetchJobs} className="mt-4">
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">فرصت شغلی یافت نشد</h3>
            <p className="text-muted-foreground text-sm">
              {hasFilters
                ? 'فیلترها را تغییر دهید یا پروفایل خود را تکمیل کنید'
                : 'در حال حاضر فرصت شغلی متناسب با پروفایل شما وجود ندارد'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const matchReason = getMatchReason(job);

            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Company Logo */}
                      {job.company.logo_url ? (
                        <img
                          src={job.company.logo_url}
                          alt={job.company.name}
                          className="w-14 h-14 rounded-xl object-cover border"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-primary" />
                        </div>
                      )}

                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{job.title}</h3>
                              {job.has_applied && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                  <CheckCircle className="w-3 h-3" />
                                  درخواست داده‌اید
                                </span>
                              )}
                              {job.is_featured && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                  ویژه
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground">{job.company.name}</p>
                          </div>

                          <ArrowLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {job.employment_type && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                              <Clock className="w-3 h-3" />
                              {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
                            </span>
                          )}
                          {job.location_type && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                              <MapPin className="w-3 h-3" />
                              {LOCATION_TYPE_LABELS[job.location_type]}
                            </span>
                          )}
                          {job.experience_level && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                              <Users className="w-3 h-3" />
                              {EXPERIENCE_LEVEL_LABELS[job.experience_level]}
                            </span>
                          )}
                          {job.location && (
                            <span className="text-xs text-muted-foreground">
                              {job.location}
                            </span>
                          )}
                        </div>

                        {/* Match Reason */}
                        {matchReason && (
                          <div className="flex items-center gap-1.5 mt-3 text-xs text-primary">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{matchReason}</span>
                          </div>
                        )}

                        {/* Skills Preview */}
                        {job.required_skills && job.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {job.required_skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 bg-primary/5 text-primary rounded text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.required_skills.length > 4 && (
                              <span className="text-xs text-muted-foreground">
                                +{job.required_skills.length - 4} مهارت دیگر
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
