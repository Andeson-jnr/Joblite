import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ArtisanProfile, ServiceListing, User } from '../types';
import { MAKURDI_AREAS } from '../constants';
import { formatNaira } from '../lib/utils';
import { createBooking } from '../lib/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  artisan: ArtisanProfile | null;
  preSelectedService?: ServiceListing | null;
  currentUser: User | null;
  onBookingCreated: (booking: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  artisan,
  preSelectedService,
  currentUser,
  onBookingCreated,
}) => {
  const [jobDescription, setJobDescription] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('10:00 AM');
  const [locationArea, setLocationArea] = useState('Wurukum');
  const [locationAddress, setLocationAddress] = useState('');
  const [customCostNaira, setCustomCostNaira] = useState<number>(() => {
    if (preSelectedService) return preSelectedService.startingPriceMinor / 100;
    if (artisan) return artisan.startingPriceMinor / 100;
    return 10000;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !artisan) return null;

  const costMinor = customCostNaira * 100;
  const platformCommissionMinor = Math.round(costMinor * 0.05); // 5% platform commission
  const artisanNetMinor = costMinor - platformCommissionMinor; // 95% artisan payout

  const timeSlots = [
    '08:00 AM',
    '09:00 AM',
    '10:00 AM',
    '11:30 AM',
    '01:00 PM',
    '02:30 PM',
    '04:00 PM',
    '05:30 PM',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please provide a description of the problem or task.');
      return;
    }
    if (!locationAddress.trim()) {
      setError('Please enter your specific street address in Makurdi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await createBooking({
        artisanId: artisan.id,
        serviceId: preSelectedService?.id,
        jobDescription,
        date,
        time,
        locationArea,
        locationAddress,
        estimatedCostMinor: costMinor,
      });

      if (res.success && res.booking) {
        onBookingCreated(res.booking);
        onClose();
      } else {
        setError(res.message || 'Failed to submit booking');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred submitting the booking request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Request Service Booking
            </h3>
            <p className="text-xs text-slate-500">
              with {artisan.businessName} ({artisan.categoryName})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Service Title */}
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Service Selected</div>
              <div className="font-bold text-xs sm:text-sm text-slate-900">
                {preSelectedService ? preSelectedService.name : `${artisan.categoryName} General Booking`}
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-white text-emerald-800 font-semibold border border-emerald-200">
              {artisan.pricingModel}
            </span>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Job Description & Specific Requirements *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe what needs to be fixed or installed (e.g. My borehole submersible pump stopped pumping water, need troubleshooting and wire check)..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>

          {/* Date and Time Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Preferred Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Preferred Time *
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Area & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Makurdi Area / Zone *
              </label>
              <select
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {MAKURDI_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Street Address / Landmark *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Flat 4, opposite BSU Gate 2..."
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Pricing & 5% Platform Commission Transparency */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Agreed Service Budget (₦)
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-500">₦</span>
                <input
                  type="number"
                  min="2000"
                  step="500"
                  value={customCostNaira}
                  onChange={(e) => setCustomCostNaira(Math.max(1000, Number(e.target.value)))}
                  className="w-28 text-right text-xs font-bold p-1 px-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* Commission Breakdown */}
            <div className="text-xs space-y-1.5 pt-2 border-t border-slate-200/80 text-slate-600">
              <div className="flex justify-between">
                <span>Gross Job Value:</span>
                <span className="font-semibold text-slate-800">{formatNaira(costMinor)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="flex items-center gap-1">
                  Platform Commission (5%):
                  <Info className="w-3 h-3 text-slate-400" />
                </span>
                <span>{formatNaira(platformCommissionMinor)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Artisan Settlement Net:</span>
                <span className="text-emerald-700">{formatNaira(artisanNetMinor)}</span>
              </div>
            </div>

            {/* Escrow Guarantee Notice */}
            <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Escrow Held:</strong> You only fund this amount after the artisan accepts. Payment remains held until you inspect and confirm 100% satisfactory job completion.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <span>Submit Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
