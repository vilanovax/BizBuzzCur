import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// POST /api/admin/migrate-soft-delete - Add deleted_at column for soft delete
export async function POST() {
  try {
    // Add deleted_at column if it doesn't exist
    await sql`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL
    `;

    // Create index for non-deleted profiles
    await sql`
      CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL
    `;

    // Create index for trash queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_profiles_trash ON profiles(deleted_at) WHERE deleted_at IS NOT NULL
    `;

    return NextResponse.json({
      success: true,
      message: 'Migration completed: deleted_at column added to profiles table',
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Migration failed', details: String(error) },
      { status: 500 }
    );
  }
}
