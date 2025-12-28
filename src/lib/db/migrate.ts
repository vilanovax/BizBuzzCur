import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('user:password@host')) {
  console.error('ERROR: DATABASE_URL is not configured properly in .env.local');
  process.exit(1);
}

console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':***@'));

const sql = postgres(connectionString, {
  ssl: false,
  max: 1,
  connect_timeout: 30,
});

const SCHEMA_DIR = path.join(process.cwd(), 'src/lib/db/schema');

async function migrate() {
  console.log('Starting database migration...\n');

  // Get all SQL files sorted by name
  const files = fs.readdirSync(SCHEMA_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files:\n`);

  for (const file of files) {
    console.log(`Running: ${file}`);
    const filePath = path.join(SCHEMA_DIR, file);
    const sqlContent = fs.readFileSync(filePath, 'utf-8');

    try {
      await sql.unsafe(sqlContent);
      console.log(`  ✓ Success\n`);
    } catch (error) {
      console.error(`  ✗ Error in ${file}:`, error);
      throw error;
    }
  }

  console.log('\n✓ All migrations completed successfully!');
  process.exit(0);
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
