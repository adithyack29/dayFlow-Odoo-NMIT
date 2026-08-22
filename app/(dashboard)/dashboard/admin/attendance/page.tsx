'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Crown,
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  Search,
  AlertCircle,
  Edit3,
  X,
  Save,
  Info,
} from 'lucide-react';

interface AttendanceRow {
  userId: string;
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
  checkInTime: string | null;
  checkOutTime: string | null;
  adminNote: string | null;
}

interface AdminAttendanceStats {
  total: number;
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  leaveCount: number;
}

export default function AdminAttendancePage() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<AdminAttendanceStats | null>(null);
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin Override Modal State
  const [overrideModalRow, setOverrideModalRow] = useState<AttendanceRow | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE'>('PRESENT');
  const [overrideNote, setOverrideNote] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAdminAttendance = async (dateStr: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/admin?date=${dateStr}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        if (response.status === 403) {
          router.push('/dashboard/employee');
          return;
        }
        throw new Error('Failed to load admin attendance data');
      }
      const data = await response.json();
      setStats(data.stats);
      setRecords(data.records || []);
    } catch {
      setError('Error loading attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminAttendance(selectedDate);
  }, [selectedDate, router]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedDate(val);
    }
  };

  const handleOpenOverride = (row: AttendanceRow) => {
    setOverrideModalRow(row);
    setOverrideStatus(row.status);
    setOverrideNote(row.adminNote || '');
    setOverrideError(null);
  };

  const handleCloseOverride = () => {
    setOverrideModalRow(null);
    setOverrideError(null);
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalRow) return;

    if (!overrideNote.trim()) {
      setOverrideError('An admin remark/reason is strictly required for status overrides.');
      return;
    }

    setOverrideError(null);
    setIsSubmittingOverride(true);

    try {
      const response = await fetch('/api/attendance/admin/override', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: overrideModalRow.userId,
          date: selectedDate,
          newStatus: overrideStatus,
          adminNote: overrideNote,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setOverrideError(data.error || 'Failed to override attendance');
      } else {
        setSuccessMessage(`Attendance for ${overrideModalRow.fullName} overridden to ${overrideStatus}`);
        handleCloseOverride();
        await fetchAdminAttendance(selectedDate);
      }
    } catch {
      setOverrideError('Network error during status override');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.fullName.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    );
  });

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
              <h1 className="font-bold text-lg text-white tracking-tight">Admin Attendance Oversight</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-amber-300 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Banner Alert Messages */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {error}
          </div>
        )}

        {/* 1. Summary Widgets for Selected Date */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Attendance Metrics for {selectedDate}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Present</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-400">{stats?.presentCount ?? 0}</p>
              <span className="text-[11px] text-slate-500 block">Full day check-ins</span>
            </div>

            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Half-Day</span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-3xl font-extrabold text-amber-400">{stats?.halfDayCount ?? 0}</p>
              <span className="text-[11px] text-slate-500 block">Late check-in cutoff</span>
            </div>

            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>On Leave</span>
                <FileCheck className="w-5 h-5 text-sky-400" />
              </div>
              <p className="text-3xl font-extrabold text-sky-400">{stats?.leaveCount ?? 0}</p>
              <span className="text-[11px] text-slate-500 block">Approved leave requests</span>
            </div>

            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Absent</span>
                <XCircle className="w-5 h-5 text-rose-400" />
              </div>
              <p className="text-3xl font-extrabold text-rose-400">{stats?.absentCount ?? 0}</p>
              <span className="text-[11px] text-slate-500 block">Unexcused / missed check-in</span>
            </div>
          </div>
        </div>

        {/* 2. Interactive Attendance Table */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-400" /> Daily Attendance Logs ({selectedDate})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect check-in/out timestamps or manually override attendance status with a required admin note.
              </p>
            </div>

            {/* Search Filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, ID, department..."
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
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Admin Remark</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading date records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No attendance records found for this date/search filter.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.userId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {r.fullName}
                        <span className="block font-normal text-[11px] text-slate-500">{r.email}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-300">{r.employeeId}</td>

                      <td className="py-3.5 px-4 text-slate-300">{r.department}</td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${
                            r.status === 'PRESENT'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : r.status === 'HALF_DAY'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : r.status === 'LEAVE'
                              ? 'bg-sky-950 text-sky-300 border-sky-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">{r.checkInTime || '--:--'}</td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">{r.checkOutTime || '--:--'}</td>

                      <td className="py-3.5 px-4 text-slate-400 max-w-[150px] truncate">
                        {r.adminNote ? (
                          <span className="text-[11px] text-amber-300 font-medium" title={r.adminNote}>
                            💬 {r.adminNote}
                          </span>
                        ) : (
                          <span className="text-slate-600">&mdash;</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenOverride(r)}
                          className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Override
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Admin Override Modal */}
      {overrideModalRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" /> Override Attendance Status
              </h3>
              <button
                onClick={handleCloseOverride}
                className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {overrideError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {overrideError}
              </div>
            )}

            <form onSubmit={handleSaveOverride} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block">Target Employee</span>
                <span className="font-bold text-white text-sm block">{overrideModalRow.fullName}</span>
                <span className="text-amber-400 font-mono">{overrideModalRow.employeeId} &bull; Date: {selectedDate}</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">New Attendance Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="PRESENT">PRESENT (Full Day)</option>
                  <option value="HALF_DAY">HALF_DAY (Half Day)</option>
                  <option value="LEAVE">LEAVE (Excused Absence)</option>
                  <option value="ABSENT">ABSENT (Unexcused)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Required Admin Remark / Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="e.g. Traffic delay approved by HR Director..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseOverride}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOverride}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  {isSubmittingOverride ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
