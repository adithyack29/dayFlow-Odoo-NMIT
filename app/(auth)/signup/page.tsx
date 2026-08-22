'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Lock, Mail, User, Phone, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CompanySignUpPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState('Odoo India');
  const [companyCode, setCompanyCode] = useState('OI');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const errors: Record<string, string> = {};
    if (!companyName.trim()) errors.companyName = 'Company name is required';
    if (!companyCode.trim()) errors.companyCode = 'Company code is required (e.g. OI)';
    if (!adminName.trim()) errors.adminName = 'Admin full name is required';
    if (!email.trim()) errors.email = 'Email address is required';
    if (!password) errors.password = 'Password is required';
    if (password && password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create initial company settings & first admin
      const resCompany = await fetch('/api/company/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, companyCode }),
      });

      const parts = adminName.trim().split(' ');
      const firstName = parts[0] || 'Admin';
      const lastName = parts.slice(1).join(' ') || 'User';

      const resUser = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: `${companyCode.toUpperCase()}ADMIN0001`,
          email,
          password,
          firstName,
          lastName,
          role: 'ADMIN',
        }),
      });

      const data = await resUser.json();
      if (!resUser.ok) {
        if (data.errors) setFieldErrors(data.errors);
        else setGeneralError(data.error || 'Failed to create company account');
      } else {
        setSuccessMsg('Initial Organization & Admin Account created! Redirecting to Sign In...');
        setTimeout(() => {
          router.push('/signin');
        }, 1500);
      }
    } catch {
      setGeneralError('Network error during company registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 space-y-6">
        {/* Wireframe Logo & Title Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Organization Sign Up</h1>
          <p className="text-xs text-slate-400">
            Create initial company profile &amp; first Admin account.
            <span className="block font-semibold text-amber-400 mt-1">
              Note: Employee onboarding is handled by Admin inside the app.
            </span>
          </p>
        </div>

        {generalError && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {generalError}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Wireframe Form matching Image 1 */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Odoo India"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {fieldErrors.companyName && <p className="text-red-400 text-[11px] mt-0.5">{fieldErrors.companyName}</p>}
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Code *</label>
              <input
                type="text"
                maxLength={4}
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                placeholder="e.g. OI"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold uppercase placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
              />
              {fieldErrors.companyCode && <p className="text-red-400 text-[11px] mt-0.5">{fieldErrors.companyCode}</p>}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Admin Full Name *</label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="e.g. Subhradeep"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {fieldErrors.adminName && <p className="text-red-400 text-[11px] mt-0.5">{fieldErrors.adminName}</p>}
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Admin Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@odooindia.com"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {fieldErrors.email && <p className="text-red-400 text-[11px] mt-0.5">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9876543210"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {fieldErrors.password && <p className="text-red-400 text-[11px] mt-0.5">{fieldErrors.password}</p>}
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Confirm Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {fieldErrors.confirmPassword && <p className="text-red-400 text-[11px] mt-0.5">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-lg shadow-purple-600/30 text-sm mt-2"
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          Already have an account?{' '}
          <Link href="/signin" className="text-indigo-400 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
