import React, { useState } from 'react';
import {
  X,
  Flame,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { ArtisanProfile, ServiceCategory } from '../types';
import { MAKURDI_AREAS } from '../constants';
import { createBooking } from '../lib/api';
import { formatNaira } from '../lib/utils';

interface UrgentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  artisans: ArtisanProfile[];
  onBookingCreated: (booking: any) => void;
}

export const UrgentRequestModal: React.FC<UrgentRequestModalProps> = ({
  isOpen,
  onClose,
  categories,
  artisans,
  onBookingCreated,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 'cat-plumbing');
  const [locationArea, setLocationArea] = useState('Wurukum');
  const [locationAddress, setLocationAddress] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'immediate' | '2_hours'>('immediate');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('+234 803 123 4567');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Find the top rated available artisan in this category and area
  const matchedArtisan =
    artisans.find(
      (a) =>
        a.categoryId === selectedCategory &&
        (a.serviceArea.includes(locationArea) || a.address.includes(locationArea))
    ) ||
    artisans.find((a) => a.categoryId === selectedCategory) ||
    artisans[0];

  const estimatedUrgentCostMinor = (matchedArtisan?.startingPriceMinor || 1000000) + 200000; // includes ₦2,000 rapid emergency dispatch fee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please describe the emergency issue.');
      return;
    }
    if (!locationAddress.trim()) {
      setError('Please provide your specific location address in Makurdi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await createBooking({
        artisanId: matchedArtisan.id,
        jobDescription: `[EMERGENCY RAPID DISPATCH: ${urgencyLevel === 'immediate' ? 'Under 45 mins' : 'Under 2 hours'}] ${description.trim()}`,
        date: new Date().toISOString().split('T')[0],
        time: urgencyLevel === 'immediate' ? 'Immediate (ASAP)' : 'Within 2 Hours',
        locationArea,
        locationAddress,
        estimatedCostMinor: estimatedUrgentCostMinor,
      });

      if (res.success && res.booking) {
        onBookingCreated(res.booking);
        onClose();
      } else {
        setError(res.message || 'Failed to dispatch urgent request');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating emergency dispatch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-rose-200 overflow-hidden flex flex-col">
        {/* Urgent Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Rapid Artisan SOS Dispatch</h3>
              <p className="text-xs text-rose-100">Immediate response across Makurdi Metropolis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Urgency Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUrgencyLevel('immediate')}
              className={`p-3 rounded-xl border text-left transition-all ${
                urgencyLevel === 'immediate'
                  ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>Under 45 Mins</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Emergency pipe burst, power cut, lockouts</p>
            </button>

            <button
              type="button"
              onClick={() => setUrgencyLevel('2_hours')}
              className={`p-3 rounded-xl border text-left transition-all ${
                urgencyLevel === '2_hours'
                  ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Today (Within 2 hrs)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Same-day urgent generator or AC fix</p>
            </button>
          </div>

          {/* Trade Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Required Trade Service *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Emergency Description *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Overhead water tank pipe has ruptured and flooding the backyard at Kanshio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Location Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Makurdi Area *
              </label>
              <select
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                {MAKURDI_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
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
                placeholder="e.g. Near St. Theresa Church..."
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Matched Pro Preview */}
          {matchedArtisan && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Nearest On-Duty Pro</span>
                <div className="font-bold text-slate-900">{matchedArtisan.businessName}</div>
                <div className="text-slate-500">Rating: {matchedArtisan.rating} ★ • 📍 {matchedArtisan.address}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Estimated Total</span>
                <div className="text-sm font-black text-rose-700">{formatNaira(estimatedUrgentCostMinor)}</div>
              </div>
            </div>
          )}

          {/* Escrow Guarantee Statement */}
          <div className="p-2.5 rounded-lg bg-emerald-50 text-[11px] text-emerald-900 flex items-center gap-2 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Funds held safely in escrow. You only pay after technician arrives and resolves the issue.</span>
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Broadcasting Rapid Alert to Artisan...</span>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Broadcast Emergency Dispatch Now</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
