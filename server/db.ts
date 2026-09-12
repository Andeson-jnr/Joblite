import {
  User,
  ArtisanProfile,
  ServiceCategory,
  ServiceListing,
  Booking,
  PaymentTransaction,
  Wallet,
  WalletTransaction,
  PayoutRequest,
  Review,
  Conversation,
  Message,
  Dispute,
  AdminAuditLog,
  PlatformSettings,
  AppNotification,
} from '../src/types';
import { calculateCommission } from './commission';
import { hashPassword, generateToken } from './auth';
import {
  MAKURDI_AREAS,
  NIGERIAN_CITIES,
  NIGERIAN_BANKS,
  SERVICE_CATEGORIES,
} from '../src/constants';

export {
  MAKURDI_AREAS,
  NIGERIAN_CITIES,
  NIGERIAN_BANKS,
  SERVICE_CATEGORIES,
};

export interface DatabaseState {
  users: User[];
  artisans: ArtisanProfile[];
  services: ServiceListing[];
  categories: ServiceCategory[];
  bookings: Booking[];
  transactions: PaymentTransaction[];
  wallets: Record<string, Wallet>; // keyed by artisanId
  walletTransactions: WalletTransaction[];
  payouts: PayoutRequest[];
  reviews: Review[];
  conversations: Conversation[];
  messages: Message[];
  disputes: Dispute[];
  auditLogs: AdminAuditLog[];
  notifications: AppNotification[];
  settings: PlatformSettings;
}

