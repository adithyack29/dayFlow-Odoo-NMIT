import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createNotificationAndEmailAlert } from '@/lib/notifications';
import { logAdminAudit } from '@/lib/audit';

export async function PUT(request: Request) {
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

    const body = await request.json();
    const { profileId, baseSalary, housingAllowance, otherAllowances } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    const numBase = Number(baseSalary);
    const numHousing = Number(housingAllowance || 0);
    const numOther = Number(otherAllowances || 0);

    const errors: Record<string, string> = {};

    if (isNaN(numBase) || numBase < 0) {
      errors.baseSalary = 'Base salary must be a non-negative number';
    }
    if (isNaN(numHousing) || numHousing < 0) {
      errors.housingAllowance = 'Housing allowance must be a non-negative number';
    }
    if (isNaN(numOther) || numOther < 0) {
      errors.otherAllowances = 'Other allowances must be a non-negative number';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const currentProfile = await db.profile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!currentProfile) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    // Transactional Update & Salary Audit Log creation
    const updatedProfile = await db.$transaction(async (tx) => {
      // 1. Log Salary Audit Entry
      await tx.salaryHistory.create({
        data: {
          profileId,
          oldBaseSalary: currentProfile.baseSalary,
          newBaseSalary: numBase,
          oldHousingAllowance: currentProfile.housingAllowance,
          newHousingAllowance: numHousing,
          oldOtherAllowances: currentProfile.otherAllowances,
          newOtherAllowances: numOther,
          changedById: session.userId,
        },
      });

      // 2. Update Profile salary fields
      const updated = await tx.profile.update({
        where: { id: profileId },
        data: {
          baseSalary: numBase,
          housingAllowance: numHousing,
          otherAllowances: numOther,
        },
      });

      return updated;
    });

    // 3. LOG CONSOLIDATED ADMIN AUDIT LOG
    await logAdminAudit({
      actorUserId: session.userId,
      action: 'SALARY_UPDATE',
      targetUserId: currentProfile.userId,
      details: `Updated salary for ${currentProfile.firstName} ${currentProfile.lastName}: Base $${currentProfile.baseSalary} -> $${numBase}, Housing $${numHousing}, Other $${numOther}`,
    });

    // 4. TRIGGER NOTIFICATION & SIMULATED EMAIL ALERT TO EMPLOYEE
    await createNotificationAndEmailAlert({
      userId: currentProfile.userId,
      type: 'SALARY_UPDATED',
      message: `Your compensation structure was updated by HR Administration. New Base Salary: $${numBase.toLocaleString()}.`,
    });

    return NextResponse.json({
      success: true,
      message: 'Salary structure updated and audit log recorded successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error in /api/payroll/admin/update-salary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
