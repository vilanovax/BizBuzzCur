import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';

// Check if we have a valid connection string (not placeholder)
const isValidConnectionString = connectionString.includes('@') && !connectionString.includes('user:password@host:port');

// Create PostgreSQL client
// For build time with placeholder credentials, we create a dummy connection that will fail at runtime
const sql = postgres(
  isValidConnectionString
    ? connectionString
    : 'postgres://localhost:5432/bizbuzz', // Fallback for build time only
  {
    ssl: process.env.NODE_ENV === 'production' && isValidConnectionString ? 'require' : false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  }
);

export default sql;

// Helper types for common operations
export type QueryResult<T> = T[];

// Transaction helper
export async function transaction<T>(
  callback: (sql: postgres.Sql) => Promise<T>
): Promise<T> {
  return sql.begin(callback) as Promise<T>;
}

// Health check
export async function checkConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
