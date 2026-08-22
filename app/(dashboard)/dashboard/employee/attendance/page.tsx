'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Calendar, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import TopNavBar from '@/app/components/TopNavBar';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
  checkInTime: string | null;
  checkOutTime: string | null;
  workHours: string | null;
  extraHours: string | null;
}

export default function EmployeeAttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/attendance/employee');
      if (!res.ok) return;
      const data = await res.json();
      setAttendances(data.attendances || []);
    } catch {
      // Silent catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Filter records by selected month and year
  const filteredRecords = attendances.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const countPresent = filteredRecords.filter((a) => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
  const countLeaves = filteredRecords.filter((a) => a.status === 'LEAVE').length;
  const totalWorkingDays = filteredRecords.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      <TopNavBar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header & Wireframe Month Selector */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-6 h-6 text-indigo-400" /> My Attendance Log
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly day-wise log displaying check-in times, check-out times, work hours, and extra hours.
              </p>
            </div>

            {/* Wireframe Month Navigation Controls */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 border border-slate-800 rounded-xl text-xs">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-white font-mono">
                {months[selectedMonth]} {selectedYear}
              </span>

              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Wireframe Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Count of days present</span>
              <p className="text-2xl font-black text-emerald-400">{countPresent} <span className="text-xs font-normal text-slate-400">Days</span></p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Leaves count</span>
              <p className="text-2xl font-black text-amber-400">{countLeaves} <span className="text-xs font-normal text-slate-400">Days</span></p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Total working days recorded</span>
              <p className="text-2xl font-black text-indigo-400">{totalWorkingDays} <span className="text-xs font-normal text-slate-400">Days</span></p>
            </div>
          </div>

          {/* Wireframe Attendance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Work Hours</th>
                  <th className="py-3 px-4">Extra Hours</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No attendance records logged for {months[selectedMonth]} {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const inTimeStr = rec.checkInTime
                      ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--';
                    const outTimeStr = rec.checkOutTime
                      ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--';

                    return (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors font-mono">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {rec.date}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-400">{inTimeStr}</td>
                        <td className="py-3.5 px-4 text-slate-300">{outTimeStr}</td>
                        <td className="py-3.5 px-4 font-bold text-indigo-300">{rec.workHours || '08:00'}</td>
                        <td className="py-3.5 px-4 text-amber-400">{rec.extraHours || '00:00'}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${
                              rec.status === 'PRESENT'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : rec.status === 'LEAVE'
                                ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                                : 'bg-amber-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            {rec.status}
                          </span>
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
