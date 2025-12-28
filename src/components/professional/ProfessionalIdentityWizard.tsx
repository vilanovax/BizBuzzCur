'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { DynamicIcon } from '@/lib/utils/icons';
import { DomainSelector } from './DomainSelector';
import { SpecializationSelector } from './SpecializationSelector';
import { SkillsAutocomplete } from './SkillsAutocomplete';
import { Button } from '@/components/ui/Button';
import type {
  ProfessionalDomain,
  Specialization,
  Skill,
  SkillLevel,
  ProfessionalStatus,
} from '@/types/professional';

interface ProfessionalIdentityWizardProps {
  onComplete: (data: ProfessionalIdentityData) => void;
  initialData?: Partial<ProfessionalIdentityData>;
  className?: string;
  // Analytics callbacks
  onDomainSelect?: (domain: ProfessionalDomain) => void;
  onSpecializationToggle?: (specId: string, isAdding: boolean, newCount: number) => void;
  onSkillAdd?: (skill: Skill, level: SkillLevel, newCount: number) => void;
  onSkillRemove?: (skillId: string, newCount: number) => void;
  onSkillLevelChange?: (skillId: string, newLevel: SkillLevel) => void;
  onStepChange?: (step: string, stepIndex: number) => void;
}

export interface ProfessionalIdentityData {
  primaryDomainId: string;
  specializationIds: string[];
  skills: Array<{
    skillId: string;
    level: SkillLevel;
    yearsExperience?: number;
  }>;
  statusId?: string;
}

type Step = 'domain' | 'specialization' | 'skills' | 'status';

const STEPS: { id: Step; title: string; titleFa: string }[] = [
  { id: 'domain', title: 'Domain', titleFa: 'حوزه تخصصی' },
  { id: 'specialization', title: 'Specialization', titleFa: 'تخصص' },
  { id: 'skills', title: 'Skills', titleFa: 'مهارت‌ها' },
  { id: 'status', title: 'Status', titleFa: 'وضعیت' },
];

