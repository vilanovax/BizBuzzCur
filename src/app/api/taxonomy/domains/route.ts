import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import type { ProfessionalDomain } from '@/types/professional';

// GET /api/taxonomy/domains - List all professional domains
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    let domains: ProfessionalDomain[];

    if (activeOnly) {
      domains = await sql<ProfessionalDomain[]>`
        SELECT * FROM professional_domains
        WHERE is_active = true
        ORDER BY display_order ASC
      `;
    } else {
      domains = await sql<ProfessionalDomain[]>`
        SELECT * FROM professional_domains
        ORDER BY display_order ASC
      `;
    }

    return NextResponse.json({
      success: true,
      data: domains,
    });
  } catch (error) {
    console.error('List domains error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list domains' },
      { status: 500 }
    );
  }
}
