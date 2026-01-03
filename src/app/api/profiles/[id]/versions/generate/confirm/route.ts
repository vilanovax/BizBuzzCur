import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createProfileVersion } from '@/lib/services/profile-version.service';
import type { GeneratedVersionRules } from '@/types/version-generator';
import type { CreateProfileVersionRequest } from '@/types/profile-version';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/profiles/[id]/versions/generate/confirm
 * Confirm and create the AI-generated profile version
 *
 * Body: {
 *   rules: GeneratedVersionRules,
 *   modify?: boolean  // If true, rules have been modified by user
 * }
 *
 * Response: ProfileVersion (created version)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check profile ownership
    type ProfileRow = { user_id: string; slug: string };
    const [profile] = await sql<ProfileRow[]>`
      SELECT user_id, slug FROM profiles
      WHERE id = ${profileId} AND deleted_at IS NULL
    `;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const rules: GeneratedVersionRules = body.rules;
    const modified: boolean = body.modify || false;

    // Validate rules
    if (!rules) {
      return NextResponse.json(
        { success: false, error: 'rules is required' },
        { status: 400 }
      );
    }

    if (!rules.name) {
      return NextResponse.json(
        { success: false, error: 'Version name is required' },
        { status: 400 }
      );
    }

    if (!rules.context) {
      return NextResponse.json(
        { success: false, error: 'Version context is required' },
        { status: 400 }
      );
    }

    // Validate context
    const validContexts = ['public', 'network', 'team', 'investor', 'job', 'custom'];
    if (!validContexts.includes(rules.context)) {
      return NextResponse.json(
        { success: false, error: 'Invalid context' },
        { status: 400 }
      );
    }

    // Generate a unique slug for the version
    const slug = generateUniqueSlug(rules.name, rules.context);

    // Check if slug is already used
    type SlugRow = { id: string };
    const [existingSlug] = await sql<SlugRow[]>`
      SELECT id FROM profile_versions
      WHERE profile_id = ${profileId}
        AND slug = ${slug}
    `;

    // If slug exists, append a random suffix
    const finalSlug = existingSlug
      ? `${slug}-${Math.random().toString(36).substring(2, 6)}`
      : slug;

    // Prepare reasons - add modification note if modified
    const reasons = [...(rules.reasons || [])];
    if (modified) {
      reasons.push({
        type: 'ai_generated' as const,
        message: 'این نسخه توسط کاربر ویرایش شده است.',
      });
    }

    // Create the version
    const createRequest: CreateProfileVersionRequest = {
      profile_id: profileId,
      name: rules.name,
      context: rules.context,
      visibility_rules: rules.visibility_rules || [],
      emphasis_rules: rules.emphasis_rules || [],
      ordering_rules: rules.ordering_rules || [],
      slug: finalSlug,
      is_default: false,
    };

    const version = await createProfileVersion(createRequest);

    // Update with AI-generated reasons (createProfileVersion doesn't handle reasons)
    if (reasons.length > 0) {
      await sql`
        UPDATE profile_versions
        SET
          auto_generated = TRUE,
          reasons = ${JSON.stringify(reasons)}
        WHERE id = ${version.id}
      `;
    }

    // Add computed share URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bizbuzz.me';
    const versionWithUrl = {
      ...version,
      auto_generated: true,
      reasons,
      share_url: `${appUrl}/${profile.slug}/${finalSlug}`,
    };

    return NextResponse.json({
      success: true,
      data: versionWithUrl,
    });
  } catch (error) {
    console.error('Confirm version error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create version' },
      { status: 500 }
    );
  }
}

/**
 * Generate a URL-friendly slug from version name and context
 */
function generateUniqueSlug(name: string, context: string): string {
  // Context-based prefix
  const contextPrefix: Record<string, string> = {
    public: 'pub',
    network: 'net',
    team: 'team',
    investor: 'inv',
    job: 'job',
    custom: 'custom',
  };

  const prefix = contextPrefix[context] || 'v';

  // Simple transliteration for Persian characters
  const persianToLatin: Record<string, string> = {
    'ا': 'a', 'آ': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
    'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
    'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
    'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
    'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'و': 'v', 'ه': 'h', 'ی': 'y', 'ي': 'y', 'ة': 'h', 'ئ': 'y',
  };

  let slug = name
    .split('')
    .map((char) => persianToLatin[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 20);

  // If slug is empty, use timestamp
  if (!slug) {
    slug = Date.now().toString(36);
  }

  return `${prefix}-${slug}`;
}
