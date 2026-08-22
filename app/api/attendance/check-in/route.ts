import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AttendanceStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    let body: { isHalfDay?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // Body optional
    }

    // Server-side timestamp anti-tampering: always compute time on the server
    const serverNow = new Date();
    const todayStr = serverNow.toISOString().split('T')[0];

    // Check if attendance record already exists for today
    const existingAttendance = await db.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.userId,
          date: todayStr,
        },
      },
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      return NextResponse.json(
        { error: 'You have already checked in for today.' },
        { status: 400 }
      );
    }

    /*
     * HALF-DAY / LATE CHECK-IN CUTOFF RULE:
     * - Standard workday start is 09:00 AM local server time.
     * - Cutoff threshold is 13:00 PM (1:00 PM) local server time.
     * - If an employee checks in before 13:00 PM, status is automatically set to PRESENT.
     * - If an employee checks in at or after 13:00 PM (or explicitly requests half-day),
     *   status is set to HALF_DAY.
     */
    const hour = serverNow.getHours();
    const autoHalfDay = hour >= 13 || body.isHalfDay === true;
    const determinedStatus: AttendanceStatus = autoHalfDay
      ? AttendanceStatus.HALF_DAY
      : AttendanceStatus.PRESENT;

    const attendanceRecord = await db.attendance.upsert({
      where: {
        userId_date: {
          userId: session.userId,
          date: todayStr,
        },
      },
      update: {
        checkInTime: serverNow,
        status: determinedStatus,
      },
      create: {
        userId: session.userId,
        date: todayStr,
        checkInTime: serverNow,
        status: determinedStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Check-in recorded at ${serverNow.toLocaleTimeString()} (${determinedStatus})`,
      attendance: attendanceRecord,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 });
  }
}
