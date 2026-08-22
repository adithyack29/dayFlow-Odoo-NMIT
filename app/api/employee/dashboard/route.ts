import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // 1. Query current user details & profile
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        employeeId: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Fetch recent attendance logs (last 5)
    const recentAttendance = await db.attendance.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 3. Fetch recent leave requests (last 5)
    const recentLeaves = await db.leaveRequest.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 4. Determine today's attendance record
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendance = await db.attendance.findUnique({
      where: {
        userId_date: {
          userId: session.userId,
          date: todayStr,
        },
      },
    });

    // 5. Construct real recent activity timeline (combining attendance & leave updates)
    const activityItems: Array<{
      id: string;
      type: 'ATTENDANCE' | 'LEAVE';
      title: string;
      description: string;
      timestamp: string;
      statusBadge: string;
    }> = [];

    for (const att of recentAttendance) {
      activityItems.push({
        id: `att-${att.id}`,
        type: 'ATTENDANCE',
        title: `Attendance Marked: ${att.status}`,
        description: `Check-in recorded for date ${att.date}`,
        timestamp: att.createdAt.toISOString(),
        statusBadge: att.status,
      });
    }

    for (const l of recentLeaves) {
      activityItems.push({
        id: `leave-${l.id}`,
        type: 'LEAVE',
        title: `Leave Request (${l.leaveType}): ${l.status}`,
        description: `${new Date(l.startDate).toLocaleDateString()} to ${new Date(l.endDate).toLocaleDateString()} — ${l.remarks}`,
        timestamp: l.updatedAt ? l.updatedAt.toISOString() : l.createdAt.toISOString(),
        statusBadge: l.status,
      });
    }

    // Sort chronologically descending (most recent first) and take top 5
    activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const finalActivity = activityItems.slice(0, 5);

    return NextResponse.json({
      success: true,
      user,
      todayAttendanceStatus: todayAttendance ? todayAttendance.status : 'NOT_MARKED',
      todayAttendance,
      recentActivity: finalActivity,
    });
  } catch (error) {
    console.error('Error in /api/employee/dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
