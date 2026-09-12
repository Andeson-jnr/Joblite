import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  CreditCard,
  MessageSquare,
  Star,
  ShieldCheck,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Booking, User } from '../types';
import { formatNaira, formatDate, getStatusBadge } from '../lib/utils';
import { fetchBookings, updateBookingStatus } from '../lib/api';

interface CustomerDashboardProps {
  currentUser: User | null;
  onPayBooking: (booking: Booking) => void;
  onChatBooking: (booking: Booking) => void;
  onReviewBooking: (booking: Booking) => void;
  onDisputeBooking: (booking: Booking) => void;
  onViewReceipt: (booking: Booking) => void;
  onExploreServices: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  onPayBooking,
  onChatBooking,
  onReviewBooking,
  onDisputeBooking,
  onViewReceipt,
  onExploreServices,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'issues'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    fetchBookings({ customerId: currentUser?.id })
      .then((res) => {
        if (res.bookings) setBookings(res.bookings);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  const [confirmingBooking, setConfirmingBooking] = useState<Booking | null>(null);

  const handleConfirmCompletion = async (booking: Booking) => {
    setActionLoadingId(booking.id);
    try {
      const res = await updateBookingStatus(
        booking.id,
        'customer_confirmed',
        'Customer confirmed satisfactory job completion in Makurdi'
      );
      if (res.success) {
        setConfirmingBooking(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'active') {
      return ['requested', 'pending_artisan', 'accepted', 'payment_pending', 'paid', 'in_progress', 'completed'].includes(b.status);
    }
    if (activeFilter === 'completed') {
      return b.status === 'customer_confirmed';
    }
    if (activeFilter === 'issues') {
      return ['disputed', 'refunded', 'cancelled'].includes(b.status);
    }
    return true;
  });

  const activeCount = bookings.filter((b) => ['paid', 'in_progress', 'accepted', 'completed'].includes(b.status)).length;
  const completedCount = bookings.filter((b) => b.status === 'customer_confirmed').length;
  const totalSpentMinor = bookings
    .filter((b) => ['paid', 'in_progress', 'completed', 'customer_confirmed'].includes(b.status))
    .reduce((acc, b) => acc + b.estimatedCostMinor, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-teal-950 p-6 sm:p-8 rounded-3xl text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/40 text-emerald-200 text-xs font-semibold mb-2">
            <span>Customer Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Welcome back, {currentUser?.fullName || 'Customer'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 max-w-xl">
            Track and manage your requested artisan services across Makurdi with safe escrow payment protection.
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-3 sm:gap-6 bg-white/10 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-white/10 shrink-0">
          <div>
            <div className="text-[11px] uppercase font-bold text-emerald-300">Active Jobs</div>
            <div className="text-2xl font-black">{activeCount}</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <div className="text-[11px] uppercase font-bold text-emerald-300">Completed</div>
            <div className="text-2xl font-black">{completedCount}</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <div className="text-[11px] uppercase font-bold text-emerald-300">Secured Spend</div>
            <div className="text-lg sm:text-xl font-black">{formatNaira(totalSpentMinor)}</div>
          </div>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`pb-2 text-xs font-bold px-3 border-b-2 transition-colors ${
                activeFilter === 'all'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              All Requests ({bookings.length})
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`pb-2 text-xs font-bold px-3 border-b-2 transition-colors ${
                activeFilter === 'active'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Active & In Progress ({activeCount})
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`pb-2 text-xs font-bold px-3 border-b-2 transition-colors ${
                activeFilter === 'completed'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 p-1.5 rounded-lg border border-slate-200 bg-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading your bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3 bg-white">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="font-bold text-sm text-slate-800">No bookings in this category</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Ready to hire a plumber, electrician, generator mechanic or designer in Makurdi?
            </p>
            <button
              onClick={onExploreServices}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs"
            >
              Find Artisans in Makurdi
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((bk) => {
              const badge = getStatusBadge(bk.status);

              return (
                <div
                  key={bk.id}
                  id={`booking-item-${bk.bookingRef}`}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-4 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                        {bk.bookingRef}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400">Requested on {formatDate(bk.createdAt)}</span>
                    </div>

                    <div className="text-base sm:text-lg font-black text-slate-900">
                      {formatNaira(bk.estimatedCostMinor)}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Artisan Pro</div>
                      <div className="font-bold text-sm text-slate-900 mt-0.5">{bk.artisanBusinessName}</div>
                      <div className="text-slate-500">{bk.categoryName}</div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Appointment</div>
                      <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        {bk.date}
                      </div>
                      <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {bk.time}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Location</div>
                      <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {bk.locationArea}, Makurdi
                      </div>
                      <div className="text-slate-500 truncate">{bk.locationAddress}</div>
                    </div>
                  </div>

                  {/* Task Description */}
                  <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 leading-relaxed border border-slate-100">
                    <span className="font-bold text-slate-900">Problem / Task: </span>
                    {bk.jobDescription}
                  </div>

                  {/* Status Specific Prompts & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    {/* Status hint text */}
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      {bk.status === 'accepted' && (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Artisan accepted! Fund payment to secure booking in escrow.
                        </span>
                      )}
                      {bk.status === 'paid' && (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" />
                          Payment held safely in escrow. Waiting for artisan to start.
                        </span>
                      )}
                      {bk.status === 'completed' && (
                        <span className="text-amber-800 font-medium flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Artisan marked job complete! Please inspect work and confirm.
                        </span>
                      )}
                      {bk.status === 'customer_confirmed' && (
                        <span className="text-emerald-800 font-medium flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Settled! Funds released to artisan (less 5% platform fee).
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onChatBooking(bk)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                      </button>

                      {bk.status === 'accepted' && (
                        <button
                          onClick={() => onPayBooking(bk)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay {formatNaira(bk.estimatedCostMinor)}
                        </button>
                      )}

                      {bk.status === 'completed' && (
                        <button
                          onClick={() => setConfirmingBooking(bk)}
                          disabled={actionLoadingId === bk.id}
                          className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Confirm & Release Pay</span>
                        </button>
                      )}

                      {bk.status === 'customer_confirmed' && (
                        <>
                          <button
                            onClick={() => onReviewBooking(bk)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Star className="w-3.5 h-3.5 fill-white" />
                            Rate Artisan
                          </button>
                          <button
                            onClick={() => onViewReceipt(bk)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                        </>
                      )}

                      {['paid', 'in_progress', 'completed'].includes(bk.status) && (
                        <button
                          onClick={() => onDisputeBooking(bk)}
                          className="px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Report Issue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Escrow Release Confirmation Modal */}
      {confirmingBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Work Completion</h3>
                <p className="text-xs text-slate-500">Ref: {confirmingBooking.bookingRef}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <p>
                Have you inspected the job done by <strong>{confirmingBooking.artisanBusinessName}</strong>?
              </p>
              <p className="font-semibold text-emerald-900">
                Confirming will immediately release {formatNaira(confirmingBooking.artisanNetMinor)} from escrow into their available wallet.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingBooking(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel / Re-inspect
              </button>
              <button
                type="button"
                disabled={actionLoadingId === confirmingBooking.id}
                onClick={() => handleConfirmCompletion(confirmingBooking)}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {actionLoadingId === confirmingBooking.id ? 'Releasing...' : 'Yes, Release Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
