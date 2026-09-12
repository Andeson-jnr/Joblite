import React from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Download,
  Building,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  FileCheck,
} from 'lucide-react';
import { Booking } from '../types';
import { formatNaira, formatDateTime, formatDate } from '../lib/utils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, booking }) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Payment & Escrow Receipt</h3>
              <p className="text-xs text-slate-500">Receipt Ref: REC-{booking.bookingRef.replace('BK-', '')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 overflow-y-auto space-y-6 text-slate-900 bg-white">
          {/* Header Organization info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="text-lg font-black text-emerald-800 tracking-tight flex items-center gap-1.5">
                Makurdi Artisan Marketplace
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">
                Benue State Service Escrow Authority • www.makurdiartisans.ng
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Wurukum Commercial Hub, Makurdi, Benue State, Nigeria
              </div>
            </div>

            <div className="sm:text-right bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 shrink-0">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                Transaction Status
              </span>
              <span className="text-sm font-extrabold text-emerald-700 flex items-center sm:justify-end gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {booking.status === 'customer_confirmed'
                  ? 'Settled & Released'
                  : 'Escrow Secured'}
              </span>
            </div>
          </div>

          {/* Billing and Artisan Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Customer Details
              </div>
              <div className="font-bold text-sm text-slate-900">{booking.customerName}</div>
              <div className="text-slate-600 font-mono">{booking.customerPhone}</div>
              <div className="text-slate-500 pt-0.5">
                📍 {booking.locationArea}, Makurdi ({booking.locationAddress})
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Artisan Service Provider
              </div>
              <div className="font-bold text-sm text-slate-900">{booking.artisanBusinessName}</div>
              <div className="text-emerald-700 font-semibold">{booking.categoryName}</div>
              <div className="text-slate-500 pt-0.5">
                Appointment: {booking.date} at {booking.time}
              </div>
            </div>
          </div>

          {/* Job Scope & Financial Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 p-3 font-bold text-slate-700 grid grid-cols-12">
              <div className="col-span-8">Description of Service</div>
              <div className="col-span-4 text-right">Amount (NGN)</div>
            </div>

            <div className="p-3.5 divide-y divide-slate-100 space-y-2">
              <div className="grid grid-cols-12 pt-1">
                <div className="col-span-8">
                  <div className="font-bold text-slate-900">{booking.serviceName}</div>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                    {booking.jobDescription}
                  </p>
                </div>
                <div className="col-span-4 text-right font-mono font-bold text-slate-900">
                  {formatNaira(booking.estimatedCostMinor)}
                </div>
              </div>

              <div className="grid grid-cols-12 pt-3 text-[11px] text-slate-500">
                <div className="col-span-8">Platform Fee & Safe Escrow Insurance (5.0%):</div>
                <div className="col-span-4 text-right font-mono">
                  {formatNaira(booking.platformCommissionMinor)}
                </div>
              </div>

              <div className="grid grid-cols-12 pt-2 text-[11px] text-slate-500">
                <div className="col-span-8">Artisan Net Payout Allocation (95.0%):</div>
                <div className="col-span-4 text-right font-mono text-emerald-700 font-semibold">
                  {formatNaira(booking.artisanNetMinor)}
                </div>
              </div>

              <div className="grid grid-cols-12 pt-3 text-sm font-bold text-slate-900 border-t border-slate-200">
                <div className="col-span-8">Total Paid via Paystack:</div>
                <div className="col-span-4 text-right text-emerald-800 font-mono font-extrabold text-base">
                  {formatNaira(booking.estimatedCostMinor)}
                </div>
              </div>
            </div>
          </div>

          {/* Escrow Guarantee Statement */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Makurdi Service Protection Guarantee</div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                This receipt certifies that funds were authorized and held securely through Paystack Nigeria. The customer has confirmed satisfactory job execution, and payout has been released to the artisan's registered Nigerian bank account.
              </p>
            </div>
          </div>

          {/* Verification Footnote */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 font-mono">
            <div>Booking Ref: {booking.bookingRef}</div>
            <div>Issued: {formatDateTime(booking.createdAt)}</div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Valid digital document for tax & expense records.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
