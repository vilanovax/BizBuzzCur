/**
 * Candidate Match API
 *
 * Returns "Why this candidate?" fit insights for hiring teams.
 *
 * Security:
 * - Only accessible by job admins (owner, admin, recruiter)
 * - Never returns raw signals or personality data
 * - Returns qualitative insights only
 */

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  matchCandidate,
  buildJobContextForCandidate,
  type CandidateContext,
} from '@/lib/services/candidate-match.service';
import {
  getCandidateInsightsDepth,
  filterCandidateInsights,
} from '@/lib/services/premium.service';
import type { Signal } from '@/modules/personality-engine/contracts/signal.schema';

// Check if user can view applications for this job
async function canViewApplications(userId: string, jobId: string): Promise<boolean> {
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
    const canView = await canViewApplications(user.id, jobId);
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    // Get application with applicant's profile and signals
    const [application] = await sql`
      SELECT
        ja.id,
        ja.cover_message,
        ja.applicant_id,
        -- Job info for context
        j.title as job_title,
        j.location_type,
        j.required_skills,
        j.company_id,
        -- Company info for context
        c.company_size,
        -- Applicant's profile and signals
        p.personality_signals,
        p.skills
      FROM job_applications ja
      JOIN job_ads j ON j.id = ja.job_id
      JOIN companies c ON c.id = j.company_id
      LEFT JOIN profiles p ON p.user_id = ja.applicant_id AND p.is_primary = true
      WHERE ja.id = ${applicationId} AND ja.job_id = ${jobId}
    `;

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'درخواست یافت نشد' },
        { status: 404 }
      );
    }

    // Build job context
    const jobContext = buildJobContextForCandidate({
      title: application.job_title,
      location_type: application.location_type,
      company_size: application.company_size,
      required_skills: application.required_skills || [],
    });

    // Parse signals safely
    let signals: Signal[] = [];
    if (application.personality_signals) {
      try {
        signals = typeof application.personality_signals === 'string'
          ? JSON.parse(application.personality_signals)
          : application.personality_signals;
      } catch {
        // If parsing fails, treat as no signals
        signals = [];
      }
    }

    // Get matching skills
    const candidateSkills: string[] = application.skills || [];
    const jobSkills: string[] = application.required_skills || [];
    const matchingSkills = candidateSkills.filter((skill: string) =>
      jobSkills.some(jobSkill =>
        skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    // Build candidate context
    const candidateContext: CandidateContext = {
      signals,
      matchingSkills,
      hasCoverMessage: !!application.cover_message,
    };

    // Generate fit result
    let fitResult = matchCandidate(candidateContext, jobContext);

    // Apply premium filtering based on company tier
    const insightsDepth = await getCandidateInsightsDepth(application.company_id);
    fitResult = filterCandidateInsights(fitResult, insightsDepth);

    return NextResponse.json({
      success: true,
      data: fitResult,
      meta: {
        depth: insightsDepth,
        isPremiumLimited: insightsDepth === 'basic',
      },
    });
  } catch (error) {
    console.error('Candidate match error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
