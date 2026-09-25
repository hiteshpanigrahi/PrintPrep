"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Star, X, CupSoda, Send, Check } from "lucide-react";
import PeekRating from "./PeekRating";
import { getUserRating, submitToGoogleSheets } from "../utils/analytics";

export default function FeedbackModal({ onClose, onSupport }) {
  const [existingRating, setExistingRating] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = getUserRating();
    if (saved) {
      setExistingRating(saved);
    }
  }, []);

  const handleRating = (val) => {
    if (existingRating) return; // Prevent any interaction if already rated
    setRating(val);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (existingRating) return;
    if (!rating && !feedbackText.trim()) return;
    setSubmitting(true);
    try {
      await submitToGoogleSheets({
        rating: rating || 5,
        feedback: feedbackText.trim(),
      });
      setExistingRating({
        rating: rating || 5,
        feedback: feedbackText.trim(),
      });
    } catch (err) {
      console.warn("Feedback save error:", err);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="animate-rise relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-7 text-center shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] transition hover:bg-[var(--accent-coral)] hover:text-[var(--bg-main)]"
        >
          <X size={16} />
        </button>

        {existingRating ? (
          <div className="py-2">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-yellow-500/15 text-yellow-500">
              <Star size={24} className="fill-current" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--text-main)]">Rating Recorded</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              You rated PrintPrep {existingRating.rating} / 5 stars.
            </p>

            <div className="mt-4 flex justify-center pb-2 opacity-90 pointer-events-none">
              <PeekRating
                value={existingRating.rating}
                readOnly={true}
                activeColor="#eab308"
                idleColor="var(--border-color)"
                size={30}
              />
            </div>

            {existingRating.feedback && (
              <p className="mt-3 text-xs italic text-[var(--text-muted)] bg-[var(--bg-secondary)] p-2.5 rounded-xl border border-[var(--border-color)] max-w-xs mx-auto">
                &ldquo;{existingRating.feedback}&rdquo;
              </p>
            )}

            {onSupport && (
              <div className="mt-5 rounded-2xl border border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 p-4 text-center">
                <p className="text-xs font-bold text-[var(--text-main)]">Enjoying the tool?</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Consider fueling the project with a tip!</p>
                <button
                  onClick={onSupport}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-coral)] px-4 py-2.5 text-xs font-bold text-[var(--bg-main)] transition hover:brightness-110 hover:scale-[1.02] active:scale-95 shadow-sm"
                >
                  <CupSoda size={15} />
                  Buy me a drink
                </button>
              </div>
            )}
          </div>
        ) : !submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-yellow-500/10 text-yellow-500">
              <Star size={24} className="fill-current" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--text-main)]">How did we do?</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Your feedback helps us make PrintPrep even better.
            </p>

            <div className="mt-5 flex justify-center pb-2">
              <PeekRating
                value={rating}
                onChange={handleRating}
                activeColor="#eab308"
                idleColor="var(--border-color)"
                size={34}
                labels={['Poor', 'Fair', 'Good', 'Great', 'Superb']}
              />
            </div>

            {/* Feedback text input */}
            <div className="mt-4 w-full text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
                Feedback or Suggestions (Optional)
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="What did you like? Any bugs or ideas?"
                rows={3}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent-mint)] focus:outline-none resize-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || (rating === 0 && !feedbackText.trim())}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-coral)] px-4 py-2.5 text-xs font-bold text-[var(--bg-main)] transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? (
                <span className="h-4 w-4 rounded-full border-2 border-[var(--bg-main)] border-t-transparent animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {submitting ? "Sending..." : "Submit Feedback"}
            </button>

            {onSupport && (
              <div className="mt-5 pt-4 border-t border-[var(--border-color)] w-full flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)]">Enjoying PrintPrep?</span>
                <button
                  type="button"
                  onClick={onSupport}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-bold text-[var(--text-main)] transition hover:border-[var(--accent-coral)] hover:text-[var(--accent-coral)] hover:scale-105 active:scale-95 shadow-sm"
                >
                  <CupSoda size={13} className="text-[var(--accent-coral)]" />
                  Buy me a drink
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className="py-2">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[var(--accent-mint)]/15 text-[var(--accent-mint)]">
              <Check size={24} />
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--text-main)]">Thank You!</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              We appreciate you taking the time to help improve PrintPrep.
            </p>

            {onSupport && (
              <div className="mt-5 rounded-2xl border border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 p-4 text-center">
                <p className="text-xs font-bold text-[var(--text-main)]">Did PrintPrep save your day?</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Consider fueling the project with a tip!</p>
                <button
                  onClick={onSupport}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-coral)] px-4 py-2.5 text-xs font-bold text-[var(--bg-main)] transition hover:brightness-110 hover:scale-[1.02] active:scale-95 shadow-sm"
                >
                  <CupSoda size={15} />
                  Buy me a drink
                </button>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>,
    document.querySelector("main") || document.body
  );
}
