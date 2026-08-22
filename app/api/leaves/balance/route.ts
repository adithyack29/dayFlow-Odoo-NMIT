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

    // Server-side RBAC: Employee can only view their own balance
    if (session.role === 'EMPLOYEE' && targetUserId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own leave balance' },
        { status: 403 }
      );
    }

    const profile = await db.profile.findUnique({
      where: { userId: targetUserId },
      select: {
        paidLeaveBalance: true,
        sickLeaveBalance: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      balances: {
        paidLeaveBalance: profile.paidLeaveBalance,
        sickLeaveBalance: profile.sickLeaveBalance,
        unpaidLeaveBalance: 'Unlimited',
      },
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
