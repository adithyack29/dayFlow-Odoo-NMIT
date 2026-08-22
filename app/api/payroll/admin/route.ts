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

    // Fetch all employees and profiles
    const employees = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        employeeId: true,
        email: true,
        role: true,
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
            baseSalary: true,
            housingAllowance: true,
            otherAllowances: true,
            updatedAt: true,
          },
        },
      },
    });

    // Fetch salary change audit logs
    const salaryHistories = await db.salaryHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                employeeId: true,
              },
            },
          },
        },
        changedBy: {
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
      employees,
      salaryHistories,
    });
  } catch (error) {
    console.error('Error in /api/payroll/admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
