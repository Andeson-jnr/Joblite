import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle,
  FileText,
  Printer,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Booking } from '../types';
import { formatNaira, formatDateTime } from '../lib/utils';
import { initializePayment, verifyPayment } from '../lib/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onPaymentSuccess: (bookingId: string, reference: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ reference: string; date: string; amount: number } | null>(null);

  if (!isOpen || !booking) return null;

  const handlePaystackPay = async () => {
    setLoading(true);
    setError('');

    try {
      // Initialize transaction with backend
      const initRes = await initializePayment(booking.id, booking.estimatedCostMinor);

      if (!initRes.success && !initRes.reference) {
        throw new Error(initRes.message || 'Payment initialization failed');
      }

      const reference = initRes.reference;

      // In sandbox mode or live popup, immediately verify transaction with backend
      const verifyRes = await verifyPayment(reference);

      if (verifyRes.success) {
        setReceipt({
          reference,
          date: new Date().toISOString(),
          amount: booking.estimatedCostMinor,
        });
        onPaymentSuccess(booking.id, reference);
      } else {
        throw new Error(verifyRes.message || 'Payment verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              Secure Paystack Checkout
            </h3>
            <p className="text-xs text-slate-500">Booking Ref: {booking.bookingRef}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {receipt ? (
            /* Payment Receipt Success View */
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">Payment Successful!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your funds are secured in platform escrow and will be released to the artisan once you confirm job completion.
                </p>
              </div>

              {/* Receipt Voucher */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Receipt Ref:</span>
                  <span className="font-bold text-slate-900">{receipt.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Ref:</span>
                  <span className="font-semibold text-slate-800">{booking.bookingRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Artisan:</span>
                  <span className="font-semibold text-slate-800">{booking.artisanBusinessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-800">{booking.locationArea}, Makurdi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="text-slate-800">{formatDateTime(receipt.date)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-sans font-extrabold text-slate-900">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-700">{formatNaira(receipt.amount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handlePrintReceipt}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs"
                >
                  View My Bookings
                </button>
              </div>
            </div>
          ) : (
            /* Checkout View */
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Service:</span>
                  <span className="font-semibold text-slate-900">{booking.serviceName}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Artisan Pro:</span>
                  <span className="font-semibold text-slate-900">{booking.artisanBusinessName}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Scheduled Date:</span>
                  <span className="font-semibold text-slate-900">{booking.date} at {booking.time}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Makurdi Location:</span>
                  <span className="font-semibold text-slate-900">{booking.locationArea}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-700">Total Due (NGN):</span>
                  <span className="text-2xl font-black text-slate-900">
                    {formatNaira(booking.estimatedCostMinor)}
                  </span>
                </div>
              </div>

              {/* Escrow Guarantee Pill */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  100% Escrow Protection Guarantee
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Your money is held safely by the marketplace. The artisan does NOT receive payment until you inspect the work and confirm satisfaction.
                </p>
              </div>

              {/* Gateway Channel Info */}
              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>Paystack Nigeria (Cards, Bank Transfer, USSD)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Bank-Grade 256-bit SSL
                </span>
              </div>

              {/* Submit Payment CTA */}
              <button
                id="btn-confirm-paystack-pay"
                onClick={handlePaystackPay}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Securing & Authorizing Payment...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay {formatNaira(booking.estimatedCostMinor)} via Paystack</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-center text-slate-400">
                Processed via Paystack checkout API. All card details remain strictly confidential and encrypted.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
