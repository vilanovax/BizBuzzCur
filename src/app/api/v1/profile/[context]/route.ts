import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, hasAnyScope } from '@/lib/api/middleware/auth';
import sql from '@/lib/db';
import type { ProfileType } from '@/types/profile';

const VALID_CONTEXTS: ProfileType[] = ['business_card', 'resume', 'event'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ context: string }> }
) {
  try {
    const { context } = await params;

    // Validate context
    if (!VALID_CONTEXTS.includes(context as ProfileType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'invalid_context',
            message: `Invalid profile context. Valid values: ${VALID_CONTEXTS.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Authenticate request
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'unauthorized', message: auth.error },
        },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
      );
    }

    // Check scopes
    const requiredScopes = [
      'profile:read' as const,
      `profile:${context}:read` as const,
    ];

    if (!hasAnyScope(auth, requiredScopes as ['profile:read'])) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'insufficient_scope',
            message: `Required scope: profile:read or profile:${context}:read`,
          },
        },
        { status: 403 }
      );
    }

    // Fetch user's profile of the specified type
    const userId = auth.userId!;
    const [profile] = await sql`
      SELECT
        p.id, p.slug, p.title, p.profile_type, p.schema_version,
        p.full_name, p.headline, p.bio, p.photo_url, p.cover_url,
        p.job_title, p.company, p.industry,
        p.website, p.social_links, p.custom_fields,
        p.theme_color, p.is_public, p.view_count,
        p.created_at, p.updated_at
      FROM profiles p
      WHERE p.user_id = ${userId}
        AND p.profile_type = ${context}
        AND p.is_active = TRUE
      ORDER BY p.updated_at DESC
      LIMIT 1
    `;

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'not_found',
            message: `No ${context} profile found for this user`,
          },
        },
        { status: 404 }
      );
    }

    // Add contact info if scopes allow
    let contactInfo: Record<string, unknown> = {};

    if (auth.scopes?.includes('contact:email')) {
      const [emailData] = await sql`
        SELECT email FROM profiles WHERE id = ${profile.id}
      `;
      if (emailData?.email) {
        contactInfo.email = emailData.email;
      }
    }

    if (auth.scopes?.includes('contact:phone')) {
      const [phoneData] = await sql`
        SELECT phone FROM profiles WHERE id = ${profile.id}
      `;
      if (phoneData?.phone) {
        contactInfo.phone = phoneData.phone;
      }
    }

    if (auth.scopes?.includes('contact:address')) {
      const [addressData] = await sql`
        SELECT address, city, country FROM profiles WHERE id = ${profile.id}
      `;
      if (addressData) {
        contactInfo = {
          ...contactInfo,
          address: addressData.address,
          city: addressData.city,
          country: addressData.country,
        };
      }
    }

    // Fetch related data for resume profile
    let education: Record<string, unknown>[] = [];
    let experience: Record<string, unknown>[] = [];
    let skills: Record<string, unknown>[] = [];

    if (context === 'resume') {
      education = await sql`
        SELECT id, institution, degree, field_of_study, start_date, end_date, is_current, description
        FROM profile_education
        WHERE profile_id = ${profile.id}
        ORDER BY display_order ASC, start_date DESC
      `;

      experience = await sql`
        SELECT id, company, title, employment_type, location, start_date, end_date, is_current, description
        FROM profile_experience
        WHERE profile_id = ${profile.id}
        ORDER BY display_order ASC, start_date DESC
      `;

      skills = await sql`
        SELECT id, name, level
        FROM profile_skills
        WHERE profile_id = ${profile.id}
        ORDER BY display_order ASC
      `;
    }

    // Build response
    const responseData = {
      id: profile.id,
      slug: profile.slug,
      title: profile.title,
      profile_type: profile.profile_type,
      full_name: profile.full_name,
      headline: profile.headline,
      bio: profile.bio,
      photo_url: profile.photo_url,
      cover_url: profile.cover_url,
      job_title: profile.job_title,
      company: profile.company,
      industry: profile.industry,
      website: profile.website,
      social_links: profile.social_links,
      custom_fields: profile.custom_fields,
      theme_color: profile.theme_color,
      ...contactInfo,
      ...(context === 'resume' && {
        education,
        experience,
        skills,
      }),
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        schema_version: profile.schema_version,
        context,
        retrieved_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'server_error', message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
