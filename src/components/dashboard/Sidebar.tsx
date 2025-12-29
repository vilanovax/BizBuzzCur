'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  User,
  Calendar,
  Users,
  Building2,
  Settings,
  LogOut,
  Code,
  QrCode,
  Briefcase,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarInfo {
  profileCount: number;
  firstProfilePhoto: string | null;
  trashCount: number;
  eventCount: number;
}

const navigation = [
  { name: 'داشبورد', href: '/dashboard', icon: LayoutDashboard, countKey: null },
  { name: 'هویت حرفه‌ای', href: '/dashboard/identity', icon: Briefcase, countKey: null },
  { name: 'پروفایل‌ها', href: '/dashboard/profiles', icon: User, countKey: 'profileCount' as const },
  { name: 'رویدادها', href: '/dashboard/events', icon: Calendar, countKey: 'eventCount' as const },
  { name: 'شبکه من', href: '/dashboard/contacts', icon: Users, countKey: null },
  { name: 'شرکت‌ها', href: '/dashboard/companies', icon: Building2, countKey: null },
  { name: 'اسکنر QR', href: '/dashboard/scan', icon: QrCode, countKey: null },
];

const developerNav = [
  { name: 'پنل توسعه‌دهنده', href: '/developers', icon: Code },
];

const bottomNav = [
  { name: 'سطل آشغال', href: '/dashboard/trash', icon: Trash2 },
  { name: 'تنظیمات', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarInfo, setSidebarInfo] = useState<SidebarInfo | null>(null);

  useEffect(() => {
    const fetchSidebarInfo = async () => {
      try {
        const res = await fetch('/api/user/sidebar-info');
        const data = await res.json();
        if (data.success) {
          setSidebarInfo(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch sidebar info:', error);
      }
    };

    fetchSidebarInfo();
  }, []);

  return (
    <aside className="fixed inset-y-0 right-0 w-64 bg-card border-l border-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">B</span>
          </div>
          <span className="text-xl font-bold">BizBuzz</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          // Special case for dashboard: only exact match
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {item.countKey && sidebarInfo && sidebarInfo[item.countKey] > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {sidebarInfo[item.countKey]}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-border">
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2">توسعه‌دهندگان</p>
          {developerNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="pt-4 mt-4 border-t border-border">
          {bottomNav.map((item) => {
            const isActive = pathname === item.href;
            const isTrash = item.href === '/dashboard/trash';
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.name}</span>
                {isTrash && sidebarInfo && sidebarInfo.trashCount > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  )}>
                    {sidebarInfo.trashCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          {sidebarInfo?.firstProfilePhoto ? (
            <img
              src={sidebarInfo.firstProfilePhoto}
              alt={user?.first_name || 'User'}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium">
                {user?.first_name?.charAt(0) || 'U'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.mobile || user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          خروج
        </button>
      </div>
    </aside>
  );
}
