'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  User,
  AlertCircle,
  X,
  Save,
  CheckCircle2,
  BarChart3,
  History,
  Crown,
  Clock,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import TopNavBar from '@/app/components/TopNavBar';

interface EmployeeItem {
  id: string;
  employeeId: string;
  email: string;
  role: 'EMPLOYEE' | 'ADMIN';
  profile?: {
    firstName: string;
    lastName: string;
    department: string;
    designation: string;
    profilePictureUrl?: string;
  };
  todayStatus: 'PRESENT' | 'LEAVE' | 'ABSENT';
}

interface AdminDashboardStats {
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  pendingLeavesCount: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalEmployees: 0,
    presentCount: 0,
    absentCount: 0,
    pendingLeavesCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Employee Onboarding Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('Software Engineer');
  const [joiningYear, setJoiningYear] = useState(new Date().getFullYear().toString());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Created Employee Credentials Display State
  const [createdCredentials, setCreatedCredentials] = useState<{
    loginId: string;
    firstTimePassword: string;
    name: string;
  } | null>(null);

  const fetchAdminDashboard = async () => {
    try {
      setLoading(true);

      const [resEmployees, resLive, resPendingLeaves] = await Promise.all([
        fetch('/api/admin/employees'),
        fetch('/api/attendance/live-status'),
        fetch('/api/leaves/admin?status=PENDING'),
      ]);

      if (!resEmployees.ok) {
        if (resEmployees.status === 401) {
          router.push('/signin');
          return;
        }
        if (resEmployees.status === 403) {
          router.push('/dashboard/employee');
          return;
        }
        throw new Error('Failed to load admin dashboard');
      }

      const empData = await resEmployees.json();
      const rawEmployees = empData.employees || [];

      let attendanceMap: Record<string, string> = {};
      let leaveUserIds: string[] = [];

      if (resLive.ok) {
        const lData = await resLive.json();
        attendanceMap = lData.attendanceMap || {};
        leaveUserIds = lData.leaveUserIds || [];
      }

      let pendingCount = 0;
      if (resPendingLeaves.ok) {
        const pData = await resPendingLeaves.json();
        pendingCount = (pData.leaveRequests || []).length;
      }

      const leaveSet = new Set(leaveUserIds);
      let pCount = 0;
      let aCount = 0;

      const mapped: EmployeeItem[] = rawEmployees.map((emp: EmployeeItem) => {
        let todayStatus: 'PRESENT' | 'LEAVE' | 'ABSENT' = 'ABSENT';
        const attStat = attendanceMap[emp.id];

        if (attStat === 'PRESENT' || attStat === 'HALF_DAY') {
          todayStatus = 'PRESENT';
          pCount++;
        } else if (leaveSet.has(emp.id) || attStat === 'LEAVE') {
          todayStatus = 'LEAVE';
        } else {
          todayStatus = 'ABSENT';
          aCount++;
        }

        return { ...emp, todayStatus };
      });

      setEmployees(mapped);
      setStats({
        totalEmployees: rawEmployees.length,
        presentCount: pCount,
        absentCount: aCount,
        pendingLeavesCount: pendingCount,
      });
    } catch {
      setError('Error loading admin control center');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, [router]);

  const handleOpenModal = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setDepartment('Engineering');
    setDesignation('Software Engineer');
    setJoiningYear(new Date().getFullYear().toString());
    setModalError(null);
    setFieldErrors({});
    setCreatedCredentials(null);
    setIsModalOpen(true);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/employees/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          department,
          designation,
          joiningYear: Number(joiningYear),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setModalError(data.error || 'Failed to onboard employee');
        }
      } else {
        setCreatedCredentials({
          loginId: data.loginId,
          firstTimePassword: data.firstTimePassword,
          name: `${firstName} ${lastName}`,
        });
        await fetchAdminDashboard();
      }
    } catch {
      setModalError('Network error during employee onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const fullName = emp.profile ? `${emp.profile.firstName} ${emp.profile.lastName}`.toLowerCase() : '';
    const dept = emp.profile?.department.toLowerCase() || '';
    const desig = emp.profile?.designation.toLowerCase() || '';
    return (
      emp.employeeId.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      dept.includes(q) ||
      desig.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      <TopNavBar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {error}
          </div>
        )}

        {/* Admin Control Center Hero Header */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-xl text-xs font-mono font-bold inline-flex items-center gap-1 mb-2">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Administrator Control Center
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Executive HR Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live organizational metrics, employee directory management, payroll controls, and compliance logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> Onboard Employee (+ NEW)
            </button>
          </div>
        </div>

        {/* Live Admin Summary Metric Widgets */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Live System Metrics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-medium">Total Staff Count</span>
              <p className="text-2xl font-black text-white">{stats.totalEmployees} <span className="text-xs font-normal text-slate-400">Employees</span></p>
            </div>

            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-medium">Today's Present Staff</span>
              <p className="text-2xl font-black text-emerald-400">{stats.presentCount} <span className="text-xs font-normal text-slate-400">In Office</span></p>
            </div>

            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-medium">Today's Unexplained Absences</span>
              <p className="text-2xl font-black text-amber-400">{stats.absentCount} <span className="text-xs font-normal text-slate-400">Absent</span></p>
            </div>

            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs text-slate-400 font-medium">Pending Leave Requests</span>
              <p className="text-2xl font-black text-indigo-400">{stats.pendingLeavesCount} <span className="text-xs font-normal text-slate-400">Awaiting Review</span></p>
            </div>
          </div>
        </div>

        {/* Admin Quick Action Controls */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Administrative Management Modules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold">
            <Link
              href="/dashboard/admin/reports"
              className="p-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between text-sky-400 transition-all"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Reports &amp; Analytics
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard/admin/audit-log"
              className="p-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between text-amber-400 transition-all"
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4" /> Admin Audit Log
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard/admin/payroll"
              className="p-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between text-emerald-400 transition-all"
            >
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Payroll Management
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard/admin/leaves"
              className="p-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl flex items-center justify-between text-indigo-400 transition-all"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Leave Approval Queue
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Staff Management Directory & Inspector Grid */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Staff Directory &amp; Profile Inspector ({filteredEmployees.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select an employee card to open full profile editor including Admin-Only Salary Info tab.
              </p>
            </div>

            <div className="relative max-w-xs">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, department..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>

          {/* Wireframe Legend Status Indicators */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-300 font-bold">Status Indicators:</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" /> 🟢 Present in office
            </span>
            <span className="flex items-center gap-1">
              <span>✈️</span> On approved leave
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" /> 🟡 Absent (Unexplained)
            </span>
          </div>

          {/* Staff Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {loading ? (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                Loading staff directory...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                No employees found matching search criteria.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const name = emp.profile
                  ? `${emp.profile.firstName} ${emp.profile.lastName}`
                  : emp.email;
                const dept = emp.profile?.department || 'Operations';
                const desig = emp.profile?.designation || 'Staff Member';

                return (
                  <Link
                    key={emp.id}
                    href={`/dashboard/admin/employee/${emp.id}`}
                    className="group relative p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all shadow-md flex flex-col items-center text-center space-y-3"
                  >
                    {/* Top-Right Status Dot */}
                    <div className="absolute top-3 right-3">
                      {emp.todayStatus === 'PRESENT' && (
                        <span className="w-3 h-3 bg-emerald-400 rounded-full block ring-4 ring-emerald-950/60 animate-pulse" title="Present in Office Today" />
                      )}
                      {emp.todayStatus === 'LEAVE' && (
                        <span className="text-sm" title="On Approved Leave Today">✈️</span>
                      )}
                      {emp.todayStatus === 'ABSENT' && (
                        <span className="w-3 h-3 bg-amber-400 rounded-full block ring-4 ring-amber-950/60" title="Absent (Unexplained)" />
                      )}
                    </div>

                    {/* Profile Avatar Picture */}
                    <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform overflow-hidden">
                      {emp.profile?.profilePictureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={emp.profile.profilePictureUrl}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-indigo-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-0.5 w-full">
                      <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors truncate">
                        {name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">{desig}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{dept}</p>
                    </div>

                    <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md font-mono text-[10px] uppercase font-bold">
                      {emp.employeeId}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Wireframe Admin Employee Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" /> Create Employee Account
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Auto-generates Login ID (e.g. OIJODO20220001) &amp; first-time password.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdCredentials ? (
              /* Success Display */
              <div className="space-y-4 p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Employee Onboarded Successfully!
                </div>
                <p className="text-slate-300">
                  Share these auto-generated credentials with <strong>{createdCredentials.name}</strong>:
                </p>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Login ID:</span>
                    <span className="font-bold text-amber-400 text-sm">{createdCredentials.loginId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">First-Time Password:</span>
                    <span className="font-bold text-indigo-300 text-sm">{createdCredentials.firstTimePassword}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                  >
                    Done &amp; Close
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
                {modalError && (
                  <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    {modalError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">First Name *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. John"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {fieldErrors.firstName && <p className="text-red-400 text-[11px] mt-0.5">{fieldErrors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Doe"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {fieldErrors.lastName && <p className="text-red-400 text-[11px] mt-0.5">{fieldErrors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john.doe@dayflow.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {fieldErrors.email && <p className="text-red-400 text-[11px] mt-0.5">{fieldErrors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Department *</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Engineering"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Designation *</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Developer"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Joining Year</label>
                  <input
                    type="number"
                    value={joiningYear}
                    onChange={(e) => setJoiningYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Generate Login ID &amp; Create
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
