'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  User,
  Eye,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Plus,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ProfileHealthWidgetProps {
  hasProfile: boolean;
  profileId?: string;
  title?: string;
  completeness: number;
  suggestions: string[];
  viewCount: number;
}

export function ProfileHealthWidget({
  hasProfile,
  profileId,
  title,
  completeness,
  suggestions,
  viewCount,
}: ProfileHealthWidgetProps) {
  if (!hasProfile) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="h-14 w-14 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <User className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">پروفایل بسازید</h3>
            <p className="text-sm text-muted-foreground mb-4">
              کارت ویزیت دیجیتال شما آماده نیست
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/dashboard/profiles/quick">
                  <Zap className="h-4 w-4 ml-2" />
                  ساخت سریع (۳ دقیقه)
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/profiles/new" className="text-muted-foreground">
                  یا پروفایل کامل بسازید
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isComplete = completeness >= 80;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5" />
            سلامت پروفایل
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/profiles`} className="flex items-center gap-1">
              مشاهده
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">تکمیل پروفایل</span>
            <span className={cn(
              'text-sm font-medium',
              isComplete ? 'text-green-600' : 'text-amber-600'
            )}>
              {completeness}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isComplete ? 'bg-green-500' : 'bg-amber-500'
              )}
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 py-2 border-y">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{viewCount}</span>
              <span className="text-muted-foreground mr-1">بازدید</span>
            </span>
          </div>
          {title && (
            <span className="text-sm text-muted-foreground truncate">
              {title}
            </span>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">پیشنهادات بهبود:</p>
            {suggestions.map((suggestion, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>{suggestion}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
              <Link href={profileId ? `/dashboard/profiles/${profileId}/edit` : '/dashboard/profiles'}>
                بهبود پروفایل
              </Link>
            </Button>
          </div>
        )}

        {suggestions.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>پروفایل شما کامل است!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