// Initial In-Memory and State Initialization
function initializeDatabase(): DatabaseState {
  const settings: PlatformSettings = {
    platformName: 'JobLite',
    currency: 'NGN',
    commissionPercentage: 5.0, // 5% Platform Commission
    minimumPayoutMinor: 500000, // ₦5,000 minimum withdrawal
    supportEmail: 'support@joblite.ng',
    supportPhone: '+234 814 800 2345',
    autoSettlementDays: 3,
    paystackPublicKey: 'pk_test_d3a8b4172f3e8b4172f3e8b4172f3e8b4172f3e8',
    paystackSecretKeyConfigured: false,
    nigeriaCities: NIGERIAN_CITIES,
    makurdiAreas: MAKURDI_AREAS,
    maintenanceMode: false,
    requireNinValidation: true,
    requireCertificationConfirmation: true,
  };

  // Pre-seeded demo customer accounts removed until user creates one.
  // Superadmin account configured with secured password.
  // 1 registered artisan applicant awaiting admin review for NIN & Trade certification.
  const users: User[] = [
    {
      id: 'usr-admin-1',
      fullName: 'JobLite Admin',
      email: 'admin@joblite.ng',
      phone: '+234 814 800 2345',
      role: 'superadmin',
      passwordHash: hashPassword('Admin123!'),
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr-artisan-pending',
      fullName: 'Terna Iorfa',
      email: 'terna@iorfaplumbing.ng',
      phone: '+234 806 987 6543',
      role: 'artisan',
      passwordHash: hashPassword('Artisan123!'),
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-09-12T10:00:00Z',
    },
  ];

  const artisans: ArtisanProfile[] = [
    {
      id: 'art-applicant-1',
      userId: 'usr-artisan-pending',
      businessName: 'Iorfa & Sons Master Plumbing Works',
      categoryId: 'cat-plumbing',
      categoryName: 'Plumbing',
      skills: ['PPR & PVC Piping', 'Borehole Submersible Pump Install', 'Bathroom Sanitaries', 'Leak Detection', 'Overhead Tank Connection'],
      yearsOfExperience: 12,
      description: 'Master plumbing contractor in Makurdi specializing in borehole installation, leak-proof piping, and bathroom fixtures.',
      pricingModel: 'starting_from',
      startingPriceMinor: 2500000,
      serviceArea: ['Wurukum', 'High Level', 'Kanshio', 'Judges Quarters'],
      address: 'Plot 14, Modern Market Road, Makurdi',
      workingHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
      verificationStatus: 'pending',
      verificationSubmittedAt: '2026-09-12T10:15:00Z',
      ninNumber: '28491028471',
      ninStatus: 'pending',
      certificationTitle: 'Federal Trade Test Certificate Class I (Plumbing & Pipefitting)',
      certificationBody: 'Federal Ministry of Labour and Employment',
      certificationNumber: 'FML/PLM/2018/00924',
      certificationDocumentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      certificationStatus: 'pending',
      guarantorName: 'Chief Emmanuel Akume',
      guarantorPhone: '+234 803 555 1290',
      guarantorRelationship: 'Community Elder & Property Owner',
      rating: 0,
      reviewCount: 0,
      completedJobsCount: 0,
      coverImage: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=80',
      portfolioImages: [
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
      ],
      bankDetails: {
        bankName: 'First Bank of Nigeria',
        accountNumber: '3049182391',
        accountName: 'Terna Iorfa Enterprise',
        bankCode: '011',
      },
    },
  ];

  const services: ServiceListing[] = [
    {
      id: 'srv-1',
      artisanId: 'art-applicant-1',
      categoryId: 'cat-plumbing',
      name: 'Borehole Submersible Pump Installation & Overhead Tank Plumbing',
      description: 'Complete borehole submersible pump installation with safety control box, non-return valve, pressure test, and PVC/PPR pipe connection to overhead storage tanks.',
      startingPriceMinor: 2500000,
      pricingType: 'starting_from',
      estimatedDuration: '4 - 8 hours',
      serviceArea: ['Wurukum', 'High Level', 'Kanshio', 'Judges Quarters'],
      images: ['https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80'],
      active: true,
    },
  ];

  const bookings: Booking[] = [];
  const transactions: PaymentTransaction[] = [];
  const payouts: PayoutRequest[] = [];
  const reviews: Review[] = [];
  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  const disputes: Dispute[] = [];
  const walletTransactions: WalletTransaction[] = [];

  const wallets: Record<string, Wallet> = {
    'art-applicant-1': {
      artisanId: 'art-applicant-1',
      availableBalanceMinor: 0,
      pendingBalanceMinor: 0,
      totalEarningsMinor: 0,
      totalCommissionPaidMinor: 0,
    },
  };

  const auditLogs: AdminAuditLog[] = [
    {
      id: 'log-init',
      adminId: 'usr-admin-1',
      adminEmail: 'admin@joblite.ng',
      adminName: 'JobLite Admin',
      action: 'Platform Initialized',
      targetType: 'PlatformSettings',
      targetId: 'settings',
      details: 'JobLite launched with strict NIN verification and trade certification confirmation enabled.',
      timestamp: '2026-09-12T10:00:00Z',
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: 'notif-pending-artisan',
      userId: 'usr-admin-1',
      title: 'Artisan Application Awaiting Review',
      message: 'Terna Iorfa (Iorfa & Sons Master Plumbing Works) registered. NIN validation and Trade Test confirmation required.',
      type: 'verification',
      link: '/admin-dashboard',
      read: false,
      createdAt: '2026-09-12T10:15:00Z',
    },
  ];

  return {
    users,
    artisans,
    services,
    categories: SERVICE_CATEGORIES,
    bookings,
    transactions,
    wallets,
    walletTransactions,
    payouts,
    reviews,
    conversations,
    messages,
    disputes,
    auditLogs,
    notifications,
    settings,
  };
}

export class MarketplaceDatabase {
  private static instance: MarketplaceDatabase;
  private state: DatabaseState;
  private sessions: Map<string, { userId: string; expiresAt: number }> = new Map();

  private constructor() {
    this.state = initializeDatabase();
  }

  public static getInstance(): MarketplaceDatabase {
    if (!MarketplaceDatabase.instance) {
      MarketplaceDatabase.instance = new MarketplaceDatabase();
    }
    return MarketplaceDatabase.instance;
  }

  // Session Authentication Management
  public createSession(userId: string): string {
    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days expiration
    this.sessions.set(token, { userId, expiresAt });
    return token;
  }

