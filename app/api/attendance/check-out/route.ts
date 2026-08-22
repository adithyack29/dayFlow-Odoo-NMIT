import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const serverNow = new Date();
    const todayStr = serverNow.toISOString().split('T')[0];

    const existingAttendance = await db.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.userId,
          date: todayStr,
        },
      },
    });

    if (!existingAttendance || !existingAttendance.checkInTime) {
      return NextResponse.json(
        { error: 'Invalid sequence: You must check in before checking out.' },
        { status: 400 }
      );
    }

    if (existingAttendance.checkOutTime) {
      return NextResponse.json(
        { error: 'You have already checked out for today.' },
        { status: 400 }
      );
    }

    const updatedAttendance = await db.attendance.update({
      where: { id: existingAttendance.id },
      data: {
        checkOutTime: serverNow,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Check-out recorded at ${serverNow.toLocaleTimeString()}`,
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json({ error: 'Failed to record check-out' }, { status: 500 });
  }
}
