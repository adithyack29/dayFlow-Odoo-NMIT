import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
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
    const { month } = body; // Format: YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Please use YYYY-MM (e.g., 2026-08)' },
        { status: 400 }
      );
    }

    /*
     * MONTHLY PAYSLIP DEDUCTION FORMULA & BUSINESS RULE:
     * - Standard Workdays Per Month: 22 working days.
     * - Daily Gross Rate = Gross Salary / 22.
     * - Absent Days: Count of 'ABSENT' records in Attendance for target month.
     * - Unpaid Leave Days: Count of approved 'UNPAID' leave days in LeaveRequest for target month.
     * - Deductions = (Absent Days + Unpaid Leave Days) * (Gross Salary / 22).
     * - Net Salary = Math.max(0, Gross Salary - Deductions).
     */

    const allUsers = await db.user.findMany({
      include: {
        profile: true,
      },
    });

    let generatedCount = 0;

    for (const u of allUsers) {
      if (!u.profile) continue;

      const profile = u.profile;
      const grossSalary = profile.baseSalary + profile.housingAllowance + profile.otherAllowances;

      // 1. Count ABSENT days for target month
      const absentCount = await db.attendance.count({
        where: {
          userId: u.id,
          date: { startsWith: month },
          status: 'ABSENT',
        },
      });

      // 2. Count approved UNPAID leave days for target month
      const unpaidLeaves = await db.leaveRequest.findMany({
        where: {
          userId: u.id,
          leaveType: 'UNPAID',
          status: 'APPROVED',
        },
      });

      let unpaidDaysCount = 0;
      for (const l of unpaidLeaves) {
        const s = new Date(l.startDate);
        const e = new Date(l.endDate);
        const cur = new Date(s);
        while (cur <= e) {
          const dateStr = cur.toISOString().split('T')[0];
          if (dateStr.startsWith(month)) {
            unpaidDaysCount++;
          }
          cur.setDate(cur.getDate() + 1);
        }
      }

      // 3. Deduction Math
      const dailyRate = grossSalary > 0 ? grossSalary / 22 : 0;
      const totalDeductions = Math.round((absentCount + unpaidDaysCount) * dailyRate * 100) / 100;
      const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

      // 4. Upsert Payslip
      await db.payslip.upsert({
        where: {
          userId_month: {
            userId: u.id,
            month,
          },
        },
        update: {
          baseSalary: profile.baseSalary,
          housingAllowance: profile.housingAllowance,
          otherAllowances: profile.otherAllowances,
          grossSalary,
          absentDays: absentCount,
          unpaidLeaveDays: unpaidDaysCount,
          deductions: totalDeductions,
          netSalary,
          generatedById: session.userId,
          generatedAt: new Date(),
        },
        create: {
          userId: u.id,
          month,
          baseSalary: profile.baseSalary,
          housingAllowance: profile.housingAllowance,
          otherAllowances: profile.otherAllowances,
          grossSalary,
          absentDays: absentCount,
          unpaidLeaveDays: unpaidDaysCount,
          deductions: totalDeductions,
          netSalary,
          generatedById: session.userId,
        },
      });

      generatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${generatedCount} payslips for ${month}`,
      month,
      generatedCount,
    });
  } catch (error: unknown) {
    console.error('Error generating payslips:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
