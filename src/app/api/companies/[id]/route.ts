import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { UpdateCompanyRequest, CompanyRole } from '@/types/company';

// Helper to check user's role in company
async function getUserCompanyRole(userId: string, companyId: string): Promise<CompanyRole | null> {
  const [member] = await sql<[{ role: CompanyRole }]>`
    SELECT role FROM company_team_members
    WHERE company_id = ${companyId}
      AND user_id = ${userId}
      AND invitation_status = 'accepted'
  `;
  return member?.role || null;
}

// GET /api/companies/[id] - Get company details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const user = await getCurrentUser();

    const [company] = await sql`
      SELECT
        c.*,
        (SELECT COUNT(*) FROM company_team_members WHERE company_id = c.id AND invitation_status = 'accepted') as member_count,
        (SELECT COUNT(*) FROM company_departments WHERE company_id = c.id) as department_count,
        (SELECT COUNT(*) FROM job_ads WHERE company_id = c.id AND status = 'published') as active_jobs_count
      FROM companies c
      WHERE c.id = ${companyId}
    `;

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get user's role if logged in
    let userRole: CompanyRole | null = null;
    if (user) {
      userRole = await getUserCompanyRole(user.id, companyId);
    }

    // Increment view count (if not a team member)
    if (!userRole) {
      await sql`
        UPDATE companies
        SET total_views = total_views + 1
        WHERE id = ${companyId}
      `;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...company,
        user_role: userRole,
      },
    });
  } catch (error) {
    console.error('Get company error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get company' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] - Update company
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

    const { id: companyId } = await params;

    // Check user permission
    const userRole = await getUserCompanyRole(user.id, companyId);
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'شما دسترسی ویرایش این شرکت را ندارید' },
        { status: 403 }
      );
    }

    const body: UpdateCompanyRequest = await request.json();

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number | boolean | null | string[])[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'tagline', 'description', 'industry', 'company_size',
      'founded_year', 'company_type', 'website', 'email', 'phone',
      'address', 'city', 'country', 'logo_url', 'cover_image_url',
      'brand_color', 'linkedin_url', 'twitter_url', 'instagram_url',
      'telegram_url', 'ceo_name', 'ceo_message', 'vision', 'mission',
      'core_values', 'is_hiring', 'show_in_directory'
    ];

    for (const field of allowedFields) {
      const value = body[field as keyof UpdateCompanyRequest];
      if (field in body && value !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(value ?? null);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(companyId);
    const updateQuery = `
      UPDATE companies
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const [company] = await sql.unsafe(updateQuery, values);

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] - Delete company (only owner)
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

    const { id: companyId } = await params;

    // Only owner can delete
    const userRole = await getUserCompanyRole(user.id, companyId);
    if (userRole !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'فقط مالک شرکت میتواند آن را حذف کند' },
        { status: 403 }
      );
    }

    // Check for active jobs
    const [activeJobs] = await sql`
      SELECT COUNT(*) as count FROM job_ads
      WHERE company_id = ${companyId}
        AND status IN ('published', 'paused')
    `;

    if (parseInt(activeJobs.count) > 0) {
      return NextResponse.json(
        { success: false, error: 'لطفاً ابتدا آگهی‌های فعال را ببندید' },
        { status: 400 }
      );
    }

    // Delete company (cascades to team members, jobs, etc.)
    await sql`DELETE FROM companies WHERE id = ${companyId}`;

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    console.error('Delete company error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}
