import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  generateVersionWithAI,
  getFallbackVersion,
} from '@/lib/services/version-generator.service';
import { isOpenAIConfigured } from '@/lib/services/openai.service';
import type { WizardAnswers } from '@/types/version-generator';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/profiles/[id]/versions/generate
 * Generate a profile version using AI based on wizard answers
 *
 * Body: {
 *   wizardAnswers: WizardAnswers
 * }
 *
 * Response: {
 *   success: true,
 *   data: {
 *     preview: GeneratedVersionRules,
 *     profileId: string
 *   }
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check profile ownership
    type ProfileRow = { user_id: string; slug: string };
    const [profile] = await sql<ProfileRow[]>`
      SELECT user_id, slug FROM profiles
      WHERE id = ${profileId} AND deleted_at IS NULL
    `;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (profile.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const wizardAnswers: WizardAnswers = body.wizardAnswers;

    // Validate wizard answers
    if (!wizardAnswers) {
      return NextResponse.json(
        { success: false, error: 'wizardAnswers is required' },
        { status: 400 }
      );
    }

    if (!wizardAnswers.purpose) {
      return NextResponse.json(
        { success: false, error: 'purpose is required' },
        { status: 400 }
      );
    }

    if (!wizardAnswers.audienceType) {
      return NextResponse.json(
        { success: false, error: 'audienceType is required' },
        { status: 400 }
      );
    }

    if (!wizardAnswers.tone) {
      return NextResponse.json(
        { success: false, error: 'tone is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(wizardAnswers.emphasize) || wizardAnswers.emphasize.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one emphasis block is required' },
        { status: 400 }
      );
    }

    // Validate purpose
    const validPurposes = ['networking', 'job_seeking', 'investor_pitch', 'team_intro', 'other'];
    if (!validPurposes.includes(wizardAnswers.purpose)) {
      return NextResponse.json(
        { success: false, error: 'Invalid purpose' },
        { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      console.warn('OpenAI not configured, using fallback');
      const fallbackVersion = getFallbackVersion(wizardAnswers);
      return NextResponse.json({
        success: true,
        data: {
          preview: fallbackVersion,
          profileId,
          fallback: true,
        },
      });
    }

    // Generate version with AI
    try {
      const preview = await generateVersionWithAI(profileId, wizardAnswers);

      return NextResponse.json({
        success: true,
        data: {
          preview,
          profileId,
          fallback: false,
        },
      });
    } catch (aiError) {
      console.error('AI generation failed, using fallback:', aiError);

      // Use fallback when AI fails
      const fallbackVersion = getFallbackVersion(wizardAnswers);

      return NextResponse.json({
        success: true,
        data: {
          preview: fallbackVersion,
          profileId,
          fallback: true,
          error: aiError instanceof Error ? aiError.message : 'AI generation failed',
        },
      });
    }
  } catch (error) {
    console.error('Generate version error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate version' },
      { status: 500 }
    );
  }
}
