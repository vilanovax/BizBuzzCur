'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { NextActionsWidget } from '@/components/dashboard/widgets/NextActionsWidget';
import { InboxWidget } from '@/components/dashboard/widgets/InboxWidget';
import { JobsWidget } from '@/components/dashboard/widgets/JobsWidget';
import { ProfileHealthWidget } from '@/components/dashboard/widgets/ProfileHealthWidget';
import { ActiveContextsWidget } from '@/components/dashboard/widgets/ActiveContextsWidget';
import { ProfessionalIdentityCard } from '@/components/dashboard/ProfessionalIdentityCard';

interface DashboardData {
  nextActions: Array<{
    type: 'inbox' | 'profile' | 'job' | 'company' | 'event';
    priority: number;
    title: string;
    description: string;
    href: string;
    count?: number;
  }>;
  inboxHighlights: {
    conversations: Array<{
      id: string;
      contextType: string | null;
      contextName: string | null;
      lastMessage: string | null;
      otherParticipant: string | null;
      unreadCount: number;
      updatedAt: string;
    }>;
    totalUnread: number;
  };
  jobsSnapshot: {
    jobs: Array<{
      id: string;
      title: string;
      location: string | null;
      employmentType: string | null;
      companyName: string;
      companyLogo: string | null;
    }>;
    totalCount: number;
  };
  profileHealth: {
    hasProfile: boolean;
    profileId?: string;
    title?: string;
    completeness: number;
    suggestions: string[];
    viewCount: number;
  };
  activeContexts: {
    companies: Array<{
      id: string;
      name: string;
      logo: string | null;
      slug: string;
      role: string;
      activeJobs: number;
    }>;
    upcomingEvents: Array<{
      id: string;
      title: string;
      slug: string;
      startDate: string;
      venue?: string;
    }>;
    organizedEvents: Array<{
      id: string;
      title: string;
      slug: string;
      startDate: string;
      attendeeCount: number;
    }>;
    activeProfile: {
      id: string;
      title: string;
      slug: string;
      viewCount: number;
    } | null;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'خطا در بارگذاری داشبورد');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 text-sm text-primary hover:underline"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صبح بخیر';
    if (hour < 17) return 'روز بخیر';
    return 'عصر بخیر';
  };

  return (
    <div className="space-y-6">
      {/* Header - Personal & Contextual */}
      <div>
        <h1 className="text-2xl font-bold">
          {getGreeting()}، {user?.first_name}
        </h1>
        <p className="text-muted-foreground mt-1">
          {data.nextActions.length > 0
            ? 'کارهایی هست که نیاز به توجه شما دارند'
            : 'همه چیز مرتب است!'}
        </p>
      </div>

      {/* Next Best Actions - TOP PRIORITY */}
      <NextActionsWidget actions={data.nextActions} />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inbox Highlights */}
          <InboxWidget
            conversations={data.inboxHighlights.conversations}
            totalUnread={data.inboxHighlights.totalUnread}
          />

          {/* Jobs Snapshot */}
          <JobsWidget
            jobs={data.jobsSnapshot.jobs as any}
            totalCount={data.jobsSnapshot.totalCount}
          />
        </div>

        {/* Sidebar Column - 1/3 */}
        <div className="space-y-6">
          {/* Professional Identity */}
          <ProfessionalIdentityCard />

          {/* Profile Health */}
          <ProfileHealthWidget
            hasProfile={data.profileHealth.hasProfile}
            profileId={data.profileHealth.profileId}
            title={data.profileHealth.title}
            completeness={data.profileHealth.completeness}
            suggestions={data.profileHealth.suggestions}
            viewCount={data.profileHealth.viewCount}
          />

          {/* Active Contexts */}
          <ActiveContextsWidget
            companies={data.activeContexts.companies as any}
            upcomingEvents={data.activeContexts.upcomingEvents}
            organizedEvents={data.activeContexts.organizedEvents}
            activeProfile={data.activeContexts.activeProfile}
          />
        </div>
      </div>
    </div>
  );
}
