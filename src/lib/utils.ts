export function formatNaira(koboOrNaira: number, isMinorUnits = true): string {
  const naira = isMinorUnits ? koboOrNaira / 100 : koboOrNaira;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(naira);
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function getStatusBadge(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'paid':
      return { label: 'Paid (In Escrow)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'in_progress':
      return { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'completed':
      return { label: 'Completed (Awaiting Confirm)', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'customer_confirmed':
      return { label: 'Completed & Settled', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    case 'accepted':
      return { label: 'Accepted (Pay Pending)', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'requested':
    case 'pending_artisan':
      return { label: 'Pending Response', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'disputed':
      return { label: 'Disputed', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'refunded':
      return { label: 'Refunded', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
    case 'verified':
      return { label: 'Verified Artisan', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' };
    case 'under_review':
      return { label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'rejected':
      return { label: 'Verification Rejected', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'suspended':
      return { label: 'Suspended', bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-900' };
    default:
      return { label: status, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  }
}
