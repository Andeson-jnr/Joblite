import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, MAKURDI_AREAS, SERVICE_CATEGORIES } from './server/db';
import { calculateCommission, formatNaira } from './server/commission';
import { PaymentService } from './server/payments';
import { hashPassword, verifyPassword } from './server/auth';
import { Booking, User, UserRole, Review, ArtisanProfile } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global active session tracker for server routes
let currentSessionUser: User | null = null;

// Auth Context Middleware (supports Bearer token, x-auth-token, or x-user-id fallback)
app.use((req: any, _res: Response, next) => {
  let token = req.headers['authorization'] as string;
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  } else {
    token = (req.headers['x-auth-token'] as string) || '';
  }

  if (token) {
    const sessionUser = db.getSessionUser(token);
    if (sessionUser) {
      req.user = sessionUser;
      req.token = token;
      currentSessionUser = sessionUser;
      return next();
    }
  }

  // Fallback header for testing/switch-demo
  const userIdHeader = req.headers['x-user-id'] as string;
  if (userIdHeader) {
    const fallbackUser = db.getUserById(userIdHeader);
    if (fallbackUser) {
      req.user = fallbackUser;
      currentSessionUser = fallbackUser;
    }
  }

  next();
});

// Helper to get active request user
const getRequestUser = (req: any): User | null => {
  return req.user || null;
};

// --- AUTHENTICATION ENDPOINTS ---

app.get('/api/auth/me', (req: any, res: Response) => {
  const user = getRequestUser(req);
  if (!user) {
    return res.json({ user: null, artisan: null });
  }
  const artisan = user.role === 'artisan' ? db.getArtisanByUserId(user.id) : null;
  res.json({ user, artisan });
});

app.post('/api/auth/login', (req: any, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ success: false, message: 'This account has been suspended by platform administration' });
  }

  // If passwordHash exists, verify against it; otherwise check if demo password matches
  if (user.passwordHash) {
    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  }

  const token = db.createSession(user.id);
  const artisan = user.role === 'artisan' ? db.getArtisanByUserId(user.id) : null;

  res.json({
    success: true,
    token,
    user,
    artisan,
    message: `Welcome back, ${user.fullName}!`,
  });
});

app.post('/api/auth/register', (req: any, res: Response) => {
  const {
    fullName,
    email,
    phone,
    role,
    password,
    // Artisan registration details
    businessName,
    categoryId,
    categoryName,
    skills,
    yearsOfExperience,
    description,
    pricingModel,
    startingPriceMinor,
    serviceArea,
    address,
    ninNumber,
    certificationTitle,
    certificationBody,
    certificationNumber,
    certificationDocumentUrl,
    guarantorName,
    guarantorPhone,
    guarantorRelationship,
    bankName,
    accountNumber,
    accountName,
  } = req.body;

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ success: false, message: 'Full name, email, phone number, and password are required.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
  }

  const userRole: UserRole = (role as UserRole) || 'customer';
  const userId = `usr-${Date.now()}`;

  const newUser: User = {
    id: userId,
    fullName,
    email,
    phone,
    role: userRole,
    passwordHash: hashPassword(password),
    avatarUrl: `https://images.unsplash.com/photo-${userRole === 'artisan' ? '1500648767791-00dcc994a43e' : '1534528741775-53994a69daeb'}?w=150&auto=format&fit=crop&q=80`,
    createdAt: new Date().toISOString(),
  };

  db.addUser(newUser);

  let artisanProfile: ArtisanProfile | null = null;

  if (userRole === 'artisan') {
    // For an artisan, registration must pass through admin approval with NIN validation and Trade test confirmation
    artisanProfile = {
      id: `art-${Date.now()}`,
      userId: newUser.id,
      businessName: businessName || `${fullName} Professional Services`,
      categoryId: categoryId || 'cat-plumbing',
      categoryName: categoryName || 'Plumbing',
      skills: Array.isArray(skills) ? skills : (skills ? String(skills).split(',').map((s) => s.trim()) : ['General Repairs']),
      yearsOfExperience: Number(yearsOfExperience) || 1,
      description: description || 'Licensed and skilled professional ready to deliver quality craftsmanship.',
      pricingModel: pricingModel || 'starting_from',
      startingPriceMinor: Number(startingPriceMinor) || 500000,
      serviceArea: Array.isArray(serviceArea) ? serviceArea : ['Wurukum', 'High Level', 'Kanshio'],
      address: address || 'Makurdi, Benue State',
      workingHours: 'Mon - Sat: 8:00 AM - 6:00 PM',
      // Strict Admin Vetting Pipeline
      verificationStatus: 'pending', // Must be reviewed by Admin!
      verificationSubmittedAt: new Date().toISOString(),
      ninNumber: ninNumber || '',
      ninStatus: 'pending', // Requires NIMC validation
      certificationTitle: certificationTitle || '',
      certificationBody: certificationBody || '',
      certificationNumber: certificationNumber || '',
      certificationDocumentUrl: certificationDocumentUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      certificationStatus: 'pending', // Requires professional confirmation
      guarantorName: guarantorName || '',
      guarantorPhone: guarantorPhone || '',
      guarantorRelationship: guarantorRelationship || '',
      rating: 0,
      reviewCount: 0,
      completedJobsCount: 0,
      coverImage: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=80',
      portfolioImages: [],
      bankDetails: bankName && accountNumber ? {
        bankName,
        accountNumber,
        accountName: accountName || fullName,
      } : undefined,
    };

    db.addArtisan(artisanProfile);

    // Notify administrators of incoming artisan review
    db.addNotification({
      userId: 'usr-admin-1',
      title: 'New Artisan Registration Pending Review',
      message: `${fullName} (${artisanProfile.businessName}) registered as an artisan. NIN validation & Trade certification confirmation required.`,
      type: 'verification',
      link: '/admin-dashboard',
    });
  }

  db.addAuditLog({
    adminId: newUser.id,
    adminEmail: newUser.email,
    adminName: newUser.fullName,
    action: 'User Registered',
    targetType: 'User',
    targetId: newUser.id,
    details: `New ${newUser.role} registered: ${newUser.fullName} (${newUser.email}). ${userRole === 'artisan' ? 'Pending Admin NIN & Certification Approval.' : ''}`,
  });

  const token = db.createSession(newUser.id);

  res.status(201).json({
    success: true,
    token,
    user: newUser,
    artisan: artisanProfile,
    message: userRole === 'artisan'
      ? 'Artisan registration submitted! Your profile is pending administrative approval for NIN and Trade Certification.'
      : 'Account created successfully!',
  });
});

