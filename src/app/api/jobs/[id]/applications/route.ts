import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Helper to check if user can view applications for this job
async function canViewApplications(userId: string, jobId: string): Promise<boolean> {
  const [result] = await sql`
    SELECT 1 FROM job_ads j
    JOIN company_team_members ctm ON ctm.company_id = j.company_id
    WHERE j.id = ${jobId}
      AND ctm.user_id = ${userId}
      AND ctm.invitation_status = 'accepted'
      AND ctm.role IN ('owner', 'admin', 'recruiter')
  `;
  return !!result;
}

// GET /api/jobs/[id]/applications - List applications for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: jobId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, reviewing, shortlisted, rejected, hired, withdrawn

    // Check permission
    const canView = await canViewApplications(user.id, jobId);
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'شما دسترسی مشاهده درخواست‌های این آگهی را ندارید' },
        { status: 403 }
      );
    }

    // Build status filter
    let statusFilter = sql``;
    if (status) {
      statusFilter = sql`AND ja.status = ${status}`;
    }

    // Get applications with applicant info
    const applications = await sql`
      SELECT
        ja.*,
        u.id as applicant_user_id,
        u.first_name as applicant_first_name,
        u.last_name as applicant_last_name,
        u.email as applicant_email,
        u.avatar_url as applicant_avatar,
        -- Get primary profile info
        p.id as profile_id,
        p.title as profile_title,
        p.tagline as profile_tagline,
        p.city as profile_city,
        p.country as profile_country,
        -- Get job title for context
        j.title as job_title
      FROM job_applications ja
      JOIN users u ON u.id = ja.applicant_id
      JOIN job_ads j ON j.id = ja.job_id
      LEFT JOIN profiles p ON p.user_id = u.id AND p.is_primary = true
      WHERE ja.job_id = ${jobId}
      ${statusFilter}
      ORDER BY ja.applied_at DESC
    `;

    // Get counts by status
    const [counts] = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'reviewing') as reviewing,
        COUNT(*) FILTER (WHERE status = 'shortlisted') as shortlisted,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'hired') as hired,
        COUNT(*) FILTER (WHERE status = 'withdrawn') as withdrawn
      FROM job_applications
      WHERE job_id = ${jobId}
    `;

    return NextResponse.json({
      success: true,
      data: applications.map(app => ({
        id: app.id,
        job_id: app.job_id,
        job_title: app.job_title,
        status: app.status,
        cover_message: app.cover_message,
        resume_url: app.resume_url,
        conversation_id: app.conversation_id,
        applied_at: app.applied_at,
        reviewed_at: app.reviewed_at,
        status_changed_at: app.status_changed_at,
        applicant: {
          id: app.applicant_user_id,
          first_name: app.applicant_first_name,
          last_name: app.applicant_last_name,
          email: app.applicant_email,
          avatar_url: app.applicant_avatar,
        },
        profile: app.profile_id ? {
          id: app.profile_id,
          title: app.profile_title,
          tagline: app.profile_tagline,
          city: app.profile_city,
          country: app.profile_country,
        } : null,
      })),
      counts: {
        total: parseInt(counts?.total || '0'),
        pending: parseInt(counts?.pending || '0'),
        reviewing: parseInt(counts?.reviewing || '0'),
        shortlisted: parseInt(counts?.shortlisted || '0'),
        rejected: parseInt(counts?.rejected || '0'),
        hired: parseInt(counts?.hired || '0'),
        withdrawn: parseInt(counts?.withdrawn || '0'),
      }
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get applications' },
      { status: 500 }
    );
  }
}
