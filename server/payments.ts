import { createHmac } from 'crypto';
import { db } from './db';
import { calculateCommission } from './commission';
import { PaymentTransaction } from '../src/types';

export interface InitializePaymentInput {
  bookingId: string;
  customerId: string;
  email: string;
  amountMinor: number; // in kobo
  callbackUrl?: string;
}

export interface InitializePaymentResult {
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  amountMinor: number;
  isTestMode: boolean;
}

export class PaymentService {
  private static paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || '';

  /**
   * Initialize a payment transaction for a booking
   */
  public static async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    const booking = db.getBookingById(input.bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const reference = `PAY_MKD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const settings = db.getSettings();

    // Use current platform commission rate
    const commCalc = calculateCommission(input.amountMinor, settings.commissionPercentage);

    // Create initialized transaction record
    const transaction: PaymentTransaction = {
      id: `tx-${Date.now()}`,
      reference,
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      customerId: input.customerId,
      customerName: booking.customerName,
      artisanId: booking.artisanId,
      artisanName: booking.artisanName,
      amountMinor: input.amountMinor,
      commissionMinor: commCalc.platformCommissionMinor,
      artisanNetMinor: commCalc.artisanNetMinor,
      currency: 'NGN',
      status: 'initialized',
      settlementStatus: 'held',
      gateway: 'paystack',
      createdAt: new Date().toISOString(),
    };

    db.addTransaction(transaction);

    // If Paystack live key configured, attempt to hit Paystack API
    if (this.paystackSecretKey && this.paystackSecretKey.startsWith('sk_')) {
      try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: input.email,
            amount: input.amountMinor, // Paystack takes amount in kobo
            reference,
            callback_url: input.callbackUrl || `${process.env.APP_URL || ''}/customer/bookings`,
            metadata: {
              bookingId: booking.id,
              bookingRef: booking.bookingRef,
              artisanId: booking.artisanId,
              platform: 'Makurdi Artisan Marketplace',
            },
          }),
        });

        const data = await response.json();
        if (data.status && data.data) {
          return {
            authorizationUrl: data.data.authorization_url,
            accessCode: data.data.access_code,
            reference,
            amountMinor: input.amountMinor,
            isTestMode: false,
          };
        }
      } catch (err) {
        console.warn('Paystack API call failed, falling back to secure test sandbox mode:', err);
      }
    }

    // Default Sandbox / Secure Test Mode
    return {
      reference,
      amountMinor: input.amountMinor,
      isTestMode: true,
      authorizationUrl: `/payment/checkout?ref=${reference}`,
    };
  }

  /**
   * Verify a payment reference
   */
  public static async verifyPayment(reference: string): Promise<{ success: boolean; transaction?: PaymentTransaction; message?: string }> {
    const transactions = db.getTransactions();
    const tx = transactions.find((t) => t.reference === reference);
    if (!tx) {
      return { success: false, message: 'Transaction reference not found in marketplace ledger' };
    }

    if (tx.status === 'successful') {
      return { success: true, transaction: tx, message: 'Transaction already verified and processed' };
    }

    // If live key, verify with Paystack
    let isVerified = false;
    if (this.paystackSecretKey && this.paystackSecretKey.startsWith('sk_')) {
      try {
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
          },
        });
        const data = await res.json();
        if (data.status && data.data?.status === 'success') {
          isVerified = true;
          tx.gatewayReference = data.data.id ? String(data.data.id) : undefined;
        }
      } catch (e) {
        console.warn('Paystack verification error:', e);
      }
    } else {
      // In sandbox/test environment: accept test verification
      isVerified = true;
      tx.gatewayReference = `pstk_test_${Date.now()}`;
    }

    if (isVerified) {
      tx.status = 'successful';
      tx.settlementStatus = 'held';
      tx.paidAt = new Date().toISOString();

      // Update booking to paid (which automatically puts artisanNet into pending holding escrow in db.ts!)
      const booking = db.getBookingById(tx.bookingId);
      if (booking) {
        booking.paymentReference = tx.reference;
        db.updateBookingStatus(booking.id, 'paid', tx.customerId, tx.customerName, `Payment of ₦${tx.amountMinor / 100} verified via Paystack. Funds held in platform escrow.`);

        // Notify artisan
        db.addNotification({
          userId: booking.artisanUserId,
          title: 'Booking Payment Funded',
          message: `${tx.customerName} has funded ₦${tx.amountMinor / 100} for booking ${booking.bookingRef}. The funds are held in escrow and will be released when job is confirmed.`,
          type: 'payment',
          link: '/artisan/bookings',
        });

        // Notify customer
        db.addNotification({
          userId: tx.customerId,
          title: 'Payment Successful',
          message: `Your payment for booking ${booking.bookingRef} was successful. Artisan has been notified to proceed.`,
          type: 'payment',
          link: '/customer/bookings',
        });
      }

      return { success: true, transaction: tx };
    }

    tx.status = 'failed';
    return { success: false, transaction: tx, message: 'Payment verification failed at gateway' };
  }

  /**
   * Process Paystack Webhook events securely with HMAC SHA-512 check
   */
  public static verifyWebhookSignature(body: string, signature: string): boolean {
    if (!this.paystackSecretKey) return true; // in demo test mode
    const hash = createHmac('sha512', this.paystackSecretKey).update(body).digest('hex');
    return hash === signature;
  }
}
