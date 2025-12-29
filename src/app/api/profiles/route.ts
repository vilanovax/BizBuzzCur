import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { nanoid } from 'nanoid';
import type {
  Profile,
  CreateProfileInput,
  ProfileType,
  ProfileVisibility,
  PhoneVisibility,
  EmailVisibility,
  CTAType,
  TemplateId,
} from '@/types/profile';

// GET /api/profiles - List user's profiles
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
    const type = searchParams.get('type') as ProfileType | null;
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query conditions
    let profiles: Profile[];

    if (type && active !== null) {
      profiles = await sql<Profile[]>`
        SELECT * FROM profiles
        WHERE user_id = ${user.id}
          AND profile_type = ${type}
          AND is_active = ${active === 'true'}
          AND deleted_at IS NULL
        ORDER BY updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (type) {
      profiles = await sql<Profile[]>`
        SELECT * FROM profiles
        WHERE user_id = ${user.id}
          AND profile_type = ${type}
          AND deleted_at IS NULL
        ORDER BY updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (active !== null) {
      profiles = await sql<Profile[]>`
        SELECT * FROM profiles
        WHERE user_id = ${user.id}
          AND is_active = ${active === 'true'}
          AND deleted_at IS NULL
        ORDER BY updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      profiles = await sql<Profile[]>`
        SELECT * FROM profiles
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
        ORDER BY updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Get total count (excluding deleted)
    const [{ count }] = await sql<[{ count: number }]>`
      SELECT COUNT(*) as count FROM profiles WHERE user_id = ${user.id} AND deleted_at IS NULL
    `;

    return NextResponse.json({
      success: true,
      data: profiles,
      meta: {
        total: Number(count),
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('List profiles error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list profiles' },
      { status: 500 }
    );
  }
}

// Helper to map field visibility to phone/email visibility
// FieldVisibility uses 'public' but DB uses 'full'
function mapToContactVisibility(visibility: string | undefined): PhoneVisibility {
  if (visibility === 'public' || visibility === 'full') return 'full';
  if (visibility === 'masked') return 'masked';
  if (visibility === 'after_connect') return 'after_connect';
  if (visibility === 'hidden') return 'hidden';
  return 'full'; // default
}

// POST /api/profiles - Create new profile
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateProfileInput = await request.json();

    // Validate required fields
    if (!body.title || !body.profile_type) {
      return NextResponse.json(
        { success: false, error: 'Title and profile_type are required' },
        { status: 400 }
      );
    }

    // Generate short, clean slug (8 chars alphanumeric)
    const slug = nanoid(8);

    // Create profile
    const [profile] = await sql<Profile[]>`
      INSERT INTO profiles (
        user_id,
        slug,
        title,
        profile_type,
        template_id,
        full_name,
        headline,
        bio,
        email,
        phone,
        website,
        job_title,
        company,
        social_links,
        theme_color,
        is_public,
        visibility,
        phone_visibility,
        email_visibility,
        cta_type,
        cta_url,
        internal_notes,
        expires_at,
        schema_version
      ) VALUES (
        ${user.id},
        ${slug},
        ${body.title},
        ${body.profile_type},
        ${(body.template_id as TemplateId) || null},
        ${body.full_name || user.first_name + ' ' + (user.last_name || '')},
        ${body.headline || null},
        ${body.bio || null},
        ${body.email || user.email || null},
        ${body.phone || user.mobile || null},
        ${body.website || null},
        ${body.job_title || null},
        ${body.company || null},
        ${JSON.stringify(body.social_links || {})},
        ${body.theme_color || '#2563eb'},
        ${body.is_public !== false},
        ${(body.visibility as ProfileVisibility) || 'public'},
        ${mapToContactVisibility(body.phone_visibility)},
        ${mapToContactVisibility(body.email_visibility)},
        ${(body.cta_type as CTAType) || 'connect'},
        ${body.cta_url || null},
        ${body.internal_notes || null},
        ${body.expires_at ? new Date(body.expires_at) : null},
        '1.0'
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: profile,
    }, { status: 201 });
  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}
