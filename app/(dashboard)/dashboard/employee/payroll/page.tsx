'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  DollarSign,
  ArrowLeft,
  Calendar,
  FileText,
  Printer,
  X,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface SalaryStructure {
  baseSalary: number;
  housingAllowance: number;
  otherAllowances: number;
  grossSalary: number;
}

interface UserSummary {
  employeeId: string;
  email: string;
  fullName: string;
  designation: string;
  department: string;
}

interface Payslip {
  id: string;
  month: string;
  baseSalary: number;
  housingAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  absentDays: number;
  unpaidLeaveDays: number;
  deductions: number;
  netSalary: number;
  generatedAt: string;
}

export default function EmployeePayrollPage() {
  const router = useRouter();

  const [salaryStructure, setSalaryStructure] = useState<SalaryStructure | null>(null);
  const [userInfo, setUserInfo] = useState<UserSummary | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Printable Payslip Modal State
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payroll/employee');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/signin');
          return;
        }
        throw new Error('Failed to load payroll details');
      }
      const data = await response.json();
      setSalaryStructure(data.salaryStructure);
      setUserInfo(data.user);
      setPayslips(data.payslips || []);
    } catch {
      setError('Error fetching payroll information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Payroll &amp; Payslips...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12 print:bg-white print:text-black">
      {/* Top Navbar (hidden on print) */}
      <header className="sticky top-0 z-40 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 py-4 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/employee"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-bold text-lg text-white tracking-tight">My Salary &amp; Payslips</h1>
          </div>

          <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Read-Only Portal
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8 print:p-0">
        {error && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-3 text-xs font-semibold print:hidden">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {error}
          </div>
        )}

        {/* 1. Salary Structure Summary Widgets */}
        <div className="print:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Salary Structure Breakdown
            </h2>
            <span className="text-xs text-slate-500 font-mono">Managed by HR Administration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Base Salary</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">
                ${salaryStructure?.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500 block">Annual contracted base</span>
            </div>

            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Housing Allowance</span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-indigo-300">
                ${salaryStructure?.housingAllowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500 block">Monthly housing stipend</span>
            </div>

            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Other Allowances</span>
                <CreditCard className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-extrabold text-sky-300">
                ${salaryStructure?.otherAllowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500 block">Transport &amp; medical</span>
            </div>

            <div className="p-5 bg-gradient-to-br from-emerald-950/90 to-slate-900 border border-emerald-800/80 rounded-2xl space-y-2 shadow-lg shadow-emerald-950/30">
              <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
                <span>Gross Compensation</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-400">
                ${salaryStructure?.grossSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-emerald-200/60 block">Total monthly before deductions</span>
            </div>
          </div>
        </div>

        {/* 2. Monthly Payslips Table */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" /> Generated Monthly Payslips ({payslips.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Download or print monthly salary statements reflecting attendance &amp; unpaid leave deductions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Pay Period</th>
                  <th className="py-3 px-4">Gross Pay</th>
                  <th className="py-3 px-4">Absent Days</th>
                  <th className="py-3 px-4">Unpaid Leave</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4 text-right">Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payslips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No monthly payslips generated yet by HR administration.
                    </td>
                  </tr>
                ) : (
                  payslips.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-300">{p.month}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        ${p.grossSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">{p.absentDays} days</td>
                      <td className="py-3.5 px-4 font-mono text-sky-400">{p.unpaidLeaveDays} days</td>
                      <td className="py-3.5 px-4 font-mono text-rose-400">
                        -${p.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-400 text-sm">
                        ${p.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedPayslip(p)}
                          className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Payslip
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

      {/* Printable Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:static print:bg-white">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:w-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 print:border-black pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-slate-950 flex items-center justify-center font-black text-xl">
                  D
                </div>
                <div>
                  <h2 className="font-extrabold text-xl text-white print:text-black tracking-tight">DAYFLOW HRMS</h2>
                  <p className="text-xs text-slate-400 print:text-gray-600">Official Monthly Earnings Statement</p>
                </div>
              </div>

              <div className="text-right print:hidden flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Statement
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Employee Metadata */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 print:bg-gray-100 rounded-xl border border-slate-800 print:border-gray-300 text-xs">
              <div>
                <span className="text-slate-500 print:text-gray-500 block">Employee Name</span>
                <span className="font-bold text-white print:text-black text-sm">{userInfo?.fullName}</span>
                <span className="text-amber-400 print:text-amber-700 font-mono block mt-0.5">{userInfo?.employeeId}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 print:text-gray-500 block">Pay Period / Month</span>
                <span className="font-mono font-bold text-emerald-400 print:text-emerald-700 text-sm">
                  {selectedPayslip.month}
                </span>
                <span className="text-slate-400 print:text-gray-600 block mt-0.5">{userInfo?.department} &bull; {userInfo?.designation}</span>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-gray-300 pb-1">
                Earnings &amp; Deductions Breakdown
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60 print:border-gray-200">
                  <span className="text-slate-300 print:text-gray-700">Contracted Base Salary</span>
                  <span className="font-mono text-white print:text-black">${selectedPayslip.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60 print:border-gray-200">
                  <span className="text-slate-300 print:text-gray-700">Housing Allowance</span>
                  <span className="font-mono text-white print:text-black">${selectedPayslip.housingAllowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60 print:border-gray-200">
                  <span className="text-slate-300 print:text-gray-700">Other Allowances</span>
                  <span className="font-mono text-white print:text-black">${selectedPayslip.otherAllowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-2 font-bold text-sm bg-slate-950/60 print:bg-gray-100 px-3 rounded-lg">
                  <span className="text-emerald-300 print:text-emerald-800">Total Gross Pay</span>
                  <span className="font-mono text-emerald-400 print:text-emerald-800">${selectedPayslip.grossSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="space-y-2 pt-2">
                <span className="font-semibold text-rose-400 print:text-red-700 block">Attendance &amp; Leave Deductions</span>

                <div className="flex justify-between py-1 text-slate-400 print:text-gray-600 text-[11px]">
                  <span>Absent Days ({selectedPayslip.absentDays} days) + Unpaid Leave ({selectedPayslip.unpaidLeaveDays} days)</span>
                  <span className="font-mono text-rose-400 print:text-red-600">-${selectedPayslip.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Net Pay Box */}
              <div className="p-4 bg-emerald-950/80 print:bg-emerald-100 border border-emerald-800 print:border-emerald-400 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-200 print:text-emerald-900 font-bold uppercase block">NET TAKE-HOME PAY</span>
                  <span className="text-[10px] text-emerald-400/80 print:text-emerald-700 block">Directly credited to verified bank account</span>
                </div>
                <span className="text-2xl font-black text-emerald-300 print:text-emerald-900 font-mono">
                  ${selectedPayslip.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 print:border-gray-300 flex justify-between items-center text-[10px] text-slate-500 print:text-gray-500">
              <span>Generated on {new Date(selectedPayslip.generatedAt).toLocaleDateString()}</span>
              <span>System Verification Hash: {selectedPayslip.id.slice(0, 12)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
