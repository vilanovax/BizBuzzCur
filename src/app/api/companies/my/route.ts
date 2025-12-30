import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/companies/my - List companies the user is a member of
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all companies where user is a team member
    const companies = await sql`
      SELECT
        c.*,
        ctm.role as user_role,
        ctm.joined_at,
        (SELECT COUNT(*) FROM company_team_members WHERE company_id = c.id AND invitation_status = 'accepted') as member_count,
        (SELECT COUNT(*) FROM company_departments WHERE company_id = c.id) as department_count,
        (SELECT COUNT(*) FROM job_ads WHERE company_id = c.id AND status = 'published') as active_jobs_count
      FROM companies c
      JOIN company_team_members ctm ON ctm.company_id = c.id
      WHERE ctm.user_id = ${user.id}
        AND ctm.invitation_status = 'accepted'
      ORDER BY
        CASE ctm.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'recruiter' THEN 3
          ELSE 4
        END,
        c.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error('Get my companies error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get companies' },
      { status: 500 }
    );
  }
}
