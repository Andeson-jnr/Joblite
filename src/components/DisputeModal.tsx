import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Booking } from '../types';
import { submitDispute } from '../lib/api';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onDisputeSubmitted: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  booking,
  onDisputeSubmitted,
}) => {
  const [reason, setReason] = useState('Incomplete job scope');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  const disputeReasons = [
    'Incomplete job scope',
    'Substandard / poor workmanship',
    'Artisan did not show up',
    'Property damage during service',
    'Disagreement on materials cost',
    'Unprofessional conduct',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide details for the dispute investigation.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await submitDispute({
        bookingId: booking.id,
        reason,
        description: description.trim(),
      });

      if (res.success) {
        onDisputeSubmitted();
        onClose();
      } else {
        setError(res.message || 'Failed to submit dispute claim');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Raise Escrow Dispute</h3>
              <p className="text-xs text-slate-500">Ref: {booking.bookingRef}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{error}</div>}

        <div className="p-3 rounded-xl bg-red-50/70 border border-red-200 text-xs text-red-900 leading-relaxed">
          <strong>Escrow Freeze:</strong> Once submitted, all funds for this booking are frozen immediately. Our Makurdi marketplace resolution officer will review evidence from both parties within 24 hours.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Dispute Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              {disputeReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Claim & Evidence Description *
            </label>
            <textarea
              required
              rows={4}
              placeholder="State what went wrong, what was agreed upon, and any attempts to resolve it with the artisan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Freezing Escrow & Submitting...' : 'Freeze Escrow & Submit Claim'}
          </button>
        </form>
      </div>
    </div>
  );
};
