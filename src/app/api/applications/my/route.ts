import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/applications/my - Get user's job applications
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filter by status
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build status filter
    let statusFilter = sql``;
    if (status) {
      statusFilter = sql`AND ja.status = ${status}`;
    }

    // Get user's applications
    const applications = await sql`
      SELECT
        ja.*,
        j.id as job_id,
        j.title as job_title,
        j.employment_type,
        j.location_type,
        j.location,
        j.status as job_status,
        c.id as company_id,
        c.name as company_name,
        c.logo_url as company_logo,
        c.slug as company_slug
      FROM job_applications ja
      JOIN job_ads j ON j.id = ja.job_id
      JOIN companies c ON c.id = j.company_id
      WHERE ja.applicant_id = ${user.id}
      ${statusFilter}
      ORDER BY ja.applied_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
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
      WHERE applicant_id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      data: applications.map(app => ({
        id: app.id,
        status: app.status,
        cover_message: app.cover_message,
        resume_url: app.resume_url,
        conversation_id: app.conversation_id,
        applied_at: app.applied_at,
        reviewed_at: app.reviewed_at,
        status_changed_at: app.status_changed_at,
        job: {
          id: app.job_id,
          title: app.job_title,
          employment_type: app.employment_type,
          location_type: app.location_type,
          location: app.location,
          status: app.job_status,
        },
        company: {
          id: app.company_id,
          name: app.company_name,
          logo_url: app.company_logo,
          slug: app.company_slug,
        },
      })),
      counts: {
        total: parseInt(counts?.total || '0'),
        pending: parseInt(counts?.pending || '0'),
        reviewing: parseInt(counts?.reviewing || '0'),
        shortlisted: parseInt(counts?.shortlisted || '0'),
        rejected: parseInt(counts?.rejected || '0'),
        hired: parseInt(counts?.hired || '0'),
        withdrawn: parseInt(counts?.withdrawn || '0'),
      },
      pagination: {
        total: parseInt(counts?.total || '0'),
        limit,
        offset,
        has_more: offset + applications.length < parseInt(counts?.total || '0'),
      },
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get applications' },
      { status: 500 }
    );
  }
}
