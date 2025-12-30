import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/applications/[id]/withdraw - Withdraw job application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: applicationId } = await params;

    // Get application and verify ownership
    const [application] = await sql`
      SELECT
        ja.*,
        j.title as job_title,
        j.company_id,
        c.created_by as company_owner_id
      FROM job_applications ja
      JOIN job_ads j ON j.id = ja.job_id
      JOIN companies c ON c.id = j.company_id
      WHERE ja.id = ${applicationId}
        AND ja.applicant_id = ${user.id}
    `;

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'درخواست یافت نشد' },
        { status: 404 }
      );
    }

    // Check if already withdrawn or hired
    if (application.status === 'withdrawn') {
      return NextResponse.json(
        { success: false, error: 'این درخواست قبلاً پس گرفته شده است' },
        { status: 400 }
      );
    }

    if (application.status === 'hired') {
      return NextResponse.json(
        { success: false, error: 'نمی‌توانید درخواست استخدام شده را پس بگیرید' },
        { status: 400 }
      );
    }

    // Update application status
    await sql`
      UPDATE job_applications
      SET status = 'withdrawn', status_changed_at = NOW()
      WHERE id = ${applicationId}
    `;

    // Notify company owner
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
        ${application.company_owner_id},
        'job_application',
        'درخواست پس گرفته شد',
        ${`${user.first_name} ${user.last_name} درخواست خود را برای "${application.job_title}" پس گرفت`},
        ${`/dashboard/jobs/${application.job_id}/applications`},
        ${JSON.stringify({ job_id: application.job_id, application_id: applicationId, status: 'withdrawn' })},
        ${user.id}
      )
    `;

    // Send message in conversation if exists
    if (application.conversation_id) {
      const [message] = await sql`
        INSERT INTO messages (
          conversation_id,
          sender_id,
          content,
          message_type,
          metadata
        )
        VALUES (
          ${application.conversation_id},
          ${user.id},
          'درخواست شغلی خود را پس گرفتم.',
          'text',
          ${JSON.stringify({ type: 'application_withdrawn', application_id: applicationId })}
        )
        RETURNING *
      `;

      await sql`
        UPDATE conversations
        SET
          last_message_id = ${message.id},
          last_message_at = ${message.created_at},
          last_message_preview = 'درخواست شغلی خود را پس گرفتم.'
        WHERE id = ${application.conversation_id}
      `;

      // Update unread count for company owner
      await sql`
        UPDATE conversation_participants
        SET unread_count = unread_count + 1
        WHERE conversation_id = ${application.conversation_id}
          AND user_id = ${application.company_owner_id}
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'درخواست شما با موفقیت پس گرفته شد',
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در پس گرفتن درخواست' },
      { status: 500 }
    );
  }
}
