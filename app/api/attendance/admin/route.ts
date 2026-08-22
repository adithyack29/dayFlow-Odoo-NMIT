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

    const { searchParams } = new URL(request.url);
    const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    // 1. Fetch all employee users and profiles
    const employees = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        employeeId: true,
        email: true,
        role: true,
        profile: true,
      },
    });

    // 2. Fetch attendance records for selected date
    const attendanceRecords = await db.attendance.findMany({
      where: { date: selectedDate },
    });

    const attendanceMap = new Map(attendanceRecords.map((a) => [a.userId, a]));

    // 3. Fetch approved leave requests covering selected date
    const selectedDateObj = new Date(`${selectedDate}T00:00:00Z`);
    const approvedLeaves = await db.leaveRequest.findMany({
      where: { status: 'APPROVED' },
    });

    const leaveUserIds = new Set<string>();
    for (const l of approvedLeaves) {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      if (selectedDateObj >= start && selectedDateObj <= end) {
        leaveUserIds.add(l.userId);
      }
    }

    let presentCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;

    // Combine into employee attendance rows
    const allRecords = employees.map((emp) => {
      const attRecord = attendanceMap.get(emp.id);
      let status = attRecord ? attRecord.status : 'ABSENT';

      if (!attRecord) {
        if (leaveUserIds.has(emp.id)) {
          status = 'LEAVE';
        } else {
          status = 'ABSENT';
        }
      }

      if (status === 'PRESENT') presentCount++;
      else if (status === 'ABSENT') absentCount++;
      else if (status === 'HALF_DAY') halfDayCount++;
      else if (status === 'LEAVE') leaveCount++;

      const fullName = emp.profile
        ? `${emp.profile.firstName} ${emp.profile.lastName}`
        : emp.email;

      return {
        userId: emp.id,
        employeeId: emp.employeeId,
        fullName,
        email: emp.email,
        department: emp.profile?.department || 'Unassigned',
        designation: emp.profile?.designation || 'Staff',
        status,
        checkInTime: attRecord?.checkInTime ? new Date(attRecord.checkInTime).toLocaleTimeString() : null,
        checkOutTime: attRecord?.checkOutTime ? new Date(attRecord.checkOutTime).toLocaleTimeString() : null,
        adminNote: attRecord?.adminNote || null,
      };
    });

    // Apply search filter if provided
    let filteredRecords = allRecords;
    if (search) {
      filteredRecords = allRecords.filter(
        (r) =>
          r.fullName.toLowerCase().includes(search) ||
          r.employeeId.toLowerCase().includes(search) ||
          r.email.toLowerCase().includes(search) ||
          r.department.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      selectedDate,
      stats: {
        total: employees.length,
        presentCount,
        absentCount,
        halfDayCount,
        leaveCount,
      },
      records: filteredRecords,
    });
  } catch (error) {
    console.error('Error in /api/attendance/admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
