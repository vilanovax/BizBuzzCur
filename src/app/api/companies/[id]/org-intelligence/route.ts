/**
 * Org-Level Intelligence API
 *
 * Returns aggregated organizational insights for company owners/admins.
 *
 * Security:
 * - Only accessible by company owners and admins
 * - Never returns individual data
 * - Returns aggregated unit-level insights only
 *
 * Privacy:
 * - Minimum sample size enforced (5+)
 * - Individual signals never exposed
 * - Aggregated statistics only
 */

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  analyzeOrgIntelligence,
  buildMemberData,
} from '@/lib/services/org-intelligence.service';
import type { OrgContext } from '@/types/org-intelligence';
import type { Signal } from '@/modules/personality-engine/contracts/signal.schema';

// Check if user can view org insights for this company
async function canViewOrgInsights(
  userId: string,
  companyId: string
): Promise<boolean> {
  const [result] = await sql`
    SELECT 1 FROM company_team_members
    WHERE company_id = ${companyId}
      AND user_id = ${userId}
      AND invitation_status = 'accepted'
      AND role IN ('owner', 'admin')
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

    // Permission check - only owners and admins
    const canView = await canViewOrgInsights(user.id, companyId);
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    // Get company info for context
    const [company] = await sql`
      SELECT id, name, company_size, industry
      FROM companies
      WHERE id = ${companyId}
    `;

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'شرکت یافت نشد' },
        { status: 404 }
      );
    }

    // Get all team members with their signals and department info
    // IMPORTANT: We only use aggregated data, never expose individual signals
    const teamMembersData = await sql`
      SELECT
        ctm.user_id,
        ctm.department_id,
        cd.name as department_name,
        p.personality_signals
      FROM company_team_members ctm
      LEFT JOIN company_departments cd ON cd.id = ctm.department_id
      LEFT JOIN profiles p ON p.user_id = ctm.user_id AND p.is_primary = true
      WHERE ctm.company_id = ${companyId}
        AND ctm.invitation_status = 'accepted'
        AND p.personality_signals IS NOT NULL
        AND jsonb_array_length(p.personality_signals) > 0
    `;

    // Build member data grouped by unit
    const membersByUnit = buildMemberData(teamMembersData as unknown as Array<{
      user_id: string;
      department_id: string | null;
      department_name: string | null;
      personality_signals: Signal[] | string | null;
    }>);

    // Build org context
    const orgContext: OrgContext = {
      companyId: company.id,
      companyName: company.name,
      companySize: company.company_size,
      industry: company.industry,
    };

    // Analyze org intelligence
    const result = analyzeOrgIntelligence(membersByUnit, orgContext);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Org intelligence error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
