import React, { useState } from 'react';
import { X, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { Booking } from '../types';
import { submitReview } from '../lib/api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  booking,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please share feedback regarding the quality of work.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await submitReview({
        bookingId: booking.id,
        rating,
        comment: comment.trim(),
      });

      if (res.success) {
        onReviewSubmitted();
        onClose();
      } else {
        setError(res.message || 'Failed to submit review');
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Rate & Review Artisan</h3>
            <p className="text-xs text-slate-500">{booking.artisanBusinessName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center space-y-2">
            <label className="block text-xs font-bold text-slate-700">Your Overall Rating</label>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-xs font-bold text-slate-600">
              {rating === 5 && 'Outstanding Work (5.0)'}
              {rating === 4 && 'Very Good (4.0)'}
              {rating === 3 && 'Average (3.0)'}
              {rating === 2 && 'Below Expectation (2.0)'}
              {rating === 1 && 'Unsatisfactory (1.0)'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Share your experience in Makurdi *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Was the artisan punctual? Did they clean up afterward? Were materials handled transparently?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Publishing Review...' : 'Submit Verified Review'}
          </button>
        </form>
      </div>
    </div>
  );
};
