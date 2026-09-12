import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LogOut,
  FileCheck,
  Building2,
  KeyRound,
} from 'lucide-react';
import { User, ArtisanProfile, ServiceCategory } from '../types';
import { loginUser, registerUser, logoutUser } from '../lib/api';
import { MAKURDI_AREAS } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentArtisan: ArtisanProfile | null;
  categories: ServiceCategory[];
  onAuthSuccess: (user: User, artisan?: ArtisanProfile | null) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentArtisan,
  categories,
  onAuthSuccess,
  onLogout,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regRole, setRegRole] = useState<'customer' | 'artisan'>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Artisan-specific registration fields
  const [businessName, setBusinessName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-plumbing');
  const [yearsOfExperience, setYearsOfExperience] = useState(3);
  const [startingPriceNaira, setStartingPriceNaira] = useState(5000);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['Wurukum', 'High Level']);
  const [ninNumber, setNinNumber] = useState('');
  const [certificationTitle, setCertificationTitle] = useState('Trade Test Certificate Grade I');
  const [certificationBody, setCertificationBody] = useState('Federal Ministry of Labour & Employment');
  const [certificationNumber, setCertificationNumber] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');

  if (!isOpen) return null;

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await loginUser({ email: loginEmail, password: loginPassword });
      if (res.success && res.user) {
        setSuccessMsg('Successfully authenticated.');
        onAuthSuccess(res.user, res.artisan || null);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setLoginEmail('admin@joblite.ng');
    setLoginPassword('Admin@123');
    setLoading(true);
    setError('');
    try {
      const res = await loginUser({ email: 'admin@joblite.ng', password: 'Admin@123' });
      if (res.success && res.user) {
        onAuthSuccess(res.user, res.artisan || null);
        onClose();
      } else {
        setError(res.message || 'Could not log in as admin.');
      }
    } catch (err: any) {
      setError(err.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    if (regRole === 'artisan') {
      if (!businessName) {
        setError('Please enter your business or trade brand name.');
        setLoading(false);
        return;
      }
      if (!ninNumber || ninNumber.length < 11) {
        setError('A valid 11-digit National Identification Number (NIN) is required for artisan vetting.');
        setLoading(false);
        return;
      }
      if (!certificationTitle || !certificationBody) {
        setError('Please provide your professional trade qualification details.');
        setLoading(false);
        return;
      }
      if (selectedAreas.length === 0) {
        setError('Please select at least one Makurdi coverage area.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload: any = {
        fullName,
        email,
        phone,
        password,
        role: regRole,
      };

      if (regRole === 'artisan') {
        payload.businessName = businessName;
        payload.category = categoryId;
        payload.yearsOfExperience = Number(yearsOfExperience);
        payload.startingPrice = startingPriceNaira * 100;
        payload.serviceAreas = selectedAreas;
        payload.ninNumber = ninNumber;
        payload.certificationTitle = certificationTitle;
        payload.certificationBody = certificationBody;
        payload.certificationNumber = certificationNumber || `TTC-${Date.now().toString().slice(-6)}`;
        payload.guarantorName = guarantorName || 'Makurdi Trade Association';
        payload.guarantorPhone = guarantorPhone || '+234 803 111 2233';
      }

      const res = await registerUser(payload);
      if (res.success && res.user) {
        setSuccessMsg(
          regRole === 'artisan'
            ? 'Registration submitted! Your profile is pending administrative approval (NIN & certification validation).'
            : 'Account registered successfully!'
        );
        onAuthSuccess(res.user, res.artisan || null);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    await logoutUser();
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                JobLite Security & Accounts
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser ? 'Authenticated Profile Session' : 'Secured User & Artisan Access'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Logged In State */}
        {currentUser ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-black text-lg flex items-center justify-center shrink-0">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base text-slate-900 truncate">{currentUser.fullName}</div>
                <div className="text-xs text-slate-600 truncate">{currentUser.email}</div>
                <div className="text-[11px] text-slate-500">{currentUser.phone}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                {currentUser.role}
              </span>
            </div>

            {/* If Artisan, show verification status summary */}
            {currentArtisan && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Artisan Verification Status</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      currentArtisan.verificationStatus === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentArtisan.verificationStatus === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {currentArtisan.verificationStatus.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">NIN Status</div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      {currentArtisan.ninStatus === 'validated' ? (
                        <span className="text-emerald-700">✅ Validated</span>
                      ) : (
                        <span className="text-amber-700">⏳ Pending Admin</span>
                      )}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Cert Status</div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      {currentArtisan.certificationStatus === 'confirmed' ? (
                        <span className="text-emerald-700">✅ Confirmed</span>
                      ) : (
                        <span className="text-amber-700">⏳ Pending Admin</span>
                      )}
                    </div>
                  </div>
                </div>

                {currentArtisan.verificationStatus === 'pending' && (
                  <p className="text-[11px] text-slate-500">
                    Your trade profile is undergoing administrative vetting. Once an admin validates your NIN and confirms your certificates, your profile will be publicly active for customer bookings.
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of JobLite</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB: LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. user@joblite.ng"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                </button>

                {/* Quick Admin Access Helper */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 text-center mb-2">Platform Administration Access</div>
                  <button
                    type="button"
                    onClick={handleQuickAdminLogin}
                    disabled={loading}
                    className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Quick Login as Platform Admin (admin@joblite.ng)</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB: REGISTER */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Role Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">I want to register as:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegRole('customer')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        regRole === 'customer'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <UserIcon className={`w-4 h-4 mt-0.5 ${regRole === 'customer' ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Customer</div>
                        <div className="text-[10px] text-slate-500">Hire verified artisans</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('artisan')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        regRole === 'artisan'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Briefcase className={`w-4 h-4 mt-0.5 ${regRole === 'artisan' ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Skilled Artisan</div>
                        <div className="text-[10px] text-slate-500">Requires admin approval</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Common Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Terver Akume"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="name@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Nigeria) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+234 800 000 0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password * (min 6 chars)</label>
                    <input
                      type="password"
                      required
                      placeholder="Create secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Artisan Verification & Compliance Fields */}
                {regRole === 'artisan' && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3.5">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>Artisan Compliance & Verification Details</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Per JobLite policy, your registration passes to the Admin Console for mandatory NIN validation and professional trade certification confirmation before profile approval.
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Business / Brand Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Wurukum Master Plumbers & Sons"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">Trade Category *</label>
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">Years Experience</label>
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={yearsOfExperience}
                          onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                          className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    {/* NIN Verification Field */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        National Identity Number (NIN) * (11 Digits)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        placeholder="e.g. 74829103849"
                        value={ninNumber}
                        onChange={(e) => setNinNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500">Will be verified by Admin against national registry</span>
                    </div>

                    {/* Professional Certification Details */}
                    <div className="space-y-2 pt-2 border-t border-amber-200/60">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Trade Certification / Professional Qualification *</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Certificate Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Federal Trade Test Certificate Grade I"
                          value={certificationTitle}
                          onChange={(e) => setCertificationTitle(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Issuing Authority *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ministry of Labour"
                            value={certificationBody}
                            onChange={(e) => setCertificationBody(e.target.value)}
                            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Cert / License No.
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. TTC/BN/2023/491"
                            value={certificationNumber}
                            onChange={(e) => setCertificationNumber(e.target.value)}
                            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Guarantor Details */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Trade Guarantor Name
                        </label>
                        <input
                          type="text"
                          placeholder="Elder / Guild Chairman"
                          value={guarantorName}
                          onChange={(e) => setGuarantorName(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Guarantor Phone
                        </label>
                        <input
                          type="tel"
                          placeholder="+234..."
                          value={guarantorPhone}
                          onChange={(e) => setGuarantorPhone(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    {/* Service Areas */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Makurdi Service Areas Covered
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                        {MAKURDI_AREAS.slice(0, 8).map((area) => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleArea(area)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              selectedAreas.includes(area)
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Submitting Application...' : 'Complete Registration'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
