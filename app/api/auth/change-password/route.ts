import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    const errors: Record<string, string> = {};

    if (!currentPassword) errors.currentPassword = 'Current password is required';
    if (!newPassword) errors.newPassword = 'New password is required';
    if (!confirmPassword) errors.confirmPassword = 'Password confirmation is required';

    if (newPassword && newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'New password and confirmation do not match';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { errors: { currentPassword: 'The current password you entered is incorrect' } },
        { status: 400 }
      );
    }

    // Hash and update new password
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: session.userId },
      data: {
        passwordHash: newHash,
        firstTimePassword: null, // Clear temp password upon change
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been changed successfully.',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
