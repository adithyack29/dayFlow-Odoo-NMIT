import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { LeaveStatus, AttendanceStatus } from '@prisma/client';

export async function PUT(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Server-side Access Control: Admin only
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { leaveRequestId, status, adminComment } = body;

    if (!leaveRequestId || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters: leaveRequestId and status are required.' },
        { status: 400 }
      );
    }

    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Invalid status. Status must be either APPROVED or REJECTED.' },
        { status: 400 }
      );
    }

    // MANDATORY REJECTION COMMENT VALIDATION
    if (status === 'REJECTED' && (!adminComment || typeof adminComment !== 'string' || !adminComment.trim())) {
      return NextResponse.json(
        { error: 'An admin comment explaining the reason for rejection is strictly required when rejecting a leave request.' },
        { status: 400 }
      );
    }

    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id: leaveRequestId },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    /*
     * TRANSACTIONAL ATTENDANCE SYNC (MILESTONE 4 HOOK):
     * When a LeaveRequest transitions to APPROVED:
     * We update the LeaveRequest and upsert the employee's Attendance records for every date
     * in the range [startDate, endDate] setting status = LEAVE inside the same database transaction.
     *
     * EDGE CASE PROTECTION:
     * If a day in the leave range has already been recorded as PRESENT or HALF_DAY by an actual check-in,
     * it is NOT overwritten.
     *
     * EDGE CASE NOTE:
     * If a leave request is later reversed/rejected after approval, attendance records are not reverted
     * automatically to keep hackathon scope sane.
     */

    const startDateObj = new Date(leaveRequest.startDate);
    const endDateObj = new Date(leaveRequest.endDate);

    const datesToSync: string[] = [];
    const cur = new Date(startDateObj);
    while (cur <= endDateObj) {
      datesToSync.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    // Perform database transaction
    const updatedLeaveRequest = await db.$transaction(async (tx) => {
      // 1. Update LeaveRequest status & review metadata
      const updated = await tx.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: status as LeaveStatus,
          adminComment: adminComment?.trim() || null,
          reviewedById: session.userId,
        },
      });

      // 2. If APPROVED, sync dates into Attendance table
      if (status === 'APPROVED') {
        const existingAttendances = await tx.attendance.findMany({
          where: {
            userId: leaveRequest.userId,
            date: { in: datesToSync },
          },
        });

        const attendanceMap = new Map(existingAttendances.map((a) => [a.date, a]));

        for (const dateStr of datesToSync) {
          const existing = attendanceMap.get(dateStr);

          // EDGE CASE: Do NOT overwrite an already recorded check-in day (PRESENT or HALF_DAY)
          if (existing && (existing.status === AttendanceStatus.PRESENT || existing.status === AttendanceStatus.HALF_DAY)) {
            continue;
          }

          if (existing) {
            await tx.attendance.update({
              where: { id: existing.id },
              data: {
                status: AttendanceStatus.LEAVE,
              },
            });
          } else {
            await tx.attendance.create({
              data: {
                userId: leaveRequest.userId,
                date: dateStr,
                status: AttendanceStatus.LEAVE,
              },
            });
          }
        }
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully`,
      leaveRequest: updatedLeaveRequest,
    });
  } catch (error) {
    console.error('Error reviewing leave request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
