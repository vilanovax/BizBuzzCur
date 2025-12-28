import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { UserProfessionalProfile, UserDomain, UserSpecialization, UserSkill, UserProfessionalStatus } from '@/types/professional';

// GET /api/user/professional - Get complete user professional profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user domains
    const domains = await sql<UserDomain[]>`
      SELECT ud.*,
        json_build_object(
          'id', pd.id,
          'slug', pd.slug,
          'name_en', pd.name_en,
          'name_fa', pd.name_fa,
          'description_en', pd.description_en,
          'description_fa', pd.description_fa,
          'icon', pd.icon,
          'color', pd.color,
          'display_order', pd.display_order,
          'is_active', pd.is_active
        ) as domain
      FROM user_domains ud
      JOIN professional_domains pd ON ud.domain_id = pd.id
      WHERE ud.user_id = ${user.id}
      ORDER BY ud.is_primary DESC, pd.display_order ASC
    `;

    // Get user specializations
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

    // Get user skills
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

    // Get user's global professional status
    const [status] = await sql<UserProfessionalStatus[]>`
      SELECT ups.*,
        json_build_object(
          'id', ps.id,
          'slug', ps.slug,
          'name_en', ps.name_en,
          'name_fa', ps.name_fa,
          'description_en', ps.description_en,
          'description_fa', ps.description_fa,
          'icon', ps.icon,
          'color', ps.color,
          'status_type', ps.status_type,
          'display_order', ps.display_order,
          'is_active', ps.is_active
        ) as status
      FROM user_professional_status ups
      JOIN professional_statuses ps ON ups.status_id = ps.id
      WHERE ups.user_id = ${user.id} AND ups.profile_id IS NULL
    `;

    const profile: UserProfessionalProfile = {
      primaryDomain: domains.find(d => d.is_primary) || null,
      secondaryDomains: domains.filter(d => !d.is_primary),
      specializations,
      skills,
      status: status || null,
    };

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Get user professional profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get professional profile' },
      { status: 500 }
    );
  }
}
