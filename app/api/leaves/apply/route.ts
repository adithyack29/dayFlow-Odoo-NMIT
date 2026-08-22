import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { LeaveType } from '@prisma/client';
import { createNotificationAndEmailAlert } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { leaveType, startDate, endDate, remarks, attachmentUrl } = body;

    const errors: Record<string, string> = {};

    // 1. Basic Field Validation
    const validLeaveTypes = ['PAID', 'SICK', 'UNPAID'];
    if (!leaveType || !validLeaveTypes.includes(leaveType)) {
      errors.leaveType = 'Please select a valid leave type (PAID, SICK, or UNPAID)';
    }

    if (!startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!endDate) {
      errors.endDate = 'End date is required';
    }

    // WIREFRAME RULE: Sick leave MANDATORY attachment requirement
    if (leaveType === 'SICK' && (!attachmentUrl || !attachmentUrl.trim())) {
      errors.attachmentUrl = 'A medical certificate attachment is strictly required when applying for Sick Leave.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const startObj = new Date(`${startDate}T00:00:00Z`);
    const endObj = new Date(`${endDate}T00:00:00Z`);

    if (isNaN(startObj.getTime())) {
      errors.startDate = 'Invalid start date format';
    }

    if (isNaN(endObj.getTime())) {
      errors.endDate = 'Invalid end date format';
    }

    if (endObj < startObj) {
      errors.endDate = 'End date cannot be earlier than start date';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // 2. Backdating Business Rule Validation
    const todayStr = new Date().toISOString().split('T')[0];
    const todayObj = new Date(`${todayStr}T00:00:00Z`);

    if (leaveType === 'PAID' || leaveType === 'UNPAID') {
      if (startObj < todayObj) {
        errors.startDate = `${leaveType} leave requests cannot be backdated. Please select a start date on or after today.`;
      }
    } else if (leaveType === 'SICK') {
      const maxBackdateObj = new Date(todayObj);
      maxBackdateObj.setDate(todayObj.getDate() - 7);

      if (startObj < maxBackdateObj) {
        errors.startDate = 'Sick leave requests cannot be backdated by more than 7 days.';
      }
    }

    if (remarks && remarks.length > 300) {
      errors.remarks = 'Remarks must not exceed 300 characters';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // 3. Overlap Prevention Check
    const activeLeaves = await db.leaveRequest.findMany({
      where: {
        userId: session.userId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    for (const existing of activeLeaves) {
      const existingStart = new Date(existing.startDate);
      const existingEnd = new Date(existing.endDate);

      if (startObj <= existingEnd && endObj >= existingStart) {
        const eStartStr = existingStart.toISOString().split('T')[0];
        const eEndStr = existingEnd.toISOString().split('T')[0];
        return NextResponse.json(
          {
            errors: {
              startDate: `Leave request overlaps with an existing ${existing.status} leave request (${eStartStr} to ${eEndStr}).`,
            },
          },
          { status: 400 }
        );
      }
    }

    // 4. Create PENDING Leave Request
    const newLeave = await db.leaveRequest.create({
      data: {
        userId: session.userId,
        leaveType: leaveType as LeaveType,
        startDate: startObj,
        endDate: endObj,
        remarks: remarks?.trim() || '',
        attachmentUrl: attachmentUrl?.trim() || null,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // 5. TRIGGER NOTIFICATION TO ALL ADMINS
    const empName = newLeave.user.profile
      ? `${newLeave.user.profile.firstName} ${newLeave.user.profile.lastName}`
      : session.email;

    const admins = await db.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      await createNotificationAndEmailAlert({
        userId: admin.id,
        type: 'LEAVE_SUBMITTED',
        message: `${empName} submitted a new ${leaveType} leave request for ${startDate} to ${endDate}.`,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Leave request submitted successfully and is pending admin review.',
        leaveRequest: newLeave,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error applying for leave:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
