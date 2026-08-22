'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Lock, Mail, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isVerified = searchParams.get('verified') === 'true';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const errors: Record<string, string> = {};
    if (!formData.email.trim()) errors.email = 'Email address is required';
    if (!formData.password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          if (typeof data.errors === 'string') {
            setGeneralError(data.errors);
          } else {
            setFieldErrors(data.errors);
            if (data.errors.general) setGeneralError(data.errors.general);
          }
        } else {
          setGeneralError('Invalid credentials. Please try again.');
        }
      } else {
        // Redirect to role dashboard
        const redirectPath = data.redirectUrl || '/dashboard/employee';
        router.push(redirectPath);
        router.refresh();
      }
    } catch {
      setGeneralError('Network error. Unable to connect to authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Sign In to Dayflow</h1>
        <p className="text-sm text-slate-400 mt-1">Human Resource Management System</p>
      </div>

      {/* Email Verified Banner */}
      {isVerified && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 flex items-start gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Email Verified!</span>
            Your account email has been verified. You can now sign in below.
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {generalError && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 flex items-start gap-3 text-sm">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Authentication Failed</span>
            {generalError}
          </div>
        </div>
      )}

      {/* Sign In Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@dayflow.com or john.doe@dayflow.com"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-indigo-500'
              } text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-xs font-medium text-slate-300">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-indigo-500'
              } text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2`}
            />
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* Demo Credentials Cheat Sheet */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5 text-xs text-slate-400">
          <span className="font-semibold text-slate-300 block uppercase tracking-wider text-[10px]">
            Demo Seed Accounts (Click to Fill)
          </span>
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setFormData({ email: 'admin@dayflow.com', password: 'AdminPass123!' })}
              className="text-left px-2.5 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-900/50 text-indigo-300 transition-colors flex items-center justify-between"
            >
              <span>👑 Admin: <strong className="font-mono">admin@dayflow.com</strong></span>
              <span className="text-[10px] text-indigo-400/80">AdminPass123!</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ email: 'john.doe@dayflow.com', password: 'EmpPass123!' })}
              className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors flex items-center justify-between"
            >
              <span>👤 Employee: <strong className="font-mono">john.doe@dayflow.com</strong></span>
              <span className="text-[10px] text-slate-400">EmpPass123!</span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Sign In <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Link */}
      <div className="mt-8 text-center text-xs text-slate-400">
        Don&apos;t have an account yet?{' '}
        <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
          Register new account
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950 text-slate-100">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading sign in page...</div>}>
        <SignInContent />
      </Suspense>
    </div>
  );
}
