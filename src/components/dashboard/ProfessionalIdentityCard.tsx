'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { DynamicIcon, getIconEmoji } from '@/lib/utils/icons';
import { Briefcase, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import type { UserProfessionalProfile } from '@/types/professional';
import { SKILL_LEVELS, type SkillLevel } from '@/types/professional';

export function ProfessionalIdentityCard() {
  const [profile, setProfile] = React.useState<UserProfessionalProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const profileRes = await fetch('/api/user/professional');
        const profileData = await profileRes.json();

        if (profileData.success) {
          setProfile(profileData.data);
        } else {
          setError(profileData.error);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('خطا در بارگذاری');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No professional identity set
  if (!profile?.primaryDomain) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Briefcase className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">هویت حرفه‌ای</h3>
              <p className="text-sm text-muted-foreground mt-1">
                هنوز هویت حرفه‌ای تعریف نشده است
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/identity">
                تنظیم کنید
              </Link>
            </Button>
          </div>

        </CardContent>
      </Card>
    );
  }

  // Has professional identity
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">هویت حرفه‌ای</CardTitle>
          <Link
            href="/dashboard/identity"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            ویرایش
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Domain */}
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-xl"
            style={{
              backgroundColor: profile.primaryDomain.domain?.color || '#e5e7eb',
            }}
          >
            {getIconEmoji(profile.primaryDomain.domain?.icon || '')}
          </div>
          <div>
            <p className="font-medium">{profile.primaryDomain.domain?.name_fa}</p>
            <p className="text-xs text-muted-foreground">
              {profile.primaryDomain.domain?.name_en}
            </p>
          </div>
        </div>

        {/* Specializations */}
        {profile.specializations && profile.specializations.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">تخصص‌ها</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.specializations.slice(0, 3).map((spec) => (
                <span
                  key={spec.id}
                  className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  {spec.specialization?.name_fa}
                </span>
              ))}
              {profile.specializations.length > 3 && (
                <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                  +{profile.specializations.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">مهارت‌ها</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.slice(0, 4).map((userSkill) => (
                <span
                  key={userSkill.id}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    'bg-muted text-foreground'
                  )}
                >
                  {userSkill.skill?.name_fa}
                  <span className="text-muted-foreground mr-1">
                    ({SKILL_LEVELS[userSkill.level as SkillLevel]?.labelFa})
                  </span>
                </span>
              ))}
              {profile.skills.length > 4 && (
                <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                  +{profile.skills.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Status */}
        {profile.status && (
          <div className="pt-2 border-t">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: profile.status.status?.color || '#e5e7eb',
                color: '#fff',
              }}
            >
              {profile.status.status?.icon && (
                <DynamicIcon
                  name={profile.status.status.icon}
                  className="h-3.5 w-3.5"
                  size={14}
                  fallback="emoji"
                />
              )}
              <span>{profile.status.status?.name_fa}</span>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
