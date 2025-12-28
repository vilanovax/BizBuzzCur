import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import type { ProfessionalStatus, StatusType } from '@/types/professional';

// GET /api/taxonomy/statuses - List all professional statuses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusType = searchParams.get('type') as StatusType | null;

    let statuses: ProfessionalStatus[];

    if (statusType) {
      statuses = await sql<ProfessionalStatus[]>`
        SELECT *
        FROM professional_statuses
        WHERE is_active = true AND status_type = ${statusType}
        ORDER BY display_order ASC
      `;
    } else {
      statuses = await sql<ProfessionalStatus[]>`
        SELECT *
        FROM professional_statuses
        WHERE is_active = true
        ORDER BY status_type, display_order ASC
      `;
    }

    return NextResponse.json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    console.error('List statuses error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list statuses' },
      { status: 500 }
    );
  }
}
