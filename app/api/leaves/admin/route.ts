import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { LeaveStatus } from '@prisma/client';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const whereClause: { status?: LeaveStatus } = {};
    if (filterStatus === 'PENDING' || filterStatus === 'APPROVED' || filterStatus === 'REJECTED') {
      whereClause.status = filterStatus as LeaveStatus;
    }

    const allLeaves = await db.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            employeeId: true,
            email: true,
            role: true,
            profile: true,
          },
        },
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

    // Actionable Queue Priority: PENDING requests first, then by createdAt desc
    allLeaves.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Filter by search query if provided
    let filteredLeaves = allLeaves;
    if (search) {
      filteredLeaves = allLeaves.filter((l) => {
        const empId = l.user.employeeId.toLowerCase();
        const email = l.user.email.toLowerCase();
        const firstName = l.user.profile?.firstName.toLowerCase() || '';
        const lastName = l.user.profile?.lastName.toLowerCase() || '';
        const remarks = l.remarks.toLowerCase();

        return (
          empId.includes(search) ||
          email.includes(search) ||
          firstName.includes(search) ||
          lastName.includes(search) ||
          remarks.includes(search)
        );
      });
    }

    return NextResponse.json({
      success: true,
      leaveRequests: filteredLeaves,
    });
  } catch (error) {
    console.error('Error fetching admin leave queue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
