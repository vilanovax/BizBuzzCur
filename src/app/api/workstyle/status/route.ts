/**
 * Workstyle Status API
 *
 * Returns whether the current user has completed the workstyle assessment.
 */

import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user's primary profile has personality signals
    const [profile] = await sql`
      SELECT
        personality_signals IS NOT NULL
        AND jsonb_array_length(personality_signals) > 0 as has_signals
      FROM profiles
      WHERE user_id = ${user.id}
        AND is_primary = true
    `;

    return NextResponse.json({
      success: true,
      data: {
        hasSignals: profile?.has_signals || false,
      },
    });
  } catch (error) {
    console.error('Workstyle status error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
