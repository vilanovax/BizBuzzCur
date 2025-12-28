'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  OnboardingWelcome,
  OnboardingWhy,
  OnboardingDomain,
  OnboardingSpecialization,
  OnboardingSkills,
  OnboardingDone,
} from '@/components/onboarding';
import type { ProfessionalDomain, Specialization, Skill } from '@/types/professional';
import type { OnboardingStep, EntrySource } from '@/types/onboarding';
import { DOMAIN_SUGGESTIONS } from '@/types/onboarding';
import { useAuth } from '@/contexts/AuthContext';
import {
  trackOnboardingStarted,
  trackOnboardingSkipped,
  trackOnboardingCompleted,
  trackOnboardingStepViewed,
  trackDomainSuggested,
  trackDomainSelected,
  trackDomainSkipped,
  trackSpecializationSelected,
  trackSpecializationRemoved,
  trackSkillAdded,
  trackSkillRemoved,
  setEntryApp,
} from '@/lib/analytics';

interface SelectedSkill {
  skill: Skill;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Step state
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Entry source (from query params or default)
  const entrySource = (searchParams.get('source') as EntrySource) || 'direct';

  // Set entry app for analytics
  React.useEffect(() => {
    if (entrySource === 'carbarg') {
      setEntryApp('carbarg');
    }
  }, [entrySource]);

