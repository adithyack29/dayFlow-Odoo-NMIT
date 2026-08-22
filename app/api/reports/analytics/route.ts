import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Server-side RBAC: Admin only
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    // 1. Attendance Metrics Over Date Range
    const attendances = await db.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            profile: {
              select: {
                department: true,
              },
            },
          },
        },
      },
    });

    const attendanceStats = {
      total: attendances.length,
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
    };

    const departmentStats: Record<string, { present: number; absent: number; halfDay: number; leave: number }> = {};

    attendances.forEach((a) => {
      const dept = a.user.profile?.department || 'General Operations';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { present: 0, absent: 0, halfDay: 0, leave: 0 };
      }

      if (a.status === 'PRESENT') {
        attendanceStats.present++;
        departmentStats[dept].present++;
      } else if (a.status === 'ABSENT') {
        attendanceStats.absent++;
        departmentStats[dept].absent++;
      } else if (a.status === 'HALF_DAY') {
        attendanceStats.halfDay++;
        departmentStats[dept].halfDay++;
      } else if (a.status === 'LEAVE') {
        attendanceStats.leave++;
        departmentStats[dept].leave++;
      }
    });

    // 2. Leave Metrics Over Date Range
    const startObj = new Date(`${startDate}T00:00:00Z`);
    const endObj = new Date(`${endDate}T23:59:59Z`);

    const leaves = await db.leaveRequest.findMany({
      where: {
        createdAt: {
          gte: startObj,
          lte: endObj,
        },
      },
    });

    const leaveStats = {
      total: leaves.length,
      byStatus: {
        PENDING: leaves.filter((l) => l.status === 'PENDING').length,
        APPROVED: leaves.filter((l) => l.status === 'APPROVED').length,
        REJECTED: leaves.filter((l) => l.status === 'REJECTED').length,
      },
      byType: {
        PAID: leaves.filter((l) => l.leaveType === 'PAID').length,
        SICK: leaves.filter((l) => l.leaveType === 'SICK').length,
        UNPAID: leaves.filter((l) => l.leaveType === 'UNPAID').length,
      },
    };

    return NextResponse.json({
      success: true,
      dateRange: { startDate, endDate },
      attendanceStats,
      departmentStats,
      leaveStats,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
