'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Search, User, AlertCircle } from 'lucide-react';
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

export default function EmployeeDashboardPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/employees');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
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

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" /> Employees Directory
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select an employee card to view information in View-Only mode.
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

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {error}
          </div>
        )}

        {/* Status Indicators Legend */}
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

        {/* Employee Cards Grid */}
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
      </main>
    </div>
  );
}
