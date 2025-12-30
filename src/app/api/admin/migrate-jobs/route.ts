import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// POST /api/admin/migrate-jobs - Run job_ads migration
// This is a development-only endpoint
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Migration endpoint disabled in production' },
      { status: 403 }
    );
  }

  try {
    const schemaPath = path.join(process.cwd(), 'src/lib/db/schema');
    const filePath = path.join(schemaPath, '017_job_ads.sql');

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Migration file not found' },
        { status: 404 }
      );
    }

    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    await sql.unsafe(sqlContent);

    return NextResponse.json({
      success: true,
      message: 'Job ads migration completed successfully',
    });
  } catch (error) {
    console.error('Migration error:', error);
    const pgError = error as { code?: string; message?: string; detail?: string };

    // Handle common cases
    if (pgError.code === '42P07') {
      return NextResponse.json({
        success: true,
        message: 'Tables already exist',
        warning: pgError.message,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: pgError.message || 'Migration failed',
        code: pgError.code,
        detail: pgError.detail,
      },
      { status: 500 }
    );
  }
}
