'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Crown,
  ArrowLeft,
  History,
  Search,
  AlertCircle,
  UserCheck,
  DollarSign,
  CalendarCheck,
  CalendarX,
  Clock,
  Filter,
} from 'lucide-react';
import NotificationBell from '@/app/components/NotificationBell';

interface AuditLogItem {
  id: string;
  action: 'PROFILE_EDIT' | 'SALARY_UPDATE' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'ATTENDANCE_OVERRIDE';
  details: string;
  timestamp: string;
  actorUser: {
    employeeId: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
  targetUser?: {
    employeeId: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

export default function AdminAuditLogPage() {
  const router = useRouter();

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async (action: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/audit-logs/admin?action=${action}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        if (response.status === 403) {
          router.push('/dashboard/employee');
          return;
        }
        throw new Error('Failed to load audit logs');
      }
      const data = await response.json();
      setAuditLogs(data.auditLogs || []);
    } catch {
      setError('Error loading administrative audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(filterAction);
  }, [filterAction, router]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'PROFILE_EDIT':
        return (
          <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md font-mono text-[10px] uppercase font-bold inline-flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-indigo-400" /> PROFILE EDIT
          </span>
        );
      case 'SALARY_UPDATE':
        return (
          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md font-mono text-[10px] uppercase font-bold inline-flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400" /> SALARY UPDATE
          </span>
        );
      case 'LEAVE_APPROVED':
        return (
          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md font-mono text-[10px] uppercase font-bold inline-flex items-center gap-1">
            <CalendarCheck className="w-3 h-3 text-emerald-400" /> LEAVE APPROVED
          </span>
        );
      case 'LEAVE_REJECTED':
        return (
          <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded-md font-mono text-[10px] uppercase font-bold inline-flex items-center gap-1">
            <CalendarX className="w-3 h-3 text-rose-400" /> LEAVE REJECTED
          </span>
        );
      case 'ATTENDANCE_OVERRIDE':
        return (
          <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-md font-mono text-[10px] uppercase font-bold inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> ATTENDANCE OVERRIDE
          </span>
        );
      default:
        return <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px]">{action}</span>;
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const actorName = log.actorUser.profile
      ? `${log.actorUser.profile.firstName} ${log.actorUser.profile.lastName}`.toLowerCase()
      : log.actorUser.email.toLowerCase();
    const targetName = log.targetUser?.profile
      ? `${log.targetUser.profile.firstName} ${log.targetUser.profile.lastName}`.toLowerCase()
      : log.targetUser?.email.toLowerCase() || '';

    return (
      actorName.includes(q) ||
      targetName.includes(q) ||
      log.actorUser.employeeId.toLowerCase().includes(q) ||
      (log.targetUser?.employeeId.toLowerCase() || '').includes(q) ||
      log.details.toLowerCase().includes(q)
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
              <h1 className="font-bold text-lg text-white tracking-tight">Consolidated System Audit Log</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-mono hidden sm:inline">
              Administrative Compliance Trail
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {error}
          </div>
        )}

        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" /> Administrative Action Audit Log ({filteredLogs.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Consolidated immutable system event log recording profile edits, salary changes, leave approvals/rejections, and attendance status overrides.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px]">
              {['ALL', 'PROFILE_EDIT', 'SALARY_UPDATE', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'ATTENDANCE_OVERRIDE'].map((act) => (
                <button
                  key={act}
                  onClick={() => setFilterAction(act)}
                  className={`py-1 px-2.5 rounded-lg font-semibold transition-all ${
                    filterAction === act ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {act === 'ALL' ? 'ALL ACTIONS' : act.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search admin, staff, or details..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Audit Log Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Acting Admin</th>
                  <th className="py-3 px-4">Target Employee</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No administrative audit logs recorded for this action filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => {
                    const actorName = l.actorUser.profile
                      ? `${l.actorUser.profile.firstName} ${l.actorUser.profile.lastName}`
                      : l.actorUser.email;
                    const targetName = l.targetUser?.profile
                      ? `${l.targetUser.profile.firstName} ${l.targetUser.profile.lastName}`
                      : l.targetUser?.email || 'N/A';

                    return (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {new Date(l.timestamp).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4">{getActionBadge(l.action)}</td>

                        <td className="py-3.5 px-4 font-bold text-indigo-300">
                          🛡️ {actorName}
                          <span className="block font-mono text-[10px] text-slate-500">{l.actorUser.employeeId}</span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-white">
                          {targetName}
                          {l.targetUser && (
                            <span className="block font-mono text-[10px] text-amber-400">{l.targetUser.employeeId}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={l.details}>
                          {l.details}
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
