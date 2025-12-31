/**
 * Team Fit Insights API
 *
 * Returns aggregated team-level insights for hiring managers.
 *
 * Security:
 * - Only accessible by company team members (owner, admin, recruiter)
 * - Returns aggregated data only - no individual exposure
 * - Never returns raw signals or personality data
 *
 * Privacy:
 * - Minimum team size enforced (3+)
 * - Individual signals never exposed
 * - Aggregated statistics only
 */

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  analyzeTeamFit,
  buildTeamFitJobContext,
  type TeamMemberSignals,
} from '@/lib/services/team-fit.service';
import {
  getTeamFitDepth,
  filterTeamFitInsights,
} from '@/lib/services/premium.service';
import type { Signal } from '@/modules/personality-engine/contracts/signal.schema';

// Check if user can view team insights for this job
async function canViewTeamInsights(userId: string, jobId: string): Promise<boolean> {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: jobId, applicationId } = await params;

    // Permission check
    const canView = await canViewTeamInsights(user.id, jobId);
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    // Get application and job details
    const [application] = await sql`
      SELECT
        ja.id,
        ja.applicant_id,
        j.title as job_title,
        j.company_id,
        j.location_type,
        c.company_size,
        -- Candidate's signals
        p.personality_signals as candidate_signals
      FROM job_applications ja
      JOIN job_ads j ON j.id = ja.job_id
      JOIN companies c ON c.id = j.company_id
      LEFT JOIN LATERAL (
        SELECT personality_signals
        FROM profiles
        WHERE user_id = ja.applicant_id AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1
      ) p ON true
      WHERE ja.id = ${applicationId} AND ja.job_id = ${jobId}
    `;

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'درخواست یافت نشد' },
        { status: 404 }
      );
    }

    // Get team members with their signals (aggregated, never exposed individually)
    // Only get members who have completed workstyle assessment
    const teamMembersData = await sql`
      SELECT
        ctm.user_id,
        ctm.role,
        p.personality_signals
      FROM company_team_members ctm
      JOIN LATERAL (
        SELECT personality_signals
        FROM profiles
        WHERE user_id = ctm.user_id AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1
      ) p ON true
      WHERE ctm.company_id = ${application.company_id}
        AND ctm.invitation_status = 'accepted'
        AND p.personality_signals IS NOT NULL
        AND jsonb_array_length(p.personality_signals) > 0
    `;

    // Parse team members' signals
    const teamMembers: TeamMemberSignals[] = teamMembersData.map(member => {
      let signals: Signal[] = [];
      if (member.personality_signals) {
        try {
          signals = typeof member.personality_signals === 'string'
            ? JSON.parse(member.personality_signals)
            : member.personality_signals;
        } catch {
          signals = [];
        }
      }
      return {
        signals,
        role: member.role,
      };
    });

    // Parse candidate signals
    let candidateSignals: Signal[] = [];
    if (application.candidate_signals) {
      try {
        candidateSignals = typeof application.candidate_signals === 'string'
          ? JSON.parse(application.candidate_signals)
          : application.candidate_signals;
      } catch {
        candidateSignals = [];
      }
    }

    // Build job context
    const jobContext = buildTeamFitJobContext({
      title: application.job_title,
      location_type: application.location_type,
      company_size: application.company_size,
    });

    // Analyze team fit
    let result = analyzeTeamFit(candidateSignals, teamMembers, jobContext);

    // Apply premium filtering based on company tier
    const teamFitDepth = await getTeamFitDepth(application.company_id);
    result = filterTeamFitInsights(result, teamFitDepth);

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        depth: teamFitDepth,
        isPremiumLimited: teamFitDepth === 'summary',
      },
    });
  } catch (error) {
    console.error('Team fit insights error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
