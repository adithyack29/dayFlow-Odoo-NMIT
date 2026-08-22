import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { createNotificationAndEmailAlert } from '@/lib/notifications';
import { logAdminAudit } from '@/lib/audit';

// Zod schema for Employee self-update (Phone, Address, Profile Picture only)
const employeeProfileUpdateSchema = z.object({
  phone: z.string().trim().max(30, 'Phone number must not exceed 30 characters').optional().nullable(),
  address: z.string().trim().max(250, 'Address must not exceed 250 characters').optional().nullable(),
  profilePictureUrl: z.string().optional().nullable(),
});

// Zod schema for Admin full-update
const adminProfileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string().trim().max(30, 'Phone number must not exceed 30 characters').optional().nullable(),
  address: z.string().trim().max(250, 'Address must not exceed 250 characters').optional().nullable(),
  designation: z.string().trim().min(1, 'Designation is required'),
  department: z.string().trim().min(1, 'Department is required'),
  joiningDate: z.string().optional(),
  baseSalary: z.number().min(0, 'Base salary must be non-negative'),
  housingAllowance: z.number().min(0, 'Housing allowance must be non-negative').optional(),
  otherAllowances: z.number().min(0, 'Other allowances must be non-negative').optional(),
  profilePictureUrl: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const { userId } = await params;

    // Access Control: Employee can only view their own profile
    if (session.role === 'EMPLOYEE' && session.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view other employee profiles' },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
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
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();

    // Access Control Check: Employee trying to update another employee's profile
    if (session.role === 'EMPLOYEE' && session.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot modify another employee profile' },
        { status: 403 }
      );
    }

    // Access Control Check: Employee trying to modify restricted fields
    if (session.role === 'EMPLOYEE') {
      const restrictedAttempted = Object.keys(body).filter((key) =>
        ['designation', 'department', 'joiningDate', 'baseSalary', 'housingAllowance', 'otherAllowances', 'email', 'employeeId', 'role', 'firstName', 'lastName'].includes(key)
      );

      if (restrictedAttempted.length > 0) {
        return NextResponse.json(
          {
            error: `Forbidden: Employees are not allowed to modify restricted fields (${restrictedAttempted.join(', ')}). Only Admins can modify these fields.`,
          },
          { status: 403 }
        );
      }

      // Validate Employee self-update schema
      const parseResult = employeeProfileUpdateSchema.safeParse(body);
      if (!parseResult.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parseResult.error.issues) {
          fieldErrors[issue.path[0]?.toString() || 'general'] = issue.message;
        }
        return NextResponse.json({ errors: fieldErrors }, { status: 400 });
      }

      const { phone, address, profilePictureUrl } = parseResult.data;

      const updatedProfile = await db.profile.upsert({
        where: { userId },
        update: {
          phone,
          address,
          ...(profilePictureUrl !== undefined ? { profilePictureUrl } : {}),
        },
        create: {
          userId,
          firstName: 'Employee',
          lastName: 'User',
          phone,
          address,
          designation: 'Staff Employee',
          department: 'General Operations',
          profilePictureUrl,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        profile: updatedProfile,
      });
    }

    // User is ADMIN: Validate full admin schema
    const parseResult = adminProfileUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        fieldErrors[issue.path[0]?.toString() || 'general'] = issue.message;
      }
      return NextResponse.json({ errors: fieldErrors }, { status: 400 });
    }

    const data = parseResult.data;

    const updatedProfile = await db.profile.upsert({
      where: { userId },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        designation: data.designation,
        department: data.department,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
        baseSalary: data.baseSalary,
        housingAllowance: data.housingAllowance ?? 0,
        otherAllowances: data.otherAllowances ?? 0,
        ...(data.profilePictureUrl !== undefined ? { profilePictureUrl: data.profilePictureUrl } : {}),
      },
      create: {
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        designation: data.designation,
        department: data.department,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
        baseSalary: data.baseSalary,
        housingAllowance: data.housingAllowance ?? 0,
        otherAllowances: data.otherAllowances ?? 0,
        profilePictureUrl: data.profilePictureUrl,
      },
    });

    // LOG CONSOLIDATED ADMIN AUDIT LOG
    await logAdminAudit({
      actorUserId: session.userId,
      action: 'PROFILE_EDIT',
      targetUserId: userId,
      details: `Admin updated profile for ${data.firstName} ${data.lastName} (${data.department} - ${data.designation})`,
    });

    // TRIGGER NOTIFICATION & SIMULATED EMAIL ALERT TO EMPLOYEE
    await createNotificationAndEmailAlert({
      userId,
      type: 'PROFILE_UPDATED',
      message: `Your employment profile details (Designation, Department, Salary) were updated by HR Administration.`,
    });

    return NextResponse.json({
      success: true,
      message: 'Employee profile updated successfully by Admin',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
