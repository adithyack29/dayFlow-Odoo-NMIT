import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export interface DocumentItem {
  id: string;
  name: string;
  url: string;
  fileType: string;
  size: number;
  uploadedAt: string;
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetUserId = (formData.get('userId') as string) || session.userId;
    const customName = (formData.get('documentName') as string) || '';

    // Access Control: Employee can only upload documents for themselves
    if (session.role === 'EMPLOYEE' && targetUserId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only upload documents for your own profile' },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: 'No document file provided' }, { status: 400 });
    }

    // 1. File Format & Size Validation (Max 5MB)
    const extension = path.extname(file.name).toLowerCase();
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.doc'];

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: 'Invalid document file type. Allowed formats: PDF, PNG, JPG, DOCX.' },
        { status: 400 }
      );
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Document size exceeds maximum limit of 5MB' },
        { status: 400 }
      );
    }

    // 2. Prepare target upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    await fs.mkdir(uploadDir, { recursive: true });

    const safeExt = extension || '.pdf';
    const filename = `doc-${targetUserId}-${Date.now()}${safeExt}`;
    const filePath = path.join(uploadDir, filename);

    // Save file buffer to local disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/documents/${filename}`;

    // 3. Fetch existing profile & documents list
    const profile = await db.profile.findUnique({
      where: { userId: targetUserId },
    });

    let existingDocs: DocumentItem[] = [];
    if (profile?.documents) {
      try {
        existingDocs = JSON.parse(profile.documents);
      } catch {
        existingDocs = [];
      }
    }

    const newDocItem: DocumentItem = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: customName.trim() || file.name,
      url: publicUrl,
      fileType: extension.replace('.', '').toUpperCase(),
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    const updatedDocs = [newDocItem, ...existingDocs];

    // 4. Save updated document array JSON string in SQLite DB
    await db.profile.upsert({
      where: { userId: targetUserId },
      update: { documents: JSON.stringify(updatedDocs) },
      create: {
        userId: targetUserId,
        firstName: 'Employee',
        lastName: 'User',
        designation: 'Staff',
        department: 'General Operations',
        documents: JSON.stringify(updatedDocs),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      document: newDocItem,
      documents: updatedDocs,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, documentId } = body;
    const targetUserId = userId || session.userId;

    // Access Control: Employee can only delete documents from their own profile
    if (session.role === 'EMPLOYEE' && targetUserId !== session.userId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete documents from your own profile' },
        { status: 403 }
      );
    }

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const profile = await db.profile.findUnique({
      where: { userId: targetUserId },
    });

    if (!profile || !profile.documents) {
      return NextResponse.json({ error: 'No documents found' }, { status: 404 });
    }

    let existingDocs: DocumentItem[] = [];
    try {
      existingDocs = JSON.parse(profile.documents);
    } catch {
      existingDocs = [];
    }

    const filteredDocs = existingDocs.filter((doc) => doc.id !== documentId);

    await db.profile.update({
      where: { userId: targetUserId },
      data: { documents: JSON.stringify(filteredDocs) },
    });

    return NextResponse.json({
      success: true,
      message: 'Document removed successfully',
      documents: filteredDocs,
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
