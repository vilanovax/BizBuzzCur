import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { ApplicationStatus } from '@/types/job';

// Helper to check if user can manage this application
async function canManageApplication(userId: string, applicationId: string): Promise<{ allowed: boolean; application?: any }> {
  const [app] = await sql`
    SELECT
      ja.*,
      j.title as job_title,
      j.company_id,
      c.name as company_name,
      u.first_name as applicant_first_name,
      u.last_name as applicant_last_name
    FROM job_applications ja
    JOIN job_ads j ON j.id = ja.job_id
    JOIN companies c ON c.id = j.company_id
    JOIN users u ON u.id = ja.applicant_id
    JOIN company_team_members ctm ON ctm.company_id = j.company_id
    WHERE ja.id = ${applicationId}
      AND ctm.user_id = ${userId}
      AND ctm.invitation_status = 'accepted'
      AND ctm.role IN ('owner', 'admin', 'recruiter')
  `;
  return { allowed: !!app, application: app };
}

const VALID_STATUSES: ApplicationStatus[] = ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired', 'withdrawn'];

// PUT /api/applications/[id]/status - Update application status
export async function PUT(
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
    const body = await request.json();
    const { status, note } = body;

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'وضعیت نامعتبر است' },
        { status: 400 }
      );
    }

    // Check permission
    const { allowed, application } = await canManageApplication(user.id, applicationId);
    if (!allowed || !application) {
      return NextResponse.json(
        { success: false, error: 'شما دسترسی تغییر وضعیت این درخواست را ندارید' },
        { status: 403 }
      );
    }

    const previousStatus = application.status;

    // Update application status
    const [updated] = await sql`
      UPDATE job_applications
      SET
        status = ${status},
        status_changed_at = NOW(),
        reviewed_at = CASE
          WHEN ${status} != 'pending' AND reviewed_at IS NULL THEN NOW()
          ELSE reviewed_at
        END
      WHERE id = ${applicationId}
      RETURNING *
    `;

    // Create notification for applicant about status change
    const statusMessages: Record<ApplicationStatus, string> = {
      pending: 'درخواست شما در انتظار بررسی است',
      reviewing: 'درخواست شما در حال بررسی است',
      shortlisted: 'تبریک! شما در لیست نهایی قرار گرفتید',
      rejected: 'متأسفانه درخواست شما پذیرفته نشد',
      hired: 'تبریک! شما استخدام شدید',
      withdrawn: 'درخواست شما پس گرفته شد',
    };

    // Only notify if status actually changed
    if (previousStatus !== status) {
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
          ${application.applicant_id},
          'job_application',
          'بروزرسانی وضعیت درخواست',
          ${`${statusMessages[status as ApplicationStatus]} - ${application.job_title}`},
          ${`/dashboard/inbox/${application.conversation_id}`},
          ${JSON.stringify({
            job_id: application.job_id,
            application_id: applicationId,
            status,
            previous_status: previousStatus
          })},
          ${user.id}
        )
      `;

      // Optionally send a message in the conversation
      if (note?.trim() && application.conversation_id) {
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
            ${note.trim()},
            'text',
            ${JSON.stringify({
              type: 'status_update',
              application_id: applicationId,
              new_status: status,
              previous_status: previousStatus
            })}
          )
          RETURNING *
        `;

        // Update conversation
        await sql`
          UPDATE conversations
          SET
            last_message_id = ${message.id},
            last_message_at = ${message.created_at},
            last_message_preview = ${note.substring(0, 100)}
          WHERE id = ${application.conversation_id}
        `;

        // Update unread count for applicant
        await sql`
          UPDATE conversation_participants
          SET unread_count = unread_count + 1
          WHERE conversation_id = ${application.conversation_id}
            AND user_id = ${application.applicant_id}
        `;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        previous_status: previousStatus,
        status_changed_at: updated.status_changed_at,
      },
      message: 'وضعیت درخواست با موفقیت بروزرسانی شد',
    });
  } catch (error) {
    console.error('Update application status error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بروزرسانی وضعیت' },
      { status: 500 }
    );
  }
}

// GET /api/applications/[id]/status - Get application status (for applicant)
export async function GET(
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

    // Get application - user must be applicant or company admin
    const [application] = await sql`
      SELECT
        ja.*,
        j.title as job_title,
        j.company_id,
        c.name as company_name
      FROM job_applications ja
      JOIN job_ads j ON j.id = ja.job_id
      JOIN companies c ON c.id = j.company_id
      WHERE ja.id = ${applicationId}
        AND (
          ja.applicant_id = ${user.id}
          OR EXISTS (
            SELECT 1 FROM company_team_members ctm
            WHERE ctm.company_id = j.company_id
              AND ctm.user_id = ${user.id}
              AND ctm.invitation_status = 'accepted'
              AND ctm.role IN ('owner', 'admin', 'recruiter')
          )
        )
    `;

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'درخواست یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        job_id: application.job_id,
        job_title: application.job_title,
        company_name: application.company_name,
        status: application.status,
        applied_at: application.applied_at,
        reviewed_at: application.reviewed_at,
        status_changed_at: application.status_changed_at,
        conversation_id: application.conversation_id,
      },
    });
  } catch (error) {
    console.error('Get application status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get application status' },
      { status: 500 }
    );
  }
}
