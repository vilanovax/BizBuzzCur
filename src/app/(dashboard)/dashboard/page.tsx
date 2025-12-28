import { getCurrentUser } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProfessionalIdentityCard } from '@/components/dashboard/ProfessionalIdentityCard';
import Link from 'next/link';
import sql from '@/lib/db';
import {
  User,
  Calendar,
  Users,
  Eye,
  QrCode,
  ArrowUpLeft,
  Plus,
} from 'lucide-react';

// Fetch dashboard stats from database
async function getDashboardStats(userId: string) {
  try {
    // Get profile count and total views
    const [profileStats] = await sql<[{ count: number; total_views: number }]>`
      SELECT
        COUNT(*)::int as count,
        COALESCE(SUM(view_count), 0)::int as total_views
      FROM profiles
      WHERE user_id = ${userId}
    `;

    // Get active profiles count (for change indicator)
    const [activeProfiles] = await sql<[{ count: number }]>`
      SELECT COUNT(*)::int as count
      FROM profiles
      WHERE user_id = ${userId} AND is_active = true AND is_public = true
    `;

    // Events count (placeholder - will be implemented when events table is ready)
    let eventsCount = 0;
    try {
      const [eventStats] = await sql<[{ count: number }]>`
        SELECT COUNT(*)::int as count
        FROM events
        WHERE organizer_id = ${userId}
      `;
      eventsCount = eventStats?.count || 0;
    } catch {
      // Events table may not exist yet
    }

    // Connections count (placeholder)
    let connectionsCount = 0;
    try {
      const [connectionStats] = await sql<[{ count: number }]>`
        SELECT COUNT(*)::int as count
        FROM connections
        WHERE (user_a_id = ${userId} OR user_b_id = ${userId})
          AND status = 'accepted'
      `;
      connectionsCount = connectionStats?.count || 0;
    } catch {
      // Connections table may not exist yet
    }

    return {
      profileCount: profileStats?.count || 0,
      activeProfileCount: activeProfiles?.count || 0,
      totalViews: profileStats?.total_views || 0,
      eventsCount,
      connectionsCount,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      profileCount: 0,
      activeProfileCount: 0,
      totalViews: 0,
      eventsCount: 0,
      connectionsCount: 0,
    };
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Fetch real stats from database
  const dashboardStats = user ? await getDashboardStats(user.id) : null;

  const stats = [
    {
      title: 'پروفایل‌ها',
      value: String(dashboardStats?.profileCount || 0),
      change: dashboardStats?.activeProfileCount ? `${dashboardStats.activeProfileCount} فعال` : '',
      icon: User,
      href: '/dashboard/profiles',
    },
    {
      title: 'رویدادها',
      value: String(dashboardStats?.eventsCount || 0),
      change: '',
      icon: Calendar,
      href: '/dashboard/events',
    },
    {
      title: 'شبکه',
      value: String(dashboardStats?.connectionsCount || 0),
      change: '',
      icon: Users,
      href: '/dashboard/contacts',
    },
    {
      title: 'بازدید کل',
      value: String(dashboardStats?.totalViews || 0),
      change: '',
      icon: Eye,
      href: '#',
    },
  ];

  const quickActions = [
    {
      title: 'ایجاد پروفایل جدید',
      description: 'پروفایل دیجیتال جدید بسازید',
      icon: Plus,
      href: '/dashboard/profiles/new',
      color: 'bg-blue-500',
    },
    {
      title: 'ایجاد رویداد',
      description: 'رویداد یا جلسه جدید ایجاد کنید',
      icon: Calendar,
      href: '/dashboard/events/new',
      color: 'bg-green-500',
    },
    {
      title: 'اسکن QR Code',
      description: 'پروفایل دیگران را اسکن کنید',
      icon: QrCode,
      href: '/dashboard/scan',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          سلام، {user?.first_name}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          به داشبورد بیزباز خوش آمدید
        </p>
      </div>

      {/* Professional Identity Card */}
      <ProfessionalIdentityCard />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="min-h-[72px] flex flex-col justify-center">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1 h-4">
                      {stat.change && (
                        <>
                          <ArrowUpLeft className="h-3 w-3" />
                          {stat.change}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">شروع سریع</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>شروع کار با بیزباز</CardTitle>
          <CardDescription>
            مراحل زیر را برای استفاده کامل از بیزباز دنبال کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium">اولین پروفایل خود را بسازید</h4>
                <p className="text-sm text-muted-foreground">
                  کارت ویزیت دیجیتال یا رزومه آنلاین خود را ایجاد کنید
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href="/dashboard/profiles/new">شروع</Link>
              </Button>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border opacity-60">
              <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium">QR Code خود را به اشتراک بگذارید</h4>
                <p className="text-sm text-muted-foreground">
                  پروفایل خود را با دیگران به اشتراک بگذارید
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border opacity-60">
              <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium">شبکه‌سازی کنید</h4>
                <p className="text-sm text-muted-foreground">
                  با افراد جدید آشنا شوید و شبکه حرفه‌ای خود را گسترش دهید
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
