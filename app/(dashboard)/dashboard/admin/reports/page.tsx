'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Crown,
  ArrowLeft,
  Calendar,
  BarChart3,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  Building2,
  PieChart,
  Filter,
  AlertCircle,
} from 'lucide-react';

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
}

interface DepartmentStats {
  [dept: string]: {
    present: number;
    absent: number;
    halfDay: number;
    leave: number;
  };
}

interface LeaveStats {
  total: number;
  byStatus: {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
  };
  byType: {
    PAID: number;
    SICK: number;
    UNPAID: number;
  };
}

export default function AdminReportsPage() {
  const router = useRouter();

  // Date Range State (default current month to today)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats>({});
  const [leaveStats, setLeaveStats] = useState<LeaveStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (s: string, e: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/analytics?startDate=${s}&endDate=${e}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        if (response.status === 403) {
          router.push('/dashboard/employee');
          return;
        }
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAttendanceStats(data.attendanceStats);
      setDepartmentStats(data.departmentStats || {});
      setLeaveStats(data.leaveStats);
    } catch {
      setError('Error loading report analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(startDate, endDate);
  }, [startDate, endDate, router]);

  const handleExportCSV = (type: 'attendance' | 'leave') => {
    window.open(`/api/reports/export-csv?type=${type}&startDate=${startDate}&endDate=${endDate}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h1 className="font-bold text-lg text-white tracking-tight">Analytics &amp; Reports Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportCSV('attendance')}
              className="px-3.5 py-1.5 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Attendance CSV
            </button>
            <button
              onClick={() => handleExportCSV('leave')}
              className="px-3.5 py-1.5 bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Leave CSV
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Date Filter Bar */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-white">Report Date Range Filter:</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {error}
          </div>
        )}

        {/* 1. Visual Attendance Distribution Bar Chart Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attendance Chart Card */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" /> Attendance Distribution Metrics
              </h3>
              <span className="text-xs font-mono text-slate-400">Total Logs: {attendanceStats?.total ?? 0}</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">Computing attendance analytics...</div>
            ) : (
              <div className="space-y-4">
                {/* Visual Bar Segment */}
                {attendanceStats && attendanceStats.total > 0 ? (
                  <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5">
                    <div
                      style={{ width: `${(attendanceStats.present / attendanceStats.total) * 100}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Present: ${attendanceStats.present}`}
                    />
                    <div
                      style={{ width: `${(attendanceStats.halfDay / attendanceStats.total) * 100}%` }}
                      className="bg-amber-500 h-full transition-all"
                      title={`Half Day: ${attendanceStats.halfDay}`}
                    />
                    <div
                      style={{ width: `${(attendanceStats.leave / attendanceStats.total) * 100}%` }}
                      className="bg-sky-500 h-full transition-all"
                      title={`Leave: ${attendanceStats.leave}`}
                    />
                    <div
                      style={{ width: `${(attendanceStats.absent / attendanceStats.total) * 100}%` }}
                      className="bg-rose-500 h-full transition-all"
                      title={`Absent: ${attendanceStats.absent}`}
                    />
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500">No logs in date range.</div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Present</span>
                    <span className="text-xl font-bold text-emerald-400">{attendanceStats?.present ?? 0}</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Half-Day</span>
                    <span className="text-xl font-bold text-amber-400">{attendanceStats?.halfDay ?? 0}</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px] block">On Leave</span>
                    <span className="text-xl font-bold text-sky-400">{attendanceStats?.leave ?? 0}</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Absent</span>
                    <span className="text-xl font-bold text-rose-400">{attendanceStats?.absent ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leave Metrics Chart Card */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" /> Leave Applications Breakdown
              </h3>
              <span className="text-xs font-mono text-slate-400">Total Requests: {leaveStats?.total ?? 0}</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">Computing leave analytics...</div>
            ) : (
              <div className="space-y-4">
                {/* Leave Status Visual Bar */}
                {leaveStats && leaveStats.total > 0 ? (
                  <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5">
                    <div
                      style={{ width: `${(leaveStats.byStatus.APPROVED / leaveStats.total) * 100}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Approved: ${leaveStats.byStatus.APPROVED}`}
                    />
                    <div
                      style={{ width: `${(leaveStats.byStatus.PENDING / leaveStats.total) * 100}%` }}
                      className="bg-amber-500 h-full transition-all"
                      title={`Pending: ${leaveStats.byStatus.PENDING}`}
                    />
                    <div
                      style={{ width: `${(leaveStats.byStatus.REJECTED / leaveStats.total) * 100}%` }}
                      className="bg-rose-500 h-full transition-all"
                      title={`Rejected: ${leaveStats.byStatus.REJECTED}`}
                    />
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500">No leave requests in date range.</div>
                )}

                {/* Status & Type Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-semibold text-slate-300 block">By Status</span>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between text-emerald-400">
                        <span>Approved</span>
                        <span className="font-bold">{leaveStats?.byStatus.APPROVED ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-amber-400">
                        <span>Pending</span>
                        <span className="font-bold">{leaveStats?.byStatus.PENDING ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-rose-400">
                        <span>Rejected</span>
                        <span className="font-bold">{leaveStats?.byStatus.REJECTED ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-semibold text-slate-300 block">By Type</span>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between text-indigo-300">
                        <span>Paid Leave</span>
                        <span className="font-bold">{leaveStats?.byType.PAID ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-amber-300">
                        <span>Sick Leave</span>
                        <span className="font-bold">{leaveStats?.byType.SICK ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Unpaid Leave</span>
                        <span className="font-bold">{leaveStats?.byType.UNPAID ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Department-Level Attendance Tabular Breakdown */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" /> Department-Level Attendance Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregate attendance metrics computed per organizational department over the selected date range.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Present Days</th>
                  <th className="py-3 px-4">Half-Days</th>
                  <th className="py-3 px-4">Leave Days</th>
                  <th className="py-3 px-4">Absent Days</th>
                  <th className="py-3 px-4 font-mono">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.keys(departmentStats).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No department data logged for this date range.
                    </td>
                  </tr>
                ) : (
                  Object.entries(departmentStats).map(([dept, dStats]) => {
                    const totalDays = dStats.present + dStats.halfDay + dStats.leave + dStats.absent;
                    const rate = totalDays > 0 ? Math.round(((dStats.present + dStats.halfDay * 0.5) / totalDays) * 100) : 0;

                    return (
                      <tr key={dept} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{dept}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">{dStats.present}</td>
                        <td className="py-3.5 px-4 font-bold text-amber-400">{dStats.halfDay}</td>
                        <td className="py-3.5 px-4 font-bold text-sky-400">{dStats.leave}</td>
                        <td className="py-3.5 px-4 font-bold text-rose-400">{dStats.absent}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">{rate}%</td>
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
