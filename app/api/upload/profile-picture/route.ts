import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetUserId = (formData.get('userId') as string) || session.userId;

    // Access Control: Employee can only upload profile picture for themselves
    if (session.role === 'EMPLOYEE' && targetUserId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only upload a profile picture for your own profile' },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. File Type Validation (JPG, PNG, WebP only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const extension = path.extname(file.name).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // 2. File Size Validation (Max 2MB)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 2MB' },
        { status: 400 }
      );
    }

    // 3. Prepare target upload path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile-pictures');
    await fs.mkdir(uploadDir, { recursive: true });

    const safeExt = extension || '.png';
    const filename = `avatar-${targetUserId}-${Date.now()}${safeExt}`;
    const filePath = path.join(uploadDir, filename);

    // Write file buffer to local disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/profile-pictures/${filename}`;

    // 4. Update Profile record in SQLite DB
    await db.profile.upsert({
      where: { userId: targetUserId },
      update: { profilePictureUrl: publicUrl },
      create: {
        userId: targetUserId,
        firstName: 'Employee',
        lastName: 'User',
        designation: 'Staff',
        department: 'General Operations',
        profilePictureUrl: publicUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      url: publicUrl,
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 });
  }
}
