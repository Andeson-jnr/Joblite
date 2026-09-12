/**
 * Commission Engine for Makurdi Artisan & Service Marketplace
 * All monetary calculations use integer kobo (minor units: 100 kobo = 1 NGN).
 * Commission percentage is dynamic and configurable by authorized administrators.
 */

export interface CommissionCalculation {
  grossMinor: number;
  commissionPercentage: number;
  platformCommissionMinor: number;
  artisanNetMinor: number;
}

export function calculateCommission(
  grossMinor: number,
  commissionPercentage: number
): CommissionCalculation {
  // Ensure non-negative integers
  const safeGross = Math.max(0, Math.round(grossMinor));
  const safeRate = Math.max(0, commissionPercentage);

  // Exact kobo deduction
  const platformCommissionMinor = Math.round((safeGross * safeRate) / 100);
  const artisanNetMinor = safeGross - platformCommissionMinor;

  return {
    grossMinor: safeGross,
    commissionPercentage: safeRate,
    platformCommissionMinor,
    artisanNetMinor,
  };
}

export function formatNaira(minorUnits: number): string {
  const naira = minorUnits / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(naira);
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function koboToNaira(kobo: number): number {
  return kobo / 100;
}
