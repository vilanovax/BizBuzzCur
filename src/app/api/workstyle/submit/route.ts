/**
 * Workstyle Test Submission API
 *
 * Processes test answers, generates signals, and stores them on the user's profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import sql from '@/lib/db';
import { PersonalityEngine } from '@/modules/personality-engine';
import type { TestResult, Answer } from '@/modules/personality-engine/contracts/personality.input';

interface SubmitRequest {
  testType: 'disc' | 'holland';
  testVersion: string;
  answers: Answer[];
}

export async function POST(request: NextRequest) {
  try {
    // Auth required
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'لطفاً وارد حساب کاربری شوید' },
        { status: 401 }
      );
    }

    // Parse body
    const body: SubmitRequest = await request.json();

    if (!body.testType || !body.answers || body.answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'داده‌های آزمون ناقص است' },
        { status: 400 }
      );
    }

    // Build test result
    const testResult: TestResult = {
      testType: body.testType,
      testVersion: body.testVersion || '1.0.0',
      answers: body.answers,
      completedAt: new Date().toISOString(),
    };

    // Generate session ID
    const sessionId = `${user.id}-${Date.now()}`;

    // Analyze with personality engine
    const output = PersonalityEngine.analyze({
      sessionId,
      testResults: [testResult],
      context: { purpose: 'job_matching' },
    });

    if (output.status === 'error') {
      return NextResponse.json(
        { success: false, error: 'خطا در پردازش نتایج آزمون' },
        { status: 500 }
      );
    }

    // Get user's first active profile
    const [profile] = await sql<{ id: string }[]>`
      SELECT id FROM profiles
      WHERE user_id = ${user.id} AND is_active = true
      ORDER BY created_at ASC
      LIMIT 1
    `;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'پروفایلی یافت نشد' },
        { status: 404 }
      );
    }

    // Store signals on profile
    await sql`
      UPDATE profiles
      SET
        personality_signals = ${JSON.stringify(output.signals)}::jsonb,
        personality_analyzed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${profile.id}
    `;

    return NextResponse.json({
      success: true,
      data: {
        signalCount: output.signals.length,
        status: output.status,
      },
    });
  } catch (error) {
    console.error('Workstyle submit error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت نتایج' },
      { status: 500 }
    );
  }
}
