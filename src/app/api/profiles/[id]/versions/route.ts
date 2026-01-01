import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  getProfileVersions,
  createProfileVersion,
} from '@/lib/services/profile-version.service';
import type { CreateProfileVersionRequest } from '@/types/profile-version';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/profiles/[id]/versions
 * Get all versions for a profile
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const [profile] = await sql<[{ user_id: string; slug: string }]>`
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

    const versions = await getProfileVersions(profileId);

    // Add computed share URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bizbuzz.me';
    const versionsWithUrls = versions.map((v) => ({
      ...v,
      share_url: v.slug ? `${appUrl}/${profile.slug}/${v.slug}` : null,
    }));

    return NextResponse.json({
      success: true,
      data: versionsWithUrls,
    });
  } catch (error) {
    console.error('Get profile versions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get profile versions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profiles/[id]/versions
 * Create a new profile version
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
    const [profile] = await sql<[{ user_id: string; slug: string }]>`
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

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.context) {
      return NextResponse.json(
        { success: false, error: 'Name and context are required' },
        { status: 400 }
      );
    }

    // Validate context
    const validContexts = ['public', 'network', 'team', 'investor', 'job', 'custom'];
    if (!validContexts.includes(body.context)) {
      return NextResponse.json(
        { success: false, error: 'Invalid context' },
        { status: 400 }
      );
    }

    // Validate slug if provided
    if (body.slug) {
      // Check if slug is already used for this profile
      const [existingSlug] = await sql`
        SELECT id FROM profile_versions
        WHERE profile_id = ${profileId}
          AND slug = ${body.slug}
      `;
      if (existingSlug) {
        return NextResponse.json(
          { success: false, error: 'Slug already in use' },
          { status: 400 }
        );
      }
    }

    const createRequest: CreateProfileVersionRequest = {
      profile_id: profileId,
      name: body.name,
      context: body.context,
      visibility_rules: body.visibility_rules,
      emphasis_rules: body.emphasis_rules,
      ordering_rules: body.ordering_rules,
      slug: body.slug,
      is_default: body.is_default,
      expires_at: body.expires_at,
    };

    const version = await createProfileVersion(createRequest);

    // Add computed share URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bizbuzz.me';
    const versionWithUrl = {
      ...version,
      share_url: version.slug ? `${appUrl}/${profile.slug}/${version.slug}` : null,
    };

    return NextResponse.json({
      success: true,
      data: versionWithUrl,
    });
  } catch (error) {
    console.error('Create profile version error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create profile version' },
      { status: 500 }
    );
  }
}
