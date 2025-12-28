import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { UserSkill, SetUserSkillInput } from '@/types/professional';

// GET /api/user/professional/skills - Get user's skills
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const skills = await sql<UserSkill[]>`
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
      WHERE us.user_id = ${user.id}
      ORDER BY us.display_order ASC, s.name_en ASC
    `;

    return NextResponse.json({
      success: true,
      data: skills,
    });
  } catch (error) {
    console.error('Get user skills error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user skills' },
      { status: 500 }
    );
  }
}

// POST /api/user/professional/skills - Add user's skill
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SetUserSkillInput = await request.json();
    const { skill_id, level = 'intermediate', years_experience } = body;

    if (!skill_id) {
      return NextResponse.json(
        { success: false, error: 'skill_id is required' },
        { status: 400 }
      );
    }

    // Validate level
    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid skill level' },
        { status: 400 }
      );
    }

    // Verify skill exists
    const [skillExists] = await sql`
      SELECT id FROM skills WHERE id = ${skill_id} AND is_active = true
    `;
    if (!skillExists) {
      return NextResponse.json(
        { success: false, error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Get max display order for user's skills
    const [maxOrder] = await sql<{ max: number }[]>`
      SELECT COALESCE(MAX(display_order), 0) as max FROM user_skills WHERE user_id = ${user.id}
    `;

    // Upsert user skill
    const [userSkill] = await sql<UserSkill[]>`
      INSERT INTO user_skills (user_id, skill_id, level, years_experience, display_order)
      VALUES (${user.id}, ${skill_id}, ${level}, ${years_experience ?? null}, ${maxOrder.max + 1})
      ON CONFLICT (user_id, skill_id)
      DO UPDATE SET
        level = ${level},
        years_experience = ${years_experience ?? null},
        updated_at = NOW()
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: userSkill,
    });
  } catch (error) {
    console.error('Add user skill error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add user skill' },
      { status: 500 }
    );
  }
}
