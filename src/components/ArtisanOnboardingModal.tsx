import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ChevronRight, ShieldCheck, MapPin, Building } from 'lucide-react';
import { ServiceCategory } from '../types';
import { MAKURDI_AREAS, NIGERIAN_BANKS } from '../constants';
import { onboardArtisan } from '../lib/api';

interface ArtisanOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  onOnboardingComplete: () => void;
}

export const ArtisanOnboardingModal: React.FC<ArtisanOnboardingModalProps> = ({
  isOpen,
  onClose,
  categories,
  onOnboardingComplete,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    categoryId: categories[0]?.id || 'cat-plumbing',
    yearsOfExperience: 5,
    pricingModel: 'starting_from',
    startingPriceNaira: 5000,
    address: 'Wurukum Market Road, Makurdi',
    serviceArea: ['Wurukum', 'High Level', 'North Bank'],
    description: '',
    ninNumber: '',
    certificationTitle: 'Trade Test Certificate (Grade 1)',
    certificationBody: 'Federal Ministry of Labour & Employment',
    certificationNumber: '',
    guarantorName: '',
    guarantorPhone: '',
    bankName: 'First Bank of Nigeria',
    accountNumber: '',
    accountName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleArea = (area: string) => {
    setFormData((prev) => {
      const exists = prev.serviceArea.includes(area);
      return {
        ...prev,
        serviceArea: exists ? prev.serviceArea.filter((a) => a !== area) : [...prev.serviceArea, area],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await onboardArtisan({
        ...formData,
        startingPriceMinor: formData.startingPriceNaira * 100,
        certificationTitle: formData.certificationTitle,
        certificationBody: formData.certificationBody,
        certificationNumber: formData.certificationNumber || 'TTC-' + Math.floor(100000 + Math.random() * 900000),
        skills: ['Diagnosis', 'Repairs', 'Installation', 'Routine Maintenance'],
        workingHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
        portfolioImages: [
          'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
        ],
      });

      if (res.success) {
        onOnboardingComplete();
        onClose();
      } else {
        setError(res.message || 'Onboarding failed');
      }
    } catch (err: any) {
      setError(err.message || 'Error completing onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Join as a Makurdi Verified Artisan
            </h3>
            <p className="text-xs text-slate-500">Step {step} of 3 • Expand your local client base in Benue</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="p-3 mx-6 mt-4 rounded-xl bg-red-50 text-red-700 text-xs">{error}</div>}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business / Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Makurdi Cool-Tech Air Conditioning"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Skill Trade *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: Number(e.target.value) })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Starting Rate (₦)</label>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    value={formData.startingPriceNaira}
                    onChange={(e) => setFormData({ ...formData, startingPriceNaira: Number(e.target.value) })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brief Description / Bio</label>
                <textarea
                  rows={3}
                  placeholder="Tell clients in Makurdi about your training, reliability, and specialties..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!formData.businessName) {
                    setError('Please enter your business name.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Continue to Location</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Workshop / Physical Address in Makurdi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop 14, Modern Market Road, Wurukum"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Makurdi Neighborhoods You Serve (Select Multiple)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                  {MAKURDI_AREAS.map((area) => {
                    const isSelected = formData.serviceArea.includes(area);
                    return (
                      <button
                        type="button"
                        key={area}
                        onClick={() => toggleArea(area)}
                        className={`text-left text-xs p-2 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{area}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.serviceArea.length === 0) {
                      setError('Please select at least one Makurdi area you can travel to.');
                      return;
                    }
                    setError('');
                    setStep(3);
                  }}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Continue to Verification</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Verification requires a valid National Identification Number (NIN).</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">National ID / NIN *</label>
                <input
                  type="text"
                  required
                  placeholder="11-digit NIN"
                  value={formData.ninNumber}
                  onChange={(e) => setFormData({ ...formData, ninNumber: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Professional Trade Certification / License *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trade Test Grade 1, City & Guilds, COREN"
                  value={formData.certificationTitle}
                  onChange={(e) => setFormData({ ...formData, certificationTitle: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Certifying Body</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Min of Labour"
                    value={formData.certificationBody}
                    onChange={(e) => setFormData({ ...formData, certificationBody: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Certificate / License No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TTC-48291"
                    value={formData.certificationNumber}
                    onChange={(e) => setFormData({ ...formData, certificationNumber: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Guarantor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Respected community contact"
                    value={formData.guarantorName}
                    onChange={(e) => setFormData({ ...formData, guarantorName: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Guarantor Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+234..."
                    value={formData.guarantorPhone}
                    onChange={(e) => setFormData({ ...formData, guarantorPhone: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Settlement Bank</label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b.code} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="10-digit NUBAN"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Matches bank record"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {loading ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
