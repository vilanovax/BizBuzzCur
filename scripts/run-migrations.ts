/**
 * Database Migration Runner
 * Run with: npx tsx scripts/run-migrations.ts
 */

import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  max: 1,
  connect_timeout: 60,
  idle_timeout: 30,
});

// Migration files to run in order
const migrationFiles = [
  '010_professional_taxonomy.sql',
  '011_professional_seed_data.sql',
  '012_onboarding_columns.sql',
  '013_analytics_events.sql',
];

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const schemaPath = path.join(process.cwd(), 'src/lib/db/schema');

  for (const file of migrationFiles) {
    const filePath = path.join(schemaPath, file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} - file not found`);
      continue;
    }

    console.log(`📄 Running ${file}...`);

    try {
      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      await sql.unsafe(sqlContent);
      console.log(`✅ ${file} completed successfully\n`);
    } catch (error: unknown) {
      const pgError = error as { code?: string; message?: string };
      // Some errors like "already exists" are OK
      if (pgError.code === '42P07' || pgError.code === '42710') {
        console.log(`⚠️  ${file} - some objects already exist (OK)\n`);
      } else {
        console.error(`❌ Error in ${file}:`, pgError.message || error);
        // Continue with other migrations
      }
    }
  }

  console.log('🎉 Migrations completed!');
  await sql.end();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
