import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const { id } = await params;

    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Server-side Ownership Check: Employee can only cancel their own request
    if (session.role === 'EMPLOYEE' && leaveRequest.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot cancel another employee’s leave request' },
        { status: 403 }
      );
    }

    // Status Check: Can only cancel PENDING requests
    if (leaveRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot cancel leave request. Status is already ${leaveRequest.status}. Only PENDING requests can be cancelled.` },
        { status: 400 }
      );
    }

    await db.leaveRequest.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Leave request cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
