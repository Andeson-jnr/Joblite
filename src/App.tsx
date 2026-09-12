import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Filter,
  ShieldCheck,
  Star,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Zap,
} from 'lucide-react';
import {
  User,
  ArtisanProfile,
  ServiceCategory,
  ServiceListing,
  Booking,
  AppNotification,
  UserRole,
} from './types';
import { MAKURDI_AREAS } from './constants';
import {
  fetchMe,
  switchDemoUser,
  registerUser,
  fetchCategories,
  fetchArtisans,
  fetchNotifications,
} from './lib/api';

import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CategoryGrid } from './components/CategoryGrid';
import { ArtisanCard } from './components/ArtisanCard';
import { ArtisanProfileModal } from './components/ArtisanProfileModal';
import { BookingModal } from './components/BookingModal';
import { PaymentModal } from './components/PaymentModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { ArtisanDashboard } from './components/ArtisanDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { AuthModal } from './components/AuthModal';
import { ChatModal } from './components/ChatModal';
import { ReviewModal } from './components/ReviewModal';
import { DisputeModal } from './components/DisputeModal';
import { ArtisanOnboardingModal } from './components/ArtisanOnboardingModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ReceiptModal } from './components/ReceiptModal';
import { MakurdiZoneExplorer } from './components/MakurdiZoneExplorer';
import { UrgentRequestModal } from './components/UrgentRequestModal';

