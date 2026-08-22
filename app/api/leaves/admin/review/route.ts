import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { LeaveStatus, AttendanceStatus } from '@prisma/client';
import { createNotificationAndEmailAlert } from '@/lib/notifications';
import { logAdminAudit } from '@/lib/audit';

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
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!leaveRequest || !leaveRequest.user.profile) {
      return NextResponse.json({ error: 'Leave request or employee profile not found' }, { status: 404 });
    }

    const profile = leaveRequest.user.profile;
    const startDateObj = new Date(leaveRequest.startDate);
    const endDateObj = new Date(leaveRequest.endDate);

    // Calculate duration in days
    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    /*
     * LEAVE BALANCE CHECK & APPROVAL GUARD:
     * Decrement balance ONLY on leave approval.
     * Block approval if requested duration exceeds remaining PAID or SICK leave balance.
     */
    if (status === 'APPROVED') {
      if (leaveRequest.leaveType === 'PAID' && profile.paidLeaveBalance < durationDays) {
        return NextResponse.json(
          {
            error: `Cannot approve leave: Requested duration (${durationDays} days) exceeds employee’s remaining Paid Leave balance (${profile.paidLeaveBalance} days remaining).`,
          },
          { status: 400 }
        );
      }

      if (leaveRequest.leaveType === 'SICK' && profile.sickLeaveBalance < durationDays) {
        return NextResponse.json(
          {
            error: `Cannot approve leave: Requested duration (${durationDays} days) exceeds employee’s remaining Sick Leave balance (${profile.sickLeaveBalance} days remaining).`,
          },
          { status: 400 }
        );
      }
    }

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

      // 2. Decrement Leave Balance if APPROVED
      if (status === 'APPROVED') {
        if (leaveRequest.leaveType === 'PAID') {
          await tx.profile.update({
            where: { id: profile.id },
            data: { paidLeaveBalance: profile.paidLeaveBalance - durationDays },
          });
        } else if (leaveRequest.leaveType === 'SICK') {
          await tx.profile.update({
            where: { id: profile.id },
            data: { sickLeaveBalance: profile.sickLeaveBalance - durationDays },
          });
        }

        // Sync dates into Attendance table
        const existingAttendances = await tx.attendance.findMany({
          where: {
            userId: leaveRequest.userId,
            date: { in: datesToSync },
          },
        });

        const attendanceMap = new Map(existingAttendances.map((a) => [a.date, a]));

        for (const dateStr of datesToSync) {
          const existing = attendanceMap.get(dateStr);

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

    // 3. LOG CONSOLIDATED ADMIN AUDIT LOG
    await logAdminAudit({
      actorUserId: session.userId,
      action: status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      targetUserId: leaveRequest.userId,
      details: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} ${leaveRequest.leaveType} leave for ${profile.firstName} ${profile.lastName} (${durationDays} days). Comment: ${adminComment || 'None'}`,
    });

    // 4. TRIGGER NOTIFICATION & SIMULATED EMAIL ALERT TO EMPLOYEE
    const sStr = startDateObj.toISOString().split('T')[0];
    const eStr = endDateObj.toISOString().split('T')[0];
    const notifMsg = `Your ${leaveRequest.leaveType} leave request for ${sStr} to ${eStr} was ${status.toLowerCase()}${adminComment ? `. Admin comment: "${adminComment}"` : '.'}`;

    await createNotificationAndEmailAlert({
      userId: leaveRequest.userId,
      type: 'LEAVE_STATUS',
      message: notifMsg,
    });

    // 5. TRIGGER LOW LEAVE BALANCE ALERT IF REMAINING BALANCE <= 3 DAYS
    const newPaidBal = leaveRequest.leaveType === 'PAID' ? profile.paidLeaveBalance - durationDays : profile.paidLeaveBalance;
    const newSickBal = leaveRequest.leaveType === 'SICK' ? profile.sickLeaveBalance - durationDays : profile.sickLeaveBalance;

    if (status === 'APPROVED' && (newPaidBal <= 3 || newSickBal <= 3)) {
      await createNotificationAndEmailAlert({
        userId: leaveRequest.userId,
        type: 'LOW_LEAVE_BALANCE',
        message: `Low Leave Balance Alert: You have ${newPaidBal} paid leave days and ${newSickBal} sick leave days remaining.`,
      });
    }

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
