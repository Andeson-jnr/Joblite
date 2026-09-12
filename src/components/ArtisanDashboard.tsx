import React, { useState, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  Clock,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  Plus,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Eye,
  Calendar,
  MapPin,
  TrendingUp,
  BadgeCheck,
  FileCheck,
} from 'lucide-react';
import { ArtisanProfile, Booking, Wallet, WalletTransaction, PayoutRequest, ServiceListing } from '../types';
import { formatNaira, formatDate, formatDateTime, getStatusBadge } from '../lib/utils';
import { NIGERIAN_BANKS } from '../constants';
import {
  fetchWallet,
  fetchBookings,
  fetchServices,
  updateBookingStatus,
  requestPayout,
  createService,
} from '../lib/api';

interface ArtisanDashboardProps {
  artisan: ArtisanProfile | null;
  onChatBooking: (booking: Booking) => void;
}

export const ArtisanDashboard: React.FC<ArtisanDashboardProps> = ({ artisan, onChatBooking }) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'wallet' | 'services'>('bookings');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Payout Modal State
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmountNaira, setPayoutAmountNaira] = useState(10000);
  const [bankName, setBankName] = useState('First Bank of Nigeria');
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [accountName, setAccountName] = useState(artisan?.businessName || 'Artisan Enterprise');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');

  // Add Service Modal State
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePriceNaira, setServicePriceNaira] = useState(10000);
  const [serviceDuration, setServiceDuration] = useState('2 - 4 hours');
  const [serviceArea, setServiceArea] = useState('Wurukum, High Level, Kanshio');

  const loadAllData = () => {
    if (!artisan) return;
    setLoading(true);
    Promise.all([
      fetchWallet(artisan.id),
      fetchBookings({ artisanId: artisan.id }),
      fetchServices(artisan.id),
    ])
      .then(([walletRes, bookingsRes, servicesRes]) => {
        if (walletRes.wallet) setWallet(walletRes.wallet);
        if (walletRes.transactions) setTransactions(walletRes.transactions);
        if (walletRes.payouts) setPayouts(walletRes.payouts);
        if (bookingsRes.bookings) setBookings(bookingsRes.bookings);
        if (servicesRes.services) setServices(servicesRes.services);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAllData();
  }, [artisan?.id]);

  const handleBookingAction = async (bookingId: string, newStatus: string, note?: string) => {
    try {
      const res = await updateBookingStatus(bookingId, newStatus, note);
      if (res.success) {
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artisan) return;
    setPayoutLoading(true);
    setPayoutError('');
    setPayoutSuccess('');

    try {
      const res = await requestPayout({
        artisanId: artisan.id,
        amountMinor: payoutAmountNaira * 100,
        bankName,
        accountNumber,
        accountName,
      });

      if (res.success) {
        setPayoutSuccess(`Withdrawal request for ${formatNaira(payoutAmountNaira * 100)} submitted successfully.`);
        loadAllData();
        setTimeout(() => {
          setPayoutModalOpen(false);
          setPayoutSuccess('');
        }, 1500);
      } else {
        setPayoutError(res.error || 'Withdrawal failed');
      }
    } catch (err: any) {
      setPayoutError(err.message || 'Error processing withdrawal');
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artisan || !serviceName) return;

    try {
      const res = await createService({
        artisanId: artisan.id,
        categoryId: artisan.categoryId,
        name: serviceName,
        description: serviceDesc,
        startingPriceMinor: servicePriceNaira * 100,
        pricingType: 'starting_from',
        estimatedDuration: serviceDuration,
        serviceArea: serviceArea.split(',').map((s) => s.trim()),
      });

      if (res.success) {
        setServiceModalOpen(false);
        setServiceName('');
        setServiceDesc('');
        loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!artisan) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs text-slate-500">
        No active artisan profile found for this user.
      </div>
    );
  }

  const newRequests = bookings.filter((b) => ['requested', 'pending_artisan'].includes(b.status));
  const activeJobs = bookings.filter((b) => ['accepted', 'paid', 'in_progress'].includes(b.status));
  const completedJobs = bookings.filter((b) => ['completed', 'customer_confirmed'].includes(b.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Artisan Identity Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 overflow-hidden flex items-center justify-center text-emerald-800 font-bold text-xl shrink-0">
            {artisan.portfolioImages[0] ? (
              <img src={artisan.portfolioImages[0]} alt={artisan.businessName} className="w-full h-full object-cover" />
            ) : (
              artisan.businessName[0]
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{artisan.businessName}</h1>
              {artisan.verificationStatus === 'verified' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Pro
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-300">
                  Verification Under Review
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {artisan.categoryName} • 📍 {artisan.address} • Rating: {artisan.rating} ★ ({artisan.reviewCount} reviews)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPayoutModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Withdraw Funds
          </button>
          <button
            onClick={loadAllData}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Verification Status Banner & Compliance Checklist */}
      {artisan.verificationStatus === 'pending' && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-200/80 flex items-center justify-center text-amber-900 font-bold shrink-0">
                <Clock className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h2 className="text-base font-bold text-amber-950">Registration Pending Administrative Approval</h2>
                <p className="text-xs text-amber-800 mt-0.5">
                  JobLite requires all registered artisans to pass thorough identity and skill vetting before your profile goes live for client bookings.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 border border-amber-300 self-start sm:self-auto">
              Under Review
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/70 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/80 border border-amber-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  NIN Identity Vetting
                </span>
                {artisan.ninStatus === 'validated' ? (
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Validated
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    In Progress
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-600">
                {artisan.ninNumber ? `NIN: ${artisan.ninNumber}` : 'NIN on file'}
              </div>
              <p className="text-[10px] text-slate-500">
                {artisan.ninStatus === 'validated'
                  ? 'Identity successfully verified against national registry.'
                  : 'Administrator is verifying National Identification Number records.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-amber-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Trade Certification
                </span>
                {artisan.certificationStatus === 'confirmed' ? (
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Confirmed
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    In Progress
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-600 truncate font-medium">
                {artisan.certificationTitle || 'Professional Trade Certificate'}
              </div>
              <p className="text-[10px] text-slate-500">
                {artisan.certificationStatus === 'confirmed'
                  ? 'Professional credentials and trade licensing confirmed.'
                  : 'Administrator is verifying certification body and license.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 border border-amber-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Admin Sign-off
                </span>
                <span className="text-[10px] font-black uppercase text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                  Pending Sign-off
                </span>
              </div>
              <div className="text-[11px] text-slate-600">Platform Public Listing</div>
              <p className="text-[10px] text-slate-500">
                Upon NIN and certification validation, administrator signs off and your profile activates immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {artisan.verificationStatus === 'rejected' && (
        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Registration Application Declined</span>
          </div>
          <p>
            An administrator has reviewed your application and requested corrections or rejected the submission:
          </p>
          <div className="p-3 bg-white rounded-xl border border-rose-200 font-semibold text-rose-800">
            {artisan.adminRejectionReason || 'Uploaded certification or national identity credentials could not be verified.'}
          </div>
          <p className="text-[11px] text-slate-600">
            Please contact JobLite support or update your profile credentials for re-examination.
          </p>
        </div>
      )}

      {/* Financial Metrics Cards (Integer Minor Kobo Calculations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Available Balance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <WalletIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {formatNaira(wallet?.availableBalanceMinor || 0)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            Ready for instant bank transfer
          </div>
        </div>

        {/* Pending Escrow Balance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Pending In Escrow</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {formatNaira(wallet?.pendingBalanceMinor || 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Held until customer confirms completion
          </div>
        </div>

        {/* Total Gross Earnings */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Gross Career Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {formatNaira(wallet?.totalEarningsMinor || 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Across {artisan.completedJobsCount} completed jobs
          </div>
        </div>

        {/* 5% Platform Commission Deducted */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Platform Commission (5%)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {formatNaira(wallet?.totalCommissionPaidMinor || 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Transparent 5.0% service fee
          </div>
        </div>
      </div>

      {/* Main Tabs Header */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Job Bookings</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-semibold">
            {bookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'wallet'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Wallet & Payouts</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-semibold">
            {payouts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'services'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>My Service Listings</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-semibold">
            {services.length}
          </span>
        </button>
      </div>

      {/* TAB 1: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* New Incoming Requests Queue */}
          {newRequests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                New Customer Requests Awaiting Your Response ({newRequests.length})
              </h2>

              <div className="grid gap-3">
                {newRequests.map((bk) => (
                  <div
                    key={bk.id}
                    className="p-5 rounded-2xl border-2 border-orange-200 bg-orange-50/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-orange-200">
                          {bk.bookingRef}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{bk.customerName}</span>
                        <span className="text-xs text-slate-500">({bk.customerPhone})</span>
                      </div>
                      <div className="text-base font-extrabold text-slate-900">
                        {formatNaira(bk.estimatedCostMinor)}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-orange-100">
                      <strong>Task:</strong> {bk.jobDescription}
                    </p>

                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          {bk.date} at {bk.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {bk.locationArea}, Makurdi ({bk.locationAddress})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBookingAction(bk.id, 'accepted', 'Artisan accepted request')}
                          className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
                        >
                          Accept Booking
                        </button>
                        <button
                          onClick={() => handleBookingAction(bk.id, 'cancelled', 'Artisan declined schedule conflict')}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-white text-xs font-semibold"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active & Completed Bookings */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">All Scheduled Jobs ({bookings.length})</h3>

            <div className="grid gap-3">
              {bookings.map((bk) => {
                const badge = getStatusBadge(bk.status);

                return (
                  <div
                    key={bk.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-800">{bk.bookingRef}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-slate-500">Customer: {bk.customerName}</span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900">
                        Gross: {formatNaira(bk.estimatedCostMinor)} • Net: <span className="text-emerald-700">{formatNaira(bk.artisanNetMinor)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed">
                      {bk.jobDescription}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span>📅 {bk.date} @ {bk.time}</span>
                        <span>📍 {bk.locationArea}, Makurdi</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onChatBooking(bk)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat
                        </button>

                        {bk.status === 'paid' && (
                          <button
                            onClick={() => handleBookingAction(bk.id, 'in_progress', 'Work started on site')}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                          >
                            Mark In Progress
                          </button>
                        )}

                        {bk.status === 'in_progress' && (
                          <button
                            onClick={() => handleBookingAction(bk.id, 'completed', 'Artisan finished job')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                          >
                            Mark Job Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WALLET & PAYOUTS */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Artisan Payouts & Transaction Ledger</h3>
              <p className="text-xs text-slate-500">Withdraw your earnings directly to any Nigerian commercial or microfinance bank</p>
            </div>
            <button
              onClick={() => setPayoutModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Request Withdrawal
            </button>
          </div>

          {/* Payout History Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Recent Payout Requests</h4>
            {payouts.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No payout requests yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="pb-2">Reference</th>
                      <th className="pb-2">Bank</th>
                      <th className="pb-2">Account</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.map((po) => (
                      <tr key={po.id} className="text-slate-700">
                        <td className="py-2.5 font-mono font-bold text-slate-900">{po.payoutRef}</td>
                        <td className="py-2.5">{po.bankName}</td>
                        <td className="py-2.5">{po.accountNumberMasked}</td>
                        <td className="py-2.5 font-bold text-slate-900">{formatNaira(po.amountMinor)}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                        <td className="py-2.5 text-slate-400">{formatDateTime(po.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Wallet Ledger Transactions */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Immutable Wallet Ledger</h4>
            {transactions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No transactions recorded</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{tx.description}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Ref: {tx.reference} • {formatDateTime(tx.createdAt)}
                      </div>
                    </div>
                    <div
                      className={`font-black text-sm ${
                        tx.type === 'credit_job' ? 'text-emerald-700' : 'text-slate-800'
                      }`}
                    >
                      {tx.type === 'credit_job' ? '+' : '-'}
                      {formatNaira(tx.amountMinor)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Your Listed Marketplace Services</h3>
              <p className="text-xs text-slate-500">Customers can book these services directly from your profile</p>
            </div>
            <button
              onClick={() => setServiceModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add New Service
            </button>
          </div>

          <div className="grid gap-3">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{srv.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{srv.description}</p>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Estimated Duration: {srv.estimatedDuration} • Areas: {srv.serviceArea.join(', ')}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-black text-slate-900">
                    {formatNaira(srv.startingPriceMinor)}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    {srv.pricingType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WITHDRAWAL / PAYOUT MODAL */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Request Bank Payout</h3>
              <button onClick={() => setPayoutModalOpen(false)}>
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {payoutError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{payoutError}</div>
            )}
            {payoutSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                {payoutSuccess}
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Withdrawal Amount (₦) - Min ₦5,000
                </label>
                <input
                  type="number"
                  required
                  min="5000"
                  step="1000"
                  value={payoutAmountNaira}
                  onChange={(e) => setPayoutAmountNaira(Number(e.target.value))}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 font-bold"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Available in wallet: {formatNaira(wallet?.availableBalanceMinor || 0)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Bank</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b.code} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Number (10 Digits)</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={payoutLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {payoutLoading ? 'Processing Request...' : 'Confirm Withdrawal Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD SERVICE MODAL */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Service Listing</h3>
              <button onClick={() => setServiceModalOpen(false)}>
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Copper Pipe Leak Repair & Fitting"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe scope of work, materials included..."
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Starting Price (₦) *</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  required
                  value={servicePriceNaira}
                  onChange={(e) => setServicePriceNaira(Number(e.target.value))}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Duration</label>
                <input
                  type="text"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Makurdi Service Areas</label>
                <input
                  type="text"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs"
              >
                Publish Service Listing
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
