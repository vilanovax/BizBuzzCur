import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { CreateCompanyRequest } from '@/types/company';

// Helper to generate slug from name
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${randomSuffix}`;
}

// POST /api/companies - Create a new company (Entity)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateCompanyRequest = await request.json();
    const {
      name,
      slug: providedSlug,
      tagline,
      description,
      industry,
      company_size,
      founded_year,
      company_type,
      website,
      email,
      phone,
      city,
      country,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'نام شرکت الزامی است' },
        { status: 400 }
      );
    }

    // Generate or validate slug
    let slug = providedSlug?.trim() || generateSlug(name);

    // Check slug uniqueness
    const [existingSlug] = await sql`
      SELECT id FROM companies WHERE slug = ${slug}
    `;
    if (existingSlug) {
      slug = generateSlug(name); // Generate new one if exists
    }

    // Create company
    const [company] = await sql`
      INSERT INTO companies (
        created_by, slug, name, tagline, description,
        industry, company_size, founded_year, company_type,
        website, email, phone, city, country
      )
      VALUES (
        ${user.id},
        ${slug},
        ${name.trim()},
        ${tagline || null},
        ${description || null},
        ${industry || null},
        ${company_size || null},
        ${founded_year || null},
        ${company_type || null},
        ${website || null},
        ${email || null},
        ${phone || null},
        ${city || null},
        ${country || null}
      )
      RETURNING *
    `;

    // Add creator as owner in team members
    await sql`
      INSERT INTO company_team_members (
        company_id, user_id, role, invitation_status, joined_at
      )
      VALUES (
        ${company.id},
        ${user.id},
        'owner',
        'accepted',
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create company' },
      { status: 500 }
    );
  }
}

// GET /api/companies - List companies (for discovery - future)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let companies;

    if (search) {
      companies = await sql`
        SELECT
          c.*,
          (SELECT COUNT(*) FROM company_team_members WHERE company_id = c.id AND invitation_status = 'accepted') as member_count,
          (SELECT COUNT(*) FROM job_ads WHERE company_id = c.id AND status = 'published') as active_jobs_count
        FROM companies c
        WHERE c.show_in_directory = true
          AND (c.name ILIKE ${'%' + search + '%'} OR c.tagline ILIKE ${'%' + search + '%'})
        ORDER BY c.total_views DESC, c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      companies = await sql`
        SELECT
          c.*,
          (SELECT COUNT(*) FROM company_team_members WHERE company_id = c.id AND invitation_status = 'accepted') as member_count,
          (SELECT COUNT(*) FROM job_ads WHERE company_id = c.id AND status = 'published') as active_jobs_count
        FROM companies c
        WHERE c.show_in_directory = true
        ORDER BY c.total_views DESC, c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    return NextResponse.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error('List companies error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list companies' },
      { status: 500 }
    );
  }
}
