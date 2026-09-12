import React, { useState } from 'react';
import { X, Check, Shield, User, Wrench, ShieldAlert, Sparkles } from 'lucide-react';
import { UserRole } from '../types';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onSelectRole: (role: UserRole, userId?: string) => void;
  onRegisterNew: (data: { fullName: string; email: string; phone: string; role: string }) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onSelectRole,
  onRegisterNew,
}) => {
  const [tab, setTab] = useState<'switch' | 'new'>('switch');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'customer',
  });

  if (!isOpen) return null;

  const demoAccounts = [
    {
      id: 'usr-customer-1',
      name: 'Terver Akume',
      email: 'terver@makurdiartisans.ng',
      role: 'customer' as UserRole,
      badge: 'Customer',
      location: 'Kanshio, Makurdi',
      desc: 'Can search artisans, book services, pay via Paystack escrow, chat, and confirm job completion.',
      icon: User,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'usr-artisan-1',
      name: 'Terna Iorfa (Master Plumber)',
      email: 'terna@makurdiartisans.ng',
      role: 'artisan' as UserRole,
      badge: 'Verified Artisan Pro',
      location: 'Wurukum Market Axis, Makurdi',
      desc: 'Can accept/decline jobs, manage service catalog, track earnings & 5% commission, and withdraw funds.',
      icon: Wrench,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 'usr-admin-1',
      name: 'Aondover Tor',
      email: 'admin@makurdiartisans.ng',
      role: 'admin' as UserRole,
      badge: 'Operations Admin',
      location: 'Makurdi HQ',
      desc: 'Can review artisan verification queue, manage disputes, suspend users, and approve payouts.',
      icon: Shield,
      color: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    {
      id: 'usr-superadmin-1',
      name: 'Dooshima Agbo',
      email: 'superadmin@makurdiartisans.ng',
      role: 'superadmin' as UserRole,
      badge: 'Super Admin',
      location: 'Makurdi HQ',
      desc: 'Complete control: configure 5% commission rate, payment settings, audit trails, and export reports.',
      icon: ShieldAlert,
      color: 'bg-rose-50 text-rose-800 border-rose-200',
    },
  ];

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) return;
    onRegisterNew(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Role & Persona Switcher
            </h3>
            <p className="text-xs text-slate-500">Test the marketplace from any user perspective instantly</p>
          </div>
          <button
            id="close-role-switcher"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-2">
          <button
            onClick={() => setTab('switch')}
            className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-colors ${
              tab === 'switch' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pre-Seeded Demo Accounts
          </button>
          <button
            onClick={() => setTab('new')}
            className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-colors ${
              tab === 'new' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {tab === 'switch' ? (
            <div className="space-y-3">
              {demoAccounts.map((acc) => {
                const IconComponent = acc.icon;
                const isCurrent = currentUserId === acc.id;

                return (
                  <button
                    key={acc.id}
                    id={`demo-user-${acc.role}`}
                    onClick={() => {
                      onSelectRole(acc.role, acc.id);
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${acc.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{acc.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${acc.color}`}>
                            {acc.badge}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          📍 {acc.location} • {acc.email}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{acc.desc}</p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleSubmitNew} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doosuur Iordah"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+234 800 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="customer">Customer (Book & Pay for Services)</option>
                  <option value="artisan">Artisan / Service Provider</option>
                  <option value="admin">Operations Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors shadow-xs"
              >
                Create & Switch to Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
