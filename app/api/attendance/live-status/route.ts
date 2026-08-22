import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch today's attendance records
    const attendanceRecords = await db.attendance.findMany({
      where: { date: todayStr },
      select: { userId: true, status: true },
    });

    const attendanceMap: Record<string, string> = {};
    attendanceRecords.forEach((a) => {
      attendanceMap[a.userId] = a.status;
    });

    // Fetch today's approved leaves
    const approvedLeaves = await db.leaveRequest.findMany({
      where: { status: 'APPROVED' },
      select: { userId: true, startDate: true, endDate: true },
    });

    const leaveUserIds = new Set<string>();
    for (const l of approvedLeaves) {
      const s = l.startDate.toISOString().split('T')[0];
      const e = l.endDate.toISOString().split('T')[0];
      if (todayStr >= s && todayStr <= e) {
        leaveUserIds.add(l.userId);
      }
    }

    return NextResponse.json({
      success: true,
      todayStr,
      attendanceMap,
      leaveUserIds: Array.from(leaveUserIds),
    });
  } catch (error) {
    console.error('Error fetching live status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
