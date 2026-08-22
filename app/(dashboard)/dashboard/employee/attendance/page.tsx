'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Clock,
  ArrowLeft,
  CheckCircle2,
  LogOut,
  Calendar,
  AlertCircle,
  ShieldAlert,
  Info,
  UserCheck,
} from 'lucide-react';

interface WeeklyDayRecord {
  date: string;
  dayName: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'UPCOMING';
  checkInTime: string | null;
  checkOutTime: string | null;
  hoursWorked: number;
  adminNote: string | null;
  isToday: boolean;
}

export default function EmployeeAttendancePage() {
  const router = useRouter();
  const [weeklyView, setWeeklyView] = useState<WeeklyDayRecord[]>([]);
  const [todayStr, setTodayStr] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Today's attendance state
  const [todayRecord, setTodayRecord] = useState<{
    checkInTime?: string | null;
    checkOutTime?: string | null;
    status?: string;
  } | null>(null);

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/attendance/employee');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        throw new Error('Failed to load attendance');
      }
      const data = await response.json();
      setWeeklyView(data.weeklyView || []);
      setTodayStr(data.todayStr || '');
      setTodayRecord(data.todayRecord || null);
    } catch {
      setErrorMessage('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [router]);

  // Handle Check In
  const handleCheckIn = async (isHalfDay = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActionLoading(true);

    try {
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHalfDay }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'Check-in failed');
      } else {
        setSuccessMessage(data.message || 'Check-in recorded successfully!');
        await fetchAttendance();
      }
    } catch {
      setErrorMessage('Network error during check-in');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Check Out
  const handleCheckOut = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActionLoading(true);

    try {
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'Check-out failed');
      } else {
        setSuccessMessage(data.message || 'Check-out recorded successfully!');
        await fetchAttendance();
      }
    } catch {
      setErrorMessage('Network error during check-out');
    } finally {
      setActionLoading(false);
    }
  };

  const hasCheckedInToday = Boolean(todayRecord?.checkInTime);
  const hasCheckedOutToday = Boolean(todayRecord?.checkOutTime);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Attendance Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/employee"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-bold text-lg text-white tracking-tight">Daily Check-In &amp; Attendance History</h1>
          </div>

          <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-mono">
            Today: {todayStr}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Banner Alert Messages */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-3 text-xs font-semibold">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Cutoff Rule Notice Banner */}
        <div className="p-4 bg-slate-900/90 border border-indigo-800/50 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white block">Workday Cutoff &amp; Half-Day Business Rule</span>
            <p>
              Standard workday start is <strong>09:00 AM</strong>. Check-ins completed before <strong>13:00 PM (1:00 PM)</strong> are automatically logged as <span className="text-emerald-400 font-semibold">PRESENT</span>. Check-ins recorded at or after <strong>13:00 PM</strong> are automatically categorized as <span className="text-amber-400 font-semibold">HALF_DAY</span>.
            </p>
          </div>
        </div>

        {/* 1. Daily Check-In / Check-Out Widget */}
        <div className="p-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
              Today&apos;s Attendance Action
            </span>
            <h2 className="text-2xl font-bold text-white">
              {!hasCheckedInToday
                ? 'Ready to Start Shift?'
                : !hasCheckedOutToday
                ? 'Currently Checked In'
                : 'Shift Completed Today!'}
            </h2>
            <p className="text-xs text-slate-400">
              {todayRecord?.checkInTime && (
                <span>Check-in: {new Date(todayRecord.checkInTime).toLocaleTimeString()} &bull; </span>
              )}
              {todayRecord?.checkOutTime && (
                <span>Check-out: {new Date(todayRecord.checkOutTime).toLocaleTimeString()}</span>
              )}
              {!hasCheckedInToday && 'Click below to mark your official check-in time.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!hasCheckedInToday && (
              <>
                <button
                  onClick={() => handleCheckIn(false)}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                  {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Clock className="w-4 h-4" />}
                  Check In Now (Standard)
                </button>
                <button
                  onClick={() => handleCheckIn(true)}
                  disabled={actionLoading}
                  className="px-4 py-3 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-xl font-semibold text-xs transition-all flex items-center gap-2"
                >
                  Check In (Half-Day)
                </button>
              </>
            )}

            {hasCheckedInToday && !hasCheckedOutToday && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Clock className="w-4 h-4" />}
                Check Out Now
              </button>
            )}

            {hasCheckedInToday && hasCheckedOutToday && (
              <span className="px-4 py-2.5 bg-slate-950 text-emerald-400 border border-emerald-800/80 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Shift Finished
              </span>
            )}
          </div>
        </div>

        {/* 2. Weekly Mon-Sun Scannable Calendar Table */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> Current Week View (Mon &ndash; Sun)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Live color-coded weekly attendance logs pulled directly from the database.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {weeklyView.map((day) => (
              <div
                key={day.date}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  day.isToday
                    ? 'bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {day.dayName.slice(0, 3)}
                    </span>
                    {day.isToday && (
                      <span className="px-1.5 py-0.5 bg-indigo-950 text-indigo-300 text-[9px] font-bold rounded">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-300 block">{day.date}</span>
                </div>

                {/* Status Badge */}
                <div className="my-2">
                  <span
                    className={`inline-block w-full py-1.5 px-2 text-center rounded-lg text-xs font-extrabold uppercase border ${
                      day.status === 'PRESENT'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : day.status === 'HALF_DAY'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : day.status === 'LEAVE'
                        ? 'bg-sky-950 text-sky-300 border-sky-800'
                        : day.status === 'ABSENT'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {day.status}
                  </span>
                </div>

                {/* Timestamps */}
                <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">In:</span>
                    <span className="font-mono text-slate-200">{day.checkInTime || '--:--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Out:</span>
                    <span className="font-mono text-slate-200">{day.checkOutTime || '--:--'}</span>
                  </div>
                  {day.hoursWorked > 0 && (
                    <div className="flex justify-between font-semibold text-emerald-400 pt-1">
                      <span>Total:</span>
                      <span>{day.hoursWorked} hrs</span>
                    </div>
                  )}
                  {day.adminNote && (
                    <div className="mt-1 p-1 bg-amber-950/40 border border-amber-900 text-[10px] text-amber-300 rounded">
                      Note: {day.adminNote}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
