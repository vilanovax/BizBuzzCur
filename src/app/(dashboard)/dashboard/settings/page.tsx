'use client';

import * as React from 'react';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import {
  Sun,
  Moon,
  Monitor,
  User,
  Shield,
  QrCode,
  Users,
  Sparkles,
  Bell,
  Link2,
  Database,
  ChevronLeft,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  Download,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/contexts/AuthContext';

// Setting Section Types
type SettingSection =
  | 'display'
  | 'identity'
  | 'profiles'
  | 'privacy'
  | 'qr'
  | 'networking'
  | 'ai'
  | 'notifications'
  | 'integrations'
  | 'data';

interface SectionConfig {
  id: SettingSection;
  titleFa: string;
  descriptionFa: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'display',
    titleFa: 'نمایش و ظاهر',
    descriptionFa: 'حالت شب/روز و تنظیمات ظاهری',
    icon: Sun,
    available: true,
  },
  {
    id: 'identity',
    titleFa: 'هویت حرفه‌ای',
    descriptionFa: 'حوزه تخصصی، مهارت‌ها و وضعیت شغلی',
    icon: Briefcase,
    available: true,
  },
  {
    id: 'profiles',
    titleFa: 'مدیریت پروفایل‌ها',
    descriptionFa: 'پروفایل‌ها، قالب‌ها و وضعیت انتشار',
    icon: User,
    available: true,
  },
  {
    id: 'privacy',
    titleFa: 'حریم خصوصی و نمایش',
    descriptionFa: 'کنترل نمایش اطلاعات و دسترسی‌ها',
    icon: Shield,
    available: false,
  },
  {
    id: 'qr',
    titleFa: 'QR Code و اشتراک‌گذاری',
    descriptionFa: 'مدیریت QR Codeها و لینک‌ها',
    icon: QrCode,
    available: false,
  },
  {
    id: 'networking',
    titleFa: 'ارتباطات و شبکه‌سازی',
    descriptionFa: 'تنظیمات پیام، درخواست اتصال و مخاطبین',
    icon: Users,
    available: false,
  },
  {
    id: 'ai',
    titleFa: 'هوشمندی و پیشنهادها',
    descriptionFa: 'کنترل پیشنهادات AI و استفاده از داده‌ها',
    icon: Sparkles,
    available: false,
  },
  {
    id: 'notifications',
    titleFa: 'اعلان‌ها',
    descriptionFa: 'مدیریت اعلان‌ها و نوتیفیکیشن‌ها',
    icon: Bell,
    available: false,
  },
  {
    id: 'integrations',
    titleFa: 'اتصال به اپ‌ها',
    descriptionFa: 'اپ‌های متصل و مجوزهای دسترسی',
    icon: Link2,
    available: false,
  },
  {
    id: 'data',
    titleFa: 'داده و حساب کاربری',
    descriptionFa: 'خروجی داده، لاگ فعالیت و حذف حساب',
    icon: Database,
    available: false,
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">تنظیمات</h1>
        <p className="text-muted-foreground mt-1">
          کنترل، شفافیت، بدون شلوغی
        </p>
      </div>

      {/* Display Section - Always visible first */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sun className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>نمایش و ظاهر</CardTitle>
              <CardDescription>حالت شب/روز و تنظیمات ظاهری</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Toggle */}
          <div>
            <label className="text-sm font-medium mb-3 block">حالت نمایش</label>
            <div className="flex gap-3">
              {mounted && (
                <>
                  <ThemeButton
                    icon={Sun}
                    label="روز"
                    isActive={theme === 'light'}
                    onClick={() => setTheme('light')}
                  />
                  <ThemeButton
                    icon={Moon}
                    label="شب"
                    isActive={theme === 'dark'}
                    onClick={() => setTheme('dark')}
                  />
                  <ThemeButton
                    icon={Monitor}
                    label="سیستم"
                    isActive={theme === 'system'}
                    onClick={() => setTheme('system')}
                  />
                </>
              )}
            </div>
            {mounted && theme === 'system' && (
              <p className="text-xs text-muted-foreground mt-2">
                حالت فعلی سیستم: {resolvedTheme === 'dark' ? 'شب' : 'روز'}
              </p>
            )}
          </div>

          {/* Font Size - Coming Soon */}
          <div className="opacity-50">
            <label className="text-sm font-medium mb-3 block">
              اندازه فونت
              <span className="text-xs text-muted-foreground mr-2">(به زودی)</span>
            </label>
            <div className="flex gap-2">
              <div className="px-4 py-2 rounded-lg border bg-muted text-sm">کوچک</div>
              <div className="px-4 py-2 rounded-lg border bg-primary/10 text-primary text-sm">معمولی</div>
              <div className="px-4 py-2 rounded-lg border bg-muted text-sm">بزرگ</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Sections Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.filter(s => s.id !== 'display').map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>

      {/* User Info Footer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium text-lg">
                  {user?.first_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-sm text-muted-foreground">{user?.mobile || user?.email}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              عضو از {new Date(user?.created_at || '').toLocaleDateString('fa-IR')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Theme Toggle Button Component
function ThemeButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-xl border transition-all',
        isActive
          ? 'bg-primary text-primary-foreground border-primary shadow-md'
          : 'bg-background hover:bg-accent border-border'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

// Section Card Component
function SectionCard({ section }: { section: SectionConfig }) {
  const Icon = section.icon;

  if (!section.available) {
    // Coming soon state
    return (
      <Card className="opacity-60 cursor-not-allowed">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{section.titleFa}</h3>
              <p className="text-sm text-muted-foreground">{section.descriptionFa}</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              به زودی
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Link based on section
  const href = section.id === 'identity'
    ? '/dashboard/identity'
    : section.id === 'profiles'
    ? '/dashboard/profiles'
    : `/dashboard/settings/${section.id}`;

  return (
    <Link href={href}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium group-hover:text-primary transition-colors">
                {section.titleFa}
              </h3>
              <p className="text-sm text-muted-foreground">{section.descriptionFa}</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
