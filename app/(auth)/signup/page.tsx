'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserCheck, Building2, Lock, Mail, User, Check, X, ShieldAlert, AlertCircle, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    employeeId: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'EMPLOYEE',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    verificationUrl?: string;
  } | null>(null);

  // Live password validation state
  const hasMinLen = formData.password.length >= 8;
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
  const isPasswordValid = hasMinLen && hasNumber && hasSpecialChar;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear specific field error on user input
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleRoleSelect = (role: 'EMPLOYEE' | 'ADMIN') => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    // Client-side pre-validation
    const errors: Record<string, string> = {};
    if (!formData.employeeId.trim()) errors.employeeId = 'Employee ID is required';
    if (!formData.email.trim()) errors.email = 'Email address is required';
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!isPasswordValid) {
      errors.password = 'Password does not meet required security criteria';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
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
          setGeneralError('Registration failed. Please check your inputs.');
        }
      } else {
        setSuccessInfo({
          message: data.message || 'Account created successfully!',
          verificationUrl: data.user?.verificationUrl,
        });
      }
    } catch {
      setGeneralError('Network error. Unable to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950 text-slate-100">
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Create Dayflow Account</h1>
          <p className="text-sm text-slate-400 mt-1">Register new employee or admin account for HRMS access</p>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 flex items-start gap-3 text-sm">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Registration Error</span>
              {generalError}
            </div>
          </div>
        )}

        {/* Success Modal / Banner */}
        {successInfo ? (
          <div className="p-6 bg-emerald-950/70 border border-emerald-800/80 rounded-2xl text-emerald-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-emerald-200">Account Created!</h3>
                <p className="text-xs text-emerald-300/80">{successInfo.message}</p>
              </div>
            </div>

            {/* Simulated Email Verification Box */}
            <div className="p-4 bg-slate-900 border border-emerald-900/50 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
                  <span>⚡</span> [SIMULATED EMAIL DELIVERY]
                </span>
              </div>
              <p className="text-slate-400">
                Since third-party email providers are disabled, click below to verify email:
              </p>
              {successInfo.verificationUrl && (
                <a
                  href={successInfo.verificationUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors w-full justify-center"
                >
                  Verify Email Now <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/signin"
                className="text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-4"
              >
                Proceed to Sign In &rarr;
              </Link>
            </div>
          </div>
        ) : (
          /* Sign Up Form */
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Role Selector Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Account Type / Role
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('EMPLOYEE')}
                  className={`py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    formData.role === 'EMPLOYEE'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" /> Employee
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('ADMIN')}
                  className={`py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    formData.role === 'ADMIN'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <UserCheck className="w-4 h-4" /> Admin / HR
                </button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-xs font-medium text-slate-300 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                    fieldErrors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-indigo-500'
                  } text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2`}
                />
                {fieldErrors.firstName && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-medium text-slate-300 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                    fieldErrors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-indigo-500'
                  } text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2`}
                />
                {fieldErrors.lastName && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Employee ID */}
            <div>
              <label htmlFor="employeeId" className="block text-xs font-medium text-slate-300 mb-1">
                Employee ID
              </label>
              <input
                id="employeeId"
                name="employeeId"
                type="text"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="e.g. EMP-101"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                  fieldErrors.employeeId ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-indigo-500'
                } text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2`}
              />
              {fieldErrors.employeeId && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.employeeId}
                </p>
              )}
            </div>

            {/* Email Address */}
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
                  placeholder="employee@company.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border ${
                    fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-indigo-500'
                  } text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
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
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.password}
                </p>
              )}

              {/* Password Rule Indicators */}
              <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Password Requirements
                </span>
                <div className="flex items-center gap-2">
                  {hasMinLen ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span className={hasMinLen ? 'text-emerald-300' : 'text-slate-500'}>
                    At least 8 characters long
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span className={hasNumber ? 'text-emerald-300' : 'text-slate-500'}>
                    Contains at least one number (0-9)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasSpecialChar ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span className={hasSpecialChar ? 'text-emerald-300' : 'text-slate-500'}>
                    Contains at least one special character (!@#$%^&*)
                  </span>
                </div>
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
                'Create Account'
              )}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-8 text-center text-xs text-slate-400">
          Already have a Dayflow account?{' '}
          <Link href="/signin" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
