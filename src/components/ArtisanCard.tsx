import React from 'react';
import {
  Star,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Clock,
  MessageSquare,
  ArrowUpRight,
  Briefcase,
} from 'lucide-react';
import { ArtisanProfile } from '../types';
import { formatNaira } from '../lib/utils';

interface ArtisanCardProps {
  artisan: ArtisanProfile;
  onViewProfile: (artisan: ArtisanProfile) => void;
  onBook: (artisan: ArtisanProfile) => void;
  onMessage: (artisan: ArtisanProfile) => void;
}

export const ArtisanCard: React.FC<ArtisanCardProps> = ({
  artisan,
  onViewProfile,
  onBook,
  onMessage,
}) => {
  const isVerified = artisan.verificationStatus === 'verified';

  return (
    <div
      id={`artisan-card-${artisan.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
    >
      <div>
        {/* Cover image or Header gradient */}
        <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
          {artisan.coverImage ? (
            <img
              src={artisan.coverImage}
              alt={artisan.businessName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-800 to-teal-900" />
          )}

          {/* Verification Badge Overlay */}
          <div className="absolute top-2.5 right-2.5">
            {isVerified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-emerald-800 text-[11px] font-bold shadow-xs border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Pro
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-amber-800 text-[11px] font-semibold shadow-xs border border-amber-200">
                Under Review
              </span>
            )}
          </div>

          {/* Category Chip Overlay */}
          <div className="absolute bottom-2 left-3">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium">
              {artisan.categoryName}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 pt-3 space-y-3">
          {/* Business & Experience Info */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3
                onClick={() => onViewProfile(artisan)}
                className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors cursor-pointer line-clamp-1"
              >
                {artisan.businessName}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {artisan.rating} ({artisan.reviewCount})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                {artisan.completedJobsCount} jobs completed
              </span>
              <span>•</span>
              <span>{artisan.yearsOfExperience} yrs exp</span>
            </div>
          </div>

          {/* Location & Areas */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {artisan.serviceArea.slice(0, 3).join(', ')}
              {artisan.serviceArea.length > 3 && ` +${artisan.serviceArea.length - 3} more`}
            </span>
          </div>

          {/* Skills Chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {artisan.skills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium truncate max-w-[150px]"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Bio snippet */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {artisan.description}
          </p>
        </div>
      </div>

      {/* Footer: Pricing & Action Buttons */}
      <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            {artisan.pricingModel === 'fixed' ? 'Fixed Price' : 'Starting From'}
          </div>
          <div className="text-sm font-extrabold text-slate-900">
            {formatNaira(artisan.startingPriceMinor)}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id={`message-artisan-${artisan.id}`}
            onClick={() => onMessage(artisan)}
            title="Chat with Artisan"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            id={`view-artisan-${artisan.id}`}
            onClick={() => onViewProfile(artisan)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
          >
            Profile
          </button>

          <button
            id={`book-artisan-${artisan.id}`}
            onClick={() => onBook(artisan)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};
