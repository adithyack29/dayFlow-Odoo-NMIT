import { db } from '@/lib/db';

export async function generateEmployeeLoginId(
  firstName: string,
  lastName: string,
  joiningYear?: number
): Promise<{ loginId: string; companyCode: string }> {
  // 1. Fetch Company Settings or use default "OI"
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

  const companyCode = (settings.companyCode || 'OI').trim().toUpperCase();

  // 2. Extract first 2 letters of first name and last name
  const cleanFirst = firstName.trim().replace(/[^a-zA-Z]/g, '').toUpperCase();
  const cleanLast = lastName.trim().replace(/[^a-zA-Z]/g, '').toUpperCase();

  const f2 = (cleanFirst.slice(0, 2) || 'XX').padEnd(2, 'X');
  const l2 = (cleanLast.slice(0, 2) || 'YY').padEnd(2, 'Y');
  const nameInitials = `${f2}${l2}`; // e.g. JODO

  // 3. Year of joining (default current year if not specified)
  const year = joiningYear || new Date().getFullYear();

  // 4. Determine serial number of joining for that year
  const prefixPattern = `${companyCode}${nameInitials}${year}`;

  const existingCount = await db.user.count({
    where: {
      employeeId: {
        startsWith: `${companyCode}`,
      },
    },
  });

  const nextSerial = (existingCount + 1).toString().padStart(4, '0'); // e.g. 0001
  const loginId = `${prefixPattern}${nextSerial}`; // e.g. OIJODO20220001

  return { loginId, companyCode };
}
