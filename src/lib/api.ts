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
} from '../types';

const TOKEN_KEY = 'joblite_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginUser(credentials: { email: string; password: string }): Promise<{
  success: boolean;
  token?: string;
  user?: User;
  artisan?: ArtisanProfile | null;
  message?: string;
}> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (data.success && data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function registerUser(data: {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  password?: string;
  category?: string;
  businessName?: string;
  yearsOfExperience?: number;
  serviceAreas?: string[];
  startingPrice?: number;
  ninNumber?: string;
  certificationTitle?: string;
  certificationBody?: string;
  certificationNumber?: string;
  guarantorName?: string;
  guarantorPhone?: string;
}): Promise<{
  success: boolean;
  token?: string;
  user?: User;
  artisan?: ArtisanProfile | null;
  message?: string;
}> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (result.success && result.token) {
    setAuthToken(result.token);
  }
  return result;
}

export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    clearAuthToken();
  }
  return { success: true };
}

export async function fetchMe(userId?: string): Promise<{ user: User | null; artisan: ArtisanProfile | null }> {
  const headers: Record<string, string> = { ...getAuthHeaders() };
  if (userId) headers['x-user-id'] = userId;
  const res = await fetch('/api/auth/me', { headers });
  return res.json();
}

export async function switchDemoUser(role: string, userId?: string) {
  const res = await fetch('/api/auth/switch-demo', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role, userId }),
  });
  const data = await res.json();
  if (data.success && data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function fetchCategories(): Promise<{ categories: ServiceCategory[] }> {
  const res = await fetch('/api/categories');
  return res.json();
}

export async function fetchArtisans(params?: {
  q?: string;
  category?: string;
  location?: string;
  minRating?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
}): Promise<{ artisans: ArtisanProfile[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.category) query.set('category', params.category);
  if (params?.location) query.set('location', params.location);
  if (params?.minRating) query.set('minRating', String(params.minRating));
  if (params?.maxPrice) query.set('maxPrice', String(params.maxPrice));
  if (params?.verifiedOnly) query.set('verifiedOnly', 'true');

  const res = await fetch(`/api/artisans?${query.toString()}`);
  return res.json();
}

export async function fetchArtisanById(id: string): Promise<{ artisan: ArtisanProfile; services: ServiceListing[]; reviews: Review[] }> {
  const res = await fetch(`/api/artisans/${id}`);
  return res.json();
}

export async function onboardArtisan(data: any) {
  const res = await fetch('/api/artisans/onboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateArtisanVerification(artisanId: string, status: string, note?: string) {
  const res = await fetch(`/api/artisans/${artisanId}/verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
  });
  return res.json();
}

export async function fetchServices(artisanId?: string): Promise<{ services: ServiceListing[] }> {
  const url = artisanId ? `/api/services?artisanId=${artisanId}` : '/api/services';
  const res = await fetch(url);
  return res.json();
}

export async function createService(serviceData: any) {
  const res = await fetch('/api/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serviceData),
  });
  return res.json();
}

export async function deleteService(serviceId: string) {
  const res = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchBookings(params?: { customerId?: string; artisanId?: string; status?: string }): Promise<{ bookings: Booking[] }> {
  const query = new URLSearchParams();
  if (params?.customerId) query.set('customerId', params.customerId);
  if (params?.artisanId) query.set('artisanId', params.artisanId);
  if (params?.status) query.set('status', params.status);

  const res = await fetch(`/api/bookings?${query.toString()}`);
  return res.json();
}

export async function fetchBookingById(id: string): Promise<{ booking: Booking }> {
  const res = await fetch(`/api/bookings/${id}`);
  return res.json();
}

export async function createBooking(data: any) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateBookingStatus(bookingId: string, status: string, note?: string) {
  const res = await fetch(`/api/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
  });
  return res.json();
}

export async function initializePayment(bookingId: string, amountMinor?: number) {
  const res = await fetch('/api/payments/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, amountMinor }),
  });
  return res.json();
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`/api/payments/verify/${reference}`);
  return res.json();
}

export async function fetchWallet(artisanId?: string): Promise<{
  wallet: Wallet;
  transactions: WalletTransaction[];
  payouts: PayoutRequest[];
  bankDetails?: any;
}> {
  const url = artisanId ? `/api/wallet?artisanId=${artisanId}` : '/api/wallet';
  const res = await fetch(url);
  return res.json();
}

