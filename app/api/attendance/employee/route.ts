import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId') || session.userId;

    // Server-side RBAC: Employee can only view their own attendance data
    if (session.role === 'EMPLOYEE' && targetUserId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own attendance history' },
        { status: 403 }
      );
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Compute current week's Monday to Sunday dates
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const weekDays: Array<{ dateStr: string; dayName: string }> = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: dayNames[i],
      });
    }

    const dateStrings = weekDays.map((w) => w.dateStr);

    // 1. Fetch attendance records for this week
    const attendanceRecords = await db.attendance.findMany({
      where: {
        userId: targetUserId,
        date: { in: dateStrings },
      },
    });

    const attendanceMap = new Map(attendanceRecords.map((a) => [a.date, a]));

    // 2. Fetch approved leave requests for leave-integration readiness
    const approvedLeaves = await db.leaveRequest.findMany({
      where: {
        userId: targetUserId,
        status: 'APPROVED',
      },
    });

    // Construct weekly view items (Mon - Sun)
    const weeklyView = weekDays.map(({ dateStr, dayName }) => {
      const record = attendanceMap.get(dateStr);
      let computedStatus = record ? record.status : 'UPCOMING';

      // Check if date is in past or today and no record exists
      if (!record) {
        // Check if an approved leave covers this date
        const targetDateObj = new Date(`${dateStr}T00:00:00Z`);
        const isOnLeave = approvedLeaves.some((l) => {
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          return targetDateObj >= start && targetDateObj <= end;
        });

        if (isOnLeave) {
          computedStatus = 'LEAVE';
        } else if (dateStr < todayStr) {
          computedStatus = 'ABSENT';
        } else if (dateStr === todayStr) {
          /*
           * CUTOFF RULE FOR TODAY:
           * If 13:00 PM has passed and employee has not checked in, treat today as ABSENT.
           */
          computedStatus = today.getHours() >= 13 ? 'ABSENT' : 'UPCOMING';
        }
      }

      let hoursWorked = 0;
      if (record?.checkInTime && record?.checkOutTime) {
        const diffMs = new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime();
        hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(1));
      }

      return {
        date: dateStr,
        dayName,
        status: computedStatus,
        checkInTime: record?.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : null,
        checkOutTime: record?.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : null,
        hoursWorked,
        adminNote: record?.adminNote || null,
        isToday: dateStr === todayStr,
      };
    });

    const todayRecord = attendanceMap.get(todayStr) || null;

    return NextResponse.json({
      success: true,
      todayStr,
      todayRecord,
      weeklyView,
    });
  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
