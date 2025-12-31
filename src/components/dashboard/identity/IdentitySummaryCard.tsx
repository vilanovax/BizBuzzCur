'use client';

import { DynamicIcon, getIconEmoji } from '@/lib/utils/icons';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { UserProfessionalProfile } from '@/types/professional';

interface IdentitySummaryCardProps {
  profile: UserProfessionalProfile;
}

export function IdentitySummaryCard({ profile }: IdentitySummaryCardProps) {
  const hasStatus = !!profile.status;
  const hasDomain = !!profile.primaryDomain;
  const hasSpecializations = (profile.specializations?.length ?? 0) > 0;

  // Determine identity health
  const isComplete = hasDomain && hasSpecializations && hasStatus;

  return (
    <Card className={cn(
      'border-2',
      isComplete ? 'border-green-200 dark:border-green-900/50' : 'border-amber-200 dark:border-amber-900/50'
    )}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Domain Icon */}
          {hasDomain && (
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                backgroundColor: profile.primaryDomain!.domain?.color || '#e5e7eb',
              }}
            >
              {getIconEmoji(profile.primaryDomain!.domain?.icon || '')}
            </div>
          )}

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            {/* Domain & Specialization */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">
                {profile.primaryDomain?.domain?.name_fa || 'حوزه تعیین نشده'}
              </h2>
              {hasSpecializations && profile.specializations!.length > 0 && (
                <span className="text-muted-foreground">-</span>
              )}
              {profile.specializations?.slice(0, 2).map((spec) => (
                <span
                  key={spec.id}
                  className="text-lg text-muted-foreground"
                >
                  {spec.specialization?.name_fa}
                </span>
              ))}
            </div>

            {/* Status Badge */}
            {hasStatus && profile.status?.status && (
              <div className="mt-3">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: profile.status.status.color || '#e5e7eb',
                    color: '#fff',
                  }}
                >
                  {profile.status.status.icon && (
                    <DynamicIcon
                      name={profile.status.status.icon}
                      className="h-4 w-4"
                      size={16}
                      fallback="emoji"
                    />
                  )}
                  <span>{profile.status.status.name_fa}</span>
                </div>
              </div>
            )}

            {/* Status indicator */}
            <div className="mt-3 flex items-center gap-2">
              {isComplete ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">هویت حرفه‌ای کامل است</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-600">هویت حرفه‌ای نیاز به تکمیل دارد</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
