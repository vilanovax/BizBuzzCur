import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { nanoid } from 'nanoid';
import type { Profile } from '@/types/profile';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/profiles/[id]/duplicate - Duplicate a profile
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get original profile
    const [original] = await sql<Profile[]>`
      SELECT * FROM profiles
      WHERE id = ${id} AND user_id = ${user.id}
      LIMIT 1
    `;

    if (!original) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Generate new slug
    const baseSlug = original.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 30);
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Create duplicate
    const [duplicate] = await sql<Profile[]>`
      INSERT INTO profiles (
        user_id,
        slug,
        title,
        profile_type,
        template_id,
        full_name,
        headline,
        bio,
        photo_url,
        cover_url,
        email,
        phone,
        website,
        address,
        city,
        country,
        job_title,
        company,
        industry,
        social_links,
        custom_fields,
        theme_color,
        is_public,
        visibility,
        phone_visibility,
        email_visibility,
        cta_type,
        cta_url,
        internal_notes,
        schema_version
      )
      SELECT
        user_id,
        ${slug},
        ${original.title + ' (کپی)'},
        profile_type,
        template_id,
        full_name,
        headline,
        bio,
        photo_url,
        cover_url,
        email,
        phone,
        website,
        address,
        city,
        country,
        job_title,
        company,
        industry,
        social_links,
        custom_fields,
        theme_color,
        false, -- is_public: duplicates start as drafts
        visibility,
        phone_visibility,
        email_visibility,
        cta_type,
        cta_url,
        internal_notes,
        schema_version
      FROM profiles WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: duplicate,
    }, { status: 201 });
  } catch (error) {
    console.error('Duplicate profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to duplicate profile' },
      { status: 500 }
    );
  }
}
