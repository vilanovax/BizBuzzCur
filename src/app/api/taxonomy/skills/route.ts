import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import type { Skill, SkillCategory } from '@/types/professional';

// GET /api/taxonomy/skills - Search and list skills
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const domainId = searchParams.get('domain_id');
    const specializationId = searchParams.get('specialization_id');
    const category = searchParams.get('category') as SkillCategory | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let skills: Skill[];

    // If searching by specialization, use suggestions table for relevance
    if (specializationId) {
      skills = await sql<Skill[]>`
        SELECT s.*, COALESCE(sss.relevance_score, 50) as relevance_score
        FROM skills s
        LEFT JOIN skill_specialization_suggestions sss
          ON s.id = sss.skill_id AND sss.specialization_id = ${specializationId}
        WHERE s.is_active = true
          AND (
            ${query} = '' OR
            s.name_en ILIKE ${'%' + query + '%'} OR
            s.name_fa ILIKE ${'%' + query + '%'} OR
            s.slug ILIKE ${'%' + query + '%'}
          )
          ${category ? sql`AND s.category = ${category}` : sql``}
        ORDER BY
          CASE WHEN sss.relevance_score IS NOT NULL THEN 0 ELSE 1 END,
          sss.relevance_score DESC NULLS LAST,
          s.popularity_score DESC,
          s.name_en ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (domainId) {
      // Search within a domain
      skills = await sql<Skill[]>`
        SELECT *
        FROM skills
        WHERE is_active = true
          AND ${domainId} = ANY(suggested_domain_ids)
          AND (
            ${query} = '' OR
            name_en ILIKE ${'%' + query + '%'} OR
            name_fa ILIKE ${'%' + query + '%'} OR
            slug ILIKE ${'%' + query + '%'}
          )
          ${category ? sql`AND category = ${category}` : sql``}
        ORDER BY popularity_score DESC, name_en ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // General search
      skills = await sql<Skill[]>`
        SELECT *
        FROM skills
        WHERE is_active = true
          AND (
            ${query} = '' OR
            name_en ILIKE ${'%' + query + '%'} OR
            name_fa ILIKE ${'%' + query + '%'} OR
            slug ILIKE ${'%' + query + '%'}
          )
          ${category ? sql`AND category = ${category}` : sql``}
        ORDER BY popularity_score DESC, name_en ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    return NextResponse.json({
      success: true,
      data: skills,
    });
  } catch (error) {
    console.error('Search skills error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search skills' },
      { status: 500 }
    );
  }
}
