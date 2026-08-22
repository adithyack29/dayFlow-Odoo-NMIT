'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bell, CheckCheck, Check, Info, Calendar, DollarSign, UserCheck, AlertTriangle } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'LEAVE_STATUS' | 'LEAVE_SUBMITTED' | 'PROFILE_UPDATED' | 'SALARY_UPDATED' | 'LOW_LEAVE_BALANCE' | 'GENERAL';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /*
   * DIFFERENTIATOR 1 - REAL-TIME LIVE POLLING:
   * Interval-based polling fetches fresh notifications every 10 seconds.
   * This ensures status changes and new alert notifications appear dynamically
   * without requiring a manual page refresh.
   */
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Silent catch for background polling
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set 10-second interval poll for live real-time updates
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id?: string, markAll = false) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, markAll }),
      });
      if (response.ok) {
        await fetchNotifications();
      }
    } catch {
      // Silent handle
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LEAVE_STATUS':
      case 'LEAVE_SUBMITTED':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'SALARY_UPDATED':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'PROFILE_UPDATED':
        return <UserCheck className="w-4 h-4 text-indigo-400" />;
      case 'LOW_LEAVE_BALANCE':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 flex items-center justify-center"
        aria-label="View Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-slate-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">In-App Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded-full text-[10px] font-bold">
                  {unreadCount} New
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => handleMarkAsRead(undefined, true)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No notifications logged yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                    n.isRead ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-800/40 text-slate-100 font-medium'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getNotificationIcon(n.type)}</div>
                  <div className="space-y-1 flex-1">
                    <p className="leading-snug text-xs">{n.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull;{' '}
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 bg-amber-400 rounded-full shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono">
            ⚡ Real-Time Polling: Synced every 10s
          </div>
        </div>
      )}
    </div>
  );
}
