import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
const migrationFile = process.argv[2];

if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not configured');
  process.exit(1);
}

if (!migrationFile) {
  console.error('Usage: npx tsx src/lib/db/run-single-migration.ts <filename.sql>');
  process.exit(1);
}

console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':***@'));

const sql = postgres(connectionString, {
  ssl: false,
  max: 1,
  connect_timeout: 30,
});

async function runMigration() {
  const filePath = path.join(process.cwd(), 'src/lib/db/schema', migrationFile);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Running: ${migrationFile}\n`);
  const sqlContent = fs.readFileSync(filePath, 'utf-8');

  try {
    await sql.unsafe(sqlContent);
    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('✗ Error:', error);
  }

  process.exit(0);
}

runMigration();
