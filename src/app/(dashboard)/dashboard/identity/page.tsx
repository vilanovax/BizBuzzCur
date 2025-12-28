'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Edit2, X } from 'lucide-react';
import { DynamicIcon, getIconEmoji } from '@/lib/utils/icons';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import {
  ProfessionalIdentityWizard,
  type ProfessionalIdentityData,
} from '@/components/professional';
import {
  SKILL_LEVELS,
  SKILL_CATEGORIES,
  type UserProfessionalProfile,
  type SkillLevel,
  type SkillCategory,
  type ProfessionalDomain,
  type Skill,
} from '@/types/professional';
import { useAuth } from '@/contexts/AuthContext';
import {
  trackDomainSelected,
  trackSpecializationSelected,
  trackSpecializationRemoved,
  trackSkillAdded,
  trackSkillRemoved,
  trackSkillLevelChanged,
} from '@/lib/analytics';

export default function ProfessionalIdentityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfessionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analytics tracking callbacks for wizard
  const handleDomainSelectTracking = useCallback((domain: ProfessionalDomain) => {
    if (user?.id) {
      trackDomainSelected(user.id, domain.id, domain.slug, false, 'profile_builder');
    }
  }, [user?.id]);

  const handleSpecializationToggleTracking = useCallback((specId: string, isAdding: boolean, newCount: number) => {
    if (user?.id) {
      if (isAdding) {
        trackSpecializationSelected(user.id, specId, profile?.primaryDomain?.domain_id || '', newCount, 'profile_builder');
      } else {
        trackSpecializationRemoved(user.id, specId, newCount, 'profile_builder');
      }
    }
  }, [user?.id, profile?.primaryDomain?.domain_id]);

  const handleSkillAddTracking = useCallback((skill: Skill, level: SkillLevel, newCount: number) => {
    if (user?.id) {
      trackSkillAdded(user.id, skill.id, skill.slug, skill.name_fa, level, false, newCount, 'profile_builder');
    }
  }, [user?.id]);

  const handleSkillRemoveTracking = useCallback((skillId: string, newCount: number) => {
    if (user?.id) {
      trackSkillRemoved(user.id, skillId, newCount, 'profile_builder');
    }
  }, [user?.id]);

  const handleSkillLevelChangeTracking = useCallback((skillId: string, newLevel: SkillLevel) => {
    if (user?.id) {
      trackSkillLevelChanged(user.id, skillId, newLevel, 'profile_builder');
    }
  }, [user?.id]);

  // Load user's professional profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/professional');
        const data = await res.json();

        if (data.success) {
          setProfile(data.data);
          // Show wizard if no primary domain is set
          if (!data.data.primaryDomain) {
            setShowWizard(true);
          }
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('خطا در بارگذاری اطلاعات');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Save professional identity
  const handleWizardComplete = async (data: ProfessionalIdentityData) => {
    setIsSaving(true);
    setError(null);

    try {
      // 1. Set primary domain
      await fetch('/api/user/professional/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain_id: data.primaryDomainId,
          is_primary: true,
        }),
      });

      // 2. Set specializations
      for (const specId of data.specializationIds) {
        await fetch('/api/user/professional/specializations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ specialization_id: specId }),
        });
      }

      // 3. Set skills
      for (const skill of data.skills) {
        await fetch('/api/user/professional/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skill_id: skill.skillId,
            level: skill.level,
            years_experience: skill.yearsExperience,
          }),
        });
      }

      // 4. Set status (if selected)
      if (data.statusId) {
        await fetch('/api/user/professional/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status_id: data.statusId }),
        });
      }

      // Reload profile
      const res = await fetch('/api/user/professional');
      const updatedData = await res.json();
      if (updatedData.success) {
        setProfile(updatedData.data);
      }

      setShowWizard(false);
    } catch (err) {
      console.error('Failed to save:', err);
      setError('خطا در ذخیره اطلاعات');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove skill
  const handleRemoveSkill = async (userSkillId: string) => {
    try {
      await fetch(`/api/user/professional/skills/${userSkillId}`, {
        method: 'DELETE',
      });
      // Reload profile
      const res = await fetch('/api/user/professional');
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (err) {
      console.error('Failed to remove skill:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">هویت حرفه‌ای شما</h1>
          <p className="text-muted-foreground mt-2">
            اطلاعات حرفه‌ای خود را وارد کنید تا پروفایل‌های بهتری بسازید
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <ProfessionalIdentityWizard
              onComplete={handleWizardComplete}
              initialData={
                profile?.primaryDomain
                  ? {
                      primaryDomainId: profile.primaryDomain.domain_id,
                      specializationIds: profile.specializations.map(
                        (s) => s.specialization_id
                      ),
                    }
                  : undefined
              }
              onDomainSelect={handleDomainSelectTracking}
              onSpecializationToggle={handleSpecializationToggleTracking}
              onSkillAdd={handleSkillAddTracking}
              onSkillRemove={handleSkillRemoveTracking}
              onSkillLevelChange={handleSkillLevelChangeTracking}
            />
          </CardContent>
        </Card>

        {profile?.primaryDomain && (
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => setShowWizard(false)}>
              انصراف
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Show current profile
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">هویت حرفه‌ای</h1>
          <p className="text-muted-foreground mt-1">
            مدیریت اطلاعات حرفه‌ای شما
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Edit2 className="w-4 h-4 ml-2" />
          ویرایش
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Domain */}
      <Card>
        <CardHeader>
          <CardTitle>حوزه تخصصی</CardTitle>
          <CardDescription>حوزه اصلی فعالیت حرفه‌ای شما</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.primaryDomain ? (
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{
                  backgroundColor: profile.primaryDomain.domain?.color || '#e5e7eb',
                }}
              >
                {getIconEmoji(profile.primaryDomain.domain?.icon || '')}
              </div>
              <div>
                <p className="font-medium">{profile.primaryDomain.domain?.name_fa}</p>
                <p className="text-sm text-muted-foreground">
                  {profile.primaryDomain.domain?.name_en}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">حوزه‌ای انتخاب نشده</p>
          )}
        </CardContent>
      </Card>

      {/* Specializations */}
      <Card>
        <CardHeader>
          <CardTitle>تخصص‌ها</CardTitle>
          <CardDescription>تخصص‌های شما در حوزه انتخابی</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.specializations && profile.specializations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.specializations.map((spec) => (
                <span
                  key={spec.id}
                  className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  {spec.specialization?.name_fa}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">تخصصی انتخاب نشده</p>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>مهارت‌ها</CardTitle>
          <CardDescription>مهارت‌های حرفه‌ای شما</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.skills && profile.skills.length > 0 ? (
            <div className="space-y-3">
              {profile.skills.map((userSkill) => (
                <div
                  key={userSkill.id}
                  className="flex items-center justify-between p-3 rounded-xl border"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        'bg-muted text-muted-foreground'
                      )}
                    >
                      {SKILL_CATEGORIES[userSkill.skill?.category as SkillCategory]?.labelFa}
                    </span>
                    <div>
                      <p className="font-medium">{userSkill.skill?.name_fa}</p>
                      <p className="text-xs text-muted-foreground">
                        {userSkill.skill?.name_en}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        'bg-primary/10 text-primary'
                      )}
                    >
                      {SKILL_LEVELS[userSkill.level as SkillLevel]?.labelFa}
                    </span>
                    <button
                      onClick={() => handleRemoveSkill(userSkill.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">مهارتی ثبت نشده</p>
          )}
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>وضعیت شغلی</CardTitle>
          <CardDescription>وضعیت فعلی شما</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.status ? (
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: profile.status.status?.color || '#e5e7eb',
                color: '#fff',
              }}
            >
              {profile.status.status?.icon && (
                <DynamicIcon
                  name={profile.status.status.icon}
                  className="h-4 w-4"
                  size={16}
                  fallback="emoji"
                />
              )}
              <span>{profile.status.status?.name_fa}</span>
            </div>
          ) : (
            <p className="text-muted-foreground">وضعیتی انتخاب نشده</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
