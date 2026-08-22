import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signJWT, AUTH_COOKIE_NAME } from '@/lib/auth';
import { signInSchema, formatZodErrors } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate payload with Zod schema
    const parseResult = signInSchema.safeParse(body);
    if (!parseResult.success) {
      const fieldErrors = formatZodErrors(parseResult.error);
      return NextResponse.json({ errors: fieldErrors }, { status: 400 });
    }

    const { email, password } = parseResult.data;

    // 2. Fetch user from database
    const user = await db.user.findUnique({
      where: { email },
    });

    // 3. Verify user existence & password matching
    // Returns generic authentication error without leaking whether email vs password failed
    const isPasswordValid = user ? await verifyPassword(password, user.passwordHash) : false;

    if (!user || !isPasswordValid) {
      return NextResponse.json(
        { errors: { general: 'Invalid email address or password. Please try again.' } },
        { status: 401 }
      );
    }

    // 4. Issue JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    });

    // 5. Determine dashboard redirect route based on role
    const redirectUrl = user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/employee';

    // 6. Return response setting secure httpOnly session cookie
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
