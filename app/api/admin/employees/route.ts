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
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const isAdmin = session.role === 'ADMIN';

    // Query employees from DB with profiles
    const employees = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        employeeId: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
            designation: true,
            department: true,
            joiningDate: true,
            profilePictureUrl: true,
            // Sensitive fields included ONLY for Admin
            ...(isAdmin
              ? {
                  baseSalary: true,
                  housingAllowance: true,
                  otherAllowances: true,
                  documents: true,
                }
              : {}),
          },
        },
      },
    });

    // Filter by search query if provided
    let filteredEmployees = employees;
    if (search) {
      filteredEmployees = employees.filter((emp) => {
        const empId = emp.employeeId.toLowerCase();
        const email = emp.email.toLowerCase();
        const firstName = emp.profile?.firstName.toLowerCase() || '';
        const lastName = emp.profile?.lastName.toLowerCase() || '';
        const dept = emp.profile?.department.toLowerCase() || '';
        const desig = emp.profile?.designation.toLowerCase() || '';

        return (
          empId.includes(search) ||
          email.includes(search) ||
          firstName.includes(search) ||
          lastName.includes(search) ||
          dept.includes(search) ||
          desig.includes(search)
        );
      });
    }

    return NextResponse.json({
      success: true,
      employees: filteredEmployees,
      totalCount: filteredEmployees.length,
    });
  } catch (error) {
    console.error('Error in /api/admin/employees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