export async function requestPayout(data: {
  artisanId: string;
  amountMinor: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}) {
  const res = await fetch('/api/wallet/payout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchAdminPayouts(): Promise<{ payouts: PayoutRequest[] }> {
  const res = await fetch('/api/admin/payouts');
  return res.json();
}

export async function processPayout(payoutId: string, status: 'paid' | 'failed' | 'cancelled', note?: string) {
  const res = await fetch(`/api/admin/payouts/${payoutId}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
  });
  return res.json();
}

export async function fetchReviews(artisanId?: string): Promise<{ reviews: Review[] }> {
  const url = artisanId ? `/api/reviews?artisanId=${artisanId}` : '/api/reviews';
  const res = await fetch(url);
  return res.json();
}

export async function submitReview(data: { bookingId: string; rating: number; comment: string }) {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchConversations(): Promise<{ conversations: Conversation[] }> {
  const res = await fetch('/api/messages/conversations');
  return res.json();
}

export async function fetchMessages(conversationId: string): Promise<{ messages: Message[] }> {
  const res = await fetch(`/api/messages/conversations/${conversationId}/messages`);
  return res.json();
}

export async function sendMessage(conversationId: string, text: string, image?: string) {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, text, image }),
  });
  return res.json();
}

export async function fetchDisputes(): Promise<{ disputes: Dispute[] }> {
  const res = await fetch('/api/disputes');
  return res.json();
}

export async function submitDispute(data: {
  bookingId: string;
  reason: string;
  description: string;
  evidenceImages?: string[];
}) {
  const res = await fetch('/api/disputes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function resolveDispute(disputeId: string, status: string, notes: string) {
  const res = await fetch(`/api/disputes/${disputeId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  return res.json();
}

export async function fetchAdminMetrics(): Promise<any> {
  const res = await fetch('/api/admin/metrics');
  return res.json();
}

export async function fetchAdminUsers(): Promise<{ users: User[] }> {
  const res = await fetch('/api/admin/users');
  return res.json();
}

export async function validateArtisanNin(artisanId: string): Promise<{ success: boolean; artisan?: ArtisanProfile; message?: string }> {
  const res = await fetch(`/api/admin/artisans/${artisanId}/validate-nin`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function confirmArtisanCertification(artisanId: string): Promise<{ success: boolean; artisan?: ArtisanProfile; message?: string }> {
  const res = await fetch(`/api/admin/artisans/${artisanId}/confirm-certification`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function approveArtisan(artisanId: string): Promise<{ success: boolean; artisan?: ArtisanProfile; message?: string }> {
  const res = await fetch(`/api/admin/artisans/${artisanId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function rejectArtisan(artisanId: string, reason: string): Promise<{ success: boolean; artisan?: ArtisanProfile; message?: string }> {
  const res = await fetch(`/api/admin/artisans/${artisanId}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export async function createAdminUser(data: { fullName: string; email: string; phone: string; role: string; password?: string }) {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function changeUserRole(userId: string, role: string) {
  const res = await fetch(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });
  return res.json();
}

export async function deleteAdminUser(userId: string) {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function suspendUser(userId: string, isSuspended: boolean, reason?: string) {
  const res = await fetch(`/api/admin/users/${userId}/suspend`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ isSuspended, reason }),
  });
  return res.json();
}

export async function fetchAuditLogs(): Promise<{ logs: AdminAuditLog[] }> {
  const res = await fetch('/api/admin/audit-logs', { headers: getAuthHeaders() });
  return res.json();
}

export async function fetchSettings(): Promise<{ settings: PlatformSettings }> {
  const res = await fetch('/api/settings', { headers: getAuthHeaders() });
  return res.json();
}

export async function updateSettings(settings: Partial<PlatformSettings>) {
  const res = await fetch('/api/settings', {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  return res.json();
}

export async function fetchNotifications(userId?: string): Promise<{ notifications: AppNotification[] }> {
  const url = userId ? `/api/notifications?userId=${userId}` : '/api/notifications';
  const res = await fetch(url, { headers: getAuthHeaders() });
  return res.json();
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers: getAuthHeaders() });
  return res.json();
}
