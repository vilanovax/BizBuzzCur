/**
 * Quick Profile Creation API
 *
 * Creates a minimal, immediately shareable profile.
 *
 * Flow:
 * 1. Validate input
 * 2. Apply intent defaults
 * 3. Generate unique slug
 * 4. Create profile
 * 5. Return profile with share link
 */

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { nanoid } from 'nanoid';
import {
  type QuickProfileInput,
  PROFILE_INTENTS,
} from '@/types/profile';

/**
 * Generate a unique slug
 */
function generateSlug(displayName: string): string {
  // Create base from name
  const base = displayName
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '-')
    .slice(0, 20);

  // Add random suffix
  const suffix = nanoid(6);

  return `${base}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: QuickProfileInput = await request.json();

    // Validate required fields
    if (!body.intent || !body.display_name || !body.headline || !body.contact) {
      return NextResponse.json(
        { success: false, error: 'اطلاعات ناقص است' },
        { status: 400 }
      );
    }

    // Get intent configuration
    const intentConfig = PROFILE_INTENTS[body.intent];
    if (!intentConfig) {
      return NextResponse.json(
        { success: false, error: 'نوع پروفایل نامعتبر است' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = generateSlug(body.display_name);

    // Prepare contact fields based on type
    const contactFields: Record<string, string | null> = {
      email: null,
      phone: null,
      website: null,
    };

    if (body.contact_type === 'email') {
      contactFields.email = body.contact;
    } else if (body.contact_type === 'phone') {
      contactFields.phone = body.contact;
    } else {
      contactFields.website = body.contact;
    }

    // Create profile with intent defaults
    const [profile] = await sql`
      INSERT INTO profiles (
        user_id,
        slug,
        title,
        profile_type,
        template_id,
        full_name,
        headline,
        email,
        phone,
        website,
        photo_url,
        visibility,
        cta_type,
        is_public,
        is_active,
        is_primary,
        theme_color,
        schema_version
      ) VALUES (
        ${user.id},
        ${slug},
        ${body.display_name},
        ${intentConfig.defaults.profile_type},
        ${intentConfig.defaults.template_id},
        ${body.display_name},
        ${body.headline},
        ${contactFields.email},
        ${contactFields.phone},
        ${contactFields.website},
        ${body.photo_url || null},
        ${intentConfig.defaults.visibility},
        ${intentConfig.defaults.cta_type},
        true,
        true,
        false,
        '#2563eb',
        '1.0'
      )
      RETURNING
        id,
        slug,
        title,
        full_name,
        headline,
        profile_type,
        visibility,
        created_at
    `;

    // Check if this is user's first profile, make it primary
    const [profileCount] = await sql`
      SELECT COUNT(*) as count FROM profiles
      WHERE user_id = ${user.id} AND deleted_at IS NULL
    `;

    if (parseInt(profileCount.count) === 1) {
      await sql`
        UPDATE profiles SET is_primary = true
        WHERE id = ${profile.id}
      `;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        slug: profile.slug,
        title: profile.title,
        full_name: profile.full_name,
        headline: profile.headline,
        profile_type: profile.profile_type,
        visibility: profile.visibility,
        share_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/${profile.slug}`,
        created_at: profile.created_at,
      },
    });
  } catch (error) {
    console.error('Quick profile creation error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد پروفایل' },
      { status: 500 }
    );
  }
}
