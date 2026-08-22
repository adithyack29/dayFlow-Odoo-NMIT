'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Crown,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileCheck,
  Search,
  AlertCircle,
  X,
  Save,
  MessageSquare,
  User,
  AlertTriangle,
} from 'lucide-react';
import NotificationBell from '@/app/components/NotificationBell';

interface AdminLeaveItem {
  id: string;
  leaveType: 'PAID' | 'SICK' | 'UNPAID';
  startDate: string;
  endDate: string;
  remarks: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminComment: string | null;
  createdAt: string;
  user: {
    id: string;
    employeeId: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      department?: string;
      paidLeaveBalance: number;
      sickLeaveBalance: number;
    };
  };
}

export default function AdminLeavesPage() {
  const router = useRouter();

  const [leaveRequests, setLeaveRequests] = useState<AdminLeaveItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Modal State
  const [reviewItem, setReviewItem] = useState<AdminLeaveItem | null>(null);
  const [reviewActionStatus, setReviewActionStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [adminComment, setAdminComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /*
   * DIFFERENTIATOR 1 - REAL-TIME LIVE POLLING:
   * Interval-based polling fetches fresh pending leave requests every 12 seconds.
   * This updates the actionable approval queue dynamically without manual page refresh.
   */
  const fetchAdminLeaves = async (status: string) => {
    try {
      const response = await fetch(`/api/leaves/admin?status=${status}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        if (response.status === 403) {
          router.push('/dashboard/employee');
          return;
        }
        throw new Error('Failed to load leave approval queue');
      }
      const data = await response.json();
      setLeaveRequests(data.leaveRequests || []);
    } catch {
      setError('Error fetching admin leave queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminLeaves(filterStatus);

    // 12-second interval poll for live dynamic queue updates
    const interval = setInterval(() => {
      fetchAdminLeaves(filterStatus);
    }, 12000);

    return () => clearInterval(interval);
  }, [filterStatus, router]);

  const handleOpenReview = (item: AdminLeaveItem, action: 'APPROVED' | 'REJECTED') => {
    setReviewItem(item);
    setReviewActionStatus(action);
    setAdminComment('');
    setReviewError(null);
  };

  const handleCloseReview = () => {
    setReviewItem(null);
    setReviewError(null);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewItem) return;

    if (reviewActionStatus === 'REJECTED' && !adminComment.trim()) {
      setReviewError('An admin comment explaining the rejection reason is strictly required.');
      return;
    }

    setReviewError(null);
    setIsSubmittingReview(true);

    try {
      const response = await fetch('/api/leaves/admin/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveRequestId: reviewItem.id,
          status: reviewActionStatus,
          adminComment,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setReviewError(data.error || 'Failed to review leave request');
      } else {
        const empName = reviewItem.user.profile
          ? `${reviewItem.user.profile.firstName} ${reviewItem.user.profile.lastName}`
          : reviewItem.user.email;
        setSuccessMessage(`Leave request for ${empName} has been ${reviewActionStatus.toLowerCase()}.`);
        handleCloseReview();
        await fetchAdminLeaves(filterStatus);
      }
    } catch {
      setReviewError('Network error during leave review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const filteredLeaves = leaveRequests.filter((l) => {
    const q = searchQuery.toLowerCase();
    const fullName = l.user.profile ? `${l.user.profile.firstName} ${l.user.profile.lastName}`.toLowerCase() : '';
    return (
      l.user.employeeId.toLowerCase().includes(q) ||
      l.user.email.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      l.remarks.toLowerCase().includes(q)
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
              <h1 className="font-bold text-lg text-white tracking-tight">Admin Leave Approval Queue</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="px-3 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-xl text-xs font-mono hidden sm:inline">
              Actionable Queue
            </span>
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

        {/* Filter Bar & Header */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" /> Actionable Leave Approval Queue
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review employee time-off requests. Approving automatically updates Attendance and decrements Leave Balances.
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`py-1.5 px-3 rounded-lg font-semibold transition-all ${
                  filterStatus === 'PENDING'
                    ? 'bg-amber-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                PENDING
              </button>
              <button
                onClick={() => setFilterStatus('APPROVED')}
                className={`py-1.5 px-3 rounded-lg font-semibold transition-all ${
                  filterStatus === 'APPROVED'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                APPROVED
              </button>
              <button
                onClick={() => setFilterStatus('REJECTED')}
                className={`py-1.5 px-3 rounded-lg font-semibold transition-all ${
                  filterStatus === 'REJECTED'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                REJECTED
              </button>
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`py-1.5 px-3 rounded-lg font-semibold transition-all ${
                  filterStatus === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ALL
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff, ID, or remarks..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Remaining Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading leave approval queue...
                    </td>
                  </tr>
                ) : filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No leave requests in this queue view.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((l) => {
                    const empName = l.user.profile
                      ? `${l.user.profile.firstName} ${l.user.profile.lastName}`
                      : l.user.email;
                    const durationDays = calculateDays(l.startDate, l.endDate);
                    const sDate = new Date(l.startDate).toLocaleDateString();
                    const eDate = new Date(l.endDate).toLocaleDateString();

                    const pBal = l.user.profile?.paidLeaveBalance ?? 12;
                    const sBal = l.user.profile?.sickLeaveBalance ?? 8;
                    const remBal = l.leaveType === 'PAID' ? `${pBal} Days` : l.leaveType === 'SICK' ? `${sBal} Days` : 'Unlimited';

                    return (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {empName}
                          <span className="block font-normal text-[11px] text-slate-500">{l.user.email}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-amber-300">
                          {l.user.employeeId}
                        </td>

                        <td className="py-3.5 px-4">
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

                        <td className="py-3.5 px-4 font-mono text-slate-200">
                          {sDate} &ndash; {eDate}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-indigo-400">
                          {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                          {remBal}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${
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

                        <td className="py-3.5 px-4 text-right space-x-2">
                          {l.status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => handleOpenReview(l, 'APPROVED')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleOpenReview(l, 'REJECTED')}
                                className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Reviewed</span>
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

      {/* Admin Review Modal */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" /> Review Leave Application
              </h3>
              <button
                onClick={handleCloseReview}
                className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block">Requester Profile</span>
                <span className="font-bold text-white text-sm block">
                  {reviewItem.user.profile
                    ? `${reviewItem.user.profile.firstName} ${reviewItem.user.profile.lastName}`
                    : reviewItem.user.email}
                </span>
                <span className="text-amber-400 font-mono">
                  {reviewItem.user.employeeId} &bull; Type: {reviewItem.leaveType}
                </span>
                <p className="text-slate-400 text-[11px] pt-1">
                  Requested Duration: {calculateDays(reviewItem.startDate, reviewItem.endDate)} Days
                </p>

                {/* Balance Indicator */}
                <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px]">
                  <span className="text-slate-400">Remaining Balance:</span>
                  <span className="font-bold text-indigo-300 font-mono">
                    {reviewItem.leaveType === 'PAID'
                      ? `${reviewItem.user.profile?.paidLeaveBalance ?? 12} Days Paid`
                      : reviewItem.leaveType === 'SICK'
                      ? `${reviewItem.user.profile?.sickLeaveBalance ?? 8} Days Sick`
                      : 'Unlimited Unpaid'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Action Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewActionStatus('APPROVED')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      reviewActionStatus === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewActionStatus('REJECTED')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      reviewActionStatus === 'REJECTED'
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Reject Leave
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Admin Comment{' '}
                  {reviewActionStatus === 'REJECTED' ? (
                    <span className="text-red-400 font-bold">* (Required for Rejection)</span>
                  ) : (
                    <span className="text-slate-500">(Optional)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder={
                    reviewActionStatus === 'REJECTED'
                      ? 'Please explain reason for rejection (e.g. Project deliverable deadline)...'
                      : 'Optional approval note...'
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  {isSubmittingReview ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
