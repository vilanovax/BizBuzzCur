import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import type { Specialization } from '@/types/professional';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/taxonomy/domains/[id]/specializations - List specializations for a domain
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    let specializations: Specialization[];

    if (activeOnly) {
      specializations = await sql<Specialization[]>`
        SELECT * FROM specializations
        WHERE domain_id = ${id} AND is_active = true
        ORDER BY display_order ASC
      `;
    } else {
      specializations = await sql<Specialization[]>`
        SELECT * FROM specializations
        WHERE domain_id = ${id}
        ORDER BY display_order ASC
      `;
    }

    return NextResponse.json({
      success: true,
      data: specializations,
    });
  } catch (error) {
    console.error('List specializations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list specializations' },
      { status: 500 }
    );
  }
}
