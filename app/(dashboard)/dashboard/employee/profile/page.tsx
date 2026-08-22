'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Briefcase,
  Building,
  Key,
  FileText,
  Award,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Trash2,
} from 'lucide-react';
import TopNavBar from '@/app/components/TopNavBar';

interface UserProfileData {
  id: string;
  employeeId: string;
  email: string;
  role: 'EMPLOYEE' | 'ADMIN';
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    designation: string;
    department: string;
    profilePictureUrl?: string;

    // Private Info
    jobPosition?: string;
    managerName?: string;
    location?: string;
    residingAddress?: string;
    dateOfBirth?: string;
    nationality?: string;
    personalEmail?: string;
    gender?: string;
    maritalStatus?: string;

    // Bank Details
    bankAccountNumber?: string;
    bankName?: string;
    ifscCode?: string;

    // About & Skills
    aboutText?: string;
    skillsJson?: string;
  } | null;
}

export default function EmployeeSelfProfilePage() {
  const router = useRouter();

  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'bank' | 'security' | 'about' | 'skills'>('resume');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Permitted Editable Fields for Employee
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [residingAddress, setResidingAddress] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // About & Skills
  const [aboutText, setAboutText] = useState('');
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const resMe = await fetch('/api/auth/me');
        if (!resMe.ok) {
          router.push('/signin');
          return;
        }

        const meData = await resMe.json();
        const targetId = meData.user.id || meData.user.userId;
        const resProf = await fetch(`/api/profile/${targetId}`);
        if (!resProf.ok) throw new Error('Failed to load profile');

        const data = await resProf.json();
        const u = data.user as UserProfileData;
        setUserData(u);

        if (u.profile) {
          const p = u.profile;
          setPhone(p.phone || '');
          setAddress(p.address || '');
          setLocation(p.location || 'Head Office');
          setResidingAddress(p.residingAddress || p.address || '');
          setAboutText(p.aboutText || '');

          if (p.skillsJson) {
            try {
              setSkillTags(JSON.parse(p.skillsJson));
            } catch {
              setSkillTags(['React', 'TypeScript', 'HRMS']);
            }
          } else {
            setSkillTags(['React', 'TypeScript', 'HRMS']);
          }
        }
      } catch {
        setErrorMessage('Error fetching profile details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skillTags.includes(newSkill.trim())) {
      setSkillTags([...skillTags, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkillTags(skillTags.filter((s) => s !== skill));
  };

  const handleSaveSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrorMessage(null);
    setSaving(true);

    try {
      if (!userData) return;

      const payload = {
        phone,
        address,
        location,
        residingAddress,
        aboutText,
        skillsJson: JSON.stringify(skillTags),
      };

      const res = await fetch(`/api/profile/${userData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update profile');
      } else {
        setMessage('Profile updated successfully!');
      }
    } catch {
      setErrorMessage('Network error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.errors?.currentPassword || data.error || 'Failed to change password');
      } else {
        setMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setErrorMessage('Network error changing password');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Profile...</span>
        </div>
      </div>
    );
  }

  const name = userData?.profile
    ? `${userData.profile.firstName} ${userData.profile.lastName}`
    : userData?.email || 'My Profile';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      <TopNavBar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Banner Alert Messages */}
        {message && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Wireframe Header */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400 shrink-0 overflow-hidden">
            {userData?.profile?.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userData.profile.profilePictureUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-indigo-400" />
            )}
          </div>

          <div className="space-y-1 text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">{name}</h1>
              <span className="px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-mono font-bold self-center md:self-auto">
                ID: {userData?.employeeId}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs text-slate-400 font-medium">
              <div>
                <span className="text-slate-500 block">Company:</span>
                <span className="text-slate-200 font-semibold">Odoo India</span>
              </div>
              <div>
                <span className="text-slate-500 block">Department:</span>
                <span className="text-slate-200 font-semibold">{userData?.profile?.department || 'Engineering'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Manager:</span>
                <span className="text-slate-200 font-semibold">{userData?.profile?.managerName || 'HR Manager'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Location:</span>
                <span className="text-slate-200 font-semibold">{location || 'Head Office'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wireframe Tabs Bar (Notice: Salary Info tab DOES NOT RENDER for employee per wireframe rule) */}
        <div className="flex items-center gap-1 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('resume')}
            className={`py-2 px-4 rounded-xl font-bold transition-all ${
              activeTab === 'resume' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resume
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`py-2 px-4 rounded-xl font-bold transition-all ${
              activeTab === 'private' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Private Info
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`py-2 px-4 rounded-xl font-bold transition-all ${
              activeTab === 'bank' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bank Details
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-4 rounded-xl font-bold transition-all ${
              activeTab === 'security' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-2 px-4 rounded-xl font-bold transition-all ${
              activeTab === 'about' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`py-2 px-4 rounded-xl font-bold transition-all ${
              activeTab === 'skills' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Skills
          </button>
        </div>

        {/* Tab 1: Resume */}
        {activeTab === 'resume' && (
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" /> Work History &amp; Experience
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-white text-sm">Software Developer &bull; Dayflow Inc.</span>
                <span className="text-indigo-400 font-mono block">2023 &ndash; Present</span>
                <p className="text-slate-400 leading-relaxed pt-1">
                  Responsible for HRMS development and user interface implementation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Private Info */}
        {activeTab === 'private' && (
          <form onSubmit={handleSaveSelfProfile} className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" /> Private Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Office Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Residing Address</label>
                <input
                  type="text"
                  value={residingAddress}
                  onChange={(e) => setResidingAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Profile Info
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Bank Details (Read Only for Employee) */}
        {activeTab === 'bank' && (
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" /> Bank &amp; Statutory Details (Read-Only)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Bank Name:</span>
                <span className="text-slate-200 font-bold">{userData?.profile?.bankName || 'HDFC Bank'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Account Number:</span>
                <span className="text-slate-200 font-bold">{userData?.profile?.bankAccountNumber || '50100293849182'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">IFSC Code:</span>
                <span className="text-slate-200 font-bold">{userData?.profile?.ifscCode || 'HDFC0001234'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6 max-w-lg">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" /> Account Security &amp; Change Password
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Current Password *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">New Password (Min. 8 Chars) *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
              >
                <Key className="w-4 h-4" /> Change Password
              </button>
            </div>
          </form>
        )}

        {/* Tab 5: About */}
        {activeTab === 'about' && (
          <form onSubmit={handleSaveSelfProfile} className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" /> What I Love About My Job
            </h2>

            <textarea
              rows={5}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="Write a brief statement about your job and goals..."
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save About Statement
              </button>
            </div>
          </form>
        )}

        {/* Tab 6: Skills */}
        {activeTab === 'skills' && (
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" /> Technical Skills
            </h2>

            <div className="space-y-3">
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill tag..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {skillTags.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-semibold flex items-center gap-2"
                  >
                    {s}
                    <button onClick={() => handleRemoveSkill(s)} className="text-indigo-400 hover:text-rose-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSelfProfile}
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Skills
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
