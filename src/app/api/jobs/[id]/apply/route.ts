import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { ApplyToJobRequest } from '@/types/job';

// POST /api/jobs/[id]/apply - Apply to a job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'برای ارسال درخواست باید وارد شوید' },
        { status: 401 }
      );
    }

    const { id: jobId } = await params;
    const body: ApplyToJobRequest = await request.json();
    const { cover_message, resume_url } = body;

    // Check if job exists and is published
    const [job] = await sql`
      SELECT
        j.*,
        c.created_by as company_owner_id,
        c.name as company_name
      FROM job_ads j
      JOIN companies c ON c.id = j.company_id
      WHERE j.id = ${jobId}
    `;

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'آگهی یافت نشد' },
        { status: 404 }
      );
    }

    if (job.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'این آگهی در حال حاضر فعال نیست' },
        { status: 400 }
      );
    }

    // Check if user is not the company owner
    if (job.company_owner_id === user.id) {
      return NextResponse.json(
        { success: false, error: 'شما نمی‌توانید برای آگهی شرکت خودتان درخواست دهید' },
        { status: 400 }
      );
    }

    // Check if already applied
    const [existingApplication] = await sql`
      SELECT id FROM job_applications
      WHERE job_id = ${jobId} AND applicant_id = ${user.id}
    `;

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: 'شما قبلاً برای این شغل درخواست داده‌اید' },
        { status: 400 }
      );
    }

    // Create conversation between applicant and company owner
    // First check if conversation already exists
    const p1 = user.id < job.company_owner_id ? user.id : job.company_owner_id;
    const p2 = user.id < job.company_owner_id ? job.company_owner_id : user.id;

    let conversationId: string;

    // Check for existing job_application conversation between these users
    const [existingConv] = await sql`
      SELECT id FROM conversations
      WHERE participant_1_id = ${p1}
        AND participant_2_id = ${p2}
        AND context_type = 'job_application'
        AND context_id = ${jobId}
    `;

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      // Create new conversation
      const [conversation] = await sql`
        INSERT INTO conversations (
          participant_1_id,
          participant_2_id,
          context_type,
          context_id
        )
        VALUES (${p1}, ${p2}, 'job_application', ${jobId})
        RETURNING id
      `;
      conversationId = conversation.id;

      // Create participant records
      await sql`
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES
          (${conversationId}, ${user.id}),
          (${conversationId}, ${job.company_owner_id})
      `;
    }

    // Create job application
    const [application] = await sql`
      INSERT INTO job_applications (
        job_id,
        applicant_id,
        cover_message,
        resume_url,
        conversation_id,
        status
      )
      VALUES (
        ${jobId},
        ${user.id},
        ${cover_message || null},
        ${resume_url || null},
        ${conversationId},
        'pending'
      )
      RETURNING *
    `;

    // Send initial message if cover message provided
    if (cover_message?.trim()) {
      const [message] = await sql`
        INSERT INTO messages (
          conversation_id,
          sender_id,
          content,
          message_type,
          metadata
        )
        VALUES (
          ${conversationId},
          ${user.id},
          ${cover_message.trim()},
          'text',
          ${JSON.stringify({ type: 'job_application', job_id: jobId, application_id: application.id })}
        )
        RETURNING *
      `;

      // Update conversation with last message
      await sql`
        UPDATE conversations
        SET
          last_message_id = ${message.id},
          last_message_at = ${message.created_at},
          last_message_preview = ${cover_message.substring(0, 100)}
        WHERE id = ${conversationId}
      `;

      // Update unread count for company owner
      await sql`
        UPDATE conversation_participants
        SET unread_count = unread_count + 1
        WHERE conversation_id = ${conversationId}
          AND user_id = ${job.company_owner_id}
      `;
    }

    // Create notification for company owner
    await sql`
      INSERT INTO notifications (
        user_id,
        type,
        title,
        body,
        action_url,
        action_data,
        related_user_id
      )
      VALUES (
        ${job.company_owner_id},
        'job_application',
        'درخواست شغلی جدید',
        ${`${user.first_name} ${user.last_name} برای "${job.title}" درخواست داده است`},
        ${`/dashboard/jobs/${jobId}/applications`},
        ${JSON.stringify({ job_id: jobId, application_id: application.id })},
        ${user.id}
      )
    `;

    return NextResponse.json({
      success: true,
      data: {
        application_id: application.id,
        conversation_id: conversationId,
      },
      message: 'درخواست شما با موفقیت ارسال شد',
    });
  } catch (error) {
    console.error('Apply to job error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ارسال درخواست' },
      { status: 500 }
    );
  }
}
