import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { UserSpecialization, SetUserSpecializationInput } from '@/types/professional';

// GET /api/user/professional/specializations - Get user's specializations
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const specializations = await sql<UserSpecialization[]>`
      SELECT us.*,
        json_build_object(
          'id', s.id,
          'domain_id', s.domain_id,
          'slug', s.slug,
          'name_en', s.name_en,
          'name_fa', s.name_fa,
          'description_en', s.description_en,
          'description_fa', s.description_fa,
          'display_order', s.display_order,
          'is_active', s.is_active
        ) as specialization
      FROM user_specializations us
      JOIN specializations s ON us.specialization_id = s.id
      WHERE us.user_id = ${user.id}
      ORDER BY s.display_order ASC
    `;

    return NextResponse.json({
      success: true,
      data: specializations,
    });
  } catch (error) {
    console.error('Get user specializations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user specializations' },
      { status: 500 }
    );
  }
}

// POST /api/user/professional/specializations - Add user's specialization
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SetUserSpecializationInput = await request.json();
    const { specialization_id, years_experience } = body;

    if (!specialization_id) {
      return NextResponse.json(
        { success: false, error: 'specialization_id is required' },
        { status: 400 }
      );
    }

    // Verify specialization exists
    const [specExists] = await sql`
      SELECT id FROM specializations WHERE id = ${specialization_id} AND is_active = true
    `;
    if (!specExists) {
      return NextResponse.json(
        { success: false, error: 'Specialization not found' },
        { status: 404 }
      );
    }

    // Upsert user specialization
    const [userSpec] = await sql<UserSpecialization[]>`
      INSERT INTO user_specializations (user_id, specialization_id, years_experience)
      VALUES (${user.id}, ${specialization_id}, ${years_experience ?? null})
      ON CONFLICT (user_id, specialization_id)
      DO UPDATE SET years_experience = ${years_experience ?? null}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: userSpec,
    });
  } catch (error) {
    console.error('Add user specialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add user specialization' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/professional/specializations - Remove user's specialization
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const specializationId = searchParams.get('specialization_id');

    if (!specializationId) {
      return NextResponse.json(
        { success: false, error: 'specialization_id is required' },
        { status: 400 }
      );
    }

    await sql`
      DELETE FROM user_specializations
      WHERE user_id = ${user.id} AND specialization_id = ${specializationId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Specialization removed successfully',
    });
  } catch (error) {
    console.error('Remove user specialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove user specialization' },
      { status: 500 }
    );
  }
}