  // Data state
  const [domains, setDomains] = useState<ProfessionalDomain[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<Skill[]>([]);

  // Selection state
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedSpecializationIds, setSelectedSpecializationIds] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);

  // Smart suggestion
  const [suggestedDomainId, setSuggestedDomainId] = useState<string | null>(null);
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null);

  // Get selected domain name for done screen
  const selectedDomain = domains.find((d) => d.id === selectedDomainId);

  // Load domains and check for suggestions
  useEffect(() => {
    async function loadDomains() {
      try {
        const res = await fetch('/api/taxonomy/domains');
        const data = await res.json();

        if (data.success) {
          setDomains(data.data);

          // Check for smart suggestion based on entry source
          const suggestion = DOMAIN_SUGGESTIONS[entrySource];
          if (suggestion) {
            const suggestedDomain = data.data.find(
              (d: ProfessionalDomain) => d.slug === suggestion.domainSlug
            );
            if (suggestedDomain) {
              setSuggestedDomainId(suggestedDomain.id);
              setSuggestionReason(suggestion.reason);

              // Track domain suggestion
              if (user?.id) {
                trackDomainSuggested(
                  user.id,
                  suggestedDomain.id,
                  suggestedDomain.slug,
                  suggestion.reason,
                  'onboarding'
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load domains:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDomains();
  }, [entrySource]);

  // Load specializations when domain changes
  useEffect(() => {
    if (!selectedDomainId) {
      setSpecializations([]);
      return;
    }

    async function loadSpecializations() {
      try {
        const res = await fetch(`/api/taxonomy/domains/${selectedDomainId}/specializations`);
        const data = await res.json();

        if (data.success) {
          setSpecializations(data.data);
        }
      } catch (error) {
        console.error('Failed to load specializations:', error);
      }
    }
    loadSpecializations();
  }, [selectedDomainId]);

  // Load suggested skills based on domain/specialization
  useEffect(() => {
    if (!selectedDomainId) {
      setSuggestedSkills([]);
      return;
    }

    async function loadSuggestedSkills() {
      if (!selectedDomainId) return;

      try {
        const params = new URLSearchParams({
          domain_id: selectedDomainId,
          limit: '10',
        });
        if (selectedSpecializationIds[0]) {
          params.set('specialization_id', selectedSpecializationIds[0]);
        }

        const res = await fetch(`/api/taxonomy/skills?${params}`);
        const data = await res.json();

        if (data.success) {
          setSuggestedSkills(data.data);
        }
      } catch (error) {
        console.error('Failed to load suggested skills:', error);
      }
    }
    loadSuggestedSkills();
  }, [selectedDomainId, selectedSpecializationIds]);

  // Handle skip - go directly to dashboard
  const handleSkip = useCallback(async () => {
    // Track skip event
    if (user?.id) {
      const stepIndex = ['welcome', 'why', 'domain', 'specialization', 'skills'].indexOf(currentStep);
      trackOnboardingSkipped(user.id, currentStep, stepIndex, 'onboarding');

      // Track domain skip if on domain step
      if (currentStep === 'domain') {
        trackDomainSkipped(user.id, suggestedDomainId, 'onboarding');
      }
    }

    // Mark onboarding as skipped
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped: true }),
      });
    } catch (error) {
      console.error('Failed to save skip:', error);
    }
    router.push('/dashboard');
  }, [router, user?.id, currentStep, suggestedDomainId]);

  // Handle domain selection
  const handleDomainSelect = useCallback((domainId: string) => {
    // Track domain selection
    if (user?.id) {
      const domain = domains.find((d) => d.id === domainId);
      if (domain) {
        trackDomainSelected(
          user.id,
          domainId,
          domain.slug,
          domainId === suggestedDomainId,
          'onboarding'
        );
      }
    }

    setSelectedDomainId(domainId);
    setSelectedSpecializationIds([]); // Reset specializations
    setCurrentStep('specialization');
  }, [user?.id, domains, suggestedDomainId]);

  // Handle specialization toggle
  const handleSpecializationToggle = useCallback((specId: string) => {
    setSelectedSpecializationIds((prev) => {
      const isRemoving = prev.includes(specId);
      const newIds = isRemoving
        ? prev.filter((id) => id !== specId)
        : prev.length < 3
        ? [...prev, specId]
        : prev;

      // Track specialization change
      if (user?.id && selectedDomainId && newIds !== prev) {
        if (isRemoving) {
          trackSpecializationRemoved(user.id, specId, newIds.length, 'onboarding');
        } else {
          trackSpecializationSelected(user.id, specId, selectedDomainId, newIds.length, 'onboarding');
        }
      }

      return newIds;
    });
  }, [user?.id, selectedDomainId]);

  // Handle skill add
  const handleAddSkill = useCallback((skill: Skill) => {
    setSelectedSkills((prev) => {
      if (prev.length >= 5) return prev;
      if (prev.some((s) => s.skill.id === skill.id)) return prev;

      const newSkills = [...prev, { skill, level: 'intermediate' as const }];

      // Track skill add
      if (user?.id) {
        const wasSuggested = suggestedSkills.some((s) => s.id === skill.id);
        trackSkillAdded(
          user.id,
          skill.id,
          skill.slug,
          skill.name_fa,
          'intermediate',
          wasSuggested,
          newSkills.length,
          'onboarding'
        );
      }

      return newSkills;
    });
  }, [user?.id, suggestedSkills]);

  // Handle skill remove
  const handleRemoveSkill = useCallback((skillId: string) => {
    setSelectedSkills((prev) => {
      const newSkills = prev.filter((s) => s.skill.id !== skillId);

      // Track skill remove
      if (user?.id) {
        trackSkillRemoved(user.id, skillId, newSkills.length, 'onboarding');
      }

      return newSkills;
    });
  }, [user?.id]);

  // Save professional identity and complete onboarding
  const saveAndComplete = useCallback(async () => {
    setIsSaving(true);

    try {
      // Save domain
      if (selectedDomainId) {
        await fetch('/api/user/professional/domains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain_id: selectedDomainId,
            is_primary: true,
          }),
        });
      }

      // Save specializations
      for (const specId of selectedSpecializationIds) {
        await fetch('/api/user/professional/specializations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ specialization_id: specId }),
        });
      }

      // Save skills
      for (const { skill, level } of selectedSkills) {
        await fetch('/api/user/professional/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skill_id: skill.id,
            level,
          }),
        });
      }

      // Mark onboarding as completed
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });

      // Track onboarding completed
      if (user?.id) {
        trackOnboardingCompleted(user.id, 5, 'onboarding');
      }

      setCurrentStep('done');
    } catch (error) {
      console.error('Failed to save:', error);
      // Still show done screen even if save fails
      setCurrentStep('done');
    } finally {
      setIsSaving(false);
    }
  }, [selectedDomainId, selectedSpecializationIds, selectedSkills, user?.id]);

  // Track step views
  useEffect(() => {
    if (user?.id && currentStep !== 'done') {
      const stepIndex = ['welcome', 'why', 'domain', 'specialization', 'skills'].indexOf(currentStep);
      if (stepIndex >= 0) {
        trackOnboardingStepViewed(user.id, currentStep, stepIndex, 'onboarding');
      }

      // Track onboarding started on welcome
      if (currentStep === 'welcome') {
        trackOnboardingStarted(user.id, 'onboarding');
      }
    }
  }, [currentStep, user?.id]);

  // Go to dashboard
  const goToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render current step
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress indicator (hidden on welcome and done) */}
      {currentStep !== 'welcome' && currentStep !== 'done' && (
        <div className="w-full px-4 pt-4">
          <div className="max-w-md mx-auto">
            <div className="flex gap-1.5">
              {['why', 'domain', 'specialization', 'skills'].map((step, index) => {
                const stepOrder = ['why', 'domain', 'specialization', 'skills'];
                const currentIndex = stepOrder.indexOf(currentStep);
                const isCompleted = index < currentIndex;
                const isCurrent = step === currentStep;

                return (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      isCompleted || isCurrent ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {currentStep === 'welcome' && (
            <OnboardingWelcome
              onContinue={() => setCurrentStep('why')}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 'why' && (
            <OnboardingWhy
              onContinue={() => setCurrentStep('domain')}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 'domain' && (
            <OnboardingDomain
              domains={domains}
              selectedId={selectedDomainId}
              suggestedId={suggestedDomainId}
              suggestionReason={suggestionReason}
              onSelect={handleDomainSelect}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 'specialization' && (
            <OnboardingSpecialization
              specializations={specializations}
              selectedIds={selectedSpecializationIds}
              onToggle={handleSpecializationToggle}
              onContinue={() => setCurrentStep('skills')}
              onSkip={() => setCurrentStep('skills')}
            />
          )}

          {currentStep === 'skills' && (
            <OnboardingSkills
              selectedSkills={selectedSkills}
              suggestedSkills={suggestedSkills}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
              onContinue={saveAndComplete}
              onSkip={saveAndComplete}
              domainId={selectedDomainId || undefined}
              specializationIds={selectedSpecializationIds}
            />
          )}

          {currentStep === 'done' && (
            <OnboardingDone
              domainNameFa={selectedDomain?.name_fa}
              onGoToDashboard={goToDashboard}
            />
          )}

          {/* Saving overlay */}
          {isSaving && (
            <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">در حال ذخیره...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