export function ProfessionalIdentityWizard({
  onComplete,
  initialData,
  className,
  onDomainSelect,
  onSpecializationToggle,
  onSkillAdd,
  onSkillRemove,
  onSkillLevelChange,
  onStepChange,
}: ProfessionalIdentityWizardProps) {
  const [currentStep, setCurrentStep] = React.useState<Step>('domain');
  const [isLoading, setIsLoading] = React.useState(false);

  // Data state
  const [domains, setDomains] = React.useState<ProfessionalDomain[]>([]);
  const [specializations, setSpecializations] = React.useState<Specialization[]>([]);
  const [statuses, setStatuses] = React.useState<ProfessionalStatus[]>([]);

  // Selection state
  const [selectedDomainId, setSelectedDomainId] = React.useState<string | null>(
    initialData?.primaryDomainId || null
  );
  const [selectedSpecializationIds, setSelectedSpecializationIds] = React.useState<string[]>(
    initialData?.specializationIds || []
  );
  const [selectedSkills, setSelectedSkills] = React.useState<
    Array<{ skill: Skill; level: SkillLevel; years_experience?: number }>
  >([]);
  const [selectedStatusId, setSelectedStatusId] = React.useState<string | undefined>(
    initialData?.statusId
  );

  // Load domains on mount
  React.useEffect(() => {
    async function loadDomains() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/taxonomy/domains');
        const data = await res.json();
        if (data.success) {
          setDomains(data.data);
        }
      } catch (error) {
        console.error('Failed to load domains:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDomains();
  }, []);

  // Load specializations when domain changes
  React.useEffect(() => {
    if (!selectedDomainId) {
      setSpecializations([]);
      return;
    }

    async function loadSpecializations() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/taxonomy/domains/${selectedDomainId}/specializations`);
        const data = await res.json();
        if (data.success) {
          setSpecializations(data.data);
        }
      } catch (error) {
        console.error('Failed to load specializations:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSpecializations();
  }, [selectedDomainId]);

  // Load statuses on mount
  React.useEffect(() => {
    async function loadStatuses() {
      try {
        const res = await fetch('/api/taxonomy/statuses');
        const data = await res.json();
        if (data.success) {
          setStatuses(data.data);
        }
      } catch (error) {
        console.error('Failed to load statuses:', error);
      }
    }
    loadStatuses();
  }, []);

  const handleDomainSelect = (domain: ProfessionalDomain) => {
    setSelectedDomainId(domain.id);
    // Reset specializations when domain changes
    setSelectedSpecializationIds([]);
    // Track domain selection
    onDomainSelect?.(domain);
  };

  const handleSpecializationToggle = (spec: Specialization) => {
    setSelectedSpecializationIds((prev) => {
      const isRemoving = prev.includes(spec.id);
      const newIds = isRemoving
        ? prev.filter((id) => id !== spec.id)
        : [...prev, spec.id];
      // Track specialization toggle
      onSpecializationToggle?.(spec.id, !isRemoving, newIds.length);
      return newIds;
    });
  };

  const handleAddSkill = (skill: Skill, level: SkillLevel) => {
    setSelectedSkills((prev) => {
      const newSkills = [...prev, { skill, level }];
      // Track skill add
      onSkillAdd?.(skill, level, newSkills.length);
      return newSkills;
    });
  };

  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkills((prev) => {
      const newSkills = prev.filter((s) => s.skill.id !== skillId);
      // Track skill remove
      onSkillRemove?.(skillId, newSkills.length);
      return newSkills;
    });
  };

  const handleUpdateSkill = (skillId: string, level: SkillLevel, years?: number) => {
    setSelectedSkills((prev) =>
      prev.map((s) => {
        if (s.skill.id === skillId) {
          // Track skill level change
          onSkillLevelChange?.(skillId, level);
          return { ...s, level, years_experience: years };
        }
        return s;
      })
    );
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canGoNext = () => {
    switch (currentStep) {
      case 'domain':
        return !!selectedDomainId;
      case 'specialization':
        return selectedSpecializationIds.length > 0;
      case 'skills':
        return selectedSkills.length > 0;
      case 'status':
        return true; // Status is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      const nextStep = STEPS[nextIndex];
      setCurrentStep(nextStep.id);
      // Track step change
      onStepChange?.(nextStep.id, nextIndex);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleComplete = () => {
    if (!selectedDomainId) return;

    onComplete({
      primaryDomainId: selectedDomainId,
      specializationIds: selectedSpecializationIds,
      skills: selectedSkills.map((s) => ({
        skillId: s.skill.id,
        level: s.level,
        yearsExperience: s.years_experience,
      })),
      statusId: selectedStatusId,
    });
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => {
                if (index <= currentStepIndex) {
                  setCurrentStep(step.id);
                }
              }}
              disabled={index > currentStepIndex}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all',
                currentStep === step.id
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStepIndex
                  ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index + 1}
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-1 w-8 rounded-full transition-all',
                  index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          {STEPS.find((s) => s.id === currentStep)?.titleFa}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {currentStep === 'domain' && 'حوزه تخصصی اصلی خود را انتخاب کنید'}
          {currentStep === 'specialization' && 'تخصص‌های خود را انتخاب کنید'}
          {currentStep === 'skills' && 'مهارت‌های خود را اضافه کنید'}
          {currentStep === 'status' && 'وضعیت شغلی خود را مشخص کنید'}
        </p>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === 'domain' && (
          <DomainSelector
            domains={domains}
            selectedId={selectedDomainId}
            onSelect={handleDomainSelect}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'specialization' && (
          <SpecializationSelector
            specializations={specializations}
            selectedIds={selectedSpecializationIds}
            onToggle={handleSpecializationToggle}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'skills' && (
          <SkillsAutocomplete
            selectedSkills={selectedSkills}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
            onUpdateSkill={handleUpdateSkill}
            domainId={selectedDomainId || undefined}
            specializationId={selectedSpecializationIds[0]}
          />
        )}

        {currentStep === 'status' && (
          <StatusSelector
            statuses={statuses}
            selectedId={selectedStatusId}
            onSelect={(id) => setSelectedStatusId(id)}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
        >
          قبلی
        </Button>

        {currentStepIndex < STEPS.length - 1 ? (
          <Button type="button" onClick={handleNext} disabled={!canGoNext()}>
            بعدی
          </Button>
        ) : (
          <Button type="button" onClick={handleComplete} disabled={!canGoNext()}>
            تکمیل
          </Button>
        )}
      </div>
    </div>
  );
}

// Status Selector Component (inline for simplicity)
function StatusSelector({
  statuses,
  selectedId,
  onSelect,
}: {
  statuses: ProfessionalStatus[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  // Group statuses by type
  const groupedStatuses = React.useMemo(() => {
    const groups: Record<string, ProfessionalStatus[]> = {};
    statuses.forEach((status) => {
      if (!groups[status.status_type]) {
        groups[status.status_type] = [];
      }
      groups[status.status_type].push(status);
    });
    return groups;
  }, [statuses]);

  const typeLabels: Record<string, string> = {
    availability: 'در دسترس بودن',
    seeking: 'جستجو',
    offering: 'ارائه',
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedStatuses).map(([type, typeStatuses]) => (
        <div key={type}>
          <h3 className="font-medium mb-3">{typeLabels[type] || type}</h3>
          <div className="flex flex-wrap gap-2">
            {typeStatuses.map((status) => (
              <button
                key={status.id}
                type="button"
                onClick={() => onSelect(status.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                  selectedId === status.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                )}
                style={{
                  backgroundColor:
                    selectedId === status.id && status.color
                      ? status.color
                      : undefined,
                }}
              >
                {status.icon && (
                  <DynamicIcon
                    name={status.icon}
                    className="h-4 w-4"
                    size={16}
                    fallback="emoji"
                  />
                )}
                <span>{status.name_fa}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {statuses.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          وضعیت شغلی در دسترس نیست
        </div>
      )}

      {/* Skip option */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => onSelect('')}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          فعلاً رد شوید
        </button>
      </div>
    </div>
  );
}
