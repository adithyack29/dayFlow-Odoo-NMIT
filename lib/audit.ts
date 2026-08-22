import { db } from '@/lib/db';
import { AuditAction } from '@prisma/client';

interface LogAuditParams {
  actorUserId: string;
  action: AuditAction;
  targetUserId?: string | null;
  details: string;
}

export async function logAdminAudit({
  actorUserId,
  action,
  targetUserId,
  details,
}: LogAuditParams) {
  try {
    const logEntry = await db.auditLog.create({
      data: {
        actorUserId,
        action,
        targetUserId: targetUserId || null,
        details,
      },
    });

    return logEntry;
  } catch (error) {
    console.error('Error writing to admin audit log:', error);
  }
}