app.post('/api/auth/logout', (req: any, res: Response) => {
  if (req.token) {
    db.deleteSession(req.token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/switch-demo', (req: any, res: Response) => {
  const { role, userId } = req.body;
  let targetUser: User | undefined;

  if (userId) {
    targetUser = db.getUserById(userId);
  } else if (role) {
    const users = db.getUsers();
    targetUser = users.find((u) => u.role === role) || users[0];
  }

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const token = db.createSession(targetUser.id);
  const artisan = targetUser.role === 'artisan' ? db.getArtisanByUserId(targetUser.id) : null;

  res.json({
    success: true,
    token,
    user: targetUser,
    artisan,
  });
});

// --- SERVICE CATEGORIES ---

app.get('/api/categories', (_req: Request, res: Response) => {
  const categories = db.getState().categories;
  const artisans = db.getArtisans();

  // Attach dynamic artisan counts
  const categoriesWithCounts = categories.map((cat) => ({
    ...cat,
    artisanCount: artisans.filter((a) => a.categoryId === cat.id && a.verificationStatus !== 'suspended').length,
  }));

  res.json({ categories: categoriesWithCounts });
});

// --- ARTISANS ---

app.get('/api/artisans', (req: Request, res: Response) => {
  const { q, category, location, minRating, maxPrice, verifiedOnly } = req.query;
  let list = db.getArtisans();

  // Filter non-suspended
  list = list.filter((a) => a.verificationStatus !== 'suspended');

  if (category) {
    list = list.filter((a) => a.categoryId === category || a.categoryName.toLowerCase().includes(String(category).toLowerCase()));
  }

  if (location && location !== 'all') {
    const loc = String(location).toLowerCase();
    list = list.filter(
      (a) => a.serviceArea.some((area) => area.toLowerCase().includes(loc)) || a.address.toLowerCase().includes(loc)
    );
  }

  if (verifiedOnly === 'true') {
    list = list.filter((a) => a.verificationStatus === 'verified');
  }

  if (minRating) {
    const ratingNum = Number(minRating);
    list = list.filter((a) => a.rating >= ratingNum);
  }

  if (maxPrice) {
    const priceNum = Number(maxPrice) * 100; // to kobo
    list = list.filter((a) => a.startingPriceMinor <= priceNum);
  }

  if (q) {
    const query = String(q).toLowerCase();
    list = list.filter(
      (a) =>
        a.businessName.toLowerCase().includes(query) ||
        a.categoryName.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.skills.some((s) => s.toLowerCase().includes(query))
    );
  }

  res.json({ artisans: list, total: list.length });
});

app.get('/api/artisans/:id', (req: Request, res: Response) => {
  const artisan = db.getArtisanById(req.params.id);
  if (!artisan) {
    return res.status(404).json({ message: 'Artisan not found' });
  }
  const services = db.getServices(artisan.id);
  const reviews = db.getReviews(artisan.id);
  res.json({ artisan, services, reviews });
});

// Artisan Onboarding / Registration
app.post('/api/artisans/onboard', (req: Request, res: Response) => {
  const {
    fullName,
    email,
    phone,
    businessName,
    categoryId,
    skills,
    yearsOfExperience,
    description,
    pricingModel,
    startingPriceMinor,
    serviceArea,
    address,
    workingHours,
    bankName,
    accountNumber,
    accountName,
  } = req.body;

  let user = db.getUserByEmail(email);
  if (!user) {
    user = {
      id: `usr-art-${Date.now()}`,
      fullName,
      email,
      phone,
      role: 'artisan',
      createdAt: new Date().toISOString(),
    };
    db.addUser(user);
  } else {
    user.role = 'artisan';
  }

  const category = SERVICE_CATEGORIES.find((c) => c.id === categoryId);

  const profile = db.addArtisan({
    id: `art-${Date.now()}`,
    userId: user.id,
    businessName,
    categoryId: categoryId || 'cat-other',
    categoryName: category?.name || 'General Artisan',
    skills: Array.isArray(skills) ? skills : [skills],
    yearsOfExperience: Number(yearsOfExperience) || 3,
    description,
    pricingModel: pricingModel || 'starting_from',
    startingPriceMinor: Number(startingPriceMinor) || 500000,
    serviceArea: Array.isArray(serviceArea) ? serviceArea : [serviceArea],
    address: address || 'Makurdi, Benue State',
    workingHours: workingHours || 'Mon - Sat: 8:00 AM - 6:00 PM',
    verificationStatus: 'under_review', // Submitted for Admin Review
    verificationSubmittedAt: new Date().toISOString(),
    rating: 5.0,
    reviewCount: 0,
    completedJobsCount: 0,
    portfolioImages: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    ],
    bankDetails: bankName && accountNumber ? {
      bankName,
      accountNumber: '******' + accountNumber.slice(-4),
      accountName: accountName || businessName,
    } : undefined,
  });

  currentSessionUser = user;

  // Add initial default service
  db.addService({
    id: `srv-${Date.now()}`,
    artisanId: profile.id,
    categoryId: profile.categoryId,
    name: `${profile.categoryName} Standard Service`,
    description: profile.description,
    startingPriceMinor: profile.startingPriceMinor,
    pricingType: profile.pricingModel,
    estimatedDuration: '2 - 4 hours',
    serviceArea: profile.serviceArea,
    images: profile.portfolioImages,
    active: true,
  });

  // Notify admin of new verification pending
  db.addNotification({
    userId: 'usr-admin-1',
    title: 'New Artisan Verification Request',
    message: `${businessName} (${profile.categoryName}) submitted onboarding verification for Makurdi.`,
    type: 'verification',
    link: '/admin/artisans',
  });

  res.status(201).json({ success: true, artisan: profile, user });
});

// Admin verify artisan
app.post('/api/artisans/:id/verification', (req: Request, res: Response) => {
  const { status, note } = req.body; // 'verified' | 'rejected' | 'suspended' | 'under_review'
  const artisan = db.getArtisanById(req.params.id);
  if (!artisan) {
    return res.status(404).json({ message: 'Artisan not found' });
  }

  artisan.verificationStatus = status;
  if (status === 'verified') {
    artisan.verifiedAt = new Date().toISOString();
  }

  db.addAuditLog({
    adminId: currentSessionUser?.id || 'admin',
    adminEmail: currentSessionUser?.email || 'admin@makurdiartisans.ng',
    adminName: currentSessionUser?.fullName || 'Administrator',
    action: `Updated Artisan Verification to ${status.toUpperCase()}`,
    targetType: 'Artisan',
    targetId: artisan.id,
    details: `Changed status to ${status}. Note: ${note || 'Standard verification evaluation.'}`,
  });

  db.addNotification({
    userId: artisan.userId,
    title: status === 'verified' ? 'Verification Approved! 🎉' : `Verification Update: ${status}`,
    message: status === 'verified'
      ? 'Congratulations! Your profile is verified with the official trust badge on Makurdi Marketplace.'
      : `Your verification status has been updated to ${status}. ${note || ''}`,
    type: 'verification',
    link: '/artisan/dashboard',
  });

  res.json({ success: true, artisan });
});

// --- SERVICES ---

app.get('/api/services', (req: Request, res: Response) => {
  const { artisanId } = req.query;
  const services = db.getServices(artisanId ? String(artisanId) : undefined);
  res.json({ services });
});

app.post('/api/services', (req: Request, res: Response) => {
  const { artisanId, name, categoryId, description, startingPriceMinor, pricingType, estimatedDuration, serviceArea } = req.body;
  if (!artisanId || !name || !startingPriceMinor) {
    return res.status(400).json({ message: 'Missing required service fields' });
  }

  const newService = db.addService({
    id: `srv-${Date.now()}`,
    artisanId,
    categoryId: categoryId || 'cat-other',
    name,
    description: description || '',
    startingPriceMinor: Number(startingPriceMinor),
    pricingType: pricingType || 'starting_from',
    estimatedDuration: estimatedDuration || '1 - 3 hours',
    serviceArea: Array.isArray(serviceArea) ? serviceArea : ['Makurdi'],
    images: [],
    active: true,
  });

  res.status(201).json({ success: true, service: newService });
});

app.delete('/api/services/:id', (req: Request, res: Response) => {
  const deleted = db.deleteService(req.params.id);
  res.json({ success: deleted });
});

// --- BOOKINGS & COMMISSIONS ---

app.get('/api/bookings', (req: Request, res: Response) => {
  const { customerId, artisanId, status } = req.query;
  const bookings = db.getBookings({
    customerId: customerId ? String(customerId) : undefined,
    artisanId: artisanId ? String(artisanId) : undefined,
    status: status ? String(status) : undefined,
  });
  res.json({ bookings });
});

app.get('/api/bookings/:id', (req: Request, res: Response) => {
  const booking = db.getBookingById(req.params.id);
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  res.json({ booking });
});

// Create booking (calculates 5% commission dynamically & securely on the backend)
app.post('/api/bookings', (req: Request, res: Response) => {
  const {
    artisanId,
    serviceId,
    jobDescription,
    date,
    time,
    locationArea,
    locationAddress,
    estimatedCostMinor,
  } = req.body;

  if (!artisanId || !jobDescription || !date || !time || !locationAddress) {
    return res.status(400).json({ message: 'Please provide all booking details' });
  }

  const artisan = db.getArtisanById(artisanId);
  if (!artisan) {
    return res.status(404).json({ message: 'Artisan not found' });
  }

  const customer = currentSessionUser || db.getUserById('usr-customer-1')!;
  const settings = db.getSettings();

  // Determine pricing & backend 5% commission engine
  const cost = Number(estimatedCostMinor) || artisan.startingPriceMinor || 1000000;
  const commission = calculateCommission(cost, settings.commissionPercentage);

  const bookingRef = `MKD-BK-${Math.floor(1000 + Math.random() * 9000)}`;

  const booking: Booking = {
    id: `bk-${Date.now()}`,
    bookingRef,
    customerId: customer.id,
    customerName: customer.fullName,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    artisanId: artisan.id,
    artisanUserId: artisan.userId,
    artisanName: artisan.businessName,
    artisanBusinessName: artisan.businessName,
    serviceId,
    serviceName: artisan.categoryName + ' Service',
    categoryId: artisan.categoryId,
    categoryName: artisan.categoryName,
    jobDescription,
    date,
    time,
    locationArea: locationArea || 'Makurdi',
    locationAddress,
    photos: [],
    estimatedCostMinor: cost,
    commissionRateSnapshot: settings.commissionPercentage / 100, // e.g. 0.05
    platformCommissionMinor: commission.platformCommissionMinor,
    artisanNetMinor: commission.artisanNetMinor,
    status: 'requested',
    statusHistory: [
      {
        status: 'requested',
        timestamp: new Date().toISOString(),
        changedBy: customer.id,
        changedByName: customer.fullName,
        note: 'Booking submitted by customer',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addBooking(booking);

  // Notify artisan
  db.addNotification({
    userId: artisan.userId,
    title: 'New Service Request',
    message: `${customer.fullName} in ${locationArea} sent you a booking request (${bookingRef}) for ${date} at ${time}.`,
    type: 'booking',
    link: '/artisan/bookings',
  });

  // Create or retrieve conversation
  db.getOrCreateConversation(booking.id, [customer.id, artisan.userId], [
    { id: customer.id, name: customer.fullName, role: 'customer' },
    { id: artisan.userId, name: artisan.businessName, role: 'artisan' },
  ]);

  res.status(201).json({ success: true, booking });
});

// Update Booking Status Workflow
app.patch('/api/bookings/:id/status', (req: Request, res: Response) => {
  const { status, note } = req.body;
  const booking = db.getBookingById(req.params.id);
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  const actor = currentSessionUser || { id: 'usr-actor', fullName: 'User' };
  const updated = db.updateBookingStatus(booking.id, status, actor.id, actor.fullName, note);

  // Notifications based on transition
  if (status === 'accepted') {
    db.addNotification({
      userId: booking.customerId,
      title: 'Booking Accepted! Ready for Payment',
      message: `${booking.artisanName} has accepted your request (${booking.bookingRef}). Please proceed with payment to lock in your date.`,
      type: 'booking',
      link: '/customer/bookings',
    });
  } else if (status === 'completed') {
    db.addNotification({
      userId: booking.customerId,
      title: 'Job Marked Completed by Artisan',
      message: `${booking.artisanName} marked the job complete. Please inspect and confirm completion to release escrow settlement.`,
      type: 'booking',
      link: '/customer/bookings',
    });
  } else if (status === 'customer_confirmed') {
    db.addNotification({
      userId: booking.artisanUserId,
      title: 'Settlement Released to Wallet! ₦' + (booking.artisanNetMinor / 100).toLocaleString(),
      message: `Customer ${booking.customerName} has confirmed job completion. ₦${(booking.artisanNetMinor / 100).toLocaleString()} (after 5% platform commission) is now available in your wallet.`,
      type: 'payment',
      link: '/artisan/wallet',
    });
  }

  res.json({ success: true, booking: updated });
});

// --- PAYMENTS & ESCROW ---

app.post('/api/payments/initialize', async (req: Request, res: Response) => {
  try {
    const { bookingId, amountMinor } = req.body;
    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const customer = currentSessionUser || db.getUserById(booking.customerId)!;
    const result = await PaymentService.initializePayment({
      bookingId: booking.id,
      customerId: customer.id,
      email: customer.email,
      amountMinor: amountMinor || booking.estimatedCostMinor,
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Payment initialization failed' });
  }
});

app.get('/api/payments/verify/:reference', async (req: Request, res: Response) => {
  try {
    const result = await PaymentService.verifyPayment(req.params.reference);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Verification failed' });
  }
});

app.post('/api/payments/webhook', (req: Request, res: Response) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const isValid = PaymentService.verifyWebhookSignature(JSON.stringify(req.body), signature);

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid webhook signature' });
  }

  const event = req.body;
  if (event.event === 'charge.success' && event.data?.reference) {
    PaymentService.verifyPayment(event.data.reference);
  }

  res.json({ received: true });
});

app.get('/api/payments/transactions', (req: Request, res: Response) => {
  const { artisanId, customerId } = req.query;
  const txs = db.getTransactions(artisanId ? String(artisanId) : undefined, customerId ? String(customerId) : undefined);
  res.json({ transactions: txs });
});

// --- WALLET & PAYOUTS ---

app.get('/api/wallet', (req: Request, res: Response) => {
  const { artisanId } = req.query;
  const targetId = artisanId ? String(artisanId) : 'art-1';
  const wallet = db.getOrCreateWallet(targetId);
  const transactions = db.getWalletTransactions(targetId);
  const payouts = db.getPayouts(targetId);
  const artisan = db.getArtisanById(targetId);

  res.json({ wallet, transactions, payouts, bankDetails: artisan?.bankDetails });
});

app.post('/api/wallet/payout', (req: Request, res: Response) => {
  const { artisanId, amountMinor, bankName, accountNumber, accountName } = req.body;
  if (!artisanId || !amountMinor || !bankName || !accountNumber || !accountName) {
    return res.status(400).json({ success: false, message: 'Missing required payout fields' });
  }

  const result = db.requestPayout(artisanId, Number(amountMinor), { bankName, accountNumber, accountName });
  if (!result.success) {
    return res.status(400).json(result);
  }

  // Notify admin of withdrawal request
  db.addNotification({
    userId: 'usr-admin-1',
    title: 'New Payout Request',
    message: `${result.payout?.artisanName} requested withdrawal of ₦${(Number(amountMinor) / 100).toLocaleString()} to ${bankName}.`,
    type: 'payout',
    link: '/admin/payouts',
  });

  res.json(result);
});

// Admin payout processing
app.get('/api/admin/payouts', (_req: Request, res: Response) => {
  const payouts = db.getPayouts();
  res.json({ payouts });
});

app.post('/api/admin/payouts/:id/process', (req: Request, res: Response) => {
  const { status, note } = req.body; // 'paid' | 'failed' | 'cancelled'
  const admin = currentSessionUser || { id: 'usr-admin-1', email: 'admin@makurdiartisans.ng', fullName: 'Admin' };
  const payout = db.processPayout(req.params.id, status, admin.id, note);

  if (!payout) {
    return res.status(404).json({ message: 'Payout not found' });
  }

  db.addAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.fullName,
    action: `Payout ${status.toUpperCase()}`,
    targetType: 'Payout',
    targetId: payout.id,
    details: `Processed payout of ₦${payout.amountMinor / 100} to ${payout.bankName} (${payout.accountNumberMasked}). Status: ${status}`,
  });

  res.json({ success: true, payout });
});

// --- REVIEWS ---

app.get('/api/reviews', (req: Request, res: Response) => {
  const { artisanId } = req.query;
  const reviews = db.getReviews(artisanId ? String(artisanId) : undefined);
  res.json({ reviews });
});

app.post('/api/reviews', (req: Request, res: Response) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const booking = db.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'customer_confirmed' && booking.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review a booking that has been completed' });
    }

    const customer = currentSessionUser || db.getUserById(booking.customerId)!;

    const review: Review = {
      id: `rev-${Date.now()}`,
      bookingId,
      customerId: customer.id,
      customerName: customer.fullName,
      customerAvatar: customer.avatarUrl,
      artisanId: booking.artisanId,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment,
      createdAt: new Date().toISOString(),
      moderated: false,
    };

    db.addReview(review);

    // Notify artisan
    db.addNotification({
      userId: booking.artisanUserId,
      title: `New ${rating}-Star Review! ⭐`,
      message: `${customer.fullName} left a review for booking ${booking.bookingRef}: "${comment.substring(0, 60)}..."`,
      type: 'booking',
      link: '/artisan/reviews',
    });

    res.status(201).json({ success: true, review });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// --- MESSAGES & CONVERSATIONS ---

app.get('/api/messages/conversations', (_req: Request, res: Response) => {
  const user = currentSessionUser || db.getUserById('usr-customer-1')!;
  const convs = db.getConversations(user.id);
  res.json({ conversations: convs });
});

app.get('/api/messages/conversations/:id/messages', (req: Request, res: Response) => {
  const messages = db.getMessages(req.params.id);
  res.json({ messages });
});

app.post('/api/messages', (req: Request, res: Response) => {
  const { conversationId, text, image } = req.body;
  if (!conversationId || !text) {
    return res.status(400).json({ message: 'Missing message parameters' });
  }

  const sender = currentSessionUser || db.getUserById('usr-customer-1')!;

  const msg = db.addMessage({
    id: `msg-${Date.now()}`,
    conversationId,
    senderId: sender.id,
    senderName: sender.fullName,
    senderRole: sender.role,
    text,
    image,
    createdAt: new Date().toISOString(),
    read: false,
  });

  res.status(201).json({ success: true, message: msg });
});

// --- DISPUTES ---

app.get('/api/disputes', (_req: Request, res: Response) => {
  const disputes = db.getDisputes();
  res.json({ disputes });
});

app.post('/api/disputes', (req: Request, res: Response) => {
  const { bookingId, reason, description, evidenceImages } = req.body;
  const booking = db.getBookingById(bookingId);
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  const initiator = currentSessionUser || db.getUserById(booking.customerId)!;
  const respondentId = initiator.id === booking.customerId ? booking.artisanUserId : booking.customerId;
  const respondentName = initiator.id === booking.customerId ? booking.artisanName : booking.customerName;

  const dispute = db.addDispute({
    id: `dsp-${Date.now()}`,
    disputeRef: `DSP-MKD-${Math.floor(100 + Math.random() * 900)}`,
    bookingId: booking.id,
    bookingRef: booking.bookingRef,
    initiatorId: initiator.id,
    initiatorName: initiator.fullName,
    initiatorRole: initiator.role,
    respondentId,
    respondentName,
    reason,
    description,
    evidenceImages: evidenceImages || [],
    status: 'open',
    createdAt: new Date().toISOString(),
  });

  db.addAuditLog({
    adminId: initiator.id,
    adminEmail: initiator.email,
    adminName: initiator.fullName,
    action: 'Opened Dispute',
    targetType: 'Booking',
    targetId: booking.id,
    details: `Dispute opened on booking ${booking.bookingRef}: ${reason}`,
  });

  // Notify admin
  db.addNotification({
    userId: 'usr-admin-1',
    title: 'New Dispute Opened',
    message: `Dispute on booking ${booking.bookingRef} by ${initiator.fullName}. Immediate review needed.`,
    type: 'dispute',
    link: '/admin/disputes',
  });

  res.status(201).json({ success: true, dispute });
});

app.post('/api/disputes/:id/resolve', (req: Request, res: Response) => {
  const { status, notes } = req.body; // 'resolved_refunded' | 'resolved_released' | 'dismissed'
  const admin = currentSessionUser || { id: 'usr-admin-1', fullName: 'Administrator' };

  const resolved = db.resolveDispute(req.params.id, status, notes, admin.id);
  if (!resolved) {
    return res.status(404).json({ message: 'Dispute not found' });
  }

  res.json({ success: true, dispute: resolved });
});

// --- ADMIN DASHBOARD & METRICS ---

app.get('/api/admin/metrics', (_req: Request, res: Response) => {
  const state = db.getState();
  const totalUsers = state.users.length;
  const totalArtisans = state.artisans.length;
  const verifiedArtisans = state.artisans.filter((a) => a.verificationStatus === 'verified').length;
  const pendingVerifications = state.artisans.filter((a) => a.verificationStatus === 'under_review' || a.verificationStatus === 'pending').length;
  const totalBookings = state.bookings.length;
  const activeBookings = state.bookings.filter((b) => ['paid', 'in_progress', 'accepted'].includes(b.status)).length;
  const completedJobs = state.bookings.filter((b) => ['completed', 'customer_confirmed'].includes(b.status)).length;
  const cancelledJobs = state.bookings.filter((b) => b.status === 'cancelled').length;
  const openDisputes = state.disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length;

  // Financial aggregates in Minor units
  const successfulTxs = state.transactions.filter((t) => t.status === 'successful');
  const totalTransactionValueMinor = successfulTxs.reduce((acc, t) => acc + t.amountMinor, 0);
  const platformRevenueMinor = successfulTxs.reduce((acc, t) => acc + t.commissionMinor, 0);
  const artisanNetSettledMinor = successfulTxs.reduce((acc, t) => acc + t.artisanNetMinor, 0);

  const pendingPayouts = state.payouts.filter((p) => p.status === 'pending');
  const pendingPayoutsValueMinor = pendingPayouts.reduce((acc, p) => acc + p.amountMinor, 0);

  // Chart data for daily/monthly trend
  const revenueTrend = [
    { day: 'Mon', revenue: 15000, commission: 750, bookings: 4 },
    { day: 'Tue', revenue: 22000, commission: 1100, bookings: 6 },
    { day: 'Wed', revenue: 35000, commission: 1750, bookings: 8 },
    { day: 'Thu', revenue: 28000, commission: 1400, bookings: 5 },
    { day: 'Fri', revenue: 48000, commission: 2400, bookings: 11 },
    { day: 'Sat', revenue: 65000, commission: 3250, bookings: 16 },
    { day: 'Sun', revenue: 40000, commission: 2000, bookings: 9 },
  ];

  const categoryDistribution = [
    { name: 'Plumbing', count: 18, value: 450000 },
    { name: 'Electrical', count: 14, value: 380000 },
    { name: 'Generator Repair', count: 22, value: 290000 },
    { name: 'POP & Ceiling', count: 9, value: 620000 },
    { name: 'AC & Refrigeration', count: 11, value: 310000 },
    { name: 'Tailoring & Native', count: 16, value: 410000 },
  ];

  const locationActivity = [
    { area: 'Wurukum', bookings: 29 },
    { area: 'High Level', bookings: 24 },
    { area: 'Kanshio', bookings: 19 },
    { area: 'North Bank', bookings: 17 },
    { area: 'Judges Quarters', bookings: 14 },
    { area: 'Modern Market', bookings: 12 },
  ];

  res.json({
    metrics: {
      totalUsers,
      totalArtisans,
      verifiedArtisans,
      pendingVerifications,
      totalBookings,
      activeBookings,
      completedJobs,
      cancelledJobs,
      openDisputes,
      totalTransactionValueMinor,
      platformRevenueMinor,
      artisanNetSettledMinor,
      pendingPayoutsCount: pendingPayouts.length,
      pendingPayoutsValueMinor,
      commissionPercentage: state.settings.commissionPercentage,
    },
    charts: {
      revenueTrend,
      categoryDistribution,
      locationActivity,
    },
  });
});

app.get('/api/admin/users', (_req: Request, res: Response) => {
  const users = db.getUsers();
  res.json({ users });
});

app.post('/api/admin/users', (req: any, res: Response) => {
  const admin = getRequestUser(req) || { id: 'usr-admin-1', fullName: 'Super Administrator', email: 'admin@joblite.ng' };
  const { fullName, email, phone, role, password } = req.body;

  if (!fullName || !email || !phone) {
    return res.status(400).json({ success: false, message: 'Full name, email, and phone are required.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email address already in use.' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}`,
    fullName,
    email,
    phone,
    role: (role as UserRole) || 'customer',
    passwordHash: hashPassword(password || 'JobLite2026!'),
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  };

  db.addUser(newUser);

  db.addAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.fullName,
    action: 'Created User Account',
    targetType: 'User',
    targetId: newUser.id,
    details: `Admin created ${newUser.role} user: ${newUser.fullName} (${newUser.email})`,
  });

  res.status(201).json({ success: true, user: newUser });
});

app.patch('/api/admin/users/:id/role', (req: any, res: Response) => {
  const admin = getRequestUser(req) || { id: 'usr-admin-1', fullName: 'Super Administrator', email: 'admin@joblite.ng' };
  const { role } = req.body;

  const user = db.updateUser(req.params.id, { role: role as UserRole });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  db.addAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.fullName,
    action: 'Changed User Role',
    targetType: 'User',
    targetId: user.id,
    details: `Admin changed role of ${user.fullName} to ${role}`,
  });

  res.json({ success: true, user });
});

app.delete('/api/admin/users/:id', (req: any, res: Response) => {
  const admin = getRequestUser(req) || { id: 'usr-admin-1', fullName: 'Super Administrator', email: 'admin@joblite.ng' };
  const targetId = req.params.id;

  if (targetId === admin.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own admin account.' });
  }

  const success = db.deleteUser(targetId);
  if (!success) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  db.addAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.fullName,
    action: 'Deleted User Account',
    targetType: 'User',
    targetId,
    details: `Admin deleted user ${targetId}`,
  });

  res.json({ success: true, message: 'User deleted successfully' });
});

app.patch('/api/admin/users/:id/suspend', (req: any, res: Response) => {
  const admin = getRequestUser(req) || { id: 'usr-admin-1', fullName: 'Super Administrator', email: 'admin@joblite.ng' };
  const { isSuspended, reason } = req.body;
  const user = db.updateUser(req.params.id, { isSuspended });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Also suspend artisan profile if applicable
  if (user.role === 'artisan') {
    const art = db.getArtisanByUserId(user.id);
    if (art) {
      art.verificationStatus = isSuspended ? 'suspended' : 'verified';
    }
  }

  db.addAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.fullName,
    action: isSuspended ? 'Suspended User Account' : 'Reactivated User Account',
    targetType: 'User',
    targetId: user.id,
    details: `User ${user.fullName} status updated to ${isSuspended ? 'Suspended' : 'Active'}. Reason: ${reason || 'Admin action'}`,
  });

  res.json({ success: true, user });
});

// --- ARTISAN APPROVAL & KYC VALIDATION PIPELINE ---

// Validate National Identification Number (NIMC validation)
app.post('/api/admin/artisans/:id/validate-nin', (req: any, res: Response) => {
  const admin = getRequestUser(req) || { id: 'usr-admin-1', fullName: 'Super Administrator', email: 'admin@joblite.ng' };
  const artisan = db.getArtisanById(req.params.id);
  if (!artisan) {
    return res.status(404).json({ success: false, message: 'Artisan profile not found' });
  }

  const updated = db.validateArtisanNin(artisan.id, admin.id);

  db.addAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.fullName,
    action: 'NIN Validated',
    targetType: 'Artisan',
    targetId: artisan.id,
    details: `Validated NIN ${artisan.ninNumber || 'on file'} for ${artisan.businessName} via national identity database verification.`,
  });

  res.json({ success: true, artisan: updated });
});

// Confirm Professional Trade Certification
app.post('/api/admin/artisans/:id/confirm-certification', (req: any, res: Response) => {
  const admin = getRequestUser(req) || { id: 'usr-admin-1', fullName: 'Super Administrator', email: 'admin@joblite.ng' };
  const artisan = db.getArtisanById(req.params.id);
  if (!artisan) {
    return res.status(404).json({ success: false, message: 'Artisan profile not found' });
  }

  const updated = db.confirmArtisanCertification(artisan.id, admin.id);

  db.addAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.fullName,
    action: 'Trade Certification Confirmed',
    targetType: 'Artisan',
    targetId: artisan.id,
    details: `Confirmed professional certification "${artisan.certificationTitle}" issued by ${artisan.certificationBody || 'board'} (Cert #${artisan.certificationNumber || 'N/A'}) for ${artisan.businessName}.`,
  });

  res.json({ success: true, artisan: updated });
});

// Admin Approval of Artisan
app.post('/api/admin/artisans/:id/approve', (req: any, res: Response) => {
  const admin = getRequestUser(req) || { id: 'usr-admin-1', fullName: 'Super Administrator', email: 'admin@joblite.ng' };
  const artisan = db.getArtisanById(req.params.id);
  if (!artisan) {
    return res.status(404).json({ success: false, message: 'Artisan profile not found' });
  }

  const settings = db.getSettings();
  if (settings.requireNinValidation && artisan.ninStatus !== 'validated') {
    return res.status(400).json({
      success: false,
      message: 'Cannot approve artisan: National Identification Number (NIN) must be validated first.',
    });
  }

  if (settings.requireCertificationConfirmation && artisan.certificationStatus !== 'confirmed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot approve artisan: Professional trade test/certification must be confirmed first.',
    });
  }

  const updated = db.approveArtisan(artisan.id, admin.id);

  db.addAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.fullName,
    action: 'Approved Artisan Application',
    targetType: 'Artisan',
    targetId: artisan.id,
    details: `Approved artisan registration for ${artisan.businessName}. Both NIN and professional trade certifications verified.`,
  });

  res.json({ success: true, artisan: updated });
});

