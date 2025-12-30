import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { CompanyRole } from '@/types/company';
import type { CreateJobRequest } from '@/types/job';

// Helper to check if user can post jobs for a company
async function canPostJobs(userId: string, companyId: string): Promise<boolean> {
  const [member] = await sql<[{ role: CompanyRole }]>`
    SELECT role FROM company_team_members
    WHERE company_id = ${companyId}
      AND user_id = ${userId}
      AND invitation_status = 'accepted'
      AND role IN ('owner', 'admin', 'recruiter')
  `;
  return !!member;
}

// POST /api/jobs - Create a new job ad
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateJobRequest = await request.json();
    const {
      company_id,
      department_id,
      display_profile_id,
      title,
      description,
      employment_type,
      location_type,
      location,
      salary_range,
      experience_level,
      required_skills,
      preferred_skills,
      domain_id,
      specialization_id,
      event_id,
    } = body;

    // Validate required fields
    if (!company_id) {
      return NextResponse.json(
        { success: false, error: 'شناسه شرکت الزامی است' },
        { status: 400 }
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'عنوان شغل الزامی است' },
        { status: 400 }
      );
    }

    // Check permission
    const hasPermission = await canPostJobs(user.id, company_id);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'شما دسترسی ایجاد آگهی برای این شرکت را ندارید' },
        { status: 403 }
      );
    }

    // Create job ad
    const [job] = await sql`
      INSERT INTO job_ads (
        company_id,
        department_id,
        created_by,
        display_profile_id,
        title,
        description,
        employment_type,
        location_type,
        location,
        salary_range,
        experience_level,
        required_skills,
        preferred_skills,
        domain_id,
        specialization_id,
        event_id,
        status
      )
      VALUES (
        ${company_id},
        ${department_id || null},
        ${user.id},
        ${display_profile_id || null},
        ${title.trim()},
        ${description || null},
        ${employment_type || null},
        ${location_type || null},
        ${location || null},
        ${salary_range ? JSON.stringify(salary_range) : null},
        ${experience_level || null},
        ${required_skills || []},
        ${preferred_skills || []},
        ${domain_id || null},
        ${specialization_id || null},
        ${event_id || null},
        'draft'
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

// GET /api/jobs - List jobs (admin: my company jobs, or public published jobs)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);

    const companyId = searchParams.get('company_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // If company_id provided, check if user has access
    if (companyId && user) {
      const hasAccess = await canPostJobs(user.id, companyId);
      if (hasAccess) {
        // Return all jobs for this company (admin view)
        const jobs = await sql`
          SELECT
            j.*,
            c.name as company_name,
            c.logo_url as company_logo,
            c.slug as company_slug,
            (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
          FROM job_ads j
          JOIN companies c ON c.id = j.company_id
          WHERE j.company_id = ${companyId}
          ${status ? sql`AND j.status = ${status}` : sql``}
          ORDER BY j.created_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;

        return NextResponse.json({
          success: true,
          data: jobs,
        });
      }
    }

    // Public view - only published jobs
    const jobs = await sql`
      SELECT
        j.id,
        j.title,
        j.description,
        j.employment_type,
        j.location_type,
        j.location,
        j.salary_range,
        j.experience_level,
        j.required_skills,
        j.preferred_skills,
        j.is_featured,
        j.published_at,
        j.created_at,
        c.id as company_id,
        c.name as company_name,
        c.logo_url as company_logo,
        c.slug as company_slug,
        d.name_fa as domain_name,
        s.name_fa as specialization_name
      FROM job_ads j
      JOIN companies c ON c.id = j.company_id
      LEFT JOIN professional_domains d ON d.id = j.domain_id
      LEFT JOIN specializations s ON s.id = j.specialization_id
      WHERE j.status = 'published'
        ${companyId ? sql`AND j.company_id = ${companyId}` : sql``}
      ORDER BY j.is_featured DESC, j.published_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Add has_applied flag if user is logged in
    if (user && jobs.length > 0) {
      const jobIds = jobs.map(j => j.id);
      const applications = await sql`
        SELECT job_id FROM job_applications
        WHERE applicant_id = ${user.id}
          AND job_id = ANY(${jobIds})
      `;
      const appliedJobIds = new Set(applications.map(a => a.job_id));

      jobs.forEach(job => {
        (job as Record<string, unknown>).has_applied = appliedJobIds.has(job.id);
      });
    }

    return NextResponse.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error('List jobs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list jobs' },
      { status: 500 }
    );
  }
}
