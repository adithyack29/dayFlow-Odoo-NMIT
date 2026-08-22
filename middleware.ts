import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'dayflow_session';
const JWT_SECRET_KEY = process.env.JWT_SECRET || 'dayflow-hrms-super-secret-jwt-key-2026-nmit-hackathon';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract session token from cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  let session = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload as {
        userId: string;
        email: string;
        employeeId: string;
        role: 'EMPLOYEE' | 'ADMIN';
        isEmailVerified: boolean;
      };
    } catch {
      session = null;
    }
  }

  const isAuthPage = pathname === '/signin' || pathname === '/signup';
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isAdminDashboard = pathname.startsWith('/dashboard/admin');
  const isEmployeeDashboard = pathname.startsWith('/dashboard/employee');

  // 1. Unauthenticated users trying to access protected dashboards -> Redirect to /signin
  if (isDashboardPage && !session) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Authenticated users trying to access auth pages (/signin, /signup) -> Redirect to role dashboard
  if (isAuthPage && session) {
    const targetDashboard = session.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/employee';
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  // 3. Role-based access control (RBAC):
  // Non-ADMIN users trying to access /dashboard/admin -> Redirect to /dashboard/employee
  if (isAdminDashboard && session && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard/employee', request.url));
  }

  // Root path '/' handling: redirect based on auth status
  if (pathname === '/') {
    if (!session) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    const targetDashboard = session.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/employee';
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/signin',
    '/signup',
    '/dashboard/:path*',
  ],
};
