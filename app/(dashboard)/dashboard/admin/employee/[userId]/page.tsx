'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Crown,
  ArrowLeft,
  Upload,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  User,
  Trash2,
} from 'lucide-react';

interface DocumentItem {
  id: string;
  name: string;
  url: string;
  fileType: string;
  size: number;
  uploadedAt: string;
}

interface TargetUserProfile {
  id: string;
  employeeId: string;
  email: string;
  role: 'EMPLOYEE' | 'ADMIN';
  isEmailVerified: boolean;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    designation: string;
    department: string;
    joiningDate: string;
    baseSalary: number;
    housingAllowance: number;
    otherAllowances: number;
    profilePictureUrl?: string;
    documents?: string;
  };
}

export default function AdminEmployeeProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const targetUserId = resolvedParams.userId;
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<TargetUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Admin full edit fields state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [housingAllowance, setHousingAllowance] = useState<number>(0);
  const [otherAllowances, setOtherAllowances] = useState<number>(0);

  const [docName, setDocName] = useState('');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchTargetProfile() {
      try {
        const response = await fetch(`/api/profile/${targetUserId}`);
        if (!response.ok) {
          if (response.status === 403) {
            router.push('/dashboard/employee');
            return;
          }
          router.push('/dashboard/admin');
          return;
        }
        const data = await response.json();
        const u = data.user as TargetUserProfile;
        setUser(u);

        if (u.profile) {
          setFirstName(u.profile.firstName || '');
          setLastName(u.profile.lastName || '');
          setPhone(u.profile.phone || '');
          setAddress(u.profile.address || '');
          setDesignation(u.profile.designation || '');
          setDepartment(u.profile.department || '');
          setBaseSalary(u.profile.baseSalary || 0);
          setHousingAllowance(u.profile.housingAllowance || 0);
          setOtherAllowances(u.profile.otherAllowances || 0);

          if (u.profile.documents) {
            try {
              setDocuments(JSON.parse(u.profile.documents));
            } catch {
              setDocuments([]);
            }
          }
        }
      } catch {
        setErrorMessage('Failed to load employee profile');
      } finally {
        setLoading(false);
      }
    }
    fetchTargetProfile();
  }, [targetUserId, router]);

  // Admin Submit Full Profile Updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/profile/${targetUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          address,
          designation,
          department,
          baseSalary: Number(baseSalary),
          housingAllowance: Number(housingAllowance),
          otherAllowances: Number(otherAllowances),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setErrorMessage(data.error || 'Failed to update profile');
        }
      } else {
        setSuccessMessage('Employee profile & salary structure updated successfully by Admin!');
      }
    } catch {
      setErrorMessage('Network error during profile update');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Picture Upload Handler
  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploadingPic(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', targetUserId);

    try {
      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'Image upload failed');
      } else {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                profile: prev.profile
                  ? { ...prev.profile, profilePictureUrl: data.url }
                  : undefined,
              }
            : null
        );
        setSuccessMessage('Employee profile picture updated!');
      }
    } catch {
      setErrorMessage('Error uploading profile picture');
    } finally {
      setIsUploadingPic(false);
    }
  };

  // Document Upload Handler
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploadingDoc(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', targetUserId);
    formData.append('documentName', docName);

    try {
      const response = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || 'Document upload failed');
      } else {
        setDocuments(data.documents || []);
        setDocName('');
        if (docInputRef.current) docInputRef.current.value = '';
        setSuccessMessage('Document attached to employee profile!');
      }
    } catch {
      setErrorMessage('Error uploading document file');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Document Delete Handler
  const handleDeleteDocument = async (documentId: string) => {
    setErrorMessage(null);

    try {
      const response = await fetch('/api/upload/document', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, documentId }),
      });

      const data = await response.json();
      if (response.ok) {
        setDocuments(data.documents || []);
        setSuccessMessage('Document deleted.');
      } else {
        setErrorMessage(data.error || 'Failed to remove document');
      }
    } catch {
      setErrorMessage('Error deleting document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Employee Profile Inspector...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const profile = user.profile;
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : user.email;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h1 className="font-bold text-lg text-white tracking-tight">Admin Profile Inspector</h1>
            </div>
          </div>

          <span className="px-3 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-xl text-xs font-mono">
            Target: {user.employeeId}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Banner Alert Messages */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Top Header Card */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="relative group">
              {profile?.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profilePictureUrl}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500/40 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-amber-950 border-2 border-amber-800 flex items-center justify-center text-amber-400 text-2xl font-bold">
                  {fullName.charAt(0)}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPic}
                className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center text-white text-xs font-semibold transition-opacity"
              >
                {isUploadingPic ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handlePictureUpload}
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">{fullName}</h2>
              <p className="text-sm text-amber-400 mt-0.5">
                {profile?.designation || 'Staff'} &bull; {profile?.department || 'Operations'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md text-[10px] font-mono">
                  {user.role}
                </span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPic}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload Avatar
            </button>
          </div>
        </div>

        {/* Full Admin Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Full Details Form */}
            <div className="lg:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" /> Admin Full Edit Controls
                </h3>
                <span className="text-xs text-amber-400 font-semibold bg-amber-950/80 border border-amber-800 px-2.5 py-1 rounded-lg">
                  Full Admin Edit Mode
                </span>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  {fieldErrors.firstName && <p className="text-xs text-red-400 mt-1">{fieldErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  {fieldErrors.lastName && <p className="text-xs text-red-400 mt-1">{fieldErrors.lastName}</p>}
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  {fieldErrors.designation && <p className="text-xs text-red-400 mt-1">{fieldErrors.designation}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  {fieldErrors.department && <p className="text-xs text-red-400 mt-1">{fieldErrors.department}</p>}
                </div>
              </div>

              {/* Salary Structure */}
              <div className="pt-4 border-t border-slate-800/80 space-y-4">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Admin Salary Structure Controls
                </h4>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Base Salary ($)</label>
                    <input
                      type="number"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-amber-300 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Housing Allowance ($)</label>
                    <input
                      type="number"
                      value={housingAllowance}
                      onChange={(e) => setHousingAllowance(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Other Allowances ($)</label>
                    <input
                      type="number"
                      value={otherAllowances}
                      onChange={(e) => setOtherAllowances(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2"
                >
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Full Employee Changes
                </button>
              </div>
            </div>

            {/* Right Column: Admin Document Manager */}
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> Admin Document Manager
              </h3>

              {/* Admin Upload Box */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">Attach Employee File</span>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Document Title (e.g. Contract_2026.pdf)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />

                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  disabled={isUploadingDoc}
                  className="w-full py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {isUploadingDoc ? <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload Document File
                </button>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                  className="hidden"
                  onChange={handleDocumentUpload}
                />
              </div>

              {/* Document List */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  Employee Documents ({documents.length})
                </span>

                {documents.length === 0 ? (
                  <div className="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
                    No documents attached yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate max-w-[180px]">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-slate-200 hover:text-amber-400 truncate"
                          >
                            {doc.name}
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
