import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/jobs/discover - Contextual job discovery based on user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const domainId = searchParams.get('domain_id');
    const specializationId = searchParams.get('specialization_id');
    const employmentType = searchParams.get('employment_type');
    const locationType = searchParams.get('location_type');
    const experienceLevel = searchParams.get('experience_level');

    // Get user's profile info for matching
    const [userProfile] = await sql`
      SELECT
        p.domain_id,
        p.skills,
        p.specialization_id,
        p.city,
        p.country
      FROM profiles p
      WHERE p.user_id = ${user.id} AND p.is_primary = true
    `;

    // Get events user has participated in (for context-based discovery)
    const userEventIds = await sql`
      SELECT DISTINCT e.id
      FROM events e
      JOIN event_participants ep ON ep.event_id = e.id
      WHERE ep.user_id = ${user.id}
    `;
    const eventIds = userEventIds.map(e => e.id);

    // Build filter conditions
    let filters = sql``;

    if (domainId) {
      filters = sql`${filters} AND j.domain_id = ${domainId}`;
    }
    if (specializationId) {
      filters = sql`${filters} AND j.specialization_id = ${specializationId}`;
    }
    if (employmentType) {
      filters = sql`${filters} AND j.employment_type = ${employmentType}`;
    }
    if (locationType) {
      filters = sql`${filters} AND j.location_type = ${locationType}`;
    }
    if (experienceLevel) {
      filters = sql`${filters} AND j.experience_level = ${experienceLevel}`;
    }

    // Get jobs with relevance scoring
    const jobs = await sql`
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
        d.name_fa as domain_name,
        d.name_en as domain_name_en,
        s.name_fa as specialization_name,
        s.name_en as specialization_name_en,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as application_count,
        -- Check if user already applied
        EXISTS(
          SELECT 1 FROM job_applications ja
          WHERE ja.job_id = j.id AND ja.applicant_id = ${user.id}
        ) as has_applied,
        -- Relevance scoring
        CASE
          -- Same domain gets higher score
          WHEN j.domain_id = ${userProfile?.domain_id || null} THEN 30
          ELSE 0
        END +
        CASE
          -- Same specialization gets higher score
          WHEN j.specialization_id = ${userProfile?.specialization_id || null} THEN 20
          ELSE 0
        END +
        CASE
          -- Same city gets higher score
          WHEN j.location ILIKE ${'%' + (userProfile?.city || '') + '%'} THEN 10
          ELSE 0
        END +
        CASE
          -- Event-related jobs get higher score
          WHEN j.event_id = ANY(${eventIds.length > 0 ? eventIds : ['00000000-0000-0000-0000-000000000000']}) THEN 25
          ELSE 0
        END +
        CASE
          -- Featured jobs get higher score
          WHEN j.is_featured = true THEN 15
          ELSE 0
        END +
        CASE
          -- Recently posted gets higher score
          WHEN j.published_at > NOW() - INTERVAL '7 days' THEN 10
          WHEN j.published_at > NOW() - INTERVAL '30 days' THEN 5
          ELSE 0
        END as relevance_score,
        -- Match reason flags
        j.domain_id = ${userProfile?.domain_id || null} as matches_domain,
        j.specialization_id = ${userProfile?.specialization_id || null} as matches_specialization,
        j.event_id = ANY(${eventIds.length > 0 ? eventIds : ['00000000-0000-0000-0000-000000000000']}) as from_event
      FROM job_ads j
      JOIN companies c ON c.id = j.company_id
      LEFT JOIN professional_domains d ON d.id = j.domain_id
      LEFT JOIN specializations s ON s.id = j.specialization_id
      WHERE j.status = 'published'
        AND (j.expires_at IS NULL OR j.expires_at > NOW())
        -- Exclude jobs from user's own companies
        AND NOT EXISTS (
          SELECT 1 FROM company_team_members ctm
          WHERE ctm.company_id = j.company_id
            AND ctm.user_id = ${user.id}
            AND ctm.invitation_status = 'accepted'
        )
        ${filters}
      ORDER BY relevance_score DESC, j.is_featured DESC, j.published_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count
    const [countResult] = await sql`
      SELECT COUNT(*) as total
      FROM job_ads j
      WHERE j.status = 'published'
        AND (j.expires_at IS NULL OR j.expires_at > NOW())
        AND NOT EXISTS (
          SELECT 1 FROM company_team_members ctm
          WHERE ctm.company_id = j.company_id
            AND ctm.user_id = ${user.id}
            AND ctm.invitation_status = 'accepted'
        )
        ${filters}
    `;

    return NextResponse.json({
      success: true,
      data: jobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        employment_type: job.employment_type,
        location_type: job.location_type,
        location: job.location,
        salary_range: job.salary_range,
        experience_level: job.experience_level,
        required_skills: job.required_skills,
        preferred_skills: job.preferred_skills,
        is_featured: job.is_featured,
        published_at: job.published_at,
        expires_at: job.expires_at,
        application_count: parseInt(job.application_count || '0'),
        has_applied: job.has_applied,
        relevance_score: job.relevance_score,
        match_reasons: {
          domain: job.matches_domain,
          specialization: job.matches_specialization,
          event: job.from_event,
        },
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
        domain: job.domain_name ? {
          name_fa: job.domain_name,
          name_en: job.domain_name_en,
        } : null,
        specialization: job.specialization_name ? {
          name_fa: job.specialization_name,
          name_en: job.specialization_name_en,
        } : null,
      })),
      pagination: {
        total: parseInt(countResult?.total || '0'),
        limit,
        offset,
        has_more: offset + jobs.length < parseInt(countResult?.total || '0'),
      },
      user_context: {
        domain_id: userProfile?.domain_id,
        specialization_id: userProfile?.specialization_id,
        skills: userProfile?.skills || [],
        event_count: eventIds.length,
      },
    });
  } catch (error) {
    console.error('Job discovery error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to discover jobs' },
      { status: 500 }
    );
  }
}
