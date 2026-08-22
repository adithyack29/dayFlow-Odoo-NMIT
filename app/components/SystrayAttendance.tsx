'use client';

import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, Clock, CheckCircle } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
  checkInTime: string | null;
  checkOutTime: string | null;
}

export default function SystrayAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTimeStr, setCheckInTimeStr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTodayAttendance = async () => {
    try {
      const res = await fetch('/api/attendance/employee');
      if (!res.ok) return;
      const data = await res.json();
      const records = data.attendances || [];
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRec = records.find((r: { date: string }) => r.date === todayStr);

      if (todayRec) {
        setAttendance(todayRec);
        if (todayRec.checkInTime && !todayRec.checkOutTime) {
          setIsCheckedIn(true);
          const t = new Date(todayRec.checkInTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          setCheckInTimeStr(t);
        } else {
          setIsCheckedIn(false);
        }
      } else {
        setIsCheckedIn(false);
      }
    } catch {
      // Silent catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
      });
      if (res.ok) {
        await fetchTodayAttendance();
      }
    } catch {
      // Silent catch
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
      });
      if (res.ok) {
        await fetchTodayAttendance();
      }
    } catch {
      // Silent catch
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
        <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
      {/* Live Status Dot Indicator */}
      <span className="flex items-center gap-1.5">
        <span
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            isCheckedIn ? 'bg-emerald-400 animate-pulse shadow-md shadow-emerald-500/50' : 'bg-rose-500'
          }`}
        />
        <span className="font-semibold text-slate-200 text-[11px] hidden sm:inline">
          {isCheckedIn ? 'PRESENT' : 'OFFLINE'}
        </span>
      </span>

      {/* Systray Action Controls */}
      {!isCheckedIn ? (
        <button
          onClick={handleCheckIn}
          disabled={actionLoading}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 shadow-sm"
        >
          {actionLoading ? (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogIn className="w-3 h-3" />
          )}
          Check IN &rarr;
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {checkInTimeStr && (
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              Since {checkInTimeStr}
            </span>
          )}
          <button
            onClick={handleCheckOut}
            disabled={actionLoading}
            className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
          >
            {actionLoading ? (
              <div className="w-3 h-3 border border-rose-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-3 h-3" />
            )}
            Check Out &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