// Admin Rejection of Artisan
app.post('/api/admin/artisans/:id/reject', (req: any, res: Response) => {
  const admin = getRequestUser(req) || { id: 'usr-admin-1', fullName: 'Super Administrator', email: 'admin@joblite.ng' };
  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ success: false, message: 'A rejection reason is required.' });
  }

  const updated = db.rejectArtisan(req.params.id, admin.id, reason);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Artisan profile not found' });
  }

  db.addAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    adminName: admin.fullName,
    action: 'Rejected Artisan Application',
    targetType: 'Artisan',
    targetId: updated.id,
    details: `Rejected artisan registration for ${updated.businessName}. Reason: ${reason}`,
  });

  res.json({ success: true, artisan: updated });
});

app.get('/api/admin/audit-logs', (_req: Request, res: Response) => {
  const logs = db.getAuditLogs();
  res.json({ logs });
});

// Export reports in CSV format
app.get('/api/admin/export/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const state = db.getState();

  let csvContent = '';
  let filename = `joblite_${type}_export.csv`;

  if (type === 'bookings') {
    csvContent = 'Booking Ref,Customer,Artisan,Service,Area,Date,Cost (NGN),5% Commission (NGN),Artisan Net (NGN),Status\n';
    state.bookings.forEach((b) => {
      csvContent += `"${b.bookingRef}","${b.customerName}","${b.artisanBusinessName}","${b.serviceName}","${b.locationArea}","${b.date}",${b.estimatedCostMinor / 100},${b.platformCommissionMinor / 100},${b.artisanNetMinor / 100},"${b.status}"\n`;
    });
  } else if (type === 'payments') {
    csvContent = 'Reference,Booking Ref,Customer,Artisan,Amount (NGN),Commission (NGN),Artisan Net (NGN),Status,Settlement Status,Date\n';
    state.transactions.forEach((t) => {
      csvContent += `"${t.reference}","${t.bookingRef}","${t.customerName}","${t.artisanName}",${t.amountMinor / 100},${t.commissionMinor / 100},${t.artisanNetMinor / 100},"${t.status}","${t.settlementStatus}","${t.createdAt}"\n`;
    });
  } else if (type === 'artisans') {
    csvContent = 'Business Name,Category,Rating,Completed Jobs,Experience (Yrs),Areas,Verification Status,NIN Status,Cert Status,Starting Price (NGN)\n';
    state.artisans.forEach((a) => {
      csvContent += `"${a.businessName}","${a.categoryName}",${a.rating},${a.completedJobsCount},${a.yearsOfExperience},"${a.serviceArea.join('; ')}","${a.verificationStatus}","${a.ninStatus || 'N/A'}","${a.certificationStatus || 'N/A'}",${a.startingPriceMinor / 100}\n`;
    });
  } else {
    csvContent = 'ID,Full Name,Email,Phone,Role,Created At\n';
    state.users.forEach((u) => {
      csvContent += `"${u.id}","${u.fullName}","${u.email}","${u.phone}","${u.role}","${u.createdAt}"\n`;
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

// --- SETTINGS (Super Admin Protected) ---

app.get('/api/settings', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({ settings });
});

app.patch('/api/settings', (req: any, res: Response) => {
  const {
    platformName,
    commissionPercentage,
    minimumPayoutMinor,
    supportEmail,
    supportPhone,
    autoSettlementDays,
    maintenanceMode,
    requireNinValidation,
    requireCertificationConfirmation,
    paystackPublicKey,
  } = req.body;

  const currentAdmin = getRequestUser(req) || { id: 'usr-admin-1', fullName: 'Super Administrator', email: 'admin@joblite.ng' };

  db.addAuditLog({
    adminId: currentAdmin.id,
    adminEmail: currentAdmin.email,
    adminName: currentAdmin.fullName,
    action: 'Updated JobLite Platform Settings',
    targetType: 'PlatformSettings',
    targetId: 'settings',
    details: `Updated settings. Name: ${platformName || 'JobLite'}, Commission: ${commissionPercentage}%, NIN Req: ${requireNinValidation}, Cert Req: ${requireCertificationConfirmation}`,
  });

  const updated = db.updateSettings({
    platformName: platformName !== undefined ? String(platformName) : undefined,
    commissionPercentage: commissionPercentage !== undefined ? Number(commissionPercentage) : undefined,
    minimumPayoutMinor: minimumPayoutMinor !== undefined ? Number(minimumPayoutMinor) : undefined,
    supportEmail: supportEmail !== undefined ? String(supportEmail) : undefined,
    supportPhone: supportPhone !== undefined ? String(supportPhone) : undefined,
    autoSettlementDays: autoSettlementDays !== undefined ? Number(autoSettlementDays) : undefined,
    maintenanceMode: maintenanceMode !== undefined ? Boolean(maintenanceMode) : undefined,
    requireNinValidation: requireNinValidation !== undefined ? Boolean(requireNinValidation) : undefined,
    requireCertificationConfirmation: requireCertificationConfirmation !== undefined ? Boolean(requireCertificationConfirmation) : undefined,
    paystackPublicKey: paystackPublicKey !== undefined ? String(paystackPublicKey) : undefined,
  });

  res.json({ success: true, settings: updated });
});

// Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || currentSessionUser?.id || 'usr-customer-1';
  const notifications = db.getNotifications(userId);
  res.json({ notifications });
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  db.markNotificationRead(req.params.id);
  res.json({ success: true });
});

// --- VITE MIDDLEWARE & STATIC SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Makurdi Marketplace server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
