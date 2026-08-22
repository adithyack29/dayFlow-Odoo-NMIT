import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AttendanceStatus } from '@prisma/client';

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
    const { userId, date, newStatus, adminNote } = body;

    if (!userId || !date || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, date, and newStatus are required.' },
        { status: 400 }
      );
    }

    // MANDATORY ADMIN REMARK VALIDATION
    if (!adminNote || typeof adminNote !== 'string' || !adminNote.trim()) {
      return NextResponse.json(
        { error: 'An admin remark/reason is strictly required when manually overriding an attendance record.' },
        { status: 400 }
      );
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid attendance status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Find existing attendance record or create new one
    const existing = await db.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });

    let updatedRecord;
    if (existing) {
      updatedRecord = await db.attendance.update({
        where: { id: existing.id },
        data: {
          status: newStatus as AttendanceStatus,
          adminNote: adminNote.trim(),
        },
      });
    } else {
      updatedRecord = await db.attendance.create({
        data: {
          userId,
          date,
          status: newStatus as AttendanceStatus,
          adminNote: adminNote.trim(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance status overridden successfully by Admin',
      attendance: updatedRecord,
    });
  } catch (error: unknown) {
    console.error('Error overriding attendance:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
