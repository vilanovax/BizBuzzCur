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
        p.city,
        p.country,
        p.industry
      FROM profiles p
      WHERE p.user_id = ${user.id}
      ORDER BY p.created_at ASC
      LIMIT 1
    `;

    // Get events user has attended (for context-based discovery)
    const userEventIds = await sql`
      SELECT DISTINCT e.id
      FROM events e
      JOIN event_attendees ea ON ea.event_id = e.id
      WHERE ea.user_id = ${user.id}
        AND ea.status = 'approved'
    `;
    const eventIds = userEventIds.map(e => e.id);
    const hasEvents = eventIds.length > 0;

    // Build base query - simpler approach without dynamic relevance scoring in SQL
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
        EXISTS(
          SELECT 1 FROM job_applications ja
          WHERE ja.job_id = j.id AND ja.applicant_id = ${user.id}
        ) as has_applied
      FROM job_ads j
      JOIN companies c ON c.id = j.company_id
      LEFT JOIN professional_domains d ON d.id = j.domain_id
      LEFT JOIN specializations s ON s.id = j.specialization_id
      WHERE j.status = 'published'
        AND (j.expires_at IS NULL OR j.expires_at > NOW())
        AND NOT EXISTS (
          SELECT 1 FROM company_team_members ctm
          WHERE ctm.company_id = j.company_id
            AND ctm.user_id = ${user.id}
            AND ctm.invitation_status = 'accepted'
        )
        ${domainId ? sql`AND j.domain_id = ${domainId}` : sql``}
        ${specializationId ? sql`AND j.specialization_id = ${specializationId}` : sql``}
        ${employmentType ? sql`AND j.employment_type = ${employmentType}` : sql``}
        ${locationType ? sql`AND j.location_type = ${locationType}` : sql``}
        ${experienceLevel ? sql`AND j.experience_level = ${experienceLevel}` : sql``}
      ORDER BY j.is_featured DESC, j.published_at DESC
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
        ${domainId ? sql`AND j.domain_id = ${domainId}` : sql``}
        ${specializationId ? sql`AND j.specialization_id = ${specializationId}` : sql``}
        ${employmentType ? sql`AND j.employment_type = ${employmentType}` : sql``}
        ${locationType ? sql`AND j.location_type = ${locationType}` : sql``}
        ${experienceLevel ? sql`AND j.experience_level = ${experienceLevel}` : sql``}
    `;

    // Calculate relevance in JavaScript instead of SQL for simplicity
    const processedJobs = jobs.map(job => {
      let relevanceScore = 0;
      const matchReasons = {
        domain: false,
        specialization: false,
        event: false,
      };

      // City match
      if (userProfile?.city && job.location?.toLowerCase().includes(userProfile.city.toLowerCase())) {
        relevanceScore += 10;
      }

      // Industry match (using profile industry instead of domain)
      if (userProfile?.industry && job.company_industry?.toLowerCase() === userProfile.industry.toLowerCase()) {
        relevanceScore += 20;
        matchReasons.domain = true;
      }

      // Event match
      if (hasEvents && job.event_id && eventIds.includes(job.event_id)) {
        relevanceScore += 25;
        matchReasons.event = true;
      }

      // Featured
      if (job.is_featured) {
        relevanceScore += 15;
      }

      // Recent
      if (job.published_at) {
        const publishedAt = new Date(job.published_at);
        const daysSincePublished = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePublished <= 7) {
          relevanceScore += 10;
        } else if (daysSincePublished <= 30) {
          relevanceScore += 5;
        }
      }

      return {
        id: job.id,
        title: job.title,
        description: job.description,
        employment_type: job.employment_type,
        location_type: job.location_type,
        location: job.location,
        salary_range: job.salary_range,
        experience_level: job.experience_level,
        required_skills: job.required_skills || [],
        preferred_skills: job.preferred_skills || [],
        is_featured: job.is_featured,
        published_at: job.published_at,
        expires_at: job.expires_at,
        application_count: parseInt(job.application_count || '0'),
        has_applied: job.has_applied,
        relevance_score: relevanceScore,
        match_reasons: matchReasons,
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
      };
    });

    // Sort by relevance score
    processedJobs.sort((a, b) => b.relevance_score - a.relevance_score);

    return NextResponse.json({
      success: true,
      data: processedJobs,
      pagination: {
        total: parseInt(countResult?.total || '0'),
        limit,
        offset,
        has_more: offset + jobs.length < parseInt(countResult?.total || '0'),
      },
      user_context: {
        industry: userProfile?.industry,
        city: userProfile?.city,
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
