import { useState } from "react";
import { Copy, Check, Heart } from "lucide-react";
import ToolHeader from "./ToolHeader";

export default function SupportPage({ theme, setTheme, onBackToHub }) {
  const [copied, setCopied] = useState(false);
  const upiId = "hitesh.edu9@okaxis";

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col">
      <ToolHeader theme={theme} setTheme={setTheme} onBackToHub={() => onBackToHub(false)} badge="Support" />

      <div className="flex-1 flex flex-col md:flex-row items-center md:items-start justify-center gap-16 lg:gap-24 p-6 md:p-12 md:pt-24 animate-rise max-w-6xl mx-auto w-full">
        {/* Left Side: Support Message */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left max-w-lg mt-0">
          <div className="mb-8 self-center grid h-20 w-20 place-items-center rounded-full bg-[var(--accent-coral)]/10 text-[var(--accent-coral)]">
            <Heart size={40} fill="currentColor" />
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Support PrintPrep
          </h1>

          <div className="space-y-4 text-[var(--text-muted)] text-base md:text-lg leading-relaxed">
            <p>
              I built PrintPrep to solve a personal frustration: making PDFs clean and print-ready shouldn't require uploading sensitive files to clunky, ad-filled websites.
            </p>
            <p>
              PrintPrep is 100% free, private, and runs entirely in your browser. If PrintPrep saved you time or made your workflow smoother, consider dropping a small tip!
            </p>
            <p className="font-bold text-[var(--text-main)]">
              Your support keeps the Project running.
            </p>
          </div>
        </div>

        {/* Right Side: QR Details */}
        <div className="flex-1 flex flex-col items-center w-full max-w-md relative md:mt-2">

          {/* Subtle background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--accent-mint)]/5 rounded-full blur-3xl pointer-events-none" />

          {/* QR Code */}
          <div className="flex flex-col items-center relative z-10 mb-8">
            <div className="overflow-hidden rounded-3xl border-4 border-[var(--border-color)] bg-white p-2 shadow-xl mb-4 transition-transform hover:scale-105 duration-300">
              <img
                src="/images/upi-qr.png"
                alt="UPI QR Code"
                className="h-64 w-64 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3E/images/upi-qr.png%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <p className="text-xs font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase">
              Scan with any UPI App
            </p>
          </div>

          {/* UPI Details & Copy */}
          <div className="flex flex-col w-full relative z-10 text-center">
            <h3 className="font-display text-2xl font-bold mb-2">Pay via UPI</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Open Google Pay, PhonePe, Paytm, or any UPI app to scan the code, or copy the UPI ID below.
              <span className="block mt-2 text-xs italic opacity-80">
                Drop a note like &apos;PrintPrep&apos; so I know where it came from!
              </span>
            </p>

            <div className="w-full max-w-sm mx-auto">
              <p className="mb-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider text-left pl-1">Direct UPI ID</p>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1.5 shadow-inner">
                <div className="flex-1 overflow-hidden px-4 text-left">
                  <p className="truncate font-mono text-base md:text-lg text-[var(--text-main)]">{upiId}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex min-w-[100px] items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition-all ${copied
                      ? "bg-[var(--accent-mint)] text-[var(--bg-main)]"
                      : "bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--accent-mint)] hover:text-[var(--accent-mint)] shadow-sm"
                    }`}
                >
                  {copied ? (
                    <>
                      <Check size={16} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy ID
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
