import React, { useState } from 'react';
import {
  Wrench,
  MapPin,
  Bell,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  Briefcase,
  Layers,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { User, ArtisanProfile, AppNotification } from '../types';

interface NavbarProps {
  currentUser: User | null;
  currentArtisan: ArtisanProfile | null;
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenRoleSwitcher: () => void;
  onOpenArtisanOnboarding: () => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentArtisan,
  activeView,
  onNavigate,
  onOpenRoleSwitcher,
  onOpenArtisanOnboarding,
  notifications,
  onOpenNotifications,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'artisan':
        return { label: 'Artisan Pro', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'admin':
        return { label: 'Admin', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'superadmin':
        return { label: 'Super Admin', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
      default:
        return { label: 'Customer', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
  };

  const badge = getRoleBadge(currentUser?.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      {/* Top Banner: JobLite Service Protection Guarantee */}
      <div className="bg-emerald-800 text-emerald-50 px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 inline" />
        <span>
          JobLite Escrow Protection: Artisans are only paid after you inspect and confirm 100% satisfactory job completion.
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Location */}
          <div className="flex items-center gap-4">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-800 transition-colors">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-lg text-slate-900 leading-tight flex items-center gap-1.5">
                  JobLite
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Makurdi
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">Verified Jobs & Services</div>
              </div>
            </button>

            {/* Location Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Makurdi Metropolis</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              id="nav-home"
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                activeView === 'home' ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Find Artisans
            </button>

            <button
              id="nav-categories"
              onClick={() => onNavigate('categories')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                activeView === 'categories' ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Categories
            </button>

            {currentUser?.role === 'customer' && (
              <button
                id="nav-customer-dashboard"
                onClick={() => onNavigate('customer-dashboard')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'customer-dashboard' ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                My Bookings
              </button>
            )}

            {currentUser?.role === 'artisan' && (
              <button
                id="nav-artisan-dashboard"
                onClick={() => onNavigate('artisan-dashboard')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'artisan-dashboard' ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Artisan Workspace
              </button>
            )}

            {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
              <button
                id="nav-admin-portal"
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  activeView === 'admin-dashboard' ? 'text-purple-700 bg-purple-50 font-semibold' : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Admin Control
              </button>
            )}
          </nav>

          {/* Right Action Controls: Role Switcher & Onboarding */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell */}
            <button
              id="notification-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Authentication & Profile Pill */}
            <button
              id="role-switcher-btn"
              onClick={onOpenRoleSwitcher}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-700 text-xs font-semibold">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
                  {currentUser ? currentUser.fullName : 'Sign In / Register'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <span className={`px-1 py-0.2 rounded border text-[9px] font-semibold ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <span>{currentUser ? 'Account' : 'Auth'}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Register as Artisan CTA */}
            {currentUser?.role !== 'artisan' && (
              <button
                id="btn-register-artisan"
                onClick={onOpenArtisanOnboarding}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Join as Artisan</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 mb-3">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-slate-700">Serving all Makurdi: Wurukum, High Level, North Bank, Kanshio & more</span>
          </div>

          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Find Artisans
          </button>

          <button
            onClick={() => {
              onNavigate('categories');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            Service Categories
          </button>

          <button
            onClick={() => {
              onNavigate('customer-dashboard');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
          >
            <UserIcon className="w-4 h-4 text-emerald-600" />
            Customer Bookings
          </button>

          <button
            onClick={() => {
              onNavigate('artisan-dashboard');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
          >
            <Wrench className="w-4 h-4 text-emerald-600" />
            Artisan Dashboard & Wallet
          </button>

          <button
            onClick={() => {
              onNavigate('admin-dashboard');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            Admin Control Panel
          </button>

          <div className="pt-2">
            <button
              onClick={() => {
                onOpenArtisanOnboarding();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Register as an Artisan in Makurdi
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
