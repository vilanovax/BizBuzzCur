import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getExecutiveDashboardData } from '@/lib/services/executive-dashboard.service';
import type { CompanyRole } from '@/types/company';

/**
 * GET /api/companies/[id]/job-quality
 *
 * Executive Job Quality Dashboard API
 *
 * Permissions:
 * - Company Owner
 * - Company Admin
 *
 * Not visible to recruiters by default.
 */

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

    const { id: companyId } = await params;

    // Check user permission (owner or admin only)
    const userRole = await getUserCompanyRole(user.id, companyId);
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'شما دسترسی به این بخش را ندارید' },
        { status: 403 }
      );
    }

    // Get time range from query params (default 30 days)
    const { searchParams } = new URL(request.url);
    const timeRangeParam = searchParams.get('timeRange');
    let timeRange: 30 | 60 | 90 = 30;
    if (timeRangeParam === '60') timeRange = 60;
    else if (timeRangeParam === '90') timeRange = 90;

    // Get dashboard data
    const dashboardData = await getExecutiveDashboardData(companyId, timeRange);

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Get job quality dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get dashboard data' },
      { status: 500 }
    );
  }
}
