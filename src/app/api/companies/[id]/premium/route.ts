/**
 * Company Premium Status API
 *
 * Returns premium tier and feature access for a company.
 *
 * Security:
 * - Only accessible by company team members
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';
import {
  getCompanyPremiumStatus,
  getUpgradeRecommendation,
  canPostMoreJobs,
} from '@/lib/services/premium.service';

// Check if user is a team member
async function isTeamMember(userId: string, companyId: string): Promise<boolean> {
  const [result] = await sql`
    SELECT 1 FROM company_team_members
    WHERE company_id = ${companyId}
      AND user_id = ${userId}
      AND invitation_status = 'accepted'
  `;
  return !!result;
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

    // Check if user is a team member
    const isMember = await isTeamMember(user.id, companyId);
    if (!isMember) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    // Get premium status
    const status = await getCompanyPremiumStatus(companyId);

    // Get upgrade recommendation
    const upgrade = await getUpgradeRecommendation(companyId);

    // Get job posting capacity
    const jobCapacity = await canPostMoreJobs(companyId);

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        upgrade,
        jobCapacity,
      },
    });
  } catch (error) {
    console.error('Premium status error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
