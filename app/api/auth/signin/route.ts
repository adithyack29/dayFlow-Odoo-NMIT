import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signJWT, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const loginInput = (body.email || body.loginId || '').trim();
    const password = body.password || '';

    const errors: Record<string, string> = {};
    if (!loginInput) errors.email = 'Login ID or Email address is required';
    if (!password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Search user by email OR employeeId (Login ID)
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: loginInput.toLowerCase() },
          { employeeId: loginInput.toUpperCase() },
        ],
      },
    });

    const isPasswordValid = user ? await verifyPassword(password, user.passwordHash) : false;

    if (!user || !isPasswordValid) {
      return NextResponse.json(
        { errors: { general: 'Invalid Login ID / Email address or password. Please try again.' } },
        { status: 401 }
      );
    }

    // Issue JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    });

    const redirectUrl = user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/employee';

    const response = NextResponse.json(
      {
        success: true,
        message: 'Signed in successfully',
        redirectUrl,
        user: {
          id: user.id,
          employeeId: user.employeeId,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      },
      { status: 200 }
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Sign in API error:', error);
    return NextResponse.json(
      { errors: { general: 'An unexpected error occurred during sign in. Please try again.' } },
      { status: 500 }
    );
  }
}
