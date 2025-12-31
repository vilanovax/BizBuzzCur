/**
 * Job Match API
 *
 * Returns "Why this job?" insights for the current user.
 * Uses personality signals if available, falls back to skills/domain.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';
import { matchJob, findMatchingSkills } from '@/lib/services/job-match.service';
import type { Signal } from '@/modules/personality-engine/contracts/signal.schema';
import type { JobAdWithDetails } from '@/types/job';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // Get current user (optional - works for anonymous too)
    const user = await getCurrentUser();
    const userId = user?.id;

    // Fetch job details
    const [job] = await sql<JobAdWithDetails[]>`
      SELECT
        ja.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'logo_url', c.logo_url,
          'slug', c.slug
        ) as company,
        CASE
          WHEN ja.domain_id IS NOT NULL THEN
            json_build_object(
              'id', d.id,
              'name_fa', d.name_fa,
              'name_en', d.name_en
            )
          ELSE NULL
        END as domain
      FROM job_ads ja
      LEFT JOIN companies c ON ja.company_id = c.id
      LEFT JOIN domains d ON ja.domain_id = d.id
      WHERE ja.id = ${jobId}
        AND ja.status = 'published'
    `;

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'آگهی یافت نشد' },
        { status: 404 }
      );
    }

    // If user is not logged in, return generic match
    if (!userId) {
      const result = matchJob(null, job);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Fetch user's signals and skills
    const [userProfile] = await sql<{ skills: string[]; personality_signals: Signal[] | null }[]>`
      SELECT
        COALESCE(p.skills, ARRAY[]::text[]) as skills,
        p.personality_signals
      FROM profiles p
      WHERE p.user_id = ${userId}
        AND p.is_primary = true
      LIMIT 1
    `;

    // Get user's personality signals
    const userSignals = userProfile?.personality_signals || null;
    const userSkills = userProfile?.skills || [];

    // Find matching skills
    const matchingSkills = findMatchingSkills(
      userSkills,
      job.required_skills || [],
      job.preferred_skills || []
    );

    // Get match result
    const result = matchJob(userSignals, job, matchingSkills);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Job match error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
