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

export default function AdminDashboardPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
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

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/employees');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        if (response.status === 403) {
          router.push('/dashboard/employee');
          return;
        }
        throw new Error('Failed to load employee directory');
      }

      const data = await response.json();
      const rawEmployees = data.employees || [];

      // Fetch live status mapping via /api/attendance/live-status
      let attendanceMap: Record<string, string> = {};
      let leaveUserIds: string[] = [];

      try {
        const resLive = await fetch('/api/attendance/live-status');
        if (resLive.ok) {
          const lData = await resLive.json();
          attendanceMap = lData.attendanceMap || {};
          leaveUserIds = lData.leaveUserIds || [];
        }
      } catch {
        // Fallback gracefully
      }

      const leaveSet = new Set(leaveUserIds);

      const mapped: EmployeeItem[] = rawEmployees.map((emp: EmployeeItem) => {
        let todayStatus: 'PRESENT' | 'LEAVE' | 'ABSENT' = 'ABSENT';
        const attStat = attendanceMap[emp.id];

        if (attStat === 'PRESENT' || attStat === 'HALF_DAY') {
          todayStatus = 'PRESENT';
        } else if (leaveSet.has(emp.id) || attStat === 'LEAVE') {
          todayStatus = 'LEAVE';
        } else {
          todayStatus = 'ABSENT';
        }

        return { ...emp, todayStatus };
      });

      setEmployees(mapped);
    } catch {
      setError('Error loading employee directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
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
        await fetchEmployees();
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
      {/* Top Nav Bar */}
      <TopNavBar />

      {/* Main Employee Directory Landing Page */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" /> Employee Directory
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select an employee card to view/edit profile details. Live status indicator shows attendance for today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
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

            {/* NEW Button (Visible ONLY to Admin/HR) */}
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> NEW
            </button>
          </div>
        </div>

        {/* Quick Audit / Analytics Nav Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Link
            href="/dashboard/admin/reports"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BarChart3 className="w-4 h-4" /> Reports &amp; Analytics
          </Link>
          <Link
            href="/dashboard/admin/audit-log"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
          >
            <History className="w-4 h-4" /> Admin Audit Log
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {error}
          </div>
        )}

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

        {/* Wireframe Employee Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              Loading employee directory...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              No employee profiles found matching search criteria.
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
                  {/* Top-Right Wireframe Status Indicator Badge */}
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

                  {/* Employee Name & Details */}
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
