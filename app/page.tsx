import Link from 'next/link';
import { Building2, ShieldCheck, ArrowRight, Lock, UserCheck, Users, Database } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between px-6 py-12">
      {/* Navbar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">Dayflow HRMS</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto w-full text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-950/80 border border-indigo-800/60 rounded-full text-indigo-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-indigo-400" /> Milestone 1 &bull; Local SQLite &amp; JWT Auth
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Next-Gen Human Resource <br className="hidden md:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-amber-300 bg-clip-text text-transparent">
            Management System
          </span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
          Streamline employee onboarding, attendance tracking, leave requests, and payroll structures with Dayflow local-first HRMS platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/signin"
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            Access Portal <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-sm font-semibold transition-all"
          >
            Create Account
          </Link>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 text-left">
          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <Database className="w-6 h-6 text-indigo-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Prisma + SQLite</h3>
            <p className="text-xs text-slate-400">
              Structured database schema with 1:1 profiles, attendance constraints, and leave relations.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <Lock className="w-6 h-6 text-amber-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Bcrypt &amp; JWT</h3>
            <p className="text-xs text-slate-400">
              Secure password hashing and HTTP-only session cookies with role-based middleware guards.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <UserCheck className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Granular Validation</h3>
            <p className="text-xs text-slate-400">
              Field-level error responses, email format checks, and complexity validation on both client and server.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 pt-8 border-t border-slate-900">
        Dayflow HRMS &bull; Local Development Milestone
      </footer>
    </div>
  );
}
