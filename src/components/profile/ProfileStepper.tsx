'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface Step {
  id: string;
  title: string;
  titleFa: string;
  description?: string;
  descriptionFa?: string;
}

interface ProfileStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

export function ProfileStepper({
  steps,
  currentStep,
  onStepClick,
  className,
}: ProfileStepperProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Mobile stepper */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            مرحله {currentStep + 1} از {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {steps[currentStep]?.titleFa}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop stepper */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index <= currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div
                className={cn(
                  'flex flex-col items-center',
                  isClickable && 'cursor-pointer'
                )}
                onClick={() => isClickable && onStepClick(index)}
              >
                {/* Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.titleFa}
                  </p>
                  {step.descriptionFa && (
                    <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
                      {step.descriptionFa}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={cn(
                      'h-0.5 rounded-full transition-colors',
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// Default steps for profile creation
export const PROFILE_CREATION_STEPS: Step[] = [
  {
    id: 'template',
    title: 'Select Template',
    titleFa: 'انتخاب قالب',
    description: 'Choose a template',
    descriptionFa: 'یک قالب انتخاب کنید',
  },
  {
    id: 'naming',
    title: 'Naming',
    titleFa: 'نام‌گذاری',
    description: 'Name your profile',
    descriptionFa: 'نام پروفایل',
  },
  {
    id: 'content',
    title: 'Content',
    titleFa: 'محتوا',
    description: 'Fill in your info',
    descriptionFa: 'اطلاعات خود را وارد کنید',
  },
  {
    id: 'settings',
    title: 'Settings',
    titleFa: 'تنظیمات',
    description: 'Privacy & visibility',
    descriptionFa: 'حریم خصوصی',
  },
  {
    id: 'preview',
    title: 'Preview',
    titleFa: 'پیش‌نمایش',
    description: 'Review your profile',
    descriptionFa: 'بررسی نهایی',
  },
  {
    id: 'publish',
    title: 'Publish',
    titleFa: 'انتشار',
    description: 'Get QR code',
    descriptionFa: 'دریافت QR',
  },
];
