import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // Server-side Admin Role Verification
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Compute live metrics from database
    const [totalEmployees, todayPresentCount, todayAbsentCount, pendingLeavesCount] = await Promise.all([
      db.user.count(),
      db.attendance.count({
        where: {
          date: todayStr,
          status: 'PRESENT',
        },
      }),
      db.attendance.count({
        where: {
          date: todayStr,
          status: 'ABSENT',
        },
      }),
      db.leaveRequest.count({
        where: {
          status: 'PENDING',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees,
        todayPresentCount,
        todayAbsentCount,
        pendingLeavesCount,
        todayDate: todayStr,
      },
    });
  } catch (error) {
    console.error('Error in /api/admin/dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
