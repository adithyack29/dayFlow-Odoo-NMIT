import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Verification token is missing' },
      { status: 400 }
    );
  }

  try {
    const user = await db.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/signin?verified=false&error=invalid_token', request.url));
    }

    // Update user record: set isEmailVerified = true, clear token
    await db.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });

    // Redirect user to sign-in page with verified badge parameter
    return NextResponse.redirect(new URL('/signin?verified=true', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/signin?verified=false&error=server_error', request.url));
  }
}
