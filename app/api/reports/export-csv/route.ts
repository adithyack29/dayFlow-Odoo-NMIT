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
    const type = searchParams.get('type') || 'attendance';
    const startDate = searchParams.get('startDate') || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    let csvContent = '';

    if (type === 'attendance') {
      const records = await db.attendance.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          user: {
            select: {
              employeeId: true,
              email: true,
              profile: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      });

      // CSV Header
      csvContent = 'Date,Employee ID,Full Name,Email,Department,Status,Check-In Time,Check-Out Time,Admin Note\n';

      records.forEach((r) => {
        const empId = r.user.employeeId;
        const name = r.user.profile ? `"${r.user.profile.firstName} ${r.user.profile.lastName}"` : r.user.email;
        const email = r.user.email;
        const dept = r.user.profile ? `"${r.user.profile.department}"` : 'General Operations';
        const status = r.status;
        const checkIn = r.checkInTime ? new Date(r.checkInTime).toISOString() : '';
        const checkOut = r.checkOutTime ? new Date(r.checkOutTime).toISOString() : '';
        const note = r.adminNote ? `"${r.adminNote.replace(/"/g, '""')}"` : '';

        csvContent += `${r.date},${empId},${name},${email},${dept},${status},${checkIn},${checkOut},${note}\n`;
      });
    } else {
      const startObj = new Date(`${startDate}T00:00:00Z`);
      const endObj = new Date(`${endDate}T23:59:59Z`);

      const records = await db.leaveRequest.findMany({
        where: {
          createdAt: {
            gte: startObj,
            lte: endObj,
          },
        },
        include: {
          user: {
            select: {
              employeeId: true,
              email: true,
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // CSV Header
      csvContent = 'Request ID,Employee ID,Full Name,Email,Leave Type,Start Date,End Date,Status,Remarks,Admin Comment,Created At\n';

      records.forEach((r) => {
        const reqId = r.id;
        const empId = r.user.employeeId;
        const name = r.user.profile ? `"${r.user.profile.firstName} ${r.user.profile.lastName}"` : r.user.email;
        const email = r.user.email;
        const lType = r.leaveType;
        const sDate = new Date(r.startDate).toISOString().split('T')[0];
        const eDate = new Date(r.endDate).toISOString().split('T')[0];
        const status = r.status;
        const remarks = r.remarks ? `"${r.remarks.replace(/"/g, '""')}"` : '';
        const comment = r.adminComment ? `"${r.adminComment.replace(/"/g, '""')}"` : '';
        const created = new Date(r.createdAt).toISOString();

        csvContent += `${reqId},${empId},${name},${email},${lType},${sDate},${eDate},${status},${remarks},${comment},${created}\n`;
      });
    }

    const filename = `dayflow-${type}-report-${startDate}-to-${endDate}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