export default function App() {
  // Core application state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentArtisan, setCurrentArtisan] = useState<ArtisanProfile | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [artisans, setArtisans] = useState<ArtisanProfile[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeView, setActiveView] = useState<string>(() => {
    return new URLSearchParams(window.location.search).get('view') || 'home';
  });
  const [loadingArtisans, setLoadingArtisans] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'jobs' | 'price_low'>('rating');

  // Modal Dialogs
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [selectedProfileArtisan, setSelectedProfileArtisan] = useState<ArtisanProfile | null>(null);
  const [bookingModalState, setBookingModalState] = useState<{
    isOpen: boolean;
    artisan: ArtisanProfile | null;
    service?: ServiceListing | null;
  }>({ isOpen: false, artisan: null, service: null });
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [urgentModalOpen, setUrgentModalOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{
    isOpen: boolean;
    name: string;
    role: string;
    bookingRef?: string;
  }>({ isOpen: false, name: '', role: 'artisan' });
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<Booking | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  // Initial Data Load
  const loadUserContext = async (userId?: string) => {
    try {
      const res = await fetchMe(userId);
      if (res.user) setCurrentUser(res.user);
      if (res.artisan) setCurrentArtisan(res.artisan);
      if (res.user?.id) {
        const notifRes = await fetchNotifications(res.user.id);
        if (notifRes.notifications) setNotifications(notifRes.notifications);
      }
    } catch (err) {
      console.error('Failed to load user context', err);
    }
  };

  const loadArtisansList = async () => {
    setLoadingArtisans(true);
    try {
      const res = await fetchArtisans({
        q: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        location: selectedLocation !== 'all' ? selectedLocation : undefined,
        verifiedOnly: verifiedOnly ? true : undefined,
      });
      if (res.artisans) {
        let list = [...res.artisans];
        if (sortBy === 'rating') {
          list.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'jobs') {
          list.sort((a, b) => b.completedJobsCount - a.completedJobsCount);
        } else if (sortBy === 'price_low') {
          list.sort((a, b) => a.startingPriceMinor - b.startingPriceMinor);
        }
        setArtisans(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingArtisans(false);
    }
  };

  useEffect(() => {
    loadUserContext();
    fetchCategories().then((res) => {
      if (res.categories) setCategories(res.categories);
    });
  }, []);

  useEffect(() => {
    loadArtisansList();
  }, [searchQuery, selectedCategory, selectedLocation, verifiedOnly, sortBy]);

  // Handlers for switching and navigation
  const navigateToView = (view: string) => {
    setActiveView(view);
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.history.replaceState(null, '', url.toString());
  };

  const handleSwitchRole = async (role: UserRole, userId?: string) => {
    const res = await switchDemoUser(role, userId);
    if (res.success) {
      setCurrentUser(res.user);
      setCurrentArtisan(res.artisan || null);

      if (role === 'customer') {
        navigateToView('home');
      } else if (role === 'artisan') {
        navigateToView('artisan-dashboard');
      } else if (role === 'admin' || role === 'superadmin') {
        navigateToView('admin-dashboard');
      }

      if (res.user?.id) {
        fetchNotifications(res.user.id).then((nRes) => {
          if (nRes.notifications) setNotifications(nRes.notifications);
        });
      }
    }
  };

  const handleRegisterNew = async (data: { fullName: string; email: string; phone: string; role: string }) => {
    const res = await registerUser(data);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setCurrentArtisan(null);
      if (data.role === 'artisan') {
        setOnboardingOpen(true);
      } else {
        setActiveView('home');
      }
    }
  };

  const handleHeroSearch = (params: { q?: string; location?: string }) => {
    if (params.q !== undefined) setSearchQuery(params.q);
    if (params.location !== undefined) setSelectedLocation(params.location);
    navigateToView('home');
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    navigateToView('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Main Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        currentArtisan={currentArtisan}
        activeView={activeView}
        onNavigate={(view) => navigateToView(view)}
        onOpenRoleSwitcher={() => setRoleSwitcherOpen(true)}
        onOpenArtisanOnboarding={() => setOnboardingOpen(true)}
        notifications={notifications}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {/* VIEW 1: HOME & DIRECTORY */}
        {activeView === 'home' && (
          <div>
            {/* Hero Section */}
            <HeroSection
              onSearch={handleHeroSearch}
              onSelectCategory={handleSelectCategory}
            />

            {/* Directory Section */}
            <section id="directory-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
              {/* Rapid Emergency SOS Banner */}
              <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg">Need an Emergency Fix in Makurdi?</h3>
                    <p className="text-xs text-rose-100 max-w-xl mt-0.5">
                      Ruptured pipe, electrical short circuit, locked out, or generator power breakdown? Dispatch an on-duty pro within 45 mins.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUrgentModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 text-xs font-black shrink-0 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-rose-600 fill-rose-600" />
                  <span>Broadcast Emergency SOS</span>
                </button>
              </div>

              {/* Filter and Control Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                      Verified Makurdi Artisans
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        {artisans.length} available
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vetted technicians, builders, mechanics, and creative pros across Makurdi Metropolis
                    </p>
                  </div>

                  {/* Quick Filters */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Category Selector */}
                    <div className="relative">
                      <select
                        id="filter-category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-xs font-semibold px-3 py-2 pr-8 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="all">All Trade Categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.artisanCount || 0})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Makurdi Area Selector */}
                    <div className="relative">
                      <select
                        id="filter-location"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="text-xs font-semibold px-3 py-2 pr-8 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="all">All Makurdi Areas</option>
                        {MAKURDI_AREAS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Selector */}
                    <div className="relative">
                      <select
                        id="sort-by"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="text-xs font-semibold px-3 py-2 pr-8 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="rating">Sort: Highest Rated</option>
                        <option value="jobs">Sort: Most Jobs Done</option>
                        <option value="price_low">Sort: Lowest Price</option>
                      </select>
                    </div>

                    {/* Verified Only Toggle */}
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="w-3.5 h-3.5 text-emerald-600 rounded"
                      />
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Pros Only</span>
                    </label>

                    {(searchQuery || selectedCategory !== 'all' || selectedLocation !== 'all' || verifiedOnly) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setSelectedLocation('all');
                          setVerifiedOnly(false);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Filter Chips */}
                {(searchQuery || selectedCategory !== 'all' || selectedLocation !== 'all') && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100 flex-wrap">
                    <span className="font-semibold text-slate-400">Active filters:</span>
                    {searchQuery && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Query: "{searchQuery}"
                      </span>
                    )}
                    {selectedCategory !== 'all' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium">
                        Category: {categories.find((c) => c.id === selectedCategory)?.name}
                      </span>
                    )}
                    {selectedLocation !== 'all' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium">
                        Area: {selectedLocation}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Artisans Cards Grid */}
              {loadingArtisans ? (
                <div className="p-16 text-center text-xs text-slate-400">Loading artisans in Makurdi...</div>
              ) : artisans.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">No artisans found matching your criteria</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try clearing your search query or selecting "All Makurdi Areas".
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedLocation('all');
                      setVerifiedOnly(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
                  >
                    View All Artisans
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {artisans.map((artisan) => (
                    <ArtisanCard
                      key={artisan.id}
                      artisan={artisan}
                      onViewProfile={(art) => setSelectedProfileArtisan(art)}
                      onBook={(art) => setBookingModalState({ isOpen: true, artisan: art })}
                      onMessage={(art) =>
                        setChatTarget({
                          isOpen: true,
                          name: art.businessName,
                          role: 'artisan',
                        })
                      }
                    />
                  ))}
                </div>
              )}

              {/* Interactive Makurdi Zone Explorer Map */}
              <MakurdiZoneExplorer
                artisans={artisans}
                selectedZone={selectedLocation}
                onSelectZone={(zone) => setSelectedLocation(zone)}
              />
            </section>

            {/* How It Works Section */}
            <section className="bg-white py-16 border-t border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">
                    Safe, Transparent & Reliable
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                    How the Makurdi Marketplace Works
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2">
                    Eliminating untrusted work, inflated pricing, and abandoned jobs with verified Makurdi artisans and safe escrow protection.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-lg flex items-center justify-center">
                      1
                    </div>
                    <h3 className="font-bold text-base text-slate-900">Choose a Vetted Pro</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Search by trade and Makurdi zone (Wurukum, High Level, North Bank, Kanshio). Review portfolios, past job photos, and real local ratings.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-lg flex items-center justify-center">
                      2
                    </div>
                    <h3 className="font-bold text-base text-slate-900">Funds Held in Escrow</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Once the artisan accepts your appointment, fund the job securely via Paystack. Your money stays protected in escrow—the artisan does NOT get paid yet.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-lg flex items-center justify-center">
                      3
                    </div>
                    <h3 className="font-bold text-base text-slate-900">Inspect & Confirm Payout</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      The artisan arrives and completes the work. Only when you inspect and confirm 100% satisfaction do we release the payout to their wallet.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: FULL CATEGORIES CATALOG */}
        {activeView === 'categories' && (
          <div>
            <CategoryGrid
              categories={categories}
              selectedCategoryId={selectedCategory}
              onSelectCategory={(id) => {
                setSelectedCategory(id);
                setActiveView('home');
              }}
            />
          </div>
        )}

        {/* VIEW 3: CUSTOMER PORTAL */}
        {activeView === 'customer-dashboard' && (
          <CustomerDashboard
            currentUser={currentUser}
            onPayBooking={(bk) => setPaymentBooking(bk)}
            onChatBooking={(bk) =>
              setChatTarget({
                isOpen: true,
                name: bk.artisanBusinessName,
                role: 'artisan',
                bookingRef: bk.bookingRef,
              })
            }
            onReviewBooking={(bk) => setReviewBooking(bk)}
            onDisputeBooking={(bk) => setDisputeBooking(bk)}
            onViewReceipt={(bk) => setReceiptBooking(bk)}
            onExploreServices={() => navigateToView('home')}
          />
        )}

        {/* VIEW 4: ARTISAN WORKSPACE */}
        {activeView === 'artisan-dashboard' && (
          <ArtisanDashboard
            artisan={currentArtisan}
            onChatBooking={(bk) =>
              setChatTarget({
                isOpen: true,
                name: bk.customerName,
                role: 'customer',
                bookingRef: bk.bookingRef,
              })
            }
          />
        )}

        {/* VIEW 5: ADMIN GOVERNANCE */}
        {activeView === 'admin-dashboard' && (
          <AdminDashboard currentUser={currentUser} />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="font-bold text-white text-base">Makurdi Artisan & Service Marketplace</div>
              <p className="text-slate-400 max-w-md leading-relaxed">
                The trusted platform connecting verified plumbers, electricians, generator technicians, carpenters, tailors and service professionals in Makurdi, Benue State with local customers.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-xs pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Protected by Escrow Guarantee • Paystack Verified</span>
              </div>
            </div>

            <div>
              <div className="font-bold text-white text-xs uppercase tracking-wider mb-3">Service Areas in Makurdi</div>
              <ul className="space-y-1 text-slate-400">
                <li>Wurukum & Market Axis</li>
                <li>High Level & Judges Quarters</li>
                <li>North Bank & BSU Campus</li>
                <li>Kanshio & Modern Market</li>
                <li>Nyiman, Low Level & Wadata</li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-white text-xs uppercase tracking-wider mb-3">Platform Guarantee</div>
              <ul className="space-y-1.5 text-slate-400">
                <li>• 5% Platform Commission Fee</li>
                <li>• 100% Escrow Protection</li>
                <li>• Mandatory Physical Verification</li>
                <li>• Transparent Cashless Settlement</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
            <div>© {new Date().getFullYear()} Makurdi Artisan & Service Marketplace. Benue State, Nigeria.</div>
            <div className="flex items-center gap-4">
              <button onClick={() => setRoleSwitcherOpen(true)} className="hover:text-white underline">
                Demo Personas Switcher
              </button>
              <button onClick={() => setOnboardingOpen(true)} className="hover:text-white underline">
                Artisan Registration
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ALL INTERACTIVE MODALS */}
      <RoleSwitcherModal
        isOpen={roleSwitcherOpen}
        onClose={() => setRoleSwitcherOpen(false)}
        currentUserId={currentUser?.id}
        onSelectRole={handleSwitchRole}
        onRegisterNew={handleRegisterNew}
      />

      <ArtisanProfileModal
        artisan={selectedProfileArtisan}
        isOpen={!!selectedProfileArtisan}
        onClose={() => setSelectedProfileArtisan(null)}
        onBookService={(art, srv) => {
          setBookingModalState({ isOpen: true, artisan: art, service: srv || null });
        }}
        onSendMessage={(art) =>
          setChatTarget({
            isOpen: true,
            name: art.businessName,
            role: 'artisan',
          })
        }
      />

      <BookingModal
        isOpen={bookingModalState.isOpen}
        artisan={bookingModalState.artisan}
        preSelectedService={bookingModalState.service}
        currentUser={currentUser}
        onClose={() => setBookingModalState({ isOpen: false, artisan: null, service: null })}
        onBookingCreated={(newBooking) => {
          setActiveView('customer-dashboard');
        }}
      />

      <PaymentModal
        isOpen={!!paymentBooking}
        booking={paymentBooking}
        onClose={() => setPaymentBooking(null)}
        onPaymentSuccess={(bkId) => {
          loadUserContext();
        }}
      />

      <ChatModal
        isOpen={chatTarget.isOpen}
        onClose={() => setChatTarget({ isOpen: false, name: '', role: 'artisan' })}
        currentUserId={currentUser?.id}
        targetUserName={chatTarget.name}
        targetUserRole={chatTarget.role}
        bookingRef={chatTarget.bookingRef}
      />

      <ReviewModal
        isOpen={!!reviewBooking}
        booking={reviewBooking}
        onClose={() => setReviewBooking(null)}
        onReviewSubmitted={() => {
          loadArtisansList();
        }}
      />

      <DisputeModal
        isOpen={!!disputeBooking}
        booking={disputeBooking}
        onClose={() => setDisputeBooking(null)}
        onDisputeSubmitted={() => {
          loadUserContext();
        }}
      />

      <ArtisanOnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        categories={categories}
        onOnboardingComplete={() => {
          loadArtisansList();
          loadUserContext();
        }}
      />

      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        notifications={notifications}
        onRefresh={() => {
          if (currentUser?.id) {
            fetchNotifications(currentUser.id).then((r) => {
              if (r.notifications) setNotifications(r.notifications);
            });
          }
        }}
      />

      <ReceiptModal
        isOpen={!!receiptBooking}
        booking={receiptBooking}
        onClose={() => setReceiptBooking(null)}
      />

      <UrgentRequestModal
        isOpen={urgentModalOpen}
        onClose={() => setUrgentModalOpen(false)}
        categories={categories}
        artisans={artisans}
        onBookingCreated={(newBk) => {
          navigateToView('customer-dashboard');
          setPaymentBooking(newBk);
        }}
      />
    </div>
  );
}
