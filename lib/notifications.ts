import { db } from '@/lib/db';
import { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
}

export async function createNotificationAndEmailAlert({
  userId,
  type,
  message,
}: CreateNotificationParams) {
  try {
    // 1. Create in-app notification record in SQLite DB
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        message,
      },
      include: {
        user: {
          select: {
            email: true,
            employeeId: true,
          },
        },
      },
    });

    // 2. Simulated Console Email Logger (No 3rd party cloud service required)
    const emailTo = notification.user?.email || userId;
    const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    console.log(`
======================= SIMULATED EMAIL ALERT =======================
To: ${emailTo} (${notification.user?.employeeId || 'System User'})
Subject: [Dayflow HRMS Alert] - ${type}
Timestamp: ${timeStr} UTC
Message: ${message}
=====================================================================
    `);

    return notification;
  } catch (error) {
    console.error('Error creating notification / email alert:', error);
  }
}
