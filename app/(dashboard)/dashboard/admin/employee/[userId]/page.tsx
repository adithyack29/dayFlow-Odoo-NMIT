'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Shield,
  Briefcase,
  DollarSign,
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
    joiningDate: string;
    profilePictureUrl?: string;

    // Private Info Tab
    jobPosition?: string;
    managerName?: string;
    location?: string;
    residingAddress?: string;
    dateOfBirth?: string;
    nationality?: string;
    personalEmail?: string;
    gender?: string;
    maritalStatus?: string;
    dateOfJoining?: string;
    empCode?: string;

    // Bank Details Tab
    bankAccountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    uanNo?: string;
    panNo?: string;

    // Salary Info Tab
    wageType?: string;
    monthlyWage?: number;
    yearlyWage?: number;
    workingDaysPerWeek?: number;
    breakTimeHours?: number;
    baseSalary?: number;
    housingAllowance?: number;
    standardAllowance?: number;
    performanceBonus?: number;
    otherAllowances?: number;
    fixedAllowance?: number;
    pfEmployee?: number;
    pfEmployer?: number;
    professionalTax?: number;

    // About & Skills Tabs
    aboutText?: string;
    skillsJson?: string;
    certificationsJson?: string;
    resumeJson?: string;
  } | null;
}

export default function EmployeeProfileInspectorPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const router = useRouter();

  const [viewerSession, setViewerSession] = useState<{ userId: string; role: 'EMPLOYEE' | 'ADMIN' } | null>(null);
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'salary' | 'bank' | 'security' | 'about' | 'skills'>('resume');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  // Private Info Fields
  const [jobPosition, setJobPosition] = useState('');
  const [managerName, setManagerName] = useState('');
  const [location, setLocation] = useState('');
  const [residingAddress, setResidingAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');

  // Bank Details Fields
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [uanNo, setUanNo] = useState('');
  const [panNo, setPanNo] = useState('');

  // Salary Calculations State
  const [monthlyWage, setMonthlyWage] = useState<number>(50000);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState<number>(5);
  const [breakTimeHours, setBreakTimeHours] = useState<number>(1.0);

  // Security Tab Change Password State
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
        const [resMe, resUser] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/profile/${userId}`),
        ]);

        if (resMe.ok) {
          const m = await resMe.json();
          setViewerSession({ userId: m.user.id || m.user.userId, role: m.user.role });
        }

        if (!resUser.ok) {
          if (resUser.status === 401) router.push('/signin');
          throw new Error('Failed to load profile details');
        }

        const data = await resUser.json();
        const u = data.user as UserProfileData;
        setUserData(u);

        if (u.profile) {
          const p = u.profile;
          setFirstName(p.firstName || '');
          setLastName(p.lastName || '');
          setPhone(p.phone || '');
          setAddress(p.address || '');
          setDepartment(p.department || '');
          setDesignation(p.designation || '');

          setJobPosition(p.jobPosition || p.designation || '');
          setManagerName(p.managerName || 'HR Manager');
          setLocation(p.location || 'Head Office');
          setResidingAddress(p.residingAddress || p.address || '');
          setDateOfBirth(p.dateOfBirth || '');
          setNationality(p.nationality || 'Indian');
          setPersonalEmail(p.personalEmail || u.email);
          setGender(p.gender || 'Male');
          setMaritalStatus(p.maritalStatus || 'Single');

          setBankAccountNumber(p.bankAccountNumber || '');
          setBankName(p.bankName || '');
          setIfscCode(p.ifscCode || '');
          setUanNo(p.uanNo || '');
          setPanNo(p.panNo || '');

          setMonthlyWage(p.monthlyWage ?? 50000);
          setWorkingDaysPerWeek(p.workingDaysPerWeek ?? 5);
          setBreakTimeHours(p.breakTimeHours ?? 1.0);

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
        setErrorMessage('Error fetching profile information');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId, router]);

  // Dynamic Salary Component Auto-Calculations (Exact Wireframe Formulas)
  const yearlyWage = monthlyWage * 12;
  const basicSalary = monthlyWage * 0.5; // 50% of Wage
  const hra = basicSalary * 0.5; // 50% of Basic
  const standardAllowance = 4167.0; // Fixed ₹4,167
  const performanceBonus = basicSalary * 0.0833; // 8.33% of Basic
  const lta = basicSalary * 0.08333; // 8.333% of Basic
  const sumOther = basicSalary + hra + standardAllowance + performanceBonus + lta;
  const fixedAllowance = Math.max(0, monthlyWage - sumOther); // Remainder plug value
  const pfEmployee = basicSalary * 0.12; // 12% of Basic
  const pfEmployer = basicSalary * 0.12; // 12% of Basic
  const professionalTax = 200.0; // Fixed ₹200/mo

  const isAdmin = viewerSession?.role === 'ADMIN';
  const isOwnProfile = viewerSession?.userId === userId;

  const handleAddSkill = () => {
    if (newSkill.trim() && !skillTags.includes(newSkill.trim())) {
      setSkillTags([...skillTags, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkillTags(skillTags.filter((s) => s !== skill));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrorMessage(null);
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        phone,
        address,
        location,
        residingAddress,
        aboutText,
        skillsJson: JSON.stringify(skillTags),
      };

      if (isAdmin) {
        payload.firstName = firstName;
        payload.lastName = lastName;
        payload.department = department;
        payload.designation = designation;
        payload.jobPosition = jobPosition;
        payload.managerName = managerName;
        payload.dateOfBirth = dateOfBirth;
        payload.nationality = nationality;
        payload.personalEmail = personalEmail;
        payload.gender = gender;
        payload.maritalStatus = maritalStatus;

        payload.bankAccountNumber = bankAccountNumber;
        payload.bankName = bankName;
        payload.ifscCode = ifscCode;
        payload.uanNo = uanNo;
        payload.panNo = panNo;

        payload.monthlyWage = monthlyWage;
        payload.yearlyWage = yearlyWage;
        payload.workingDaysPerWeek = workingDaysPerWeek;
        payload.breakTimeHours = breakTimeHours;
        payload.baseSalary = basicSalary;
        payload.housingAllowance = hra;
        payload.standardAllowance = standardAllowance;
        payload.performanceBonus = performanceBonus;
        payload.otherAllowances = lta;
        payload.fixedAllowance = fixedAllowance;
        payload.pfEmployee = pfEmployee;
        payload.pfEmployer = pfEmployer;
        payload.professionalTax = professionalTax;
      }

      const res = await fetch(`/api/profile/${userId}`, {
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
          <span>Loading Employee Profile...</span>
        </div>
      </div>
    );
  }

  const name = userData?.profile
    ? `${userData.profile.firstName} ${userData.profile.lastName}`
    : userData?.email || 'Employee Profile';

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

        {/* Wireframe Header Section */}
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
                <span className="text-slate-200 font-semibold">{department || 'Engineering'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Manager:</span>
                <span className="text-slate-200 font-semibold">{managerName || 'HR Admin'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Location:</span>
                <span className="text-slate-200 font-semibold">{location || 'Head Office'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wireframe 7 Tabs Bar (Exact Order) */}
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

          {/* Wireframe Rule: Salary Info Tab MUST NOT RENDER AT ALL for non-admin viewers */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('salary')}
              className={`py-2 px-4 rounded-xl font-bold transition-all ${
                activeTab === 'salary' ? 'bg-amber-600 text-slate-950 shadow-md' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              👑 Salary Info (Admin-Only)
            </button>
          )}

          <button
            onClick={() => setActiveTab('bank')}
            className={`py-2 px-4 rounded-xl font-bold transition-all ${
              activeTab === 'bank' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bank Details
          </button>

          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-4 rounded-xl font-bold transition-all ${
                activeTab === 'security' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Security
            </button>
          )}

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
                <span className="font-bold text-white text-sm">Senior Software Engineer &bull; Dayflow Inc.</span>
                <span className="text-indigo-400 font-mono block">2023 &ndash; Present (2 Years)</span>
                <p className="text-slate-400 leading-relaxed pt-1">
                  Lead full-stack developer responsible for core HRMS module architecture, database optimization, and team leadership.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-white text-sm">Software Developer &bull; Tech Solutions</span>
                <span className="text-slate-500 font-mono block">2021 &ndash; 2023 (2 Years)</span>
                <p className="text-slate-400 leading-relaxed pt-1">
                  Built client dashboards, SQL optimization pipelines, and integrated REST APIs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Private Info */}
        {activeTab === 'private' && (
          <form onSubmit={handleSaveProfile} className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" /> Private Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Job Position</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Manager</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 disabled:opacity-60"
                />
              </div>

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

              <div>
                <label className="block text-slate-400 mb-1">Date of Birth</label>
                <input
                  type="date"
                  disabled={!isAdmin}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nationality</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Personal Email</label>
                <input
                  type="email"
                  disabled={!isAdmin}
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Gender</label>
                <select
                  disabled={!isAdmin}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 disabled:opacity-60"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Private Info
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Salary Info (Admin-Only Wireframe Computation Engine) */}
        {isAdmin && activeTab === 'salary' && (
          <form onSubmit={handleSaveProfile} className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Salary Information (Admin Calculation Engine)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  All components auto-calculate from Monthly Wage. Worked example: Wage ₹50,000 &rarr; Basic ₹25,000, HRA ₹12,500.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-xl text-xs font-mono">
                Wage Type: Fixed Wage
              </span>
            </div>

            {/* Wage Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-amber-400 font-bold mb-1">Monthly Wage (₹) *</label>
                <input
                  type="number"
                  value={monthlyWage}
                  onChange={(e) => setMonthlyWage(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Yearly Wage (Calculated)</label>
                <input
                  type="text"
                  disabled
                  value={`₹${yearlyWage.toLocaleString()} / Year`}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Working Days in a Week</label>
                <input
                  type="number"
                  value={workingDaysPerWeek}
                  onChange={(e) => setWorkingDaysPerWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
            </div>

            {/* Wireframe Salary Components Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Salary Components Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Component Name</th>
                      <th className="py-2.5 px-4">Computation Rule</th>
                      <th className="py-2.5 px-4 text-right">Monthly Amount</th>
                      <th className="py-2.5 px-4 text-right">Yearly Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr>
                      <td className="py-3 px-4 font-bold text-white">Basic Salary</td>
                      <td className="py-3 px-4 text-slate-400">50% of Wage</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-300">₹{basicSalary.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">₹{(basicSalary * 12).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-white">House Rent Allowance (HRA)</td>
                      <td className="py-3 px-4 text-slate-400">50% of Basic Salary</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-300">₹{hra.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">₹{(hra * 12).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-white">Standard Allowance</td>
                      <td className="py-3 px-4 text-slate-400">Fixed ₹4,167/month</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-300">₹{standardAllowance.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">₹{(standardAllowance * 12).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-white">Performance Bonus</td>
                      <td className="py-3 px-4 text-slate-400">8.33% of Basic Salary</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-300">₹{performanceBonus.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">₹{(performanceBonus * 12).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-white">Leave Travel Allowance (LTA)</td>
                      <td className="py-3 px-4 text-slate-400">8.333% of Basic Salary</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-300">₹{lta.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">₹{(lta * 12).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-white">Fixed Allowance</td>
                      <td className="py-3 px-4 text-slate-400">Wage - Sum of Components (Plug Value)</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">₹{fixedAllowance.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">₹{(fixedAllowance * 12).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statutory Deductions Table */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Provident Fund (PF) &amp; Tax Deductions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">Employee PF (12% of Basic)</span>
                  <p className="font-mono text-base font-bold text-rose-400">₹{pfEmployee.toLocaleString()} / month</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">Professional Tax</span>
                  <p className="font-mono text-base font-bold text-rose-400">₹{professionalTax.toLocaleString()} / month</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Salary Configuration
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Bank Details */}
        {activeTab === 'bank' && (
          <form onSubmit={handleSaveProfile} className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" /> Bank &amp; Statutory Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Bank Name</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Account Number</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="e.g. 50100293849182"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">IFSC Code</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="e.g. HDFC0001234"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">PAN Number</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={panNo}
                  onChange={(e) => setPanNo(e.target.value)}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">UAN Number (PF)</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={uanNo}
                  onChange={(e) => setUanNo(e.target.value)}
                  placeholder="e.g. 100928374651"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 disabled:opacity-60"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Bank Details
                </button>
              </div>
            )}
          </form>
        )}

        {/* Tab 5: Security (Change Password) */}
        {isOwnProfile && activeTab === 'security' && (
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

        {/* Tab 6: About */}
        {activeTab === 'about' && (
          <form onSubmit={handleSaveProfile} className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" /> What I Love About My Job
            </h2>

            <textarea
              rows={5}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="Write a brief personal statement about your career goals and what inspires you at work..."
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

        {/* Tab 7: Skills */}
        {activeTab === 'skills' && (
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" /> Technical Skills &amp; Certifications
            </h2>

            {/* Skills Tag Section */}
            <div className="space-y-3">
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill tag (e.g. Next.js)..."
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
                onClick={handleSaveProfile}
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
