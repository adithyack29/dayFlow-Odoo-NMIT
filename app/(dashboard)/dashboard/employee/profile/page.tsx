'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  User,
  ArrowLeft,
  Lock,
  Upload,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Mail,
  Briefcase,
  DollarSign,
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

interface UserProfile {
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

export default function EmployeeProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Editable state (Employees can ONLY edit phone & address)
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [docName, setDocName] = useState('');

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/signin');
          return;
        }
        const data = await response.json();
        const u = data.user as UserProfile;
        setUser(u);
        setPhone(u.profile?.phone || '');
        setAddress(u.profile?.address || '');

        if (u.profile?.documents) {
          try {
            setDocuments(JSON.parse(u.profile.documents));
          } catch {
            setDocuments([]);
          }
        }
      } catch {
        setErrorMessage('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  // Handle Profile Update submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, address }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setErrorMessage(data.error || 'Failed to update profile');
        }
      } else {
        setSuccessMessage('Contact details updated successfully!');
      }
    } catch {
      setErrorMessage('Network error during profile update');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Profile Picture upload
  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploadingPic(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

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
        setSuccessMessage('Profile picture updated successfully!');
      }
    } catch {
      setErrorMessage('Error uploading image file');
    } finally {
      setIsUploadingPic(false);
    }
  };

  // Handle Document Upload
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploadingDoc(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);
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
        setSuccessMessage('Document uploaded successfully!');
      }
    } catch {
      setErrorMessage('Error uploading document file');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Handle Document Delete
  const handleDeleteDocument = async (documentId: string) => {
    if (!user) return;
    setErrorMessage(null);

    try {
      const response = await fetch('/api/upload/document', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, documentId }),
      });

      const data = await response.json();
      if (response.ok) {
        setDocuments(data.documents || []);
        setSuccessMessage('Document removed.');
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
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Profile...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const profile = user.profile;
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : user.email;
  const totalSalary = profile
    ? profile.baseSalary + (profile.housingAllowance || 0) + (profile.otherAllowances || 0)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/employee"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-bold text-lg text-white tracking-tight">Employee Profile Self-Service</h1>
          </div>

          <span className="px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-mono">
            {user.employeeId}
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

        {/* Top Header Card with Profile Picture Uploader */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="relative group">
              {profile?.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profilePictureUrl}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-950 border-2 border-indigo-800 flex items-center justify-center text-indigo-400 text-2xl font-bold">
                  {fullName.charAt(0)}
                </div>
              )}

              {/* Upload Overlay Button */}
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
              <p className="text-sm text-slate-400 mt-0.5">
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

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPic}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Change Profile Picture
          </button>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Editable Contact Details Form */}
          <div className="lg:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" /> Editable Personal &amp; Contact Details
              </h3>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-lg">
                Employee Edit Allowed
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2831"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                {fieldErrors.phone && <p className="text-xs text-red-400 mt-1">{fieldErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Residential Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="100 Executive Parkway, Suite 400..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                {fieldErrors.address && <p className="text-xs text-red-400 mt-1">{fieldErrors.address}</p>}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Contact Changes
                </button>
              </div>
            </form>

            {/* Locked Fields Section */}
            <div className="pt-6 border-t border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" /> Read-Only Job &amp; Salary Structure
                </h4>
                <span className="text-[11px] text-amber-400/80 font-mono">
                  🔒 Admin Permission Required to Change
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-0.5">Designation</span>
                  <span className="font-semibold text-slate-300">{profile?.designation || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-0.5">Department</span>
                  <span className="font-semibold text-slate-300">{profile?.department || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-0.5">Joining Date</span>
                  <span className="font-semibold text-slate-300">
                    {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-0.5">Base Salary</span>
                  <span className="font-semibold text-amber-400">${profile?.baseSalary.toLocaleString() || '0'}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-0.5">Housing Allowance</span>
                  <span className="font-semibold text-slate-300">${profile?.housingAllowance.toLocaleString() || '0'}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-0.5">Other Allowances</span>
                  <span className="font-semibold text-slate-300">${profile?.otherAllowances.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Local Document Management */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" /> Employee Documents
            </h3>

            {/* Document Uploader */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">Upload New Document</span>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Document Title (e.g. Passport.pdf)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={isUploadingDoc}
                className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                {isUploadingDoc ? <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                Choose File &amp; Upload
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
                Uploaded Files ({documents.length})
              </span>

              {documents.length === 0 ? (
                <div className="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
                  No documents uploaded yet.
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
                          className="font-medium text-slate-200 hover:text-indigo-400 truncate"
                        >
                          {doc.name}
                        </a>
                      </div>

                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="Remove Document"
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
      </main>
    </div>
  );
}
