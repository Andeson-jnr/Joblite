import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  Users,
  Settings,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Sliders,
  CheckCircle2,
  FileCheck,
  BadgeCheck,
  UserX,
  UserCheck,
  Trash2,
  UserPlus,
  Lock,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import {
  ArtisanProfile,
  Booking,
  PayoutRequest,
  Dispute,
  AdminAuditLog,
  PlatformSettings,
  User,
} from '../types';
import { formatNaira, formatDate, formatDateTime } from '../lib/utils';
import {
  fetchAdminMetrics,
  fetchArtisans,
  fetchAdminPayouts,
  processPayout,
  fetchDisputes,
  resolveDispute,
  fetchAuditLogs,
  fetchSettings,
  updateSettings,
  fetchAdminUsers,
  suspendUser,
  validateArtisanNin,
  confirmArtisanCertification,
  approveArtisan,
  rejectArtisan,
  createAdminUser,
  changeUserRole,
  deleteAdminUser,
} from '../lib/api';

interface AdminDashboardProps {
  currentUser: User | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<
    'verifications' | 'users' | 'payouts' | 'disputes' | 'settings' | 'logs'
  >('verifications');

  const [metrics, setMetrics] = useState<any>(null);
  const [artisans, setArtisans] = useState<ArtisanProfile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Artisan Verification Filters & Modals
  const [artisanFilter, setArtisanFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [rejectModalState, setRejectModalState] = useState<{ open: boolean; artisan: ArtisanProfile | null; reason: string }>({
    open: false,
    artisan: null,
    reason: '',
  });

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'customer',
    password: '',
  });

  // Dispute resolution modal state
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Settings form
  const [commissionRate, setCommissionRate] = useState(5.0);
  const [minPayoutNaira, setMinPayoutNaira] = useState(5000);
  const [autoReleaseDays, setAutoReleaseDays] = useState(3);
  const [requireNinValidation, setRequireNinValidation] = useState(true);
  const [requireCertificationConfirmation, setRequireCertificationConfirmation] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetchAdminMetrics(),
      fetchArtisans(),
      fetchAdminUsers(),
      fetchAdminPayouts(),
      fetchDisputes(),
      fetchAuditLogs(),
      fetchSettings(),
    ])
      .then(([mRes, aRes, uRes, pRes, dRes, lRes, sRes]) => {
        if (mRes?.metrics) setMetrics(mRes.metrics);
        if (aRes?.artisans) setArtisans(aRes.artisans);
        if (uRes?.users) setUsers(uRes.users);
        if (pRes?.payouts) setPayouts(pRes.payouts);
        if (dRes?.disputes) setDisputes(dRes.disputes);
        if (lRes?.logs) setAuditLogs(lRes.logs);
        if (sRes?.settings) {
          setSettings(sRes.settings);
          setCommissionRate(sRes.settings.commissionPercentage ?? 5.0);
          setMinPayoutNaira((sRes.settings.minimumPayoutMinor ?? 500000) / 100);
          setAutoReleaseDays(sRes.settings.autoSettlementDays ?? 3);
          setRequireNinValidation(sRes.settings.requireNinValidation !== false);
          setRequireCertificationConfirmation(sRes.settings.requireCertificationConfirmation !== false);
          setMaintenanceMode(!!sRes.settings.maintenanceMode);
        }
      })
      .catch((err) => console.error('Admin data fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  // --- Artisan Vetting Handlers ---
  const handleValidateNin = async (artisanId: string) => {
    try {
      const res = await validateArtisanNin(artisanId);
      if (res.success) {
        showNotification(res.message || 'Artisan National Identification Number (NIN) validated successfully.');
        loadAll();
      } else {
        showNotification(res.message || 'Failed to validate NIN.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'NIN validation error', 'error');
    }
  };

  const handleConfirmCertification = async (artisanId: string) => {
    try {
      const res = await confirmArtisanCertification(artisanId);
      if (res.success) {
        showNotification(res.message || 'Professional trade certification verified and confirmed.');
        loadAll();
      } else {
        showNotification(res.message || 'Failed to confirm certification.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Certification confirmation error', 'error');
    }
  };

  const handleApproveArtisan = async (artisan: ArtisanProfile) => {
    if (requireNinValidation && artisan.ninStatus !== 'validated') {
      showNotification(
        'Action blocked by platform policy: You must validate the artisan\'s NIN before approving their registration.',
        'error'
      );
      return;
    }
    if (requireCertificationConfirmation && artisan.certificationStatus !== 'confirmed') {
      showNotification(
        'Action blocked by platform policy: You must confirm the artisan\'s professional trade certification before approving their registration.',
        'error'
      );
      return;
    }

    try {
      const res = await approveArtisan(artisan.id);
      if (res.success) {
        showNotification(`${artisan.businessName} has been approved and is now active for bookings!`);
        loadAll();
      } else {
        showNotification(res.message || 'Approval failed.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Approval error', 'error');
    }
  };

  const handleRejectArtisanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalState.artisan) return;
    try {
      const res = await rejectArtisan(rejectModalState.artisan.id, rejectModalState.reason || 'Credentials do not satisfy vetting standards');
      if (res.success) {
        showNotification(`Application rejected for ${rejectModalState.artisan.businessName}`);
        setRejectModalState({ open: false, artisan: null, reason: '' });
        loadAll();
      } else {
        showNotification(res.message || 'Rejection failed.', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Rejection error', 'error');
    }
  };

  // --- User Management Handlers ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createAdminUser(newUserData);
      if (res.success) {
        showNotification(`User ${newUserData.fullName} created successfully.`);
        setNewUserModalOpen(false);
        setNewUserData({ fullName: '', email: '', phone: '', role: 'customer', password: '' });
        loadAll();
      } else {
        showNotification(res.message || 'Failed to create user', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'User creation error', 'error');
    }
  };

  const handleSuspendToggle = async (user: User) => {
    const isSuspending = !user.isSuspended;
    const reason = isSuspending ? prompt('Reason for suspending this account:') || 'Administrative review' : '';
    try {
      const res = await suspendUser(user.id, isSuspending, reason);
      if (res.success) {
        showNotification(`User account ${isSuspending ? 'suspended' : 'reactivated'}.`);
        loadAll();
      } else {
        showNotification(res.message || 'Suspension toggle failed', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error updating user status', 'error');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await changeUserRole(userId, newRole);
      if (res.success) {
        showNotification(`Role updated to ${newRole}`);
        loadAll();
      } else {
        showNotification(res.message || 'Role change failed', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Role change error', 'error');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      showNotification('You cannot delete your own active administrator account.', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to permanently remove ${user.fullName} (${user.email})?`)) {
      return;
    }
    try {
      const res = await deleteAdminUser(user.id);
      if (res.success) {
        showNotification(`Account ${user.fullName} deleted.`);
        loadAll();
      } else {
        showNotification(res.message || 'Failed to delete user', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Deletion error', 'error');
    }
  };

  // --- Payout & Dispute Handlers ---
  const handleProcessPayout = async (payoutId: string, status: 'paid' | 'failed') => {
    try {
      const res = await processPayout(payoutId, status, `Bank transfer processed by Admin ${currentUser?.fullName}`);
      if (res.success) {
        showNotification(`Payout marked as ${status}`);
        loadAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveDispute = async (status: 'refunded_customer' | 'released_artisan' | 'split') => {
    if (!selectedDispute) return;
    try {
      const res = await resolveDispute(selectedDispute.id, status, resolutionNote || `Resolved by Admin ${currentUser?.fullName}`);
      if (res.success) {
        showNotification(`Dispute marked as ${status}`);
        setSelectedDispute(null);
        setResolutionNote('');
        loadAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Platform Settings Handler ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateSettings({
        commissionPercentage: Number(commissionRate),
        minimumPayoutMinor: minPayoutNaira * 100,
        autoSettlementDays: Number(autoReleaseDays),
        requireNinValidation,
        requireCertificationConfirmation,
        maintenanceMode,
      });
      if (res.success) {
        setSettingsSuccess('Platform policy and settings successfully updated in JobLite core.');
        setTimeout(() => setSettingsSuccess(''), 4000);
        showNotification('Settings saved successfully.');
        loadAll();
      }
    } catch (err: any) {
      showNotification(err.message || 'Settings update failed', 'error');
    }
  };

  const pendingArtisans = artisans.filter((a) => a.verificationStatus === 'pending');
  const pendingPayouts = payouts.filter((p) => p.status === 'pending');
  const openDisputes = disputes.filter((d) => d.status === 'open' || d.status === 'investigating');

  const filteredArtisans = artisans.filter((a) => {
    if (artisanFilter === 'pending') return a.verificationStatus === 'pending';
    if (artisanFilter === 'verified') return a.verificationStatus === 'verified';
    if (artisanFilter === 'rejected') return a.verificationStatus === 'rejected';
    return true;
  });

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Alert / Action Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-md transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-800 text-emerald-100 border border-emerald-600'
              : 'bg-rose-800 text-rose-100 border border-rose-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-300" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-white/80 hover:text-white text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Admin Operations Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>JobLite Central Governance & Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">JobLite Admin Console</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Supervise artisan vetting (NIN & certifications), user account security, escrow settlements, 5% revenue splits, and platform policies.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            onClick={loadAll}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Transaction Volume</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {formatNaira(metrics?.totalVolumeMinor || 0)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">Total escrow processed through JobLite</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Revenue (5%)</div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700">
            {formatNaira(metrics?.totalCommissionMinor || 0)}
          </div>
          <div className="text-[11px] text-slate-500">Collected from settled jobs</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Artisan Registrations</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{artisans.length}</div>
          <div className="text-[11px] text-amber-700 font-semibold">
            {pendingArtisans.length} awaiting NIN/Cert vetting
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Accounts</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{users.length}</div>
          <div className="text-[11px] text-slate-500">
            {openDisputes.length} open disputes • {pendingPayouts.length} pending payouts
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'verifications'
              ? 'border-purple-600 text-purple-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Artisan Vetting & Approvals</span>
          {pendingArtisans.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
              {pendingArtisans.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Roles</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-semibold">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'payouts'
              ? 'border-purple-600 text-purple-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Payout Approvals</span>
          {pendingPayouts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-bold">
              {pendingPayouts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'disputes'
              ? 'border-purple-600 text-purple-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Escrow Disputes</span>
          {openDisputes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 font-bold">
              {openDisputes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'settings'
              ? 'border-purple-600 text-purple-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Platform Settings & Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'logs'
              ? 'border-purple-600 text-purple-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Log Trail</span>
        </button>
      </div>

      {/* TAB 1: ARTISAN VETTING QUEUE (NIN & CERTIFICATION APPROVALS) */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Artisan Compliance & Verification Queue</h3>
              <p className="text-xs text-slate-500">
                All registered artisans must be validated via National ID (NIN) and professional trade credentials before approval.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setArtisanFilter('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  artisanFilter === 'pending'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Pending Review ({pendingArtisans.length})
              </button>
              <button
                type="button"
                onClick={() => setArtisanFilter('verified')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  artisanFilter === 'verified'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Approved & Active ({artisans.filter((a) => a.verificationStatus === 'verified').length})
              </button>
              <button
                type="button"
                onClick={() => setArtisanFilter('rejected')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  artisanFilter === 'rejected'
                    ? 'bg-red-100 text-red-900 border border-red-300'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Rejected ({artisans.filter((a) => a.verificationStatus === 'rejected').length})
              </button>
              <button
                type="button"
                onClick={() => setArtisanFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  artisanFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All ({artisans.length})
              </button>
            </div>
          </div>

          {filteredArtisans.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              No artisans found in this filter view.
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredArtisans.map((art) => {
                const isNinDone = art.ninStatus === 'validated';
                const isCertDone = art.certificationStatus === 'confirmed';
                const canApprove =
                  (!requireNinValidation || isNinDone) &&
                  (!requireCertificationConfirmation || isCertDone);

                return (
                  <div
                    key={art.id}
                    className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    {/* Header line */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center font-black text-slate-700 text-lg border border-slate-200 shrink-0">
                          {art.portfolioImages && art.portfolioImages[0] ? (
                            <img
                              src={art.portfolioImages[0]}
                              alt={art.businessName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            art.businessName.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-lg text-slate-900 flex items-center gap-2">
                            <span>{art.businessName}</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                art.verificationStatus === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : art.verificationStatus === 'pending'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-red-100 text-red-800 border border-red-300'
                              }`}
                            >
                              {art.verificationStatus.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Category: <span className="font-semibold text-slate-700">{art.categoryName}</span> • Experience:{' '}
                            <span className="font-semibold text-slate-700">{art.yearsOfExperience} years</span> • 📍 {art.address}
                          </div>
                        </div>
                      </div>

                      {/* Approval Action Bar */}
                      <div className="flex items-center gap-2.5">
                        {art.verificationStatus !== 'verified' && (
                          <button
                            type="button"
                            onClick={() => handleApproveArtisan(art)}
                            disabled={!canApprove}
                            title={!canApprove ? 'Requires NIN validation and Certification confirmation first' : 'Approve registration'}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                              canApprove
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve & Activate</span>
                          </button>
                        )}

                        {art.verificationStatus !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() =>
                              setRejectModalState({
                                open: true,
                                artisan: art,
                                reason: '',
                              })
                            }
                            className="px-3.5 py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <XCircle className="w-4 h-4 inline mr-1" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Vetting Checklist Badges & Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Step 1: National Identification Number (NIN) Validation */}
                      <div
                        className={`p-4 rounded-xl border transition-all ${
                          isNinDone
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className={`w-4 h-4 ${isNinDone ? 'text-emerald-700' : 'text-slate-400'}`} />
                            <span className="text-xs font-bold">1. National Identity (NIN)</span>
                          </div>
                          {isNinDone ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ NIN Validated
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                              Pending Validation
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-xs font-mono font-bold">
                          NIN: {art.ninNumber || 'Not submitted'}
                        </div>
                        {art.ninValidatedAt && (
                          <div className="text-[10px] text-emerald-700 mt-0.5">
                            Validated on {formatDate(art.ninValidatedAt)}
                          </div>
                        )}

                        {!isNinDone && (
                          <button
                            type="button"
                            onClick={() => handleValidateNin(art.id)}
                            className="mt-3 w-full py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Validate NIN Against Registry</span>
                          </button>
                        )}
                      </div>

                      {/* Step 2: Professional Trade Certification Confirmation */}
                      <div
                        className={`p-4 rounded-xl border transition-all ${
                          isCertDone
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCheck className={`w-4 h-4 ${isCertDone ? 'text-emerald-700' : 'text-slate-400'}`} />
                            <span className="text-xs font-bold">2. Professional Certification</span>
                          </div>
                          {isCertDone ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Confirmed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                              Pending Confirmation
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-xs">
                          <div className="font-bold text-slate-900">
                            {art.certificationTitle || 'Professional Trade Certificate'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Issuer: {art.certificationBody || 'Federal Ministry of Labour'} • Ref:{' '}
                            <span className="font-mono font-semibold">{art.certificationNumber || 'TTC-PENDING'}</span>
                          </div>
                        </div>

                        {art.certificationConfirmedAt && (
                          <div className="text-[10px] text-emerald-700 mt-0.5">
                            Confirmed on {formatDate(art.certificationConfirmedAt)}
                          </div>
                        )}

                        {!isCertDone && (
                          <button
                            type="button"
                            onClick={() => handleConfirmCertification(art.id)}
                            className="mt-3 w-full py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Confirm Trade Certification</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Additional Background & Guarantor Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Guarantor Name</div>
                        <div className="font-bold text-slate-800 mt-0.5">{art.guarantorName || 'Makurdi Guild Leader'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Guarantor Phone</div>
                        <div className="font-bold text-slate-800 mt-0.5">{art.guarantorPhone || '+234 803 762 1199'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Makurdi Service Areas</div>
                        <div className="font-bold text-slate-800 mt-0.5 truncate">
                          {art.serviceArea && art.serviceArea.length > 0 ? art.serviceArea.join(', ') : 'All Makurdi'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Starting Rate</div>
                        <div className="font-black text-slate-900 mt-0.5">
                          {formatNaira(art.startingPriceMinor || 500000)}
                        </div>
                      </div>
                    </div>

                    {/* Show Rejection reason if rejected */}
                    {art.adminRejectionReason && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                        <span className="font-bold">Rejection Note: </span>
                        {art.adminRejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER ACCOUNTS & PRIVILEGES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">JobLite Registered Accounts</h3>
              <p className="text-xs text-slate-500">
                Manage all customer, artisan, and platform administrative profiles
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNewUserModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by user name, email, or phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Role:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="superadmin">Super Admins</option>
                <option value="artisan">Artisans</option>
                <option value="customer">Customers</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Role Privileges</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 font-bold text-slate-700 flex items-center justify-center shrink-0">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{u.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{u.email}</div>
                        <div className="text-slate-400 text-[11px]">{u.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${
                            u.role === 'superadmin'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : u.role === 'admin'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : u.role === 'artisan'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          <option value="customer">Customer</option>
                          <option value="artisan">Artisan</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        {u.isSuspended ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{formatDate(u.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSuspendToggle(u)}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              u.isSuspended
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-50 text-amber-700 border-amber-200 hover:bg-amber-50'
                            }`}
                            title={u.isSuspended ? 'Reactivate account' : 'Suspend account'}
                          >
                            {u.isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </button>

                          {u.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                              title="Delete account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYOUT APPROVALS */}
      {activeTab === 'payouts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Artisan Bank Withdrawal Requests</h3>
            <span className="text-xs text-slate-500">Processed via Nigerian NIBSS / Paystack Transfers</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            {payouts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No payout requests in queue</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="pb-3">Reference</th>
                      <th className="pb-3">Artisan</th>
                      <th className="pb-3">Bank Details</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Requested Date</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.map((po) => (
                      <tr key={po.id} className="text-slate-700">
                        <td className="py-3 font-mono font-bold text-slate-900">{po.payoutRef}</td>
                        <td className="py-3 font-bold text-slate-900">{po.accountName}</td>
                        <td className="py-3">
                          <div>{po.bankName}</div>
                          <div className="font-mono text-slate-400 text-[11px]">{po.accountNumberMasked}</div>
                        </td>
                        <td className="py-3 font-black text-slate-900">{formatNaira(po.amountMinor)}</td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              po.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : po.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {po.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{formatDateTime(po.createdAt)}</td>
                        <td className="py-3 text-right">
                          {po.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleProcessPayout(po.id, 'paid')}
                                className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] cursor-pointer"
                              >
                                Mark Paid
                              </button>
                              <button
                                onClick={() => handleProcessPayout(po.id, 'failed')}
                                className="px-2.5 py-1 rounded-lg border border-red-200 text-red-700 text-[11px] cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DISPUTES & CLAIMS */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Disputed Escrow Jobs</h3>
            <span className="text-xs text-slate-500">Escrow protects customer satisfaction and artisan effort</span>
          </div>

          <div className="grid gap-3">
            {disputes.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                No active disputes.
              </div>
            ) : (
              disputes.map((dsp) => (
                <div key={dsp.id} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        Ref: {dsp.bookingRef}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-red-100 text-red-800">
                        {dsp.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{formatDateTime(dsp.createdAt)}</span>
                  </div>

                  <div className="text-xs text-slate-700 bg-red-50/50 p-3 rounded-xl border border-red-100">
                    <div className="font-bold text-red-900 mb-1">Reason: {dsp.reason}</div>
                    <p>{dsp.description}</p>
                  </div>

                  {dsp.status !== 'resolved' ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedDispute(dsp);
                          handleResolveDispute('refunded_customer');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Refund Customer (100%)
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDispute(dsp);
                          handleResolveDispute('released_artisan');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                      >
                        Release to Artisan
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDispute(dsp);
                          handleResolveDispute('split');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                      >
                        Split Settlement (50/50)
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-800 font-semibold">
                      Resolved: {dsp.resolution}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS & COMMISSION ENGINE */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-900">JobLite Platform Settings & Governance Engine</h3>
            <p className="text-xs text-slate-500">
              Configure parameters governing vetting requirements, commission rate, escrow releases, and maintenance status
            </p>
          </div>

          {settingsSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
              {settingsSuccess}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Platform Commission Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="20"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full text-sm p-2.5 rounded-xl border border-slate-200 font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Standard platform commission is 5.0%. Deducted automatically upon job completion and escrow release.
              </p>
            </div>

            {/* Vetting Policies: NIN & Cert toggles */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800">Mandatory Artisan Vetting Rules</div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="toggle-nin"
                  checked={requireNinValidation}
                  onChange={(e) => setRequireNinValidation(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="toggle-nin" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Require National ID (NIN) validation before an artisan can be approved
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="toggle-cert"
                  checked={requireCertificationConfirmation}
                  onChange={(e) => setRequireCertificationConfirmation(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="toggle-cert" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Require Professional Trade Certification confirmation before approval
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Withdrawal Threshold (₦)
              </label>
              <input
                type="number"
                step="1000"
                min="1000"
                value={minPayoutNaira}
                onChange={(e) => setMinPayoutNaira(Number(e.target.value))}
                className="w-full text-sm p-2.5 rounded-xl border border-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Escrow Auto-Release Window (Days)
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={autoReleaseDays}
                onChange={(e) => setAutoReleaseDays(Number(e.target.value))}
                className="w-full text-sm p-2.5 rounded-xl border border-slate-200"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                If the customer does not raise a dispute within this window, escrow funds auto-release to the artisan.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="maintenance-toggle"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
              />
              <label htmlFor="maintenance-toggle" className="text-xs font-semibold text-slate-800 cursor-pointer">
                System Maintenance Mode (Restricts new bookings)
              </label>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              Save Platform Configuration
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: AUDIT LOG TRAIL */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Administrative Audit Trail</h3>
            <span className="text-xs text-slate-500">Tamper-evident logs of all operational actions</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{log.action}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      By: <span className="font-semibold text-slate-700">{log.adminName}</span> • Target:{' '}
                      {log.targetType} ({log.targetId})
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono shrink-0">
                    {formatDateTime(log.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reject Artisan Modal */}
      {rejectModalState.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span>Reject Artisan Registration</span>
              </h3>
              <button
                onClick={() => setRejectModalState({ open: false, artisan: null, reason: '' })}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide the specific reason for rejecting{' '}
              <span className="font-bold text-slate-900">
                {rejectModalState.artisan?.businessName}
              </span>
              . This note will be visible on the artisan's profile dashboard.
            </p>

            <form onSubmit={handleRejectArtisanSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="e.g. NIN failed national database lookup; trade certification number could not be authenticated..."
                value={rejectModalState.reason}
                onChange={(e) =>
                  setRejectModalState({ ...rejectModalState, reason: e.target.value })
                }
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalState({ open: false, artisan: null, reason: '' })}
                  className="w-1/2 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {newUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <span>Create User Account</span>
              </h3>
              <button
                onClick={() => setNewUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@joblite.ng"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+234 800 000 0000"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Privileges *</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="customer">Customer</option>
                  <option value="artisan">Artisan</option>
                  <option value="admin">Operations Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Optional or default (Admin@123)"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
