import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET_KEY = process.env.JWT_SECRET || 'dayflow-hrms-super-secret-jwt-key-2026-nmit-hackathon';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);

export const AUTH_COOKIE_NAME = 'dayflow_session';

export interface UserSessionPayload {
  userId: string;
  email: string;
  employeeId: string;
  role: 'EMPLOYEE' | 'ADMIN';
  isEmailVerified: boolean;
}

/**
 * Hashes plaintext password securely with bcrypt salt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verifies plaintext password against stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a JWT session token with user payload valid for 24 hours
 */
export async function signJWT(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

/**
 * Verifies and decodes JWT token
 */
export async function verifyJWT(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      employeeId: payload.employeeId as string,
      role: payload.role as 'EMPLOYEE' | 'ADMIN',
      isEmailVerified: Boolean(payload.isEmailVerified),
    };
  } catch {
    return null;
  }
}

/**
 * Helper to extract and verify authenticated user session from Request or Cookie header
 */
export async function getAuthenticatedUser(request?: Request): Promise<UserSessionPayload | null> {
  let token: string | undefined;

  if (request) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|; )${AUTH_COOKIE_NAME}=([^;]*)`));
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // Ignore if called out of context
    }
  }

  if (!token) return null;
  return verifyJWT(token);
}
