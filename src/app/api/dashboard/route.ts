import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/dashboard - Get dashboard data for command center
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run all queries in parallel for performance
    const [
      nextActions,
      inboxHighlights,
      jobsSnapshot,
      profileHealth,
      activeContexts,
    ] = await Promise.all([
      getNextActions(user.id),
      getInboxHighlights(user.id),
      getJobsSnapshot(user.id),
      getProfileHealth(user.id),
      getActiveContexts(user.id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        nextActions,
        inboxHighlights,
        jobsSnapshot,
        profileHealth,
        activeContexts,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}

// 1. Next Best Actions - What should user do RIGHT NOW
async function getNextActions(userId: string) {
  const actions: Array<{
    type: 'inbox' | 'profile' | 'job' | 'company' | 'event';
    priority: number;
    title: string;
    description: string;
    href: string;
    count?: number;
  }> = [];

  // Check unread inbox messages
  const [unreadInbox] = await sql`
    SELECT COUNT(*) as count
    FROM conversation_participants cp
    JOIN conversations c ON c.id = cp.conversation_id
    WHERE cp.user_id = ${userId}
      AND cp.unread_count > 0
  `;
  if (parseInt(unreadInbox?.count || '0') > 0) {
    actions.push({
      type: 'inbox',
      priority: 1,
      title: 'پیام‌های خوانده نشده',
      description: `${unreadInbox.count} مکالمه جدید دارید`,
      href: '/dashboard/inbox',
      count: parseInt(unreadInbox.count),
    });
  }

  // Check pending job applications (as company owner)
  const [pendingApps] = await sql`
    SELECT COUNT(DISTINCT ja.id) as count
    FROM job_applications ja
    JOIN job_ads j ON j.id = ja.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE c.created_by = ${userId}
      AND ja.status = 'pending'
  `;
  if (parseInt(pendingApps?.count || '0') > 0) {
    actions.push({
      type: 'job',
      priority: 2,
      title: 'درخواست‌های شغلی جدید',
      description: `${pendingApps.count} درخواست در انتظار بررسی`,
      href: '/dashboard/companies',
      count: parseInt(pendingApps.count),
    });
  }

  // Check incomplete professional identity
  const [identity] = await sql`
    SELECT domain_id FROM user_domains
    WHERE user_id = ${userId} AND is_primary = true
    LIMIT 1
  `;
  if (!identity) {
    actions.push({
      type: 'profile',
      priority: 3,
      title: 'هویت حرفه‌ای را تکمیل کنید',
      description: 'حوزه تخصصی و مهارت‌های خود را تعیین کنید',
      href: '/dashboard/identity',
    });
  }

  // Check if user has no profiles
  const [profileCount] = await sql`
    SELECT COUNT(*) as count FROM profiles WHERE user_id = ${userId}
  `;
  if (parseInt(profileCount?.count || '0') === 0) {
    actions.push({
      type: 'profile',
      priority: 4,
      title: 'اولین پروفایل را بسازید',
      description: 'کارت ویزیت دیجیتال خود را ایجاد کنید',
      href: '/dashboard/profiles/new',
    });
  }

  // Check if user has no company
  const [companyCount] = await sql`
    SELECT COUNT(*) as count FROM companies WHERE created_by = ${userId}
  `;
  if (parseInt(companyCount?.count || '0') === 0) {
    actions.push({
      type: 'company',
      priority: 5,
      title: 'شرکت خود را ثبت کنید',
      description: 'برای انتشار آگهی شغلی، ابتدا شرکت ایجاد کنید',
      href: '/dashboard/companies/new',
    });
  }

  // Sort by priority and return top 3
  return actions.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

// 2. Inbox Highlights - Recent conversations with context
async function getInboxHighlights(userId: string) {
  const conversations = await sql`
    SELECT
      c.id,
      c.context_type,
      c.context_id,
      c.updated_at,
      cp.unread_count,
      (
        SELECT m.content
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) as last_message,
      (
        SELECT u.first_name || ' ' || u.last_name
        FROM conversation_participants cp2
        JOIN users u ON u.id = cp2.user_id
        WHERE cp2.conversation_id = c.id AND cp2.user_id != ${userId}
        LIMIT 1
      ) as other_participant_name,
      CASE
        WHEN c.context_type = 'job_application' THEN (
          SELECT j.title FROM job_ads j
          JOIN job_applications ja ON ja.job_id = j.id
          WHERE ja.conversation_id = c.id
          LIMIT 1
        )
        WHEN c.context_type = 'event' THEN (
          SELECT e.title FROM events e WHERE e.id = c.context_id
        )
        ELSE NULL
      END as context_name
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id
    WHERE cp.user_id = ${userId}
    ORDER BY c.updated_at DESC
    LIMIT 3
  `;

  const totalUnread = await sql`
    SELECT COALESCE(SUM(unread_count), 0) as count
    FROM conversation_participants
    WHERE user_id = ${userId}
  `;

  return {
    conversations: conversations.map(c => ({
      id: c.id,
      contextType: c.context_type,
      contextName: c.context_name,
      lastMessage: c.last_message?.substring(0, 60) + (c.last_message?.length > 60 ? '...' : ''),
      otherParticipant: c.other_participant_name,
      unreadCount: c.unread_count,
      updatedAt: c.updated_at,
    })),
    totalUnread: parseInt(totalUnread[0]?.count || '0'),
  };
}

// 3. Jobs Snapshot - Relevant job opportunities
async function getJobsSnapshot(userId: string) {
  // Get user's profile for matching
  const [userProfile] = await sql`
    SELECT city, industry FROM profiles
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
    LIMIT 1
  `;

  // Get relevant jobs
  const jobs = await sql`
    SELECT
      j.id,
      j.title,
      j.location,
      j.employment_type,
      c.name as company_name,
      c.logo_url as company_logo
    FROM job_ads j
    JOIN companies c ON c.id = j.company_id
    WHERE j.status = 'published'
      AND (j.expires_at IS NULL OR j.expires_at > NOW())
      AND NOT EXISTS (
        SELECT 1 FROM job_applications ja
        WHERE ja.job_id = j.id AND ja.applicant_id = ${userId}
      )
      AND NOT EXISTS (
        SELECT 1 FROM company_team_members ctm
        WHERE ctm.company_id = j.company_id AND ctm.user_id = ${userId}
      )
    ORDER BY j.is_featured DESC, j.published_at DESC
    LIMIT 3
  `;

  // Get total count
  const [totalJobs] = await sql`
    SELECT COUNT(*) as count
    FROM job_ads j
    WHERE j.status = 'published'
      AND (j.expires_at IS NULL OR j.expires_at > NOW())
      AND NOT EXISTS (
        SELECT 1 FROM job_applications ja
        WHERE ja.job_id = j.id AND ja.applicant_id = ${userId}
      )
      AND NOT EXISTS (
        SELECT 1 FROM company_team_members ctm
        WHERE ctm.company_id = j.company_id AND ctm.user_id = ${userId}
      )
  `;

  return {
    jobs: jobs.map(j => ({
      id: j.id,
      title: j.title,
      location: j.location,
      employmentType: j.employment_type,
      companyName: j.company_name,
      companyLogo: j.company_logo,
    })),
    totalCount: parseInt(totalJobs?.count || '0'),
  };
}

// 4. Profile Health - Profile completeness and suggestions
async function getProfileHealth(userId: string) {
  // Get primary profile
  const [profile] = await sql`
    SELECT
      id, title, full_name, headline, bio, photo_url,
      email, phone, website, city, job_title, company,
      social_links, view_count
    FROM profiles
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
    LIMIT 1
  `;

  if (!profile) {
    return {
      hasProfile: false,
      completeness: 0,
      suggestions: ['اولین پروفایل خود را بسازید'],
      viewCount: 0,
    };
  }

  // Calculate completeness
  const fields = [
    { key: 'full_name', weight: 15 },
    { key: 'headline', weight: 15 },
    { key: 'bio', weight: 10 },
    { key: 'photo_url', weight: 20 },
    { key: 'email', weight: 10 },
    { key: 'phone', weight: 5 },
    { key: 'city', weight: 5 },
    { key: 'job_title', weight: 10 },
    { key: 'company', weight: 5 },
    { key: 'social_links', weight: 5 },
  ];

  let completeness = 0;
  const suggestions: string[] = [];

  for (const field of fields) {
    const value = profile[field.key as keyof typeof profile];
    const hasValue = value && (typeof value === 'string' ? value.trim() : Object.keys(value).length > 0);

    if (hasValue) {
      completeness += field.weight;
    } else {
      // Add suggestions for important missing fields
      switch (field.key) {
        case 'photo_url':
          suggestions.push('عکس پروفایل اضافه کنید');
          break;
        case 'headline':
          suggestions.push('تیتر حرفه‌ای بنویسید');
          break;
        case 'bio':
          suggestions.push('درباره خود بنویسید');
          break;
        case 'job_title':
          suggestions.push('عنوان شغلی را وارد کنید');
          break;
      }
    }
  }

  return {
    hasProfile: true,
    profileId: profile.id,
    title: profile.title,
    completeness: Math.min(completeness, 100),
    suggestions: suggestions.slice(0, 3),
    viewCount: profile.view_count || 0,
  };
}

// 5. Active Contexts - Current events, companies, active profile
async function getActiveContexts(userId: string) {
  // Get user's companies
  const companies = await sql`
    SELECT
      c.id, c.name, c.logo_url, c.slug,
      ctm.role,
      (SELECT COUNT(*) FROM job_ads WHERE company_id = c.id AND status = 'published') as active_jobs
    FROM companies c
    JOIN company_team_members ctm ON ctm.company_id = c.id
    WHERE ctm.user_id = ${userId}
      AND ctm.invitation_status = 'accepted'
    UNION
    SELECT
      c.id, c.name, c.logo_url, c.slug,
      'owner' as role,
      (SELECT COUNT(*) FROM job_ads WHERE company_id = c.id AND status = 'published') as active_jobs
    FROM companies c
    WHERE c.created_by = ${userId}
    LIMIT 3
  `;

  // Get upcoming events user is attending
  const events = await sql`
    SELECT
      e.id, e.title, e.slug, e.start_date, e.venue_name
    FROM events e
    JOIN event_attendees ea ON ea.event_id = e.id
    WHERE ea.user_id = ${userId}
      AND ea.status = 'approved'
      AND e.start_date >= NOW()
    ORDER BY e.start_date ASC
    LIMIT 2
  `;

  // Get user's events (as organizer)
  const organizedEvents = await sql`
    SELECT
      e.id, e.title, e.slug, e.start_date,
      (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id AND status = 'approved') as attendee_count
    FROM events e
    WHERE e.organizer_id = ${userId}
      AND e.status IN ('published', 'ongoing')
    ORDER BY e.start_date ASC
    LIMIT 2
  `;

  // Get active profile
  const [activeProfile] = await sql`
    SELECT id, title, slug, view_count
    FROM profiles
    WHERE user_id = ${userId} AND is_active = true AND is_public = true
    ORDER BY view_count DESC
    LIMIT 1
  `;

  return {
    companies: companies.map(c => ({
      id: c.id,
      name: c.name,
      logo: c.logo_url,
      slug: c.slug,
      role: c.role,
      activeJobs: parseInt(c.active_jobs || '0'),
    })),
    upcomingEvents: events.map(e => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      startDate: e.start_date,
      venue: e.venue_name,
    })),
    organizedEvents: organizedEvents.map(e => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      startDate: e.start_date,
      attendeeCount: parseInt(e.attendee_count || '0'),
    })),
    activeProfile: activeProfile ? {
      id: activeProfile.id,
      title: activeProfile.title,
      slug: activeProfile.slug,
      viewCount: activeProfile.view_count,
    } : null,
  };
}
