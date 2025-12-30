import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/companies/[id]/jobs - Get published jobs for a company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const user = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeAll = searchParams.get('include_all') === 'true'; // For admins to see all jobs

    // Check if user is company admin
    let isAdmin = false;
    if (user) {
      const [teamMember] = await sql`
        SELECT role FROM company_team_members
        WHERE company_id = ${companyId}
          AND user_id = ${user.id}
          AND invitation_status = 'accepted'
          AND role IN ('owner', 'admin', 'recruiter')
      `;
      isAdmin = !!teamMember;
    }

    // Build status filter - admins can see all, others only published
    let statusFilter = sql`AND j.status = 'published' AND (j.expires_at IS NULL OR j.expires_at > NOW())`;
    if (isAdmin && includeAll) {
      statusFilter = sql``; // No filter for admins
    }

    // Get jobs
    const jobs = await sql`
      SELECT
        j.*,
        d.name_fa as domain_name,
        d.name_en as domain_name_en,
        s.name_fa as specialization_name,
        s.name_en as specialization_name_en,
        dep.name as department_name,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id AND status = 'pending') as pending_count
      FROM job_ads j
      LEFT JOIN professional_domains d ON d.id = j.domain_id
      LEFT JOIN specializations s ON s.id = j.specialization_id
      LEFT JOIN company_departments dep ON dep.id = j.department_id
      WHERE j.company_id = ${companyId}
      ${statusFilter}
      ORDER BY j.is_featured DESC, j.published_at DESC NULLS LAST, j.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count
    const [countResult] = await sql`
      SELECT COUNT(*) as total
      FROM job_ads j
      WHERE j.company_id = ${companyId}
      ${statusFilter}
    `;

    // Check if user has applied to any of these jobs
    let userApplications: Record<string, string> = {};
    if (user) {
      const applications = await sql`
        SELECT job_id, id FROM job_applications
        WHERE applicant_id = ${user.id}
          AND job_id = ANY(${jobs.map(j => j.id)})
      `;
      userApplications = Object.fromEntries(
        applications.map(a => [a.job_id, a.id])
      );
    }

    return NextResponse.json({
      success: true,
      data: jobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        employment_type: job.employment_type,
        location_type: job.location_type,
        location: job.location,
        salary_range: job.salary_range,
        experience_level: job.experience_level,
        required_skills: job.required_skills,
        preferred_skills: job.preferred_skills,
        status: job.status,
        is_featured: job.is_featured,
        published_at: job.published_at,
        expires_at: job.expires_at,
        created_at: job.created_at,
        application_count: isAdmin ? parseInt(job.application_count || '0') : undefined,
        pending_count: isAdmin ? parseInt(job.pending_count || '0') : undefined,
        has_applied: !!userApplications[job.id],
        application_id: userApplications[job.id] || null,
        domain: job.domain_name ? {
          name_fa: job.domain_name,
          name_en: job.domain_name_en,
        } : null,
        specialization: job.specialization_name ? {
          name_fa: job.specialization_name,
          name_en: job.specialization_name_en,
        } : null,
        department: job.department_name ? {
          name: job.department_name,
        } : null,
      })),
      pagination: {
        total: parseInt(countResult?.total || '0'),
        limit,
        offset,
        has_more: offset + jobs.length < parseInt(countResult?.total || '0'),
      },
      is_admin: isAdmin,
    });
  } catch (error) {
    console.error('Get company jobs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get company jobs' },
      { status: 500 }
    );
  }
}
