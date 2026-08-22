import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateEmployeeLoginId } from '@/lib/loginIdGenerator';
import { logAdminAudit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // SERVER-SIDE RBAC: Admin only
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only Admins can onboard new employees' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, department, designation, joiningYear } = body;

    const errors: Record<string, string> = {};

    if (!firstName || !firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName || !lastName.trim()) errors.lastName = 'Last name is required';
    if (!email || !email.trim()) errors.email = 'Email address is required';
    if (!department || !department.trim()) errors.department = 'Department is required';
    if (!designation || !designation.trim()) errors.designation = 'Designation is required';

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check email uniqueness
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { errors: { email: 'An employee account with this email address already exists.' } },
        { status: 400 }
      );
    }

    // 1. Auto-generate Login ID in format: [CompanyCode][Initials][Year][Serial] -> e.g. OIJODO20220001
    const targetYear = joiningYear ? Number(joiningYear) : new Date().getFullYear();
    const { loginId } = await generateEmployeeLoginId(firstName, lastName, targetYear);

    // 2. Auto-generate First-Time Password (e.g. Dayflow#4829)
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const rawFirstTimePassword = `Dayflow#${randomDigits}`;
    const passwordHash = await bcrypt.hash(rawFirstTimePassword, 10);

    // 3. Transactional User & 7-Tab Profile Creation
    const newUser = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          employeeId: loginId,
          email: cleanEmail,
          passwordHash,
          firstTimePassword: rawFirstTimePassword,
          role: 'EMPLOYEE',
          isEmailVerified: true,
          profile: {
            create: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              designation: designation.trim(),
              department: department.trim(),
              joiningDate: new Date(`${targetYear}-01-01`),

              // Wireframe Private Info
              jobPosition: designation.trim(),
              managerName: 'HR Administration',
              location: 'Head Office',
              empCode: loginId,

              // Wireframe Salary Info (Worked Example Defaults: Wage = 50,000)
              monthlyWage: 50000.0,
              yearlyWage: 600000.0,
              baseSalary: 25000.0,      // 50% of Wage
              housingAllowance: 12500.0, // 50% of Basic
              standardAllowance: 4167.0, // Fixed
              performanceBonus: 2082.5,  // 8.33% of Basic
              otherAllowances: 2082.5,   // LTA = 8.333% of Basic
              fixedAllowance: 4168.0,    // Plug value
              pfEmployee: 3000.0,        // 12% of Basic
              pfEmployer: 3000.0,        // 12% of Basic
              professionalTax: 200.0,    // Fixed ₹200

              // Leave Allocations matching Wireframe: 24 Paid, 7 Sick
              paidLeaveBalance: 24.0,
              sickLeaveBalance: 7.0,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      return createdUser;
    });

    // 4. Log Admin Audit Event
    await logAdminAudit({
      actorUserId: session.userId,
      action: 'PROFILE_EDIT',
      targetUserId: newUser.id,
      details: `Created new employee ${firstName} ${lastName} with Login ID: ${loginId} (${department})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Employee onboarded successfully',
      loginId,
      firstTimePassword: rawFirstTimePassword,
      user: {
        id: newUser.id,
        employeeId: newUser.employeeId,
        email: newUser.email,
        profile: newUser.profile,
      },
    });
  } catch (error) {
    console.error('Error onboarding employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
