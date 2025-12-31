'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { UserProfessionalProfile } from '@/types/professional';

interface IdentityHealthCardProps {
  profile: UserProfessionalProfile;
  onEditClick: () => void;
}

interface HealthItem {
  key: string;
  label: string;
  isComplete: boolean;
  suggestion?: string;
}

export function IdentityHealthCard({ profile, onEditClick }: IdentityHealthCardProps) {
  // Calculate health items
  const healthItems: HealthItem[] = [
    {
      key: 'domain',
      label: 'حوزه تخصصی',
      isComplete: !!profile.primaryDomain,
      suggestion: 'حوزه تخصصی خود را انتخاب کنید',
    },
    {
      key: 'specializations',
      label: 'تخصص‌ها',
      isComplete: (profile.specializations?.length ?? 0) > 0,
      suggestion: 'حداقل یک تخصص اضافه کنید',
    },
    {
      key: 'skills',
      label: 'مهارت‌ها',
      isComplete: (profile.skills?.length ?? 0) >= 3,
      suggestion: 'حداقل ۳ مهارت اضافه کنید',
    },
    {
      key: 'status',
      label: 'وضعیت شغلی',
      isComplete: !!profile.status,
      suggestion: 'وضعیت شغلی خود را مشخص کنید',
    },
  ];

  const completedCount = healthItems.filter((item) => item.isComplete).length;
  const totalCount = healthItems.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const isComplete = percentage === 100;

  const incompleteItems = healthItems.filter((item) => !item.isComplete);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">سلامت هویت</CardTitle>
          <span
            className={cn(
              'text-sm font-medium',
              isComplete ? 'text-green-600' : 'text-amber-600'
            )}
          >
            {percentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isComplete ? 'bg-green-500' : 'bg-amber-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Health items */}
        <div className="space-y-2">
          {healthItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-2 text-sm"
            >
              {item.isComplete ? (
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              )}
              <span className={item.isComplete ? 'text-muted-foreground' : ''}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {incompleteItems.length > 0 && (
          <div className="pt-3 border-t space-y-2">
            <p className="text-xs text-muted-foreground">پیشنهاد بهبود:</p>
            {incompleteItems.slice(0, 2).map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="h-3 w-3 text-primary flex-shrink-0" />
                <span>{item.suggestion}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action button */}
        <Button
          variant={isComplete ? 'outline' : 'default'}
          size="sm"
          className="w-full"
          onClick={onEditClick}
        >
          {isComplete ? 'ویرایش هویت' : 'تکمیل هویت'}
        </Button>
      </CardContent>
    </Card>
  );
}
