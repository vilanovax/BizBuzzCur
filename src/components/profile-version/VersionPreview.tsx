'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import {
  WIZARD_COPY,
  type GeneratedVersionRules,
} from '@/types/version-generator';
import {
  PROFILE_BLOCK_LABELS,
  VISIBILITY_MODE_LABELS,
} from '@/types/profile-version';
import {
  Sparkles,
  Eye,
  EyeOff,
  ArrowUpDown,
  Star,
  AlertCircle,
  Check,
  Edit2,
  X,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface VersionPreviewProps {
  preview: GeneratedVersionRules;
  isFallback: boolean;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

// =============================================================================
// PREVIEW COMPONENT
// =============================================================================

export default function VersionPreview({
  preview,
  isFallback,
  isLoading,
  error,
  onConfirm,
  onEdit,
  onCancel,
}: VersionPreviewProps) {
  const confidencePercent = Math.round((preview.confidence || 0) * 100);

  return (
    <Card className="w-full max-w-2xl mx-auto" dir="rtl">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>{WIZARD_COPY.preview.title}</CardTitle>
              <CardDescription>{WIZARD_COPY.preview.subtitle}</CardDescription>
            </div>
          </div>
          {!isFallback && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>اطمینان:</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      confidencePercent >= 70 ? 'bg-green-500' :
                      confidencePercent >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
                <span className="font-medium">{confidencePercent}٪</span>
              </div>
            </div>
          )}
        </div>

        {isFallback && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>هوش مصنوعی در دسترس نبود. نسخه بر اساس ترجیحات شما ساخته شده.</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Version Name */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">نام نسخه:</span>
            <span className="font-semibold text-lg">{preview.name}</span>
          </div>
        </div>

        {/* Visibility Rules */}
        {preview.visibility_rules && preview.visibility_rules.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              تنظیمات نمایش
            </h4>
            <div className="grid gap-2">
              {preview.visibility_rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span>{PROFILE_BLOCK_LABELS[rule.block] || rule.block}</span>
                  <span
                    className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      rule.mode === 'show' && 'bg-green-500/10 text-green-700',
                      rule.mode === 'hide' && 'bg-red-500/10 text-red-700',
                      rule.mode === 'limited' && 'bg-yellow-500/10 text-yellow-700'
                    )}
                  >
                    {VISIBILITY_MODE_LABELS[rule.mode] || rule.mode}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ordering Rules */}
        {preview.ordering_rules && preview.ordering_rules.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              ترتیب بخش‌ها
            </h4>
            <div className="flex flex-wrap gap-2">
              {[...preview.ordering_rules]
                .sort((a, b) => a.order - b.order)
                .map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                      {rule.order}
                    </span>
                    <span className="text-sm">
                      {PROFILE_BLOCK_LABELS[rule.block] || rule.block}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Emphasis Rules */}
        {preview.emphasis_rules && preview.emphasis_rules.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Star className="w-4 h-4" />
              تاکیدها
            </h4>
            <div className="grid gap-2">
              {preview.emphasis_rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                      {rule.targetType}
                    </span>
                    <span>{rule.targetId}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3 h-3',
                          i < rule.weight ? 'fill-primary text-primary' : 'text-muted'
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Explanations */}
        {preview.reasons && preview.reasons.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {WIZARD_COPY.preview.reasons_title}
            </h4>
            <div className="space-y-2">
              {preview.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 text-sm"
                >
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{reason.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="w-4 h-4 ml-2" />
            {WIZARD_COPY.preview.cancel_button}
          </Button>
          <Button variant="ghost" onClick={onEdit} disabled={isLoading}>
            <Edit2 className="w-4 h-4 ml-2" />
            {WIZARD_COPY.preview.edit_button}
          </Button>
        </div>

        <Button onClick={onConfirm} isLoading={isLoading}>
          <Check className="w-4 h-4 ml-2" />
          {WIZARD_COPY.preview.confirm_button}
        </Button>
      </CardFooter>
    </Card>
  );
}
