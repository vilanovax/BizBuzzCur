import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { UserDomain, SetUserDomainInput } from '@/types/professional';

// GET /api/user/professional/domains - Get user's domains
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    return NextResponse.json({
      success: true,
      data: domains,
    });
  } catch (error) {
    console.error('Get user domains error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user domains' },
      { status: 500 }
    );
  }
}

// POST /api/user/professional/domains - Set user's domain
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SetUserDomainInput = await request.json();
    const { domain_id, is_primary = false } = body;

    if (!domain_id) {
      return NextResponse.json(
        { success: false, error: 'domain_id is required' },
        { status: 400 }
      );
    }

    // Verify domain exists
    const [domainExists] = await sql`
      SELECT id FROM professional_domains WHERE id = ${domain_id} AND is_active = true
    `;
    if (!domainExists) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    // If setting as primary, unset other primary domains first
    if (is_primary) {
      await sql`
        UPDATE user_domains
        SET is_primary = false
        WHERE user_id = ${user.id} AND is_primary = true
      `;
    }

    // Upsert user domain
    const [userDomain] = await sql<UserDomain[]>`
      INSERT INTO user_domains (user_id, domain_id, is_primary)
      VALUES (${user.id}, ${domain_id}, ${is_primary})
      ON CONFLICT (user_id, domain_id)
      DO UPDATE SET is_primary = ${is_primary}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: userDomain,
    });
  } catch (error) {
    console.error('Set user domain error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set user domain' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/professional/domains - Remove user's domain
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
    const domainId = searchParams.get('domain_id');

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'domain_id is required' },
        { status: 400 }
      );
    }

    await sql`
      DELETE FROM user_domains
      WHERE user_id = ${user.id} AND domain_id = ${domainId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Domain removed successfully',
    });
  } catch (error) {
    console.error('Remove user domain error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove user domain' },
      { status: 500 }
    );
  }
}
