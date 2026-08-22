'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Clock,
  Calendar,
  DollarSign,
  Activity,
  Search,
  Users,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Building2,
} from 'lucide-react';
import TopNavBar from '@/app/components/TopNavBar';

interface ActivityItem {
  id: string;
  type: 'ATTENDANCE' | 'LEAVE';
  title: string;
  description: string;
  timestamp: string;
  statusBadge: string;
}

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

export default function EmployeeDashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<{
    employeeId: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      designation: string;
      department: string;
      paidLeaveBalance?: number;
      sickLeaveBalance?: number;
    };
  } | null>(null);

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        const [resDash, resDirectory, resLive] = await Promise.all([
          fetch('/api/employee/dashboard'),
          fetch('/api/admin/employees'),
          fetch('/api/attendance/live-status'),
        ]);

        if (resDash.status === 401) {
          router.push('/signin');
          return;
        }

        if (resDash.ok) {
          const dashData = await resDash.json();
          setCurrentUser(dashData.user);
          setRecentActivity(dashData.recentActivity || []);
        }

        let attendanceMap: Record<string, string> = {};
        let leaveUserIds: string[] = [];

        if (resLive.ok) {
          const lData = await resLive.json();
          attendanceMap = lData.attendanceMap || {};
          leaveUserIds = lData.leaveUserIds || [];
        }

        if (resDirectory.ok) {
          const dirData = await resDirectory.json();
          const rawEmployees = dirData.employees || [];
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
        }
      } catch {
        setError('Error loading employee workspace');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [router]);

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

  const empName = currentUser?.profile
    ? `${currentUser.profile.firstName} ${currentUser.profile.lastName}`
    : currentUser?.email || 'Employee';

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

        {/* Employee Dashboard Hero Welcome Header */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-mono font-bold inline-block mb-2">
              ⚡ Employee Portal Workspace
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Welcome back, {empName}!
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {currentUser?.profile?.designation || 'Staff Member'} &bull; {currentUser?.profile?.department || 'Operations'} &bull; ID: {currentUser?.employeeId}
            </p>
          </div>
        </div>

        {/* Employee Quick-Access Module Cards */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Quick-Access Modules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Module 1: My Profile */}
            <Link
              href="/dashboard/employee/profile"
              className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all shadow-md flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-indigo-950 border border-indigo-800/80 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  My Profile
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  View &amp; edit personal details, bank info, skills &amp; security.
                </p>
              </div>
            </Link>

            {/* Module 2: Attendance */}
            <Link
              href="/dashboard/employee/attendance"
              className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all shadow-md flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-emerald-950 border border-emerald-800/80 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                  Attendance &amp; Log
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check-in / out history, monthly hours &amp; work logs.
                </p>
              </div>
            </Link>

            {/* Module 3: Time Off (Leaves) */}
            <Link
              href="/dashboard/employee/leaves"
              className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition-all shadow-md flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-amber-950 border border-amber-800/80 rounded-xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                  Time Off Portal
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  24 Days Paid / 7 Days Sick Available &bull; Apply for leave.
                </p>
              </div>
            </Link>

            {/* Module 4: My Payroll */}
            <Link
              href="/dashboard/employee/payroll"
              className="group p-5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl transition-all shadow-md flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-sky-950 border border-sky-800/80 rounded-xl flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                  My Payroll &amp; Slips
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Read-only salary structure breakdown &amp; monthly payslips.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Employee Recent Activity Timeline */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Recent Activity History
          </h2>

          <div className="divide-y divide-slate-800/60 text-xs">
            {recentActivity.length === 0 ? (
              <div className="py-6 text-center text-slate-500">
                No recent activity logged yet. Mark attendance or submit leave to populate logs.
              </div>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">{item.title}</span>
                    <span className="text-slate-400 block">{item.description}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md font-mono text-[10px] uppercase font-bold block mb-1">
                      {item.statusBadge}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Company Colleagues Directory (View-Only Mode) */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Company Colleagues Directory ({filteredEmployees.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select an employee card to view information in View-Only mode. Live status indicator shows attendance for today.
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

          {/* Employee Directory Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {loading ? (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                Loading colleagues directory...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                No colleagues found matching search criteria.
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
    </div>
  );
}
