import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { CompanyRole } from '@/types/company';
import type { UpdateJobRequest, JobStatus } from '@/types/job';

// Helper to check if user can manage this job
async function canManageJob(userId: string, jobId: string): Promise<{ allowed: boolean; companyId?: string }> {
  const [job] = await sql`
    SELECT j.company_id
    FROM job_ads j
    JOIN company_team_members ctm ON ctm.company_id = j.company_id
    WHERE j.id = ${jobId}
      AND ctm.user_id = ${userId}
      AND ctm.invitation_status = 'accepted'
      AND ctm.role IN ('owner', 'admin', 'recruiter')
  `;
  return { allowed: !!job, companyId: job?.company_id };
}

// GET /api/jobs/[id] - Get job details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const user = await getCurrentUser();

    const [job] = await sql`
      SELECT
        j.*,
        c.id as company_id,
        c.name as company_name,
        c.logo_url as company_logo,
        c.slug as company_slug,
        c.tagline as company_tagline,
        c.industry as company_industry,
        c.company_size,
        c.city as company_city,
        c.country as company_country,
        dep.name as department_name,
        d.name_fa as domain_name,
        d.name_en as domain_name_en,
        s.name_fa as specialization_name,
        s.name_en as specialization_name_en,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count
      FROM job_ads j
      JOIN companies c ON c.id = j.company_id
      LEFT JOIN company_departments dep ON dep.id = j.department_id
      LEFT JOIN professional_domains d ON d.id = j.domain_id
      LEFT JOIN specializations s ON s.id = j.specialization_id
      WHERE j.id = ${jobId}
    `;

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check access for non-published jobs
    let canEdit = false;
    if (job.status !== 'published') {
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }

      const { allowed } = await canManageJob(user.id, jobId);
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }
      canEdit = true;
    } else if (user) {
      const { allowed } = await canManageJob(user.id, jobId);
      canEdit = allowed;
    }

    // Check if user has applied
    let hasApplied = false;
    let applicationId: string | null = null;
    if (user) {
      const [application] = await sql`
        SELECT id FROM job_applications
        WHERE job_id = ${jobId} AND applicant_id = ${user.id}
      `;
      hasApplied = !!application;
      applicationId = application?.id || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        can_edit: canEdit,
        has_applied: hasApplied,
        application_id: applicationId,
        company: {
          id: job.company_id,
          name: job.company_name,
          logo_url: job.company_logo,
          slug: job.company_slug,
          tagline: job.company_tagline,
          industry: job.company_industry,
          company_size: job.company_size,
          city: job.company_city,
          country: job.company_country,
        },
        department: job.department_name ? { name: job.department_name } : null,
        domain: job.domain_name ? {
          name_fa: job.domain_name,
          name_en: job.domain_name_en,
        } : null,
        specialization: job.specialization_name ? {
          name_fa: job.specialization_name,
          name_en: job.specialization_name_en,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get job error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get job' },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id] - Update job
export async function PUT(
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

    // Check permission
    const { allowed } = await canManageJob(user.id, jobId);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'شما دسترسی ویرایش این آگهی را ندارید' },
        { status: 403 }
      );
    }

    const body: UpdateJobRequest & { status?: JobStatus } = await request.json();

    // Handle status change specially
    if (body.status) {
      const [currentJob] = await sql`SELECT status FROM job_ads WHERE id = ${jobId}`;

      // Set published_at when publishing
      if (body.status === 'published' && currentJob?.status !== 'published') {
        await sql`
          UPDATE job_ads
          SET status = 'published', published_at = NOW(), updated_at = NOW()
          WHERE id = ${jobId}
        `;
      } else {
        await sql`
          UPDATE job_ads
          SET status = ${body.status}, updated_at = NOW()
          WHERE id = ${jobId}
        `;
      }
    }

    // Update other fields
    const updateFields = { ...body };
    delete updateFields.status;

    if (Object.keys(updateFields).length > 0) {
      const updates: string[] = [];
      const values: (string | number | boolean | null)[] = [];
      let paramIndex = 1;

      const allowedFields = [
        'title', 'description', 'employment_type', 'location_type',
        'location', 'salary_range', 'experience_level', 'required_skills',
        'preferred_skills', 'domain_id', 'specialization_id', 'department_id',
        'display_profile_id', 'is_featured', 'expires_at'
      ];

      for (const field of allowedFields) {
        if (field in updateFields && updateFields[field as keyof typeof updateFields] !== undefined) {
          let value = updateFields[field as keyof typeof updateFields];

          // Handle JSON fields
          if (field === 'salary_range' && value) {
            value = JSON.stringify(value);
          }

          updates.push(`${field} = $${paramIndex}`);
          values.push(value as string | number | boolean | null);
          paramIndex++;
        }
      }

      if (updates.length > 0) {
        values.push(jobId);
        const updateQuery = `
          UPDATE job_ads
          SET ${updates.join(', ')}, updated_at = NOW()
          WHERE id = $${paramIndex}
        `;
        await sql.unsafe(updateQuery, values);
      }
    }

    // Return updated job
    const [job] = await sql`SELECT * FROM job_ads WHERE id = ${jobId}`;

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete job
export async function DELETE(
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

    // Check permission
    const { allowed } = await canManageJob(user.id, jobId);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'شما دسترسی حذف این آگهی را ندارید' },
        { status: 403 }
      );
    }

    // Check for pending applications
    const [pendingApps] = await sql`
      SELECT COUNT(*) as count FROM job_applications
      WHERE job_id = ${jobId}
        AND status NOT IN ('rejected', 'withdrawn', 'hired')
    `;

    if (parseInt(pendingApps.count) > 0) {
      // Don't delete, just close
      await sql`
        UPDATE job_ads
        SET status = 'closed', updated_at = NOW()
        WHERE id = ${jobId}
      `;

      return NextResponse.json({
        success: true,
        message: 'Job closed (has active applications)',
      });
    }

    // Delete job
    await sql`DELETE FROM job_ads WHERE id = ${jobId}`;

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Delete job error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
