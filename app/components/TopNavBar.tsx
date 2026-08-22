'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, Users, Clock, Calendar, User, LogOut, ChevronDown } from 'lucide-react';
import NotificationBell from '@/app/components/NotificationBell';
import SystrayAttendance from '@/app/components/SystrayAttendance';

interface UserSession {
  id: string;
  employeeId: string;
  email: string;
  role: 'EMPLOYEE' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

export default function TopNavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const [session, setSession] = useState<UserSession | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setSession(data.user);
        }
      } catch {
        // Silent catch
      }
    }
    fetchSession();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/signin');
    } catch {
      // Silent catch
    }
  };

  const isAdmin = session?.role === 'ADMIN';
  const homePath = isAdmin ? '/dashboard/admin' : '/dashboard/employee';
  const profilePath = isAdmin
    ? `/dashboard/admin/employee/${session?.id || ''}`
    : '/dashboard/employee/profile';
  const attendancePath = isAdmin ? '/dashboard/admin/attendance' : '/dashboard/employee/attendance';
  const leavesPath = isAdmin ? '/dashboard/admin/leaves' : '/dashboard/employee/leaves';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Navigation Links: Company Logo | Employees | Attendance | Time Off */}
        <div className="flex items-center gap-6">
          <Link href={homePath} className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base text-white tracking-tight hidden sm:inline">
              Dayflow <span className="text-indigo-400 font-normal text-xs">HRMS</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 bg-slate-950/70 p-1 border border-slate-800 rounded-xl text-xs">
            <Link
              href={homePath}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                pathname === '/dashboard/admin' || pathname === '/dashboard/employee'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Employees
            </Link>

            <Link
              href={attendancePath}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                pathname.includes('/attendance')
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Attendance
            </Link>

            <Link
              href={leavesPath}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                pathname.includes('/leaves')
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Time Off
            </Link>
          </nav>
        </div>

        {/* Right Header Controls: Systray Attendance | Notification Bell | Avatar Dropdown */}
        <div className="flex items-center gap-3">
          {session && <SystrayAttendance />}
          <NotificationBell />

          {/* User Profile Avatar Dropdown */}
          {session && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
                aria-label="User Profile Menu"
              >
                {session.profilePictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.profilePictureUrl}
                    alt={session.employeeId}
                    className="w-7 h-7 rounded-lg object-cover border border-indigo-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 bg-indigo-950 border border-indigo-800 rounded-lg flex items-center justify-center text-indigo-300 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <span className="text-xs font-semibold max-w-[100px] truncate hidden md:inline">
                  {session.firstName || session.employeeId}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Wireframe Avatar Dropdown: My Profile & Log Out */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 text-xs">
                  <div className="px-3.5 py-2 border-b border-slate-800/80">
                    <span className="font-bold text-white block truncate">
                      {session.firstName ? `${session.firstName} ${session.lastName || ''}` : session.email}
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono block">
                      {session.employeeId} ({session.role})
                    </span>
                  </div>

                  <Link
                    href={profilePath}
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full text-left px-3.5 py-2.5 text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-indigo-400" /> My Profile
                  </Link>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-rose-400 hover:bg-rose-950/50 flex items-center gap-2 font-medium transition-colors border-t border-slate-800/80"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
