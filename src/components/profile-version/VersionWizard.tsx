'use client';

import * as React from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import {
  WIZARD_COPY,
  WIZARD_PURPOSE_LABELS,
  WIZARD_PURPOSE_DESCRIPTIONS,
  WIZARD_AUDIENCE_LABELS,
  WIZARD_TONE_LABELS,
  WIZARD_EMPHASIS_LABELS,
  WIZARD_HIDE_LABELS,
  type WizardPurpose,
  type WizardAudienceType,
  type WizardTone,
  type EmphasisBlock,
  type HideBlock,
  type WizardAnswers,
  type GeneratedVersionRules,
} from '@/types/version-generator';
import { Sparkles, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import VersionPreview from './VersionPreview';

// =============================================================================
// TYPES
// =============================================================================

interface VersionWizardProps {
  profileId: string;
  onComplete: (versionId: string) => void;
  onCancel: () => void;
}

type WizardStep = 'purpose' | 'audience' | 'tone' | 'emphasize' | 'hide' | 'generating' | 'preview';

// =============================================================================
// WIZARD COMPONENT
// =============================================================================

export default function VersionWizard({ profileId, onComplete, onCancel }: VersionWizardProps) {
  // Wizard state
  const [step, setStep] = useState<WizardStep>('purpose');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Answers
  const [purpose, setPurpose] = useState<WizardPurpose | null>(null);
  const [purposeDescription, setPurposeDescription] = useState('');
  const [audienceType, setAudienceType] = useState<WizardAudienceType | null>(null);
  const [tone, setTone] = useState<WizardTone | null>(null);
  const [emphasize, setEmphasize] = useState<EmphasisBlock[]>([]);
  const [hide, setHide] = useState<HideBlock[]>([]);

  // Generated preview
  const [preview, setPreview] = useState<GeneratedVersionRules | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  // =============================================================================
  // NAVIGATION
  // =============================================================================

  const stepOrder: WizardStep[] = ['purpose', 'audience', 'tone', 'emphasize', 'hide', 'generating', 'preview'];

  const canGoNext = (): boolean => {
    switch (step) {
      case 'purpose':
        return purpose !== null && (purpose !== 'other' || purposeDescription.trim().length > 0);
      case 'audience':
        return audienceType !== null;
      case 'tone':
        return tone !== null;
      case 'emphasize':
        return emphasize.length > 0;
      case 'hide':
        return true; // Optional step
      default:
        return false;
    }
  };

  const goNext = async () => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex === -1) return;

    const nextStep = stepOrder[currentIndex + 1];
    if (!nextStep) return;

    // If moving to generating step, trigger AI generation
    if (nextStep === 'generating') {
      await generateVersion();
    } else {
      setStep(nextStep);
    }
  };

  const goBack = () => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex <= 0) {
      onCancel();
      return;
    }

    // Skip 'generating' when going back
    let prevIndex = currentIndex - 1;
    if (stepOrder[prevIndex] === 'generating') {
      prevIndex--;
    }

    setStep(stepOrder[prevIndex]);
  };

  // =============================================================================
  // AI GENERATION
  // =============================================================================

  const generateVersion = async () => {
    setStep('generating');
    setIsLoading(true);
    setError(null);

    const wizardAnswers: WizardAnswers = {
      purpose: purpose!,
      purposeDescription: purpose === 'other' ? purposeDescription : undefined,
      audienceType: audienceType!,
      tone: tone!,
      emphasize,
      hide: hide.length > 0 ? hide : undefined,
    };

    try {
      const response = await fetch(`/api/profiles/${profileId}/versions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wizardAnswers }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || WIZARD_COPY.errors.generation_failed);
      }

      setPreview(result.data.preview);
      setIsFallback(result.data.fallback || false);
      setStep('preview');
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : WIZARD_COPY.errors.generation_failed);
      setStep('hide'); // Go back to last input step
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================================================
  // CONFIRM VERSION
  // =============================================================================

  const confirmVersion = async (modified: boolean = false) => {
    if (!preview) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profiles/${profileId}/versions/generate/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rules: preview,
          modify: modified,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create version');
      }

      onComplete(result.data.id);
    } catch (err) {
      console.error('Confirm error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create version');
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================================================
  // STEP COMPONENTS
  // =============================================================================

  const renderPurposeStep = () => (
    <div className="space-y-4">
      <div className="grid gap-3">
        {(Object.keys(WIZARD_PURPOSE_LABELS) as WizardPurpose[]).map((key) => (
          <button
            key={key}
            onClick={() => setPurpose(key)}
            className={cn(
              'flex flex-col items-start gap-1 p-4 rounded-lg border text-right transition-colors',
              purpose === key
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-accent'
            )}
          >
            <span className="font-medium">{WIZARD_PURPOSE_LABELS[key]}</span>
            <span className="text-sm text-muted-foreground">{WIZARD_PURPOSE_DESCRIPTIONS[key]}</span>
          </button>
        ))}
      </div>
      {purpose === 'other' && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">توضیح هدف:</label>
          <textarea
            value={purposeDescription}
            onChange={(e) => setPurposeDescription(e.target.value)}
            placeholder="هدفت رو توضیح بده..."
            className="w-full p-3 rounded-lg border border-border bg-background resize-none"
            rows={3}
            dir="rtl"
          />
        </div>
      )}
    </div>
  );

  const renderAudienceStep = () => (
    <div className="grid gap-3">
      {(Object.keys(WIZARD_AUDIENCE_LABELS) as WizardAudienceType[]).map((key) => (
        <button
          key={key}
          onClick={() => setAudienceType(key)}
          className={cn(
            'flex items-center justify-between p-4 rounded-lg border text-right transition-colors',
            audienceType === key
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent'
          )}
        >
          <span className="font-medium">{WIZARD_AUDIENCE_LABELS[key]}</span>
          {audienceType === key && (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  );

  const renderToneStep = () => (
    <div className="grid gap-3">
      {(Object.keys(WIZARD_TONE_LABELS) as WizardTone[]).map((key) => (
        <button
          key={key}
          onClick={() => setTone(key)}
          className={cn(
            'flex items-center justify-between p-4 rounded-lg border text-right transition-colors',
            tone === key
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent'
          )}
        >
          <span className="font-medium">{WIZARD_TONE_LABELS[key]}</span>
          {tone === key && (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  );

  const renderEmphasizeStep = () => (
    <div className="grid gap-3">
      {(Object.keys(WIZARD_EMPHASIS_LABELS) as EmphasisBlock[]).map((key) => (
        <button
          key={key}
          onClick={() => {
            setEmphasize((prev) =>
              prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
            );
          }}
          className={cn(
            'flex items-center justify-between p-4 rounded-lg border text-right transition-colors',
            emphasize.includes(key)
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent'
          )}
        >
          <span className="font-medium">{WIZARD_EMPHASIS_LABELS[key]}</span>
          <div
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
              emphasize.includes(key)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border'
            )}
          >
            {emphasize.includes(key) && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>
      ))}
    </div>
  );

  const renderHideStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        این مرحله اختیاریه. اگه چیزی نمی‌خوای نشون بدی، انتخاب کن.
      </p>
      <div className="grid gap-3">
        {(Object.keys(WIZARD_HIDE_LABELS) as HideBlock[]).map((key) => (
          <button
            key={key}
            onClick={() => {
              setHide((prev) =>
                prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
              );
            }}
            className={cn(
              'flex items-center justify-between p-4 rounded-lg border text-right transition-colors',
              hide.includes(key)
                ? 'border-destructive bg-destructive/5'
                : 'border-border hover:border-destructive/50 hover:bg-accent'
            )}
          >
            <span className="font-medium">{WIZARD_HIDE_LABELS[key]}</span>
            <div
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                hide.includes(key)
                  ? 'border-destructive bg-destructive text-destructive-foreground'
                  : 'border-border'
              )}
            >
              {hide.includes(key) && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">{WIZARD_COPY.generating.title}</h3>
        <p className="text-sm text-muted-foreground">{WIZARD_COPY.generating.subtitle}</p>
      </div>
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  // Preview step
  if (step === 'preview' && preview) {
    return (
      <VersionPreview
        preview={preview}
        isFallback={isFallback}
        isLoading={isLoading}
        error={error}
        onConfirm={() => confirmVersion(false)}
        onEdit={() => setStep('hide')}
        onCancel={onCancel}
      />
    );
  }

  const getStepContent = () => {
    switch (step) {
      case 'purpose':
        return renderPurposeStep();
      case 'audience':
        return renderAudienceStep();
      case 'tone':
        return renderToneStep();
      case 'emphasize':
        return renderEmphasizeStep();
      case 'hide':
        return renderHideStep();
      case 'generating':
        return renderGeneratingStep();
      default:
        return null;
    }
  };

  const getStepTitle = (): { title: string; subtitle: string } => {
    switch (step) {
      case 'purpose':
        return WIZARD_COPY.steps.purpose;
      case 'audience':
        return WIZARD_COPY.steps.audience;
      case 'tone':
        return WIZARD_COPY.steps.tone;
      case 'emphasize':
        return WIZARD_COPY.steps.emphasize;
      case 'hide':
        return WIZARD_COPY.steps.hide;
      case 'generating':
        return WIZARD_COPY.generating;
      default:
        return { title: '', subtitle: '' };
    }
  };

  const stepInfo = getStepTitle();
  const currentStepIndex = stepOrder.indexOf(step);
  const totalSteps = stepOrder.length - 2; // Exclude 'generating' and 'preview'
  const isLastInputStep = step === 'hide';

  return (
    <Card className="w-full max-w-2xl mx-auto" dir="rtl">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>{WIZARD_COPY.title}</CardTitle>
            <CardDescription>{WIZARD_COPY.subtitle}</CardDescription>
          </div>
        </div>

        {/* Progress indicator */}
        {step !== 'generating' && (
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {step !== 'generating' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold">{stepInfo.title}</h3>
            {stepInfo.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{stepInfo.subtitle}</p>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {getStepContent()}
      </CardContent>

      {step !== 'generating' && (
        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" onClick={goBack}>
            <ChevronRight className="w-4 h-4 ml-2" />
            {WIZARD_COPY.buttons.back}
          </Button>

          <Button
            onClick={goNext}
            disabled={!canGoNext() || isLoading}
            isLoading={isLoading}
          >
            {isLastInputStep ? WIZARD_COPY.buttons.generate : WIZARD_COPY.buttons.next}
            {!isLastInputStep && <ChevronLeft className="w-4 h-4 mr-2" />}
            {isLastInputStep && <Sparkles className="w-4 h-4 mr-2" />}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
