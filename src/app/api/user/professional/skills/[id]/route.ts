import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { UserSkill, UpdateUserSkillInput } from '@/types/professional';

// GET /api/user/professional/skills/[id] - Get a specific user skill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const [userSkill] = await sql<UserSkill[]>`
      SELECT us.*,
        json_build_object(
          'id', s.id,
          'slug', s.slug,
          'name_en', s.name_en,
          'name_fa', s.name_fa,
          'description_en', s.description_en,
          'description_fa', s.description_fa,
          'category', s.category,
          'suggested_domain_ids', s.suggested_domain_ids,
          'popularity_score', s.popularity_score,
          'is_active', s.is_active
        ) as skill
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.id = ${id} AND us.user_id = ${user.id}
    `;

    if (!userSkill) {
      return NextResponse.json(
        { success: false, error: 'Skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userSkill,
    });
  } catch (error) {
    console.error('Get user skill error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user skill' },
      { status: 500 }
    );
  }
}

// PUT /api/user/professional/skills/[id] - Update a user skill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: UpdateUserSkillInput = await request.json();
    const { level, years_experience, display_order } = body;

    // Validate level if provided
    if (level) {
      const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (!validLevels.includes(level)) {
        return NextResponse.json(
          { success: false, error: 'Invalid skill level' },
          { status: 400 }
        );
      }
    }

    // Check if user skill exists and belongs to user
    const [existingSkill] = await sql`
      SELECT id FROM user_skills WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (!existingSkill) {
      return NextResponse.json(
        { success: false, error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Update user skill
    const [userSkill] = await sql<UserSkill[]>`
      UPDATE user_skills
      SET
        level = COALESCE(${level ?? null}, level),
        years_experience = COALESCE(${years_experience ?? null}, years_experience),
        display_order = COALESCE(${display_order ?? null}, display_order),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: userSkill,
    });
  } catch (error) {
    console.error('Update user skill error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user skill' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/professional/skills/[id] - Remove a user skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Delete user skill
    const result = await sql`
      DELETE FROM user_skills
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Skill removed successfully',
    });
  } catch (error) {
    console.error('Remove user skill error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove user skill' },
      { status: 500 }
    );
  }
}
