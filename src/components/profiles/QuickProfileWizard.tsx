'use client';

/**
 * Quick Profile Wizard
 *
 * 2-step wizard for creating a shareable profile in < 3 minutes.
 *
 * Step 1: Intent Selection (why this profile)
 * Step 2: Minimal Info (name, headline, contact)
 *
 * Design Principles:
 * - Speed over completeness
 * - Low pressure, no judgment
 * - Immediately shareable result
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Link as LinkIcon,
  Camera,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import {
  type ProfileIntent,
  PROFILE_INTENTS,
  QUICK_PROFILE_COPY,
  type QuickProfileInput,
} from '@/types/profile';

interface QuickProfileWizardProps {
  /** Called when profile is created successfully */
  onComplete?: (profileId: string, slug: string) => void;
  /** Initial step (default: 0 for intro, 1 for intent) */
  initialStep?: number;
  /** Skip intro screen */
  skipIntro?: boolean;
  /** Optional CSS class */
  className?: string;
}

type Step = 'intro' | 'intent' | 'info';

/**
 * Detect contact type from input
 */
function detectContactType(value: string): 'email' | 'phone' | 'link' {
  if (value.includes('@') && value.includes('.')) return 'email';
  if (/^[\d\s+()-]+$/.test(value) && value.length >= 10) return 'phone';
  return 'link';
}

/**
 * Intent Selection Card
 */
function IntentCard({
  intent,
  selected,
  onClick,
}: {
  intent: (typeof PROFILE_INTENTS)[ProfileIntent];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl border text-right transition-all',
        'hover:border-primary/50 hover:bg-primary/5',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border bg-background'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{intent.icon}</span>
        <div className="flex-1">
          <p className="font-medium">{intent.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {intent.description}
          </p>
        </div>
        {selected && (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

/**
 * Main Quick Profile Wizard
 */
export function QuickProfileWizard({
  onComplete,
  initialStep = 0,
  skipIntro = false,
  className,
}: QuickProfileWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(skipIntro ? 'intent' : 'intro');
  const [selectedIntent, setSelectedIntent] = useState<ProfileIntent | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    headline: '',
    contact: '',
    photo_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = QUICK_PROFILE_COPY;

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'نام نمایشی الزامی است';
    }
    if (!formData.headline.trim()) {
      newErrors.headline = 'عنوان کوتاه الزامی است';
    }
    if (!formData.contact.trim()) {
      newErrors.contact = 'راه ارتباطی الزامی است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedIntent || !validateForm()) return;

    setIsSubmitting(true);

    try {
      const input: QuickProfileInput = {
        intent: selectedIntent,
        display_name: formData.display_name.trim(),
        headline: formData.headline.trim(),
        contact: formData.contact.trim(),
        contact_type: detectContactType(formData.contact),
        photo_url: formData.photo_url || undefined,
      };

      const res = await fetch('/api/profiles/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (data.success) {
        if (onComplete) {
          onComplete(data.data.id, data.data.slug);
        } else {
          // Navigate to success page
          router.push(`/dashboard/profiles/${data.data.id}/created`);
        }
      } else {
        setErrors({ submit: data.error || 'خطا در ایجاد پروفایل' });
      }
    } catch (err) {
      setErrors({ submit: 'خطا در اتصال به سرور' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render intro step
  if (step === 'intro') {
    return (
      <div className={cn('max-w-md mx-auto text-center', className)}>
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{copy.entry.title}</h1>
          <p className="text-muted-foreground">{copy.entry.subtitle}</p>
        </div>

        <Button size="lg" onClick={() => setStep('intent')} className="w-full">
          {copy.entry.cta}
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>

        <p className="text-xs text-muted-foreground mt-4">{copy.entry.helper}</p>
      </div>
    );
  }

  // Render intent selection step
  if (step === 'intent') {
    return (
      <div className={cn('max-w-md mx-auto', className)}>
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1">{copy.intent.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.intent.subtitle}</p>
        </div>

        <div className="space-y-3 mb-6">
          {Object.values(PROFILE_INTENTS).map((intent) => (
            <IntentCard
              key={intent.id}
              intent={intent}
              selected={selectedIntent === intent.id}
              onClick={() => setSelectedIntent(intent.id)}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {!skipIntro && (
            <Button variant="outline" onClick={() => setStep('intro')}>
              <ArrowRight className="w-4 h-4 ml-2" />
              قبلی
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={!selectedIntent}
            onClick={() => setStep('info')}
          >
            بعدی
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          {copy.intent.footer}
        </p>
      </div>
    );
  }

  // Render info step
  return (
    <div className={cn('max-w-md mx-auto', className)}>
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">{copy.info.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.info.subtitle}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {copy.info.fields.name.label}
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              placeholder={copy.info.fields.name.placeholder}
              className={cn(
                'w-full pr-10 pl-4 py-2.5 rounded-lg border bg-background',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.display_name && 'border-destructive'
              )}
            />
          </div>
          {errors.display_name && (
            <p className="text-xs text-destructive mt-1">{errors.display_name}</p>
          )}
        </div>

        {/* Headline */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {copy.info.fields.headline.label}
          </label>
          <input
            type="text"
            value={formData.headline}
            onChange={(e) =>
              setFormData({ ...formData, headline: e.target.value })
            }
            placeholder={copy.info.fields.headline.placeholder}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border bg-background',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              errors.headline && 'border-destructive'
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {copy.info.fields.headline.helper}
          </p>
          {errors.headline && (
            <p className="text-xs text-destructive mt-1">{errors.headline}</p>
          )}
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {copy.info.fields.contact.label}
          </label>
          <div className="relative">
            {detectContactType(formData.contact) === 'email' ? (
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            ) : detectContactType(formData.contact) === 'phone' ? (
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            ) : (
              <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
            <input
              type="text"
              value={formData.contact}
              onChange={(e) =>
                setFormData({ ...formData, contact: e.target.value })
              }
              placeholder={copy.info.fields.contact.placeholder}
              className={cn(
                'w-full pr-10 pl-4 py-2.5 rounded-lg border bg-background',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                errors.contact && 'border-destructive'
              )}
              dir="ltr"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {copy.info.fields.contact.helper}
          </p>
          {errors.contact && (
            <p className="text-xs text-destructive mt-1">{errors.contact}</p>
          )}
        </div>

        {/* Photo (optional) */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {copy.info.fields.photo.label}
          </label>
          <button
            type="button"
            className="w-full p-4 rounded-lg border border-dashed bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground"
          >
            <Camera className="w-5 h-5" />
            <span className="text-sm">افزودن تصویر</span>
          </button>
          <p className="text-xs text-muted-foreground mt-1">
            {copy.info.fields.photo.helper}
          </p>
        </div>

        {/* Submit error */}
        {errors.submit && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('intent')}
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            قبلی
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                در حال ایجاد...
              </>
            ) : (
              <>
                {copy.info.cta}
                <ArrowLeft className="w-4 h-4 mr-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default QuickProfileWizard;
