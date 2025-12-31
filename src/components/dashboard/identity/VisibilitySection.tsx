'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Eye, Users, Calendar, Building2 } from 'lucide-react';
import type { UserProfessionalProfile } from '@/types/professional';

interface VisibilitySectionProps {
  profile: UserProfessionalProfile;
}

export function VisibilitySection({ profile }: VisibilitySectionProps) {
  const hasDomain = !!profile.primaryDomain;
  const hasStatus = !!profile.status;
  const skillCount = profile.skills?.length ?? 0;
  const specCount = profile.specializations?.length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-5 w-5" />
          دیگران شما را چگونه می‌بینند
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visibility contexts */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* In Events */}
          <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-900/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-pink-600" />
              <span className="text-sm font-medium text-pink-700 dark:text-pink-400">در رویدادها</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasDomain ? (
                <>
                  به عنوان <span className="font-medium text-foreground">{profile.primaryDomain?.domain?.name_fa}</span>
                  {hasStatus && (
                    <> - <span className="font-medium text-foreground">{profile.status?.status?.name_fa}</span></>
                  )}
                </>
              ) : (
                'حوزه تخصصی شما نمایش داده نمی‌شود'
              )}
            </p>
          </div>

          {/* In Companies */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">در شرکت‌ها</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {specCount > 0 ? (
                <>
                  تخصص شما: <span className="font-medium text-foreground">
                    {profile.specializations?.slice(0, 2).map(s => s.specialization?.name_fa).join('، ')}
                  </span>
                </>
              ) : (
                'تخصص‌های شما نمایش داده نمی‌شود'
              )}
            </p>
          </div>

          {/* In Job Matching */}
          <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">در جستجوی استعداد</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {skillCount > 0 ? (
                <>
                  <span className="font-medium text-foreground">{skillCount} مهارت</span> برای مچینگ استفاده می‌شود
                </>
              ) : (
                'مهارتی برای مچینگ وجود ندارد'
              )}
            </p>
          </div>

          {/* Status Visibility */}
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/50">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-400">وضعیت شغلی</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasStatus ? (
                <>
                  وضعیت فعلی: <span className="font-medium text-foreground">{profile.status?.status?.name_fa}</span>
                </>
              ) : (
                'وضعیت شغلی شما مشخص نیست'
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
