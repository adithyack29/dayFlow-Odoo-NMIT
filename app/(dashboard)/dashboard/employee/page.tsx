'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  User,
  LogOut,
  CheckCircle2,
  Clock,
  Calendar,
  DollarSign,
  ShieldCheck,
  Activity,
  ArrowRight,
  FileText,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'ATTENDANCE' | 'LEAVE';
  title: string;
  description: string;
  timestamp: string;
  statusBadge: string;
}

interface EmployeeDashboardData {
  user: {
    id: string;
    employeeId: string;
    email: string;
    role: 'EMPLOYEE' | 'ADMIN';
    isEmailVerified: boolean;
    profile?: {
      firstName: string;
      lastName: string;
      phone?: string;
      address?: string;
      designation: string;
      department: string;
      joiningDate: string;
      baseSalary: number;
      housingAllowance: number;
      otherAllowances: number;
      profilePictureUrl?: string;
    };
  };
  todayAttendanceStatus: string;
  recentActivity: ActivityItem[];
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/employee/dashboard');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/signin');
            return;
          }
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        setData(result);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [router]);

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/signin');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading your employee portal...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-red-400 text-center max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="font-semibold">{error || 'Session expired'}</p>
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

  const { user, recentActivity, todayAttendanceStatus } = data;
  const profile = user.profile;
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : user.email;
  const totalSalary = profile
    ? profile.baseSalary + (profile.housingAllowance || 0) + (profile.otherAllowances || 0)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">Dayflow HRMS</h1>
              <span className="text-xs text-slate-400 font-medium">Employee Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs">
              {profile?.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profilePictureUrl}
                  alt={fullName}
                  className="w-6 h-6 rounded-full object-cover border border-indigo-500/40"
                />
              ) : (
                <User className="w-4 h-4 text-indigo-400" />
              )}
              <span className="font-semibold text-slate-200">{fullName}</span>
              <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md font-mono text-[10px]">
                {user.employeeId}
              </span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-800/40 p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/80 border border-indigo-700/50 rounded-full text-indigo-300 text-xs font-medium mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Authenticated Employee Workspace
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Welcome, {profile?.firstName || 'Employee'}!
              </h2>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                {profile?.designation || 'Staff Member'} &bull; {profile?.department || 'General Operations'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {user.isEmailVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified Email
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-semibold rounded-xl">
                  Email Unverified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 1. Quick Access Cards */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Quick Navigation &amp; Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Profile */}
            <Link
              href="/dashboard/employee/profile"
              className="p-5 bg-slate-900 hover:bg-slate-880 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all shadow-sm group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">My Profile</h4>
                <p className="text-xs text-slate-400 mt-1">View personal details, job role &amp; documents</p>
              </div>
            </Link>

            {/* Card 2: Attendance */}
            <Link
              href="/dashboard/employee/attendance"
              className="p-5 bg-slate-900 hover:bg-slate-880 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all shadow-sm group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-md text-[10px] font-mono">
                  {todayAttendanceStatus}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Today&apos;s Attendance</h4>
                <p className="text-xs text-slate-400 mt-1">Check-in, Check-out &amp; Weekly logs &rarr;</p>
              </div>
            </Link>

            {/* Card 3: Leave Requests */}
            <Link
              href="/dashboard/employee/leaves"
              className="p-5 bg-slate-900 hover:bg-slate-880 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition-all shadow-sm group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/60 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Leave Requests</h4>
                <p className="text-xs text-slate-400 mt-1">Apply time-off &amp; track status &rarr;</p>
              </div>
            </Link>

            {/* Card 4: Payroll & Payslips */}
            <Link
              href="/dashboard/employee/payroll"
              className="p-5 bg-slate-900 hover:bg-slate-880 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all shadow-sm group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Payroll &amp; Payslips</h4>
                <p className="text-xs text-slate-400 mt-1">View salary &amp; monthly statements &rarr;</p>
              </div>
            </Link>

            {/* Card 4: Logout */}
            <button
              onClick={handleSignOut}
              className="p-5 bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-800/60 rounded-2xl transition-all shadow-sm text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                  <LogOut className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Sign Out</h4>
                <p className="text-xs text-slate-400 mt-1">End active session securely</p>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Recent Activity Section (Live DB Query Data) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> Recent Activity (Live Database Feed)
              </h3>
              <span className="text-xs text-slate-500 font-mono">Last 5 Events</span>
            </div>

            {recentActivity.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800/60 text-slate-500 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                No recent activity logged yet in your account.
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          item.type === 'ATTENDANCE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-indigo-950 text-indigo-400 border border-indigo-800/60'
                        }`}
                      >
                        {item.type === 'ATTENDANCE' ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm text-slate-200">{item.title}</h5>
                        <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 border ${
                        item.statusBadge === 'PRESENT' || item.statusBadge === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800/80'
                          : item.statusBadge === 'PENDING'
                          ? 'bg-amber-950 text-amber-300 border-amber-800/80'
                          : 'bg-red-950 text-red-300 border-red-800/80'
                      }`}
                    >
                      {item.statusBadge}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Info Widget */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-sky-400" /> Employee Summary
              </h3>
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Department</span>
                  <span className="font-semibold text-slate-200">{profile?.department || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Designation</span>
                  <span className="font-semibold text-slate-200">{profile?.designation || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Annual Compensation</span>
                  <span className="font-semibold text-amber-400">${totalSalary.toLocaleString()}/yr</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Joining Date</span>
                  <span className="font-semibold text-slate-200">
                    {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
              Dayflow HRMS Employee Module v2.0
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
