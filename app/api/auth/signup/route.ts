import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { signUpSchema, formatZodErrors } from '@/lib/validation';
import { Role } from '@prisma/client';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate payload with Zod schema
    const parseResult = signUpSchema.safeParse(body);
    if (!parseResult.success) {
      const fieldErrors = formatZodErrors(parseResult.error);
      return NextResponse.json({ errors: fieldErrors }, { status: 400 });
    }

    const { employeeId, email, password, firstName, lastName, role } = parseResult.data;

    // 2. Check for unique constraints (email & employeeId) with field-level responses
    const existingEmailUser = await db.user.findUnique({
      where: { email },
    });

    if (existingEmailUser) {
      return NextResponse.json(
        { errors: { email: 'An account with this email address already exists' } },
        { status: 400 }
      );
    }

    const existingEmpIdUser = await db.user.findUnique({
      where: { employeeId },
    });

    if (existingEmpIdUser) {
      return NextResponse.json(
        { errors: { employeeId: 'This Employee ID is already registered in the system' } },
        { status: 400 }
      );
    }

    // 3. Hash password securely (Plaintext passwords are never stored or logged)
    const passwordHash = await hashPassword(password);

    // 4. Generate random email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 5. Create User & Profile record in database
    const newUser = await db.user.create({
      data: {
        employeeId,
        email,
        passwordHash,
        role: role as Role,
        isEmailVerified: false,
        verificationToken,
        profile: {
          create: {
            firstName,
            lastName,
            designation: role === 'ADMIN' ? 'HR Administrator' : 'Staff Employee',
            department: role === 'ADMIN' ? 'Human Resources' : 'General Operations',
            baseSalary: role === 'ADMIN' ? 100000 : 75000,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    /*
     * SIMULATED EMAIL VERIFICATION (HACKATHON CONTEXT):
     * To avoid third-party email delivery services (SendGrid/Resend) per requirements,
     * we simulate email delivery by logging the verification link directly to the console log.
     */
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const verificationUrl = `${protocol}://${host}/api/auth/verify?token=${verificationToken}`;

    console.log('\n================================================================');
    console.log('📧 [SIMULATED EMAIL VERIFICATION SERVICE]');
    console.log(`To: ${newUser.email}`);
    console.log(`Subject: Verify your Dayflow HRMS Account`);
    console.log(`Verification Link: ${verificationUrl}`);
    console.log('================================================================\n');

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please verify your email.',
        user: {
          id: newUser.id,
          employeeId: newUser.employeeId,
          email: newUser.email,
          role: newUser.role,
          isEmailVerified: newUser.isEmailVerified,
          verificationUrl, // included in response for easy hackathon manual verification testing
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Sign up API error:', error);
    return NextResponse.json(
      { errors: { general: 'An unexpected error occurred during sign up. Please try again.' } },
      { status: 500 }
    );
  }
}
