'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Crown,
  ArrowLeft,
  DollarSign,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  History,
  X,
  Save,
  Search,
  Zap,
} from 'lucide-react';

interface EmployeePayroll {
  id: string;
  employeeId: string;
  email: string;
  role: string;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
    department: string;
    baseSalary: number;
    housingAllowance: number;
    otherAllowances: number;
    updatedAt: string;
  };
}

interface SalaryHistoryItem {
  id: string;
  oldBaseSalary: number;
  newBaseSalary: number;
  oldHousingAllowance: number;
  newHousingAllowance: number;
  oldOtherAllowances: number;
  newOtherAllowances: number;
  createdAt: string;
  profile: {
    firstName: string;
    lastName: string;
    user: {
      employeeId: string;
    };
  };
  changedBy: {
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function AdminPayrollPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeePayroll[]>([]);
  const [salaryHistories, setSalaryHistories] = useState<SalaryHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Salary Edit Modal State
  const [editEmp, setEditEmp] = useState<EmployeePayroll | null>(null);
  const [baseSalary, setBaseSalary] = useState('');
  const [housingAllowance, setHousingAllowance] = useState('');
  const [otherAllowances, setOtherAllowances] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Payslip Generator Modal State
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [targetMonth, setTargetMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);

  const fetchAdminPayroll = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payroll/admin');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        if (response.status === 403) {
          router.push('/dashboard/employee');
          return;
        }
        throw new Error('Failed to load admin payroll data');
      }
      const data = await response.json();
      setEmployees(data.employees || []);
      setSalaryHistories(data.salaryHistories || []);
    } catch {
      setError('Error fetching admin payroll details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminPayroll();
  }, [router]);

  // Open Edit Salary Modal
  const handleOpenEdit = (emp: EmployeePayroll) => {
    setEditEmp(emp);
    setBaseSalary(String(emp.profile.baseSalary));
    setHousingAllowance(String(emp.profile.housingAllowance));
    setOtherAllowances(String(emp.profile.otherAllowances));
    setEditError(null);
  };

  const handleCloseEdit = () => {
    setEditEmp(null);
    setEditError(null);
  };

  // Submit Salary Edit
  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmp) return;

    const numBase = Number(baseSalary);
    const numHousing = Number(housingAllowance);
    const numOther = Number(otherAllowances);

    if (isNaN(numBase) || numBase < 0 || isNaN(numHousing) || numHousing < 0 || isNaN(numOther) || numOther < 0) {
      setEditError('All salary amounts must be non-negative numbers.');
      return;
    }

    setEditError(null);
    setIsSubmittingEdit(true);

    try {
      const response = await fetch('/api/payroll/admin/update-salary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: editEmp.profile.id,
          baseSalary: numBase,
          housingAllowance: numHousing,
          otherAllowances: numOther,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setEditError(data.error || 'Failed to update salary');
      } else {
        setSuccessMessage(`Salary structure for ${editEmp.profile.firstName} updated and audit log recorded.`);
        handleCloseEdit();
        await fetchAdminPayroll();
      }
    } catch {
      setEditError('Network error updating salary');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Generate Payslips
  const handleGeneratePayslips = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMonth) return;

    setGeneratorError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/payroll/admin/generate-payslips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: targetMonth }),
      });

      const data = await response.json();
      if (!response.ok) {
        setGeneratorError(data.error || 'Failed to generate payslips');
      } else {
        setSuccessMessage(`Monthly payslips successfully generated for ${targetMonth} across all staff!`);
        setShowGeneratorModal(false);
      }
    } catch {
      setGeneratorError('Network error generating payslips');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const q = searchQuery.toLowerCase();
    const name = `${e.profile.firstName} ${e.profile.lastName}`.toLowerCase();
    return e.employeeId.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || name.includes(q);
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
              <h1 className="font-bold text-lg text-white tracking-tight">Admin Payroll Control Panel</h1>
            </div>
          </div>

          <button
            onClick={() => setShowGeneratorModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> Generate Monthly Payslips
          </button>
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

        {/* 1. Employee Salary Structure Directory */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Employee Compensation Directory
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage contracted base salaries and allowances. Edits are recorded in the system audit log.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, ID..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Base Salary</th>
                  <th className="py-3 px-4">Housing</th>
                  <th className="py-3 px-4">Other Allowances</th>
                  <th className="py-3 px-4">Gross Compensation</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading employee salary list...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No employees match search query.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((e) => {
                    const gross = e.profile.baseSalary + e.profile.housingAllowance + e.profile.otherAllowances;

                    return (
                      <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {e.profile.firstName} {e.profile.lastName}
                          <span className="block font-normal text-[11px] text-slate-500">{e.email}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-amber-300">{e.employeeId}</td>

                        <td className="py-3.5 px-4 text-slate-300">{e.profile.department}</td>

                        <td className="py-3.5 px-4 font-mono text-slate-200">
                          ${e.profile.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          ${e.profile.housingAllowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          ${e.profile.otherAllowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-black text-emerald-400">
                          ${gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenEdit(e)}
                            className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit Structure
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Salary Change Audit Logs Table */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" /> Salary Change Audit Log ({salaryHistories.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                System audit trail recording historical compensation revisions, old vs new values, and acting admin ID.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Old Base Salary</th>
                  <th className="py-3 px-4">New Base Salary</th>
                  <th className="py-3 px-4">Modified By Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {salaryHistories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No salary change audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  salaryHistories.map((h) => {
                    const empName = `${h.profile.firstName} ${h.profile.lastName}`;
                    const adminName = h.changedBy.profile
                      ? `${h.changedBy.profile.firstName} ${h.changedBy.profile.lastName}`
                      : 'System Admin';

                    return (
                      <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {new Date(h.createdAt).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-white">
                          {empName}
                          <span className="block font-mono text-[10px] text-amber-400">{h.profile.user.employeeId}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-rose-400 line-through">
                          ${h.oldBaseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          ${h.newBaseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 text-indigo-300 font-semibold">
                          🛡️ {adminName}
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

      {/* Edit Salary Structure Modal */}
      {editEmp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" /> Edit Employee Salary Structure
              </h3>
              <button onClick={handleCloseEdit} className="text-slate-500 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveSalary} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block">Target Staff</span>
                <span className="font-bold text-white text-sm block">
                  {editEmp.profile.firstName} {editEmp.profile.lastName}
                </span>
                <span className="text-amber-400 font-mono">{editEmp.employeeId} &bull; {editEmp.profile.department}</span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Contracted Base Salary ($) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Housing Allowance ($)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={housingAllowance}
                  onChange={(e) => setHousingAllowance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Other Allowances ($)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={otherAllowances}
                  onChange={(e) => setOtherAllowances(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  {isSubmittingEdit ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save &amp; Record Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Payslips Modal */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" /> Generate Monthly Payslips
              </h3>
              <button onClick={() => setShowGeneratorModal(false)} className="text-slate-500 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatorError && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                {generatorError}
              </div>
            )}

            <form onSubmit={handleGeneratePayslips} className="space-y-4 text-xs">
              <p className="text-slate-400">
                Generate monthly payslips for all active employees. Deductions will be automatically computed from real <strong>Attendance (ABSENT)</strong> and <strong>Leave (UNPAID)</strong> records for the selected month.
              </p>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Pay Period (Month)</label>
                <input
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-amber-400 block">⚡ Deduction Rule Formula</span>
                <p>Gross Salary / 22 &times; (ABSENT days + UNPAID leave days)</p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGeneratorModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Run Batch Generation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
