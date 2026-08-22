import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let settings = await db.companySettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await db.companySettings.create({
        data: {
          id: 'default',
          companyName: 'Odoo India',
          companyCode: 'OI',
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthenticatedUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required to modify company settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { companyName, companyCode, companyLogo } = body;

    if (!companyName || !companyCode) {
      return NextResponse.json(
        { error: 'Company Name and Company Code are required' },
        { status: 400 }
      );
    }

    const updated = await db.companySettings.upsert({
      where: { id: 'default' },
      update: {
        companyName: companyName.trim(),
        companyCode: companyCode.trim().toUpperCase(),
        ...(companyLogo !== undefined ? { companyLogo } : {}),
      },
      create: {
        id: 'default',
        companyName: companyName.trim(),
        companyCode: companyCode.trim().toUpperCase(),
        companyLogo,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Error updating company settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
