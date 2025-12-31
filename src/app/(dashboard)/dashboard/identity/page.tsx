'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  IdentitySummaryCard,
  VisibilitySection,
  IdentityHealthCard,
  CollapsibleDetailsSection,
} from '@/components/dashboard/identity';
import {
  ProfessionalIdentityWizard,
  type ProfessionalIdentityData,
} from '@/components/professional';
import {
  type UserProfessionalProfile,
  type SkillLevel,
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

  // No profile yet - shouldn't happen but handle it
  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">خطا در بارگذاری پروفایل</p>
        <Button className="mt-4" onClick={() => setShowWizard(true)}>
          شروع تنظیم هویت
        </Button>
      </div>
    );
  }

  // Main Overview Layout
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">هویت حرفه‌ای</h1>
          <p className="text-muted-foreground mt-1">
            نمای کلی از هویت حرفه‌ای شما
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

      {/* Summary Card - Top priority */}
      <IdentitySummaryCard profile={profile} />

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visibility Section */}
          <VisibilitySection profile={profile} />

          {/* Collapsible Details */}
          <CollapsibleDetailsSection
            profile={profile}
            onRemoveSkill={handleRemoveSkill}
          />
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-6">
          {/* Identity Health */}
          <IdentityHealthCard
            profile={profile}
            onEditClick={() => setShowWizard(true)}
          />
        </div>
      </div>
    </div>
  );
}
