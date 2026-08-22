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

    // Server-side RBAC: Employee can ONLY view their own payroll data (100% Read-Only)
    if (session.role === 'EMPLOYEE' && targetUserId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own salary structure and payslips' },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        employeeId: true,
        email: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
            baseSalary: true,
            housingAllowance: true,
            otherAllowances: true,
          },
        },
      },
    });

    if (!user || !user.profile) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    const profile = user.profile;
    const grossSalary = profile.baseSalary + (profile.housingAllowance || 0) + (profile.otherAllowances || 0);

    // Fetch generated monthly payslips
    const payslips = await db.payslip.findMany({
      where: { userId: targetUserId },
      orderBy: { month: 'desc' },
    });

    return NextResponse.json({
      success: true,
      salaryStructure: {
        baseSalary: profile.baseSalary,
        housingAllowance: profile.housingAllowance,
        otherAllowances: profile.otherAllowances,
        grossSalary,
      },
      user: {
        employeeId: user.employeeId,
        email: user.email,
        fullName: `${profile.firstName} ${profile.lastName}`,
        designation: profile.designation,
        department: profile.department,
      },
      payslips,
    });
  } catch (error) {
    console.error('Error in /api/payroll/employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
