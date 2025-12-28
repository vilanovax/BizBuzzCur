import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// POST /api/admin/migrate - Run database migrations
// This is a development-only endpoint
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Migration endpoint disabled in production' },
      { status: 403 }
    );
  }

  const migrationFiles = [
    '010_professional_taxonomy.sql',
    '011_professional_seed_data.sql',
    '012_onboarding_columns.sql',
    '013_analytics_events.sql',
  ];

  const results: { file: string; status: string; error?: string }[] = [];

  try {
    const schemaPath = path.join(process.cwd(), 'src/lib/db/schema');

    for (const file of migrationFiles) {
      const filePath = path.join(schemaPath, file);

      if (!fs.existsSync(filePath)) {
        results.push({ file, status: 'skipped', error: 'file not found' });
        continue;
      }

      try {
        const sqlContent = fs.readFileSync(filePath, 'utf-8');
        await sql.unsafe(sqlContent);
        results.push({ file, status: 'success' });
      } catch (error: unknown) {
        const pgError = error as { code?: string; message?: string };
        if (pgError.code === '42P07' || pgError.code === '42710') {
          results.push({ file, status: 'exists', error: 'some objects already exist' });
        } else {
          results.push({ file, status: 'error', error: pgError.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migrations completed',
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    );
  }
}
