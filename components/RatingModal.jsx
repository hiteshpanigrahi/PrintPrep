"use client";

import { useState } from "react";
import { Star, X, Mail } from "lucide-react";

export default function RatingModal({ isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleRating = (val) => {
    setRating(val);
    setTimeout(() => {
      setSubmitted(true);
    }, 400);
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="animate-rise relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-8 text-center shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] transition hover:bg-[var(--accent-coral)] hover:text-white"
        >
          <X size={16} />
        </button>

        {!submitted ? (
          <>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-yellow-100 text-yellow-500">
              <Star size={28} className="fill-current" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--text-main)]">How did we do?</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Your feedback helps us make PrintPrep even better.
            </p>

            <div className="mt-8 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onMouseEnter={() => setHovered(val)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => handleRating(val)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={40}
                    className={`transition-colors ${
                      (hovered || rating) >= val
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-transparent text-[var(--border-color)] hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="py-4">
            <h2 className="font-display text-2xl font-bold text-[var(--text-main)]">Thank You!</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              We appreciate your feedback.
            </p>
            
            <div className="mt-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
              <p className="text-sm font-bold text-[var(--text-main)]">Have more to say?</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Tell me about your experience!</p>
              <a
                href="mailto:contact@hiteshpanigrahi.com?subject=PrintPrep%20Feedback"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--text-main)] px-4 py-2.5 text-sm font-bold text-[var(--bg-main)] transition hover:opacity-90"
              >
                <Mail size={16} />
                Send an Email
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
