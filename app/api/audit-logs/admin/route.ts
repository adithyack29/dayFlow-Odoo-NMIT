import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { AuditAction } from '@prisma/client';

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
    const filterAction = searchParams.get('action') || 'ALL';
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const whereClause: { action?: AuditAction } = {};
    if (filterAction !== 'ALL' && Object.values(AuditAction).includes(filterAction as AuditAction)) {
      whereClause.action = filterAction as AuditAction;
    }

    const auditLogs = await db.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        actorUser: {
          select: {
            employeeId: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        targetUser: {
          select: {
            employeeId: true,
            email: true,
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

    let filteredLogs = auditLogs;
    if (search) {
      filteredLogs = auditLogs.filter((log) => {
        const actorName = log.actorUser.profile
          ? `${log.actorUser.profile.firstName} ${log.actorUser.profile.lastName}`.toLowerCase()
          : log.actorUser.email.toLowerCase();
        const targetName = log.targetUser?.profile
          ? `${log.targetUser.profile.firstName} ${log.targetUser.profile.lastName}`.toLowerCase()
          : log.targetUser?.email.toLowerCase() || '';
        const details = log.details.toLowerCase();

        return (
          actorName.includes(search) ||
          targetName.includes(search) ||
          log.actorUser.employeeId.toLowerCase().includes(search) ||
          (log.targetUser?.employeeId.toLowerCase() || '').includes(search) ||
          details.includes(search)
        );
      });
    }

    return NextResponse.json({
      success: true,
      auditLogs: filteredLogs,
    });
  } catch (error) {
    console.error('Error fetching admin audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
