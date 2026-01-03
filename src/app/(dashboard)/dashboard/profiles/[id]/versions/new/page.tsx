'use client';

import * as React from 'react';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Loader2,
  Sparkles,
  FileText,
  Users,
  Briefcase,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import VersionWizard from '@/components/profile-version/VersionWizard';
import {
  PROFILE_VERSION_CONTEXT_LABELS,
  PROFILE_VERSION_CONTEXT_DESCRIPTIONS,
  type ProfileVersionContext,
} from '@/types/profile-version';

// =============================================================================
// TYPES
// =============================================================================

interface CreateVersionPageProps {
  params: Promise<{ id: string }>;
}

type CreationMode = 'select' | 'wizard' | 'template';

// Template context icons
const CONTEXT_ICONS: Record<ProfileVersionContext, React.ElementType> = {
  public: FileText,
  network: Users,
  team: Users,
  investor: TrendingUp,
  job: Briefcase,
  custom: Layers,
};

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function CreateVersionPage({ params }: CreateVersionPageProps) {
  const { id: profileId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<CreationMode>('select');
  const [creatingTemplate, setCreatingTemplate] = useState<ProfileVersionContext | null>(null);

  // Fetch profile info
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profiles/${profileId}`);
        const data = await res.json();
        if (data.success) {
          setProfileName(data.data.title || data.data.full_name || 'پروفایل');
        } else {
          setError('پروفایل یافت نشد');
        }
      } catch {
        setError('خطا در دریافت اطلاعات پروفایل');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [profileId]);

  // Create template-based version
  const createTemplateVersion = async (context: ProfileVersionContext) => {
    setCreatingTemplate(context);
    try {
      const res = await fetch(`/api/profiles/${profileId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: PROFILE_VERSION_CONTEXT_LABELS[context],
          context,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/dashboard/profiles/${profileId}?tab=versions&created=${data.data.id}`);
      } else {
        alert(data.error || 'خطا در ساخت نسخه');
      }
    } catch {
      alert('خطا در اتصال به سرور');
    } finally {
      setCreatingTemplate(null);
    }
  };

  // Handle wizard completion
  const handleWizardComplete = (versionId: string) => {
    router.push(`/dashboard/profiles/${profileId}?tab=versions&created=${versionId}`);
  };

  // Handle wizard cancel
  const handleWizardCancel = () => {
    setMode('select');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/profiles">بازگشت به پروفایل‌ها</Link>
        </Button>
      </div>
    );
  }

  // Show wizard
  if (mode === 'wizard') {
    return (
      <div className="py-8">
        <VersionWizard
          profileId={profileId}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/profiles/${profileId}`}>
            <ArrowRight className="w-4 h-4 ml-2" />
            بازگشت
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">ساخت نسخه جدید</h1>
          <p className="text-sm text-muted-foreground">{profileName}</p>
        </div>
      </div>

      {/* AI Version Option */}
      <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                ساخت نسخه سفارشی با هوش مصنوعی
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">جدید</span>
              </CardTitle>
              <CardDescription>
                با چند سوال ساده، یک نسخه مناسب هدفت می‌سازیم
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setMode('wizard')} className="gap-2">
            <Sparkles className="w-4 h-4" />
            شروع ویزارد هوشمند
          </Button>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-4 text-muted-foreground">یا انتخاب از قالب‌های آماده</span>
        </div>
      </div>

      {/* Template Options */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(PROFILE_VERSION_CONTEXT_LABELS) as ProfileVersionContext[])
          .filter((ctx) => ctx !== 'custom') // Custom is handled by AI wizard
          .map((context) => {
            const Icon = CONTEXT_ICONS[context];
            const isCreating = creatingTemplate === context;

            return (
              <Card
                key={context}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50',
                  isCreating && 'opacity-50 pointer-events-none'
                )}
                onClick={() => createTemplateVersion(context)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      {isCreating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {PROFILE_VERSION_CONTEXT_LABELS[context]}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {PROFILE_VERSION_CONTEXT_DESCRIPTIONS[context]}
                  </p>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Info Box */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">نسخه‌ها چی هستن؟</p>
              <p className="text-sm text-muted-foreground">
                هر نسخه یک روایت متفاوت از همان پروفایل است. هیچ داده‌ای تکرار نمی‌شه —
                فقط نحوه نمایش و تأکید تغییر می‌کنه. مثلاً برای سرمایه‌گذار تجربیات کاری پررنگ‌تره،
                ولی برای تیم پروژه‌ها مهم‌ترن.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
