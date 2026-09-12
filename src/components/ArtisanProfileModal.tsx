import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MapPin,
  ShieldCheck,
  CheckCircle,
  Clock,
  MessageSquare,
  Wrench,
  Image as ImageIcon,
  Share2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ArtisanProfile, ServiceListing, Review } from '../types';
import { formatNaira, formatDate } from '../lib/utils';
import { fetchArtisanById } from '../lib/api';

interface ArtisanProfileModalProps {
  artisan: ArtisanProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onBookService: (artisan: ArtisanProfile, service?: ServiceListing) => void;
  onSendMessage: (artisan: ArtisanProfile) => void;
}

export const ArtisanProfileModal: React.FC<ArtisanProfileModalProps> = ({
  artisan,
  isOpen,
  onClose,
  onBookService,
  onSendMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'reviews' | 'about'>('services');
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (artisan && isOpen) {
      setLoading(true);
      fetchArtisanById(artisan.id)
        .then((res) => {
          if (res.services) setServices(res.services);
          if (res.reviews) setReviews(res.reviews);
        })
        .finally(() => setLoading(false));
    }
  }, [artisan, isOpen]);

  if (!isOpen || !artisan) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header & Cover Banner */}
        <div className="relative h-44 sm:h-52 w-full bg-slate-800 shrink-0">
          {artisan.coverImage ? (
            <img
              src={artisan.coverImage}
              alt={artisan.businessName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900" />
          )}

          {/* Close Button */}
          <button
            id="close-artisan-profile"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Verification Badge */}
          <div className="absolute top-3.5 left-4">
            {artisan.verificationStatus === 'verified' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-emerald-800 text-xs font-bold shadow-md border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Makurdi Artisan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-amber-800 text-xs font-bold shadow-md border border-amber-200">
                Verification Under Review
              </span>
            )}
          </div>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white relative shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  {artisan.categoryName}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {artisan.yearsOfExperience} Years Experience
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {artisan.businessName}
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-600 mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-bold text-slate-900">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {artisan.rating} ({artisan.reviewCount} reviews)
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {artisan.completedJobsCount} Completed Jobs
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {artisan.address}
                </span>
              </div>
            </div>

            {/* Price Pill */}
            <div className="sm:text-right shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Standard Rate</div>
              <div className="text-lg font-black text-slate-900">
                {formatNaira(artisan.startingPriceMinor)}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Starting fee</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-t border-slate-100 mt-4 pt-2 -mb-2 gap-4">
            <button
              onClick={() => setActiveTab('services')}
              className={`pb-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'services'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Services & Pricing ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`pb-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'portfolio'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Portfolio & Work Gallery
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'reviews'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Customer Reviews ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`pb-2 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'about'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              About & Service Areas
            </button>
          </div>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Available Bookable Services</h3>
                <span className="text-xs text-slate-500">Transparent rates, 5% platform fee included</span>
              </div>

              <div className="grid gap-3">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-900">{srv.name}</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{srv.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Est: {srv.estimatedDuration}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {srv.serviceArea.slice(0, 2).join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-base font-extrabold text-slate-900">
                        {formatNaira(srv.startingPriceMinor)}
                      </div>
                      <button
                        onClick={() => {
                          onBookService(artisan, srv);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        Book This
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Verified Work Photos</h3>
                <span className="text-xs text-slate-500">Real projects completed in Makurdi</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {artisan.portfolioImages.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group relative">
                    <img
                      src={img}
                      alt={`Portfolio work ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Customer Ratings & Feedback</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Reviews can only be left by customers with confirmed completed jobs
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-sm text-slate-900">{artisan.rating}</span>
                  <span className="text-xs text-slate-500">/ 5.0</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No public reviews yet. Be the first to book and rate this artisan!
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-700">
                            {rev.customerAvatar ? (
                              <img src={rev.customerAvatar} alt={rev.customerName} className="w-full h-full object-cover" />
                            ) : (
                              rev.customerName[0]
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900">{rev.customerName}</div>
                            <div className="text-[10px] text-slate-400">{formatDate(rev.createdAt)}</div>
                          </div>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Professional Biography</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{artisan.description}</p>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Verified Skills & Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {artisan.skills.map((skill, idx) => (
                    <span key={idx} className="text-xs px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Makurdi Coverage Areas
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {artisan.serviceArea.join(', ')}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Working Hours
                  </div>
                  <p className="text-xs text-slate-600">{artisan.workingHours}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            🛡️ Escrow Guarantee: Payment released only upon your final confirmation.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                onSendMessage(artisan);
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat / Enquire
            </button>

            <button
              id="modal-book-artisan-btn"
              onClick={() => {
                onBookService(artisan);
                onClose();
              }}
              className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Request Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
