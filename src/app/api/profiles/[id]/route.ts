import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type {
  Profile,
  UpdateProfileInput,
  ProfileVisibility,
  PhoneVisibility,
  EmailVisibility,
  CTAType,
  TemplateId,
} from '@/types/profile';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/profiles/[id] - Get single profile
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [profile] = await sql<Profile[]>`
      SELECT * FROM profiles
      WHERE id = ${id} AND user_id = ${user.id}
      LIMIT 1
    `;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

// PUT /api/profiles/[id] - Update profile
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check ownership
    const [existing] = await sql<Profile[]>`
      SELECT id FROM profiles WHERE id = ${id} AND user_id = ${user.id}
    `;

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    const body: UpdateProfileInput = await request.json();

    // Build update query dynamically
    const [profile] = await sql<Profile[]>`
      UPDATE profiles SET
        title = COALESCE(${body.title ?? null}, title),
        template_id = COALESCE(${(body.template_id as TemplateId) ?? null}, template_id),
        full_name = COALESCE(${body.full_name ?? null}, full_name),
        headline = COALESCE(${body.headline ?? null}, headline),
        bio = COALESCE(${body.bio ?? null}, bio),
        photo_url = COALESCE(${body.photo_url ?? null}, photo_url),
        cover_url = COALESCE(${body.cover_url ?? null}, cover_url),
        email = COALESCE(${body.email ?? null}, email),
        phone = COALESCE(${body.phone ?? null}, phone),
        website = COALESCE(${body.website ?? null}, website),
        address = COALESCE(${body.address ?? null}, address),
        city = COALESCE(${body.city ?? null}, city),
        country = COALESCE(${body.country ?? null}, country),
        job_title = COALESCE(${body.job_title ?? null}, job_title),
        company = COALESCE(${body.company ?? null}, company),
        industry = COALESCE(${body.industry ?? null}, industry),
        social_links = COALESCE(${body.social_links ? JSON.stringify(body.social_links) : null}, social_links),
        custom_fields = COALESCE(${body.custom_fields ? JSON.stringify(body.custom_fields) : null}, custom_fields),
        theme_color = COALESCE(${body.theme_color ?? null}, theme_color),
        is_public = COALESCE(${body.is_public ?? null}, is_public),
        visibility = COALESCE(${(body.visibility as ProfileVisibility) ?? null}, visibility),
        phone_visibility = COALESCE(${(body.phone_visibility as PhoneVisibility) ?? null}, phone_visibility),
        email_visibility = COALESCE(${(body.email_visibility as EmailVisibility) ?? null}, email_visibility),
        cta_type = COALESCE(${(body.cta_type as CTAType) ?? null}, cta_type),
        cta_url = COALESCE(${body.cta_url ?? null}, cta_url),
        internal_notes = COALESCE(${body.internal_notes ?? null}, internal_notes),
        expires_at = COALESCE(${body.expires_at ? new Date(body.expires_at) : null}, expires_at),
        resume_file_url = COALESCE(${body.resume_file_url ?? null}, resume_file_url),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/profiles/[id] - Delete profile
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check ownership and delete
    const [deleted] = await sql<Profile[]>`
      DELETE FROM profiles
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully',
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
}
