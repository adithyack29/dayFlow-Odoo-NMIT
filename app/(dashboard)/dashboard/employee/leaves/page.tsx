'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Trash2,
  Send,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface LeaveRequestItem {
  id: string;
  leaveType: 'PAID' | 'SICK' | 'UNPAID';
  startDate: string;
  endDate: string;
  remarks: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminComment: string | null;
  createdAt: string;
  reviewedBy?: {
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function EmployeeLeavesPage() {
  const router = useRouter();

  // Form State
  const [leaveType, setLeaveType] = useState<'PAID' | 'SICK' | 'UNPAID'>('PAID');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchLeaves = async () => {
    try {
      const response = await fetch('/api/leaves/employee');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        throw new Error('Failed to load leave requests');
      }
      const data = await response.json();
      setLeaveRequests(data.leaveRequests || []);
    } catch {
      setErrorMessage('Error fetching leave history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [router]);

  // Submit Leave Application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    // Client pre-validation
    const errors: Record<string, string> = {};
    if (!startDate) errors.startDate = 'Start date is required';
    if (!endDate) errors.endDate = 'End date is required';
    if (startDate && endDate && endDate < startDate) {
      errors.endDate = 'End date cannot be earlier than start date';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leaves/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          remarks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setErrorMessage(data.error || 'Failed to submit leave request');
        }
      } else {
        setSuccessMessage('Leave request submitted successfully!');
        setStartDate('');
        setEndDate('');
        setRemarks('');
        await fetchLeaves();
      }
    } catch {
      setErrorMessage('Network error during leave submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel PENDING Leave Request
  const handleCancelRequest = async (id: string) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setCancellingId(id);

    try {
      const response = await fetch(`/api/leaves/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to cancel leave request');
      } else {
        setSuccessMessage('Pending leave request cancelled.');
        await fetchLeaves();
      }
    } catch {
      setErrorMessage('Error cancelling leave request');
    } finally {
      setCancellingId(null);
    }
  };

  // Calculate day difference for badge
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Leave Requests...</span>
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
            <h1 className="font-bold text-lg text-white tracking-tight">Apply for Leave &amp; History</h1>
          </div>

          <span className="px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-mono">
            Employee Leave Portal
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

        {/* Form & Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Apply Form */}
          <div className="lg:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> Apply for Leave / Time-Off
              </h2>
              <span className="text-xs text-slate-500 font-mono">Status: PENDING on submission</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Leave Type Dropdown */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Leave Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as 'PAID' | 'SICK' | 'UNPAID')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="PAID">PAID LEAVE (Annual Vacation)</option>
                  <option value="SICK">SICK LEAVE (Medical Emergency)</option>
                  <option value="UNPAID">UNPAID LEAVE (Personal Time)</option>
                </select>
                {fieldErrors.leaveType && <p className="text-xs text-red-400 mt-1">{fieldErrors.leaveType}</p>}
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  {fieldErrors.startDate && <p className="text-xs text-red-400 mt-1">{fieldErrors.startDate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    End Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  {fieldErrors.endDate && <p className="text-xs text-red-400 mt-1">{fieldErrors.endDate}</p>}
                </div>
              </div>

              {/* Remarks Textarea */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Remarks / Reason
                  </label>
                  <span className="text-[10px] text-slate-500">{remarks.length}/300 chars</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Family vacation planned, or doctor consultation..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                {fieldErrors.remarks && <p className="text-xs text-red-400 mt-1">{fieldErrors.remarks}</p>}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Leave Application
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Business Rules & Overlap Guidelines */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3 text-xs">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-400" /> Leave Rules &amp; Guidelines
              </h3>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
                <span className="font-semibold text-amber-400 block">⚡ Backdating Rules</span>
                <p>
                  &bull; <strong>PAID &amp; UNPAID Leave:</strong> Must be requested for current or future dates (no backdating allowed).
                </p>
                <p>
                  &bull; <strong>SICK Leave:</strong> Allows up to <strong>7 days backdating</strong> for sudden medical emergencies.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
                <span className="font-semibold text-indigo-400 block">🛡️ Overlap Prevention</span>
                <p>
                  The system automatically rejects requests that overlap with existing PENDING or APPROVED leave ranges.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
              Dayflow HRMS Time-Off Module v1.0
            </div>
          </div>
        </div>

        {/* 2. My Leave Requests History Table */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> My Leave Requests History ({leaveRequests.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Track status updates and cancel PENDING requests prior to Admin review.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Date Range</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admin Review</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No leave requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((l) => {
                    const durationDays = calculateDays(l.startDate, l.endDate);
                    const sDate = new Date(l.startDate).toLocaleDateString();
                    const eDate = new Date(l.endDate).toLocaleDateString();

                    return (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-bold border ${
                              l.leaveType === 'PAID'
                                ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                                : l.leaveType === 'SICK'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {l.leaveType}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                          {sDate} &ndash; {eDate}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-indigo-400">
                          {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate" title={l.remarks}>
                          {l.remarks || 'No remarks provided'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase border ${
                              l.status === 'APPROVED'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : l.status === 'PENDING'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-rose-950 text-rose-300 border-rose-800'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 max-w-[150px] truncate">
                          {l.adminComment ? (
                            <span className="text-[11px] text-amber-300 font-medium" title={l.adminComment}>
                              💬 {l.adminComment}
                            </span>
                          ) : (
                            <span className="text-slate-600">&mdash;</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {l.status === 'PENDING' ? (
                            <button
                              onClick={() => handleCancelRequest(l.id)}
                              disabled={cancellingId === l.id}
                              className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                            >
                              {cancellingId === l.id ? (
                                <div className="w-3 h-3 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              Cancel
                            </button>
                          ) : (
                            <span className="text-slate-600 text-[11px]">Locked</span>
                          )}
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
