import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await db.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      const targetNotif = await db.notification.findUnique({
        where: { id: notificationId },
      });

      if (!targetNotif) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      // Server-side Ownership Check
      if (targetNotif.userId !== session.userId) {
        return NextResponse.json(
          { error: 'Forbidden: You cannot modify another user’s notification' },
          { status: 403 }
        );
      }

      await db.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ error: 'Specify notificationId or markAll' }, { status: 400 });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
