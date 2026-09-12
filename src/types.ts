export type UserRole = 'customer' | 'artisan' | 'admin' | 'superadmin';

export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';

export type PricingModel = 'fixed' | 'starting_from' | 'hourly' | 'negotiable' | 'quote_required';

export type BookingStatus =
  | 'requested'
  | 'pending_artisan'
  | 'accepted'
  | 'payment_pending'
  | 'paid'
  | 'in_progress'
  | 'completed'
  | 'customer_confirmed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';

export type DisputeStatus = 'open' | 'under_review' | 'resolved_refunded' | 'resolved_released' | 'dismissed';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  isSuspended?: boolean;
  suspendedReason?: string;
  passwordHash?: string;
}

export interface ArtisanProfile {
  id: string;
  userId: string;
  businessName: string;
  categoryId: string;
  categoryName: string;
  skills: string[];
  yearsOfExperience: number;
  description: string;
  pricingModel: PricingModel;
  startingPriceMinor: number; // in kobo (100 kobo = 1 Naira)
  hourlyRateMinor?: number;
  serviceArea: string[]; // Makurdi areas (Wurukum, High Level, etc.)
  address: string;
  workingHours: string;
  verificationStatus: VerificationStatus;
  verificationSubmittedAt?: string;
  verifiedAt?: string;
  adminRejectionReason?: string;
  reviewedByAdminId?: string;
  
  // Strict KYC: NIN Validation & Professional Certification
  ninNumber?: string;
  ninStatus?: 'pending' | 'validated' | 'rejected';
  ninValidatedAt?: string;
  certificationTitle?: string;
  certificationBody?: string;
  certificationNumber?: string;
  certificationDocumentUrl?: string;
  certificationStatus?: 'pending' | 'confirmed' | 'rejected';
  certificationConfirmedAt?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorRelationship?: string;

  rating: number;
  reviewCount: number;
  completedJobsCount: number;
  coverImage?: string;
  portfolioImages: string[];
  bankDetails?: {
    bankName: string;
    accountNumber: string; // masked in UI (e.g. ******1234)
    accountName: string;
    bankCode?: string;
  };
}

export interface ServiceCategory {
  id: string;
  name: string;
  iconName: string;
  description: string;
  artisanCount?: number;
  active: boolean;
}

export interface ServiceListing {
  id: string;
  artisanId: string;
  categoryId: string;
  name: string;
  description: string;
  startingPriceMinor: number;
  pricingType: PricingModel;
  estimatedDuration: string;
  serviceArea: string[];
  images: string[];
  active: boolean;
}

export interface BookingStatusChange {
  status: BookingStatus;
  timestamp: string;
  changedBy: string;
  changedByName: string;
  note?: string;
}

export interface Booking {
  id: string;
  bookingRef: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  artisanId: string;
  artisanUserId: string;
  artisanName: string;
  artisanBusinessName: string;
  serviceId?: string;
  serviceName: string;
  categoryId: string;
  categoryName: string;
  jobDescription: string;
  date: string;
  time: string;
  locationArea: string; // e.g. "Wurukum", "High Level"
  locationAddress: string;
  photos: string[];
  estimatedCostMinor: number;
  commissionRateSnapshot: number; // e.g. 0.05
  platformCommissionMinor: number; // 5% = 0.05 * cost
  artisanNetMinor: number; // 95% = cost - commission
  status: BookingStatus;
  statusHistory: BookingStatusChange[];
  paymentReference?: string;
  paidAt?: string;
  completedAt?: string;
  confirmedAt?: string;
  disputeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  reference: string;
  bookingId: string;
  bookingRef: string;
  customerId: string;
  customerName: string;
  artisanId: string;
  artisanName: string;
  amountMinor: number;
  commissionMinor: number;
  artisanNetMinor: number;
  currency: 'NGN';
  status: 'initialized' | 'successful' | 'failed' | 'refunded';
  settlementStatus: 'held' | 'released_to_wallet' | 'refunded';
  gateway: 'paystack' | 'flutterwave' | 'mock_secured';
  gatewayReference?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Wallet {
  artisanId: string;
  availableBalanceMinor: number;
  pendingBalanceMinor: number;
  totalEarningsMinor: number;
  totalCommissionPaidMinor: number;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'credit_job' | 'debit_payout' | 'commission_deducted' | 'refund_hold';
  amountMinor: number;
  description: string;
  reference: string;
  bookingId?: string;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  payoutRef: string;
  artisanId: string;
  artisanName: string;
  artisanBusinessName: string;
  amountMinor: number;
  bankName: string;
  accountNumberMasked: string;
  accountName: string;
  status: PayoutStatus;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNote?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  artisanId: string;
  rating: number; // 1 - 5
  comment: string;
  images?: string[];
  createdAt: string;
  moderated: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  image?: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  bookingId?: string;
  bookingRef?: string;
  participantIds: string[];
  participants: {
    id: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
  }[];
  lastMessage?: string;
  lastMessageTimestamp?: string;
  unreadCount?: number;
}

export interface Dispute {
  id: string;
  disputeRef: string;
  bookingId: string;
  bookingRef: string;
  initiatorId: string;
  initiatorName: string;
  initiatorRole: UserRole;
  respondentId: string;
  respondentName: string;
  reason: string;
  description: string;
  evidenceImages: string[];
  status: DisputeStatus;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface PlatformSettings {
  platformName: string;
  currency: string;
  commissionPercentage: number; // default 5.0%
  minimumPayoutMinor: number; // e.g. 500000 kobo (5,000 NGN)
  supportEmail: string;
  supportPhone: string;
  autoSettlementDays: number;
  paystackPublicKey?: string;
  paystackSecretKeyConfigured: boolean;
  nigeriaCities: string[];
  makurdiAreas: string[];
  maintenanceMode?: boolean;
  requireNinValidation?: boolean;
  requireCertificationConfirmation?: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'verification' | 'payout' | 'dispute' | 'message' | 'system';
  link?: string;
  read: boolean;
  createdAt: string;
}
