'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Plus,
  X,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Info,
} from 'lucide-react';
import TopNavBar from '@/app/components/TopNavBar';

interface LeaveRequestItem {
  id: string;
  leaveType: 'PAID' | 'SICK' | 'UNPAID';
  startDate: string;
  endDate: string;
  remarks: string;
  attachmentUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminComment: string | null;
  createdAt: string;
}

interface LeaveBalances {
  paidLeaveBalance: number;
  sickLeaveBalance: number;
}

export default function EmployeeLeavesPage() {
  const router = useRouter();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [balances, setBalances] = useState<LeaveBalances>({ paidLeaveBalance: 24, sickLeaveBalance: 7 });
  const [loading, setLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<'PAID' | 'SICK' | 'UNPAID'>('PAID');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchLeavesAndBalances = async () => {
    try {
      const [resLeaves, resBal] = await Promise.all([
        fetch('/api/leaves/employee'),
        fetch('/api/leaves/balance'),
      ]);

      if (resLeaves.status === 401) {
        router.push('/signin');
        return;
      }

      if (resLeaves.ok) {
        const data = await resLeaves.json();
        setLeaveRequests(data.leaveRequests || []);
      }

      if (resBal.ok) {
        const bData = await resBal.json();
        if (bData.balances) {
          setBalances({
            paidLeaveBalance: bData.balances.paidLeaveBalance ?? 24,
            sickLeaveBalance: bData.balances.sickLeaveBalance ?? 7,
          });
        }
      }
    } catch {
      // Silent catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeavesAndBalances();
  }, [router]);

  const handleOpenModal = () => {
    setLeaveType('PAID');
    setStartDate('');
    setEndDate('');
    setRemarks('');
    setAttachmentUrl('');
    setFieldErrors({});
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setAttachmentUrl(data.documentUrl);
        setFieldErrors((prev) => ({ ...prev, attachmentUrl: '' }));
      } else {
        setErrorMessage(data.error || 'Failed to upload document');
      }
    } catch {
      setErrorMessage('Error uploading medical certificate document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!startDate) errors.startDate = 'Start date is required';
    if (!endDate) errors.endDate = 'End date is required';
    if (startDate && endDate && endDate < startDate) {
      errors.endDate = 'End date cannot be earlier than start date';
    }

    // Wireframe Rule: Medical Certificate Required for Sick Leave
    if (leaveType === 'SICK' && !attachmentUrl.trim()) {
      errors.attachmentUrl = 'A medical certificate attachment is strictly required when applying for Sick Leave.';
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
          attachmentUrl,
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
        setSuccessMessage('Leave request submitted successfully and is pending admin review!');
        setIsModalOpen(false);
        await fetchLeavesAndBalances();
      }
    } catch {
      setErrorMessage('Network error during leave submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setCancellingId(id);

    try {
      const response = await fetch(`/api/leaves/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage('Pending leave request cancelled.');
        await fetchLeavesAndBalances();
      }
    } catch {
      setErrorMessage('Error cancelling leave request');
    } finally {
      setCancellingId(null);
    }
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      <TopNavBar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Banner Alert Messages */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Wireframe Header Allocation Cards */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-400" /> Time Off Portal
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                View time off allocation balances and submit new leave requests.
              </p>
            </div>

            {/* Wireframe NEW Button */}
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> NEW
            </button>
          </div>

          {/* Wireframe Cards: "Paid time Off — 24 Days Available", "Sick time off — 07 Days Available" */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-sm font-bold text-indigo-400">Paid time Off</span>
              <p className="text-2xl font-black text-white">{balances.paidLeaveBalance} <span className="text-xs font-normal text-slate-400">Days Available</span></p>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-sm font-bold text-amber-400">Sick time off</span>
              <p className="text-2xl font-black text-white">{balances.sickLeaveBalance} <span className="text-xs font-normal text-slate-400">Days Available</span></p>
            </div>
          </div>
        </div>

        {/* My Time Off Requests History Table */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> My Time Off History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Time Off Type</th>
                  <th className="py-3 px-4">Validity Period</th>
                  <th className="py-3 px-4">Allocation Days</th>
                  <th className="py-3 px-4">Attachment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading time off records...
                    </td>
                  </tr>
                ) : leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No time off requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((l) => {
                    const days = calculateDays(l.startDate, l.endDate);
                    const sDate = new Date(l.startDate).toLocaleDateString();
                    const eDate = new Date(l.endDate).toLocaleDateString();

                    return (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition-colors font-mono">
                        <td className="py-3.5 px-4 font-bold text-white">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${
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
                        <td className="py-3.5 px-4 text-slate-200">{sDate} &ndash; {eDate}</td>
                        <td className="py-3.5 px-4 font-bold text-indigo-300">{days} Days</td>
                        <td className="py-3.5 px-4">
                          {l.attachmentUrl ? (
                            <a
                              href={l.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 underline font-semibold"
                            >
                              📄 Medical Cert
                            </a>
                          ) : (
                            <span className="text-slate-600">&mdash;</span>
                          )}
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
                        <td className="py-3.5 px-4 text-right">
                          {l.status === 'PENDING' ? (
                            <button
                              onClick={() => handleCancelRequest(l.id)}
                              disabled={cancellingId === l.id}
                              className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Cancel
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

      {/* Wireframe Time Off Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> Time Off Type Request
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Time Off Type *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as 'PAID' | 'SICK' | 'UNPAID')}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PAID">Paid Time Off</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="UNPAID">Unpaid Leaves</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {fieldErrors.startDate && <p className="text-red-400 text-[11px] mt-0.5">{fieldErrors.startDate}</p>}
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {fieldErrors.endDate && <p className="text-red-400 text-[11px] mt-0.5">{fieldErrors.endDate}</p>}
                </div>
              </div>

              {/* Wireframe Allocation Calculation Display */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                <span className="text-slate-400">Allocation Days:</span>
                <span className="font-bold text-indigo-300 text-sm">{calculateDays(startDate, endDate)} Days</span>
              </div>

              {/* Wireframe Mandatory Medical Certificate Attachment for Sick Leave */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Attachment{' '}
                  {leaveType === 'SICK' ? (
                    <span className="text-amber-400 font-bold">* (Required for Sick Leave Certificate)</span>
                  ) : (
                    <span className="text-slate-600">(Optional)</span>
                  )}
                </label>

                <div className="flex items-center gap-3">
                  <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl cursor-pointer font-bold flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    {isUploading ? 'Uploading...' : 'Choose File'}
                    <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />
                  </label>

                  {attachmentUrl && (
                    <span className="text-emerald-400 font-semibold truncate max-w-[200px]">
                      ✓ Uploaded Medical Certificate
                    </span>
                  )}
                </div>
                {fieldErrors.attachmentUrl && (
                  <p className="text-red-400 text-[11px] mt-1 font-semibold">{fieldErrors.attachmentUrl}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Remarks / Reason</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Doctor appointment scheduled..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Wireframe Submit and Discard Buttons */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
