import { useState } from "react";
import { X, Copy, Check, Smartphone, Coffee } from "lucide-react";

export default function SupportModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const upiId = "hitesh.edu9@okaxis";
  const payeeName = "Hitesh Panigrahi";

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&cu=INR`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] text-[var(--text-main)] shadow-2xl animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent-coral)]/10 text-[var(--accent-coral)]">
              <Coffee size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Support PrintPrep</h2>
              <p className="text-xs text-[var(--text-muted)]">Keep the tool free and independent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] transition hover:bg-[var(--accent-coral)] hover:text-[var(--bg-main)]"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 md:p-8 flex flex-col items-center">
          <p className="mb-6 text-center text-sm text-[var(--text-muted)]">
            PrintPrep is 100% free and private. If it saved you some time (or money at the print shop), consider dropping a small tip via UPI!
          </p>

          {/* Desktop QR Code (Hidden on small screens) */}
          <div className="hidden sm:flex flex-col items-center w-full">
            <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white p-4 shadow-sm">
              {/* Replace with actual QR code image */}
              <img 
                src="/images/upi-qr.png" 
                alt="UPI QR Code" 
                className="h-48 w-48 object-cover opacity-90"
                onError={(e) => {
                  // Fallback if image doesn't exist yet
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3E/images/upi-qr.png%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--accent-mint)]">Scan to Pay</p>
          </div>

          {/* Mobile Deep Link Button (Hidden on larger screens) */}
          <div className="flex sm:hidden w-full mb-6">
            <a 
              href={upiLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-mint)] px-5 py-4 text-sm font-bold text-[var(--bg-main)] transition hover:brightness-110 shadow-sm"
            >
              <Smartphone size={18} />
              Pay via UPI App
            </a>
          </div>

          {/* Universal Fallback: UPI ID Copy */}
          <div className="w-full">
            <p className="mb-2 text-xs font-bold text-[var(--text-muted)]">UPI ID</p>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1.5">
              <div className="flex-1 overflow-hidden px-3">
                <p className="truncate font-mono text-sm">{upiId}</p>
              </div>
              <button
                onClick={handleCopy}
                className={`flex min-w-[80px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  copied 
                    ? "bg-[var(--accent-mint)] text-[var(--bg-main)]" 
                    : "bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-panel)] shadow-sm"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy ID
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
