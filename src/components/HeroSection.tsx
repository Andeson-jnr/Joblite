import React, { useState } from 'react';
import { Search, MapPin, ShieldCheck, CheckCircle2, Star, ArrowRight, Sparkles } from 'lucide-react';
import { MAKURDI_AREAS } from '../constants';

interface HeroSectionProps {
  onSearch: (params: { q?: string; location?: string }) => void;
  onSelectCategory: (categoryId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, onSelectCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      q: searchTerm.trim() || undefined,
      location: selectedLocation !== 'all' ? selectedLocation : undefined,
    });
  };

  const quickCategories = [
    { id: 'cat-plumbing', name: 'Plumber' },
    { id: 'cat-electrical', name: 'Electrician' },
    { id: 'cat-generator', name: 'Generator Repair' },
    { id: 'cat-ac-refrig', name: 'AC & Fridge' },
    { id: 'cat-tailoring', name: 'Native Tailor' },
    { id: 'cat-pop-ceiling', name: 'POP Ceiling' },
  ];

  return (
    <div className="relative bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900 text-white overflow-hidden py-14 md:py-20">
      {/* Decorative subtle ambient backdrop */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Makurdi Launch Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-xs font-semibold backdrop-blur-xs shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Makurdi Premier On-Demand Artisan & Service Marketplace</span>
          </div>

          {/* Core Headlines verbatim from specification */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Find Trusted Artisans Near You
          </h1>

          <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed font-normal max-w-2xl mx-auto">
            Book reliable professionals for your home, business and everyday needs across Wurukum, High Level, North Bank, Kanshio and Makurdi.
          </p>

          {/* High Conversion Search Bar Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-xl border border-emerald-800/30 text-slate-900 flex flex-col md:flex-row items-center gap-2 mt-8 text-left"
          >
            {/* Service query input */}
            <div className="relative flex-1 w-full flex items-center pl-3">
              <Search className="w-5 h-5 text-emerald-700 shrink-0 mr-2.5" />
              <div className="w-full">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  What service do you need?
                </label>
                <input
                  id="hero-service-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. Plumber, Generator mechanic, AC technician..."
                  className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-slate-200 mx-1" />

            {/* Makurdi Location dropdown */}
            <div className="relative w-full md:w-64 flex items-center pl-3 pr-2">
              <MapPin className="w-5 h-5 text-emerald-700 shrink-0 mr-2.5" />
              <div className="w-full">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Where do you need it?
                </label>
                <select
                  id="hero-location-select"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full text-sm font-semibold text-slate-900 focus:outline-none bg-transparent cursor-pointer"
                >
                  <option value="all">All Makurdi Areas</option>
                  {MAKURDI_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CTA Button */}
            <button
              id="hero-submit-btn"
              type="submit"
              className="w-full md:w-auto px-7 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Find an Artisan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Category Tags */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
            <span className="text-xs text-emerald-200/80 font-medium">Popular:</span>
            {quickCategories.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectCategory(item.id)}
                className="text-xs px-2.5 py-1 rounded-full bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-100 border border-emerald-600/30 transition-colors"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* Value Prop Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-emerald-800/40 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/80 flex items-center justify-center shrink-0 text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">100% Escrow Protection</div>
              <div className="text-[11px] text-emerald-200/70">Payment held safely until done</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/80 flex items-center justify-center shrink-0 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Vetted Makurdi Pros</div>
              <div className="text-[11px] text-emerald-200/70">Physical verification check</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/80 flex items-center justify-center shrink-0 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Transparent 5% Fee</div>
              <div className="text-[11px] text-emerald-200/70">Lowest platform fee in Nigeria</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/80 flex items-center justify-center shrink-0 text-emerald-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Rapid Doorstep Response</div>
              <div className="text-[11px] text-emerald-200/70">Within your immediate zone</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