  public getSessionUser(token: string): User | undefined {
    const session = this.sessions.get(token);
    if (!session) return undefined;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return undefined;
    }
    return this.getUserById(session.userId);
  }

  public deleteSession(token: string): void {
    this.sessions.delete(token);
  }

  // State Accessors
  public getState(): DatabaseState {
    return this.state;
  }

  public getUsers(): User[] {
    return this.state.users;
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User): User {
    this.state.users.push(user);
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    return user;
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.state.users.length;
    this.state.users = this.state.users.filter((u) => u.id !== id);
    this.state.artisans = this.state.artisans.filter((a) => a.userId !== id);
    return this.state.users.length < initialLen;
  }

  // Artisans & Approval Workflow
  public getArtisans(): ArtisanProfile[] {
    return this.state.artisans;
  }

  public getArtisanById(id: string): ArtisanProfile | undefined {
    return this.state.artisans.find((a) => a.id === id);
  }

  public getArtisanByUserId(userId: string): ArtisanProfile | undefined {
    return this.state.artisans.find((a) => a.userId === userId);
  }

  public addArtisan(profile: ArtisanProfile): ArtisanProfile {
    this.state.artisans.push(profile);
    // Initialize wallet
    if (!this.state.wallets[profile.id]) {
      this.state.wallets[profile.id] = {
        artisanId: profile.id,
        availableBalanceMinor: 0,
        pendingBalanceMinor: 0,
        totalEarningsMinor: 0,
        totalCommissionPaidMinor: 0,
      };
    }
    return profile;
  }

  public updateArtisan(id: string, updates: Partial<ArtisanProfile>): ArtisanProfile | undefined {
    const artisan = this.getArtisanById(id);
    if (!artisan) return undefined;
    Object.assign(artisan, updates);
    return artisan;
  }

  // Admin Vetting & Verification Pipeline
  public validateArtisanNin(artisanId: string, adminId: string): ArtisanProfile | undefined {
    const artisan = this.getArtisanById(artisanId);
    if (!artisan) return undefined;
    artisan.ninStatus = 'validated';
    artisan.ninValidatedAt = new Date().toISOString();
    return artisan;
  }

  public confirmArtisanCertification(artisanId: string, adminId: string): ArtisanProfile | undefined {
    const artisan = this.getArtisanById(artisanId);
    if (!artisan) return undefined;
    artisan.certificationStatus = 'confirmed';
    artisan.certificationConfirmedAt = new Date().toISOString();
    return artisan;
  }

  public approveArtisan(artisanId: string, adminId: string): ArtisanProfile | undefined {
    const artisan = this.getArtisanById(artisanId);
    if (!artisan) return undefined;
    artisan.verificationStatus = 'verified';
    artisan.verifiedAt = new Date().toISOString();
    artisan.reviewedByAdminId = adminId;
    artisan.adminRejectionReason = undefined;

    // Send notification to artisan user
    this.addNotification({
      userId: artisan.userId,
      title: 'Artisan Account Approved & Verified',
      message: 'Your JobLite artisan application, NIN, and trade certification have been confirmed. You are now live on JobLite!',
      type: 'verification',
      link: '/artisan-dashboard',
    });

    return artisan;
  }

  public rejectArtisan(artisanId: string, adminId: string, reason: string): ArtisanProfile | undefined {
    const artisan = this.getArtisanById(artisanId);
    if (!artisan) return undefined;
    artisan.verificationStatus = 'rejected';
    artisan.adminRejectionReason = reason;
    artisan.reviewedByAdminId = adminId;

    this.addNotification({
      userId: artisan.userId,
      title: 'Artisan Application Requires Attention',
      message: `Your JobLite artisan application was not approved: ${reason}. Please update your details and re-apply.`,
      type: 'system',
      link: '/artisan-dashboard',
    });

    return artisan;
  }

  // Services
  public getServices(artisanId?: string): ServiceListing[] {
    if (artisanId) {
      return this.state.services.filter((s) => s.artisanId === artisanId);
    }
    return this.state.services;
  }

  public addService(service: ServiceListing): ServiceListing {
    this.state.services.push(service);
    return service;
  }

  public updateService(id: string, updates: Partial<ServiceListing>): ServiceListing | undefined {
    const s = this.state.services.find((item) => item.id === id);
    if (!s) return undefined;
    Object.assign(s, updates);
    return s;
  }

  public deleteService(id: string): boolean {
    const initialLen = this.state.services.length;
    this.state.services = this.state.services.filter((s) => s.id !== id);
    return this.state.services.length < initialLen;
  }

  // Bookings
  public getBookings(filter?: { customerId?: string; artisanId?: string; status?: string }): Booking[] {
    return this.state.bookings.filter((b) => {
      if (filter?.customerId && b.customerId !== filter.customerId) return false;
      if (filter?.artisanId && b.artisanId !== filter.artisanId) return false;
      if (filter?.status && b.status !== filter.status) return false;
      return true;
    });
  }

  public getBookingById(id: string): Booking | undefined {
    return this.state.bookings.find((b) => b.id === id || b.bookingRef === id);
  }

  public addBooking(booking: Booking): Booking {
    this.state.bookings.unshift(booking);

    // If booking is paid, also register in pending wallet balance
    if (booking.status === 'paid') {
      const wallet = this.getOrCreateWallet(booking.artisanId);
      wallet.pendingBalanceMinor += booking.artisanNetMinor;
    }

    return booking;
  }

  public updateBookingStatus(
    bookingId: string,
    newStatus: Booking['status'],
    changedBy: string,
    changedByName: string,
    note?: string
  ): Booking | undefined {
    const booking = this.getBookingById(bookingId);
    if (!booking) return undefined;

    const previousStatus = booking.status;
    booking.status = newStatus;
    booking.updatedAt = new Date().toISOString();

    booking.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      changedBy,
      changedByName,
      note,
    });

    const wallet = this.getOrCreateWallet(booking.artisanId);

    // Escrow & Settlement Transition Logic
    if (newStatus === 'paid' && previousStatus !== 'paid') {
      booking.paidAt = new Date().toISOString();
      wallet.pendingBalanceMinor += booking.artisanNetMinor;
    } else if (newStatus === 'completed') {
      booking.completedAt = new Date().toISOString();
    } else if (newStatus === 'customer_confirmed') {
      booking.confirmedAt = new Date().toISOString();

      // Release money from pending holding to available wallet!
      if (previousStatus === 'paid' || previousStatus === 'completed' || wallet.pendingBalanceMinor >= booking.artisanNetMinor) {
        wallet.pendingBalanceMinor = Math.max(0, wallet.pendingBalanceMinor - booking.artisanNetMinor);
      }
      wallet.availableBalanceMinor += booking.artisanNetMinor;
      wallet.totalEarningsMinor += booking.estimatedCostMinor;
      wallet.totalCommissionPaidMinor += booking.platformCommissionMinor;

      // Register wallet transaction
      this.state.walletTransactions.unshift({
        id: `wtx-${Date.now()}`,
        walletId: booking.artisanId,
        type: 'credit_job',
        amountMinor: booking.artisanNetMinor,
        description: `Settlement release for booking ${booking.bookingRef} (Gross: ₦${booking.estimatedCostMinor / 100}, 5% Commission: ₦${booking.platformCommissionMinor / 100})`,
        reference: booking.paymentReference || booking.bookingRef,
        bookingId: booking.id,
        createdAt: new Date().toISOString(),
      });

      // Update artisan completed jobs count
      const artisan = this.getArtisanById(booking.artisanId);
      if (artisan) {
        artisan.completedJobsCount += 1;
      }
    } else if (newStatus === 'refunded') {
      // If refunded, remove from pending balance if it was held
      if (wallet.pendingBalanceMinor >= booking.artisanNetMinor) {
        wallet.pendingBalanceMinor -= booking.artisanNetMinor;
      }
    }

    return booking;
  }

  // Wallets & Payouts
  public getOrCreateWallet(artisanId: string): Wallet {
    if (!this.state.wallets[artisanId]) {
      this.state.wallets[artisanId] = {
        artisanId,
        availableBalanceMinor: 0,
        pendingBalanceMinor: 0,
        totalEarningsMinor: 0,
        totalCommissionPaidMinor: 0,
      };
    }
    return this.state.wallets[artisanId];
  }

  public getWalletTransactions(artisanId?: string): WalletTransaction[] {
    if (artisanId) {
      return this.state.walletTransactions.filter((tx) => tx.walletId === artisanId);
    }
    return this.state.walletTransactions;
  }

  public requestPayout(
    artisanId: string,
    amountMinor: number,
    bankDetails: { bankName: string; accountNumber: string; accountName: string }
  ): { success: boolean; error?: string; payout?: PayoutRequest } {
    const wallet = this.getOrCreateWallet(artisanId);
    const minPayout = this.state.settings.minimumPayoutMinor;

    if (amountMinor < minPayout) {
      return { success: false, error: `Minimum withdrawal amount is ₦${minPayout / 100}` };
    }

    if (wallet.availableBalanceMinor < amountMinor) {
      return { success: false, error: 'Insufficient available wallet balance' };
    }

    const artisan = this.getArtisanById(artisanId);
    const masked = '******' + bankDetails.accountNumber.slice(-4);

    // Deduct immediately from available
    wallet.availableBalanceMinor -= amountMinor;

    const payout: PayoutRequest = {
      id: `po-${Date.now()}`,
      payoutRef: `PO_MKD_${Math.floor(100000 + Math.random() * 900000)}`,
      artisanId,
      artisanName: artisan?.businessName || 'Artisan',
      artisanBusinessName: artisan?.businessName || 'Artisan',
      amountMinor,
      bankName: bankDetails.bankName,
      accountNumberMasked: masked,
      accountName: bankDetails.accountName,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.state.payouts.unshift(payout);

    // Record wallet transaction
    this.state.walletTransactions.unshift({
      id: `wtx-${Date.now()}`,
      walletId: artisanId,
      type: 'debit_payout',
      amountMinor,
      description: `Withdrawal request to ${bankDetails.bankName} (${masked})`,
      reference: payout.payoutRef,
      createdAt: new Date().toISOString(),
    });

    return { success: true, payout };
  }

  public processPayout(payoutId: string, status: 'paid' | 'failed' | 'cancelled', adminId: string, adminNote?: string): PayoutRequest | undefined {
    const payout = this.state.payouts.find((p) => p.id === payoutId);
    if (!payout) return undefined;

    payout.status = status;
    payout.processedAt = new Date().toISOString();
    payout.processedBy = adminId;
    payout.adminNote = adminNote;

    // If failed or cancelled, refund balance to wallet
    if (status === 'failed' || status === 'cancelled') {
      const wallet = this.getOrCreateWallet(payout.artisanId);
      wallet.availableBalanceMinor += payout.amountMinor;

      this.state.walletTransactions.unshift({
        id: `wtx-${Date.now()}`,
        walletId: payout.artisanId,
        type: 'credit_job',
        amountMinor: payout.amountMinor,
        description: `Refund for cancelled/failed payout ${payout.payoutRef}`,
        reference: `REV_${payout.payoutRef}`,
        createdAt: new Date().toISOString(),
      });
    }

    return payout;
  }

  public getPayouts(artisanId?: string): PayoutRequest[] {
    if (artisanId) {
      return this.state.payouts.filter((p) => p.artisanId === artisanId);
    }
    return this.state.payouts;
  }

  // Transactions
  public addTransaction(tx: PaymentTransaction): PaymentTransaction {
    this.state.transactions.unshift(tx);
    return tx;
  }

  public getTransactions(artisanId?: string, customerId?: string): PaymentTransaction[] {
    return this.state.transactions.filter((t) => {
      if (artisanId && t.artisanId !== artisanId) return false;
      if (customerId && t.customerId !== customerId) return false;
      return true;
    });
  }

  // Reviews
  public addReview(review: Review): Review {
    // Check duplicate
    const existing = this.state.reviews.find((r) => r.bookingId === review.bookingId);
    if (existing) {
      throw new Error('Review already submitted for this booking');
    }

    this.state.reviews.unshift(review);

    // Recompute artisan rating
    const artisanReviews = this.state.reviews.filter((r) => r.artisanId === review.artisanId);
    const artisan = this.getArtisanById(review.artisanId);
    if (artisan && artisanReviews.length > 0) {
      const sum = artisanReviews.reduce((acc, r) => acc + r.rating, 0);
      artisan.rating = Number((sum / artisanReviews.length).toFixed(1));
      artisan.reviewCount = artisanReviews.length;
    }

    return review;
  }

  public getReviews(artisanId?: string): Review[] {
    if (artisanId) {
      return this.state.reviews.filter((r) => r.artisanId === artisanId);
    }
    return this.state.reviews;
  }

  // Messaging
  public getConversations(userId: string): Conversation[] {
    return this.state.conversations.filter((c) => c.participantIds.includes(userId));
  }

  public getOrCreateConversation(bookingId: string, participantIds: string[], participants: Conversation['participants']): Conversation {
    let conv = this.state.conversations.find((c) => c.bookingId === bookingId);
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        bookingId,
        participantIds,
        participants,
        unreadCount: 0,
      };
      this.state.conversations.unshift(conv);
    }
    return conv;
  }

  public getMessages(conversationId: string): Message[] {
    return this.state.messages.filter((m) => m.conversationId === conversationId);
  }

  public addMessage(msg: Message): Message {
    this.state.messages.push(msg);
    const conv = this.state.conversations.find((c) => c.id === msg.conversationId);
    if (conv) {
      conv.lastMessage = msg.text;
      conv.lastMessageTimestamp = msg.createdAt;
    }
    return msg;
  }

  // Disputes
  public getDisputes(): Dispute[] {
    return this.state.disputes;
  }

  public addDispute(dispute: Dispute): Dispute {
    this.state.disputes.unshift(dispute);
    const booking = this.getBookingById(dispute.bookingId);
    if (booking) {
      booking.status = 'disputed';
      booking.disputeId = dispute.id;
      booking.statusHistory.push({
        status: 'disputed',
        timestamp: new Date().toISOString(),
        changedBy: dispute.initiatorId,
        changedByName: dispute.initiatorName,
        note: `Dispute opened: ${dispute.reason}`,
      });
    }
    return dispute;
  }

  public resolveDispute(
    disputeId: string,
    status: 'resolved_refunded' | 'resolved_released' | 'dismissed',
    notes: string,
    adminId: string
  ): Dispute | undefined {
    const dispute = this.state.disputes.find((d) => d.id === disputeId);
    if (!dispute) return undefined;

    dispute.status = status;
    dispute.resolutionNotes = notes;
    dispute.resolvedBy = adminId;
    dispute.resolvedAt = new Date().toISOString();

    const booking = this.getBookingById(dispute.bookingId);
    if (booking) {
      if (status === 'resolved_refunded') {
        this.updateBookingStatus(booking.id, 'refunded', adminId, 'Administrator Resolution', `Dispute resolved: Refunded to customer. Note: ${notes}`);
      } else if (status === 'resolved_released') {
        this.updateBookingStatus(booking.id, 'customer_confirmed', adminId, 'Administrator Resolution', `Dispute resolved: Settlement released to artisan. Note: ${notes}`);
      }
    }

    return dispute;
  }

  // Audit Logs
  public addAuditLog(log: Omit<AdminAuditLog, 'id' | 'timestamp'>): AdminAuditLog {
    const fullLog: AdminAuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(fullLog);
    return fullLog;
  }

  public getAuditLogs(): AdminAuditLog[] {
    return this.state.auditLogs;
  }

  // Notifications
  public addNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
    const fullNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.state.notifications.unshift(fullNotif);
    return fullNotif;
  }

  public getNotifications(userId: string): AppNotification[] {
    return this.state.notifications.filter((n) => n.userId === userId);
  }

  public markNotificationRead(id: string): void {
    const n = this.state.notifications.find((item) => item.id === id);
    if (n) n.read = true;
  }

  // Settings
  public getSettings(): PlatformSettings {
    return this.state.settings;
  }

  public updateSettings(updates: Partial<PlatformSettings>): PlatformSettings {
    Object.assign(this.state.settings, updates);
    return this.state.settings;
  }
}

export const db = MarketplaceDatabase.getInstance();
