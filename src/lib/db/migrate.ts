import sql from './index';
import fs from 'fs';
import path from 'path';

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
