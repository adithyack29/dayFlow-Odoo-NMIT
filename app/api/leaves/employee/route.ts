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

    // Server-side RBAC: Employee can only view their own leave history
    if (session.role === 'EMPLOYEE' && targetUserId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own leave requests' },
        { status: 403 }
      );
    }

    const leaveRequests = await db.leaveRequest.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewedBy: {
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

    return NextResponse.json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    console.error('Error fetching employee leaves:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
