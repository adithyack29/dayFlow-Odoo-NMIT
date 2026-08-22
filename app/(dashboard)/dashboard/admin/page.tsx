'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Crown,
  LogOut,
  Users,
  CheckCircle2,
  XCircle,
  FileCheck,
  Search,
  ArrowRight,
  User,
  AlertCircle,
  Clock,
  Briefcase,
  Eye,
} from 'lucide-react';

interface EmployeeItem {
  id: string;
  employeeId: string;
  email: string;
  role: 'EMPLOYEE' | 'ADMIN';
  isEmailVerified: boolean;
  createdAt: string;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    designation: string;
    department: string;
    baseSalary: number;
    profilePictureUrl?: string;
  };
}

interface AdminDashboardStats {
  totalEmployees: number;
  todayPresentCount: number;
  todayAbsentCount: number;
  pendingLeavesCount: number;
  todayDate: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [dashRes, empRes] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/employees'),
        ]);

        if (!dashRes.ok || !empRes.ok) {
          if (dashRes.status === 401 || empRes.status === 401) {
            router.push('/signin');
            return;
          }
          if (dashRes.status === 403 || empRes.status === 403) {
            router.push('/dashboard/employee');
            return;
          }
          throw new Error('Failed to load administrative data');
        }

        const dashData = await dashRes.json();
        const empData = await empRes.json();

        setStats(dashData.stats);
        setEmployees(empData.employees || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An error occurred loading the admin panel');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, [router]);

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/signin');
    router.refresh();
  };

  // Filter employee list by search term
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const fullName = emp.profile ? `${emp.profile.firstName} ${emp.profile.lastName}`.toLowerCase() : '';
    return (
      emp.employeeId.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      (emp.profile?.department && emp.profile.department.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Admin Workspace...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-red-400 text-center max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => router.push('/signin')}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">Dayflow HRMS</h1>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <span>⚡</span> Administrator Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-amber-950/40 border border-amber-800/50 rounded-xl text-xs">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-amber-200">Admin Control</span>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/30 p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/80 border border-amber-700/50 rounded-full text-amber-300 text-xs font-medium mb-3">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Live Database Overview
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                HR Management Dashboard
              </h2>
              <p className="text-slate-300 text-sm mt-1">
                Real-time workforce metrics, live attendance logs, and employee directory management.
              </p>
            </div>

            {/* Quick Action Navigation Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/admin/attendance"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
              >
                <Clock className="w-4 h-4 text-emerald-300" /> Attendance Oversight &rarr;
              </Link>
              <Link
                href="/dashboard/admin/leaves"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-600/20"
              >
                <FileCheck className="w-4 h-4 text-slate-950" /> Leave Approvals &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* 1. Summary Widgets (Computed Live from DB) */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Live System Aggregate Metrics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Widget 1: Total Employees */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Total Employees</span>
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">{stats?.totalEmployees ?? 0}</p>
              <span className="text-[11px] text-slate-500 block">Registered in SQLite Database</span>
            </div>

            {/* Widget 2: Today's Present */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Today&apos;s Present</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-400">{stats?.todayPresentCount ?? 0}</p>
              <span className="text-[11px] text-slate-500 block">Date: {stats?.todayDate}</span>
            </div>

            {/* Widget 3: Today's Absent */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Today&apos;s Absent</span>
                <XCircle className="w-5 h-5 text-rose-400" />
              </div>
              <p className="text-3xl font-extrabold text-rose-400">{stats?.todayAbsentCount ?? 0}</p>
              <span className="text-[11px] text-slate-500 block">Checked out or absent</span>
            </div>

            {/* Widget 4: Pending Leaves */}
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Pending Leaves</span>
                <FileCheck className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-3xl font-extrabold text-amber-400">{stats?.pendingLeavesCount ?? 0}</p>
              <span className="text-[11px] text-slate-500 block">Requires HR Approval</span>
            </div>
          </div>
        </div>

        {/* 2. Employee Directory Table & Switcher */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Employee Directory &amp; Profile Inspector
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click on any employee to inspect or edit their profile, job role, and salary structure.
              </p>
            </div>

            {/* Search Filter */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, email..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No employees match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const fullName = emp.profile
                      ? `${emp.profile.firstName} ${emp.profile.lastName}`
                      : emp.email;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white flex items-center gap-3">
                          {emp.profile?.profilePictureUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={emp.profile.profilePictureUrl}
                              alt={fullName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 font-bold text-xs">
                              {fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="block font-bold text-slate-100">{fullName}</span>
                            <span className="text-[11px] text-slate-500">{emp.email}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-amber-300">
                          {emp.employeeId}
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">
                          {emp.profile?.department || 'Unassigned'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">
                          {emp.profile?.designation || 'Staff'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-bold border ${
                              emp.role === 'ADMIN'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                            }`}
                          >
                            {emp.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/dashboard/admin/employee/${emp.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-all shadow-md shadow-indigo-600/10"
                          >
                            <Eye className="w-3.5 h-3.5" /> Manage Profile
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
