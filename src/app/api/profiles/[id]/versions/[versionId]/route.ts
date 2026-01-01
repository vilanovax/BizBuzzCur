import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  getProfileVersionById,
  updateProfileVersion,
  deleteProfileVersion,
  setDefaultVersion,
} from '@/lib/services/profile-version.service';
import type { UpdateProfileVersionRequest } from '@/types/profile-version';

interface RouteParams {
  params: Promise<{ id: string; versionId: string }>;
}

/**
 * GET /api/profiles/[id]/versions/[versionId]
 * Get a specific profile version
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId, versionId } = await params;
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

    const version = await getProfileVersionById(versionId);

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    // Verify version belongs to this profile
    if (version.profile_id !== profileId) {
      return NextResponse.json(
        { success: false, error: 'Version does not belong to this profile' },
        { status: 403 }
      );
    }

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
    console.error('Get profile version error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get profile version' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profiles/[id]/versions/[versionId]
 * Update a profile version
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId, versionId } = await params;
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

    // Get existing version
    const existingVersion = await getProfileVersionById(versionId);
    if (!existingVersion) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    if (existingVersion.profile_id !== profileId) {
      return NextResponse.json(
        { success: false, error: 'Version does not belong to this profile' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate context if provided
    if (body.context) {
      const validContexts = ['public', 'network', 'team', 'investor', 'job', 'custom'];
      if (!validContexts.includes(body.context)) {
        return NextResponse.json(
          { success: false, error: 'Invalid context' },
          { status: 400 }
        );
      }
    }

    // Validate slug if provided and changed
    if (body.slug && body.slug !== existingVersion.slug) {
      const [existingSlug] = await sql`
        SELECT id FROM profile_versions
        WHERE profile_id = ${profileId}
          AND slug = ${body.slug}
          AND id != ${versionId}
      `;
      if (existingSlug) {
        return NextResponse.json(
          { success: false, error: 'Slug already in use' },
          { status: 400 }
        );
      }
    }

    const updateRequest: UpdateProfileVersionRequest = {
      name: body.name,
      context: body.context,
      visibility_rules: body.visibility_rules,
      emphasis_rules: body.emphasis_rules,
      ordering_rules: body.ordering_rules,
      slug: body.slug,
      is_default: body.is_default,
      expires_at: body.expires_at,
    };

    const version = await updateProfileVersion(versionId, updateRequest);

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Failed to update version' },
        { status: 500 }
      );
    }

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
    console.error('Update profile version error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile version' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profiles/[id]/versions/[versionId]
 * Delete a profile version
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId, versionId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check profile ownership
    const [profile] = await sql<[{ user_id: string }]>`
      SELECT user_id FROM profiles
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

    // Get existing version
    const existingVersion = await getProfileVersionById(versionId);
    if (!existingVersion) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    if (existingVersion.profile_id !== profileId) {
      return NextResponse.json(
        { success: false, error: 'Version does not belong to this profile' },
        { status: 403 }
      );
    }

    try {
      await deleteProfileVersion(versionId);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Cannot delete the default version') {
        return NextResponse.json(
          { success: false, error: 'نسخه پیش‌فرض قابل حذف نیست' },
          { status: 400 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      message: 'Version deleted successfully',
    });
  } catch (error) {
    console.error('Delete profile version error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete profile version' },
      { status: 500 }
    );
  }
}
