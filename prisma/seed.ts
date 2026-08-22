import { Role, AttendanceStatus, LeaveType, LeaveStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db';


async function main() {
  console.log('🌱 Starting Dayflow HRMS database seed...');

  // Clean existing data
  await db.leaveRequest.deleteMany();
  await db.attendance.deleteMany();
  await db.profile.deleteMany();
  await db.user.deleteMany();

  // Common password hash for test accounts
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  const employeePasswordHash = await bcrypt.hash('EmpPass123!', 10);

  // 1. Create ADMIN User
  const adminUser = await db.user.create({
    data: {
      employeeId: 'EMP-001',
      email: 'admin@dayflow.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isEmailVerified: true,
      profile: {
        create: {
          firstName: 'Sarah',
          lastName: 'Jenkins',
          phone: '+1 (555) 019-2831',
          address: '100 Executive Parkway, Suite 400, New York, NY',
          designation: 'VP of Human Resources',
          department: 'Human Resources',
          joiningDate: new Date('2022-01-15'),
          baseSalary: 125000,
          housingAllowance: 25000,
          otherAllowances: 10000,
          profilePictureUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
          documents: JSON.stringify([
            { id: 'doc-admin-1', name: 'Executive_Contract.pdf', type: 'application/pdf', uploadedAt: '2022-01-15' }
          ]),
        },
      },
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email} (${adminUser.employeeId})`);

  // 2. Create EMPLOYEE 1 - John Doe (Senior Engineer)
  const emp1 = await db.user.create({
    data: {
      employeeId: 'EMP-002',
      email: 'john.doe@dayflow.com',
      passwordHash: employeePasswordHash,
      role: Role.EMPLOYEE,
      isEmailVerified: true,
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1 (555) 014-9922',
          address: '42 Silicon Avenue, San Jose, CA',
          designation: 'Senior Software Engineer',
          department: 'Engineering',
          joiningDate: new Date('2023-03-01'),
          baseSalary: 98000,
          housingAllowance: 18000,
          otherAllowances: 6000,
          profilePictureUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
          documents: JSON.stringify([
            { id: 'doc-emp2-1', name: 'Offer_Letter_John.pdf', type: 'application/pdf', uploadedAt: '2023-03-01' },
            { id: 'doc-emp2-2', name: 'Tax_Form_W2.pdf', type: 'application/pdf', uploadedAt: '2024-01-20' },
          ]),
        },
      },
    },
  });
  console.log(`✅ Employee 1 created: ${emp1.email} (${emp1.employeeId})`);

  // 3. Create EMPLOYEE 2 - Jane Smith (Product Designer)
  const emp2 = await db.user.create({
    data: {
      employeeId: 'EMP-003',
      email: 'jane.smith@dayflow.com',
      passwordHash: employeePasswordHash,
      role: Role.EMPLOYEE,
      isEmailVerified: true,
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '+1 (555) 018-4411',
          address: '78 Creative Studio Blvd, Austin, TX',
          designation: 'Lead UI/UX Designer',
          department: 'Product & Design',
          joiningDate: new Date('2023-07-15'),
          baseSalary: 92000,
          housingAllowance: 15000,
          otherAllowances: 5000,
          profilePictureUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
          documents: JSON.stringify([
            { id: 'doc-emp3-1', name: 'Design_Portfolio_Cert.pdf', type: 'application/pdf', uploadedAt: '2023-07-15' }
          ]),
        },
      },
    },
  });
  console.log(`✅ Employee 2 created: ${emp2.email} (${emp2.employeeId})`);

  // 4. Create EMPLOYEE 3 - Alex Wong (Marketing Specialist)
  const emp3 = await db.user.create({
    data: {
      employeeId: 'EMP-004',
      email: 'alex.wong@dayflow.com',
      passwordHash: employeePasswordHash,
      role: Role.EMPLOYEE,
      isEmailVerified: false,
      verificationToken: 'sample-verification-token-alex-12345',
      profile: {
        create: {
          firstName: 'Alex',
          lastName: 'Wong',
          phone: '+1 (555) 012-7733',
          address: '15 Ocean Drive, Miami, FL',
          designation: 'Digital Marketing Specialist',
          department: 'Marketing',
          joiningDate: new Date('2024-02-10'),
          baseSalary: 74000,
          housingAllowance: 12000,
          otherAllowances: 4000,
          profilePictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
        },
      },
    },
  });
  console.log(`✅ Employee 3 created: ${emp3.email} (${emp3.employeeId})`);

  // Seed Attendance Records for John Doe & Jane Smith
  const today = new Date();
  const dateStrings = [];
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dateStrings.push(d.toISOString().split('T')[0]);
  }

  for (const dateStr of dateStrings) {
    await db.attendance.create({
      data: {
        userId: emp1.id,
        date: dateStr,
        status: AttendanceStatus.PRESENT,
        checkInTime: new Date(`${dateStr}T09:00:00Z`),
        checkOutTime: new Date(`${dateStr}T17:30:00Z`),
      },
    });

    await db.attendance.create({
      data: {
        userId: emp2.id,
        date: dateStr,
        status: AttendanceStatus.PRESENT,
        checkInTime: new Date(`${dateStr}T09:15:00Z`),
        checkOutTime: new Date(`${dateStr}T17:45:00Z`),
      },
    });
  }

  // Seed Leave Requests
  await db.leaveRequest.create({
    data: {
      userId: emp1.id,
      leaveType: LeaveType.PAID,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-05'),
      remarks: 'Annual family vacation',
      status: LeaveStatus.APPROVED,
      adminComment: 'Approved! Enjoy your vacation.',
      reviewedById: adminUser.id,
    },
  });

  await db.leaveRequest.create({
    data: {
      userId: emp2.id,
      leaveType: LeaveType.SICK,
      startDate: new Date('2026-08-25'),
      endDate: new Date('2026-08-26'),
      remarks: 'Medical appointment & recovery',
      status: LeaveStatus.PENDING,
    },
  });

  console.log('🎉 Seeding complete!');
  console.log('\n--- TEST CREDENTIALS ---');
  console.log('ADMIN:    admin@dayflow.com     | Password: AdminPass123!');
  console.log('EMPLOYEE: john.doe@dayflow.com  | Password: EmpPass123!');
  console.log('EMPLOYEE: jane.smith@dayflow.com | Password: EmpPass123!');
  console.log('------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
