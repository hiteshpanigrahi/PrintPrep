"use client";

import { useState, useEffect, useRef } from "react";
import { FileImage, FilePlus2, Files, Layers, Scissors, Minimize, CupSoda, MessageSquareHeart, Mail } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AmbientBackground from "./AmbientBackground";
import NavStatsBadge from "./NavStatsBadge";
import { openGmailCompose } from "../utils/analytics";

const heroCopy = [
  {
    kicker: "PRIVACY-FIRST PDF TOOLKIT",
    headline: "Everything you need for files and decks.",
    subtext: "Combine, split, clean, and compress documents locally. No cloud uploads, no server delays—just fast browser-native processing.",
  },
  {
    kicker: "BROWSER-NATIVE DOCUMENT SUITE",
    headline: "Power tools for your PDFs and files.",
    subtext: "Merge, split, compress, and optimize entirely on your machine. Zero cloud storage, zero friction, and total privacy.",
  },
  {
    kicker: "ALL-IN-ONE LOCAL PDF STUDIO",
    headline: "Your documents, your browser, your rules.",
    subtext: "Edit decks, merge notes, extract images, and shrink files instantly. No servers involved—everything runs locally in your tab.",
  },
  {
    kicker: "SECURE CLIENT-SIDE TOOLKIT",
    headline: "Instant document tools, zero servers.",
    subtext: "Combine files, clean slides, extract pages, and compress documents right where you work. Fast, professional, and 100% local.",
  }
];

const TOOLS = [
  {
    id: "slide-optimizer",
    icon: Layers,
    color: "var(--accent-mint)",
    bg: "var(--mint)",
    label: "Coaching Slides Optimizer",
    description: "Invert dark slides, cull pages, and print multiple slides per sheet on A4. The core PrintPrep experience.",
  },
  {
    id: "merge-pdf",
    icon: FilePlus2,
    color: "var(--accent-coral)",
    bg: "#fde8e4",
    label: "Merge & Organize PDFs",
    description: "Combine PDFs, DOCX files, and images into one unified document with drag-and-drop page reordering and add blank pages.",
  },
  {
    id: "images-to-pdf",
    icon: FileImage,
    color: "#6B7FD7",
    bg: "#e8ebfa",
    label: "Images → PDF",
    description: "Batch-upload JPEGs and PNGs, arrange their order, and export them packed neatly into a single A4 PDF.",
  },
  {
    id: "pdf-to-images",
    icon: FilePlus2,
    color: "#C06C3E",
    bg: "#faeee5",
    label: "PDF → Images",
    description: "Render every page of a PDF as a high-resolution PNG. Download individually or grab them all at once.",
  },
  {
    id: "pdf-splitter",
    icon: Scissors,
    color: "#7B5EA7",
    bg: "#ede8f5",
    label: "PDF Splitter & Extractor",
    description: "Click pages or type a range like 1–5, 12, 15–20 to slice out exactly the pages you need.",
  },
  {
    id: "compressor",
    icon: Minimize,
    color: "#4A90E2",
    bg: "#eaf3fc",
    label: "PDF & Image Compressor",
    description: "Compress heavy notes or images down to your exact target file size in KB. Export as PDF or image.",
  },
];

export default function DashboardHub({ onLaunch, theme, setTheme, onFeedback }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [touchStartX, setTouchStartX] = useState(0);

  const intervalRef = useRef(null);

  const startInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % heroCopy.length);
        setFade(true);
      }, 700);
    }, 12000);
  };

  useEffect(() => {
    startInterval();
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleDotClick = (index) => {
    if (index === currentIndex) return;
    setFade(false);
    startInterval(); // Reset the timer when manually navigating
    setTimeout(() => {
      setCurrentIndex(index);
      setFade(true);
    }, 700);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleDotClick((currentIndex + 1) % heroCopy.length);
      } else {
        handleDotClick((currentIndex - 1 + heroCopy.length) % heroCopy.length);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden">
      <AmbientBackground />
      
      {/* Navbar */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PrintPrep Logo" className="h-8 w-auto object-contain" />
          <span className="font-display text-xl font-bold tracking-tight text-[var(--text-main)]">PrintPrep</span>
          <span className="hidden rounded-full bg-[var(--mint)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] sm:inline">Studio</span>
        </div>
        <div className="flex items-center gap-3">
          <NavStatsBadge onClick={onFeedback} />
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </header>

      {/* Hero */}
      <div
        className="mx-auto max-w-7xl px-6 pt-12 pb-6 lg:px-10 lg:pt-16 min-h-[300px] flex flex-col justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`transition-opacity duration-700 ${fade ? "opacity-100" : "opacity-0"}`}>
          <p className="mb-3 text-xs font-mono font-bold uppercase tracking-widest text-[var(--accent-coral)]">
            {heroCopy[currentIndex].kicker}
          </p>
          <h1 className="font-display font-serif text-5xl font-bold leading-[1.05] tracking-[-.02em] md:text-6xl max-w-3xl">
            {heroCopy[currentIndex].headline}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-muted)]">
            {heroCopy[currentIndex].subtext}
          </p>
        </div>

        <div className="mt-8 flex gap-2 items-center">
          {heroCopy.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "w-6 bg-[var(--accent-mint)]" : "w-1.5 bg-[var(--border-color)] hover:bg-[var(--text-muted)]"}`}
              aria-label={`View tagline ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Tool Grid */}
      <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onLaunch(tool.id)}
                className="group relative flex flex-col items-start rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent-mint)] hover:shadow-lg soft-shadow"
              >
                {tool.badge && (
                  <span className="absolute right-5 top-5 rounded-full bg-[var(--accent-mint)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--bg-main)]">
                    {tool.badge}
                  </span>
                )}
                <span
                  className="mb-4 grid h-12 w-12 place-items-center rounded-xl"
                  style={{ backgroundColor: tool.bg, color: tool.color }}
                >
                  <Icon size={22} />
                </span>
                <h2 className="mb-2 font-display text-lg font-bold text-[var(--text-main)]">{tool.label}</h2>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">{tool.description}</p>
                <span className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-bold text-[var(--text-main)] transition group-hover:border-[var(--accent-mint)] group-hover:bg-[var(--bg-panel)]">
                  Open tool →
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-6 py-10 lg:px-10 border-t border-[var(--border-color)]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-sm text-[var(--text-muted)]">
          <div className="flex flex-col items-center lg:items-start gap-1">
            <p>
              Created by <span className="font-bold text-[var(--text-main)]">Hitesh Panigrahi</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 flex-wrap justify-center">
            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center">
              <button
                onClick={onFeedback}
                className="flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] transition hover:border-[var(--accent-mint)] hover:text-[var(--accent-mint)] hover:scale-105 active:scale-95 shadow-sm"
              >
                <MessageSquareHeart size={14} className="text-[var(--accent-mint)]" />
                Feedback
              </button>
              <button
                onClick={() => openGmailCompose()}
                className="flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] transition hover:border-[#6B7FD7] hover:text-[#6B7FD7] hover:scale-105 active:scale-95 shadow-sm"
                title="Feature requests & bug reports via Gmail"
              >
                <Mail size={14} className="text-[#6B7FD7]" />
                Feature / Bug Report
              </button>
              <button
                onClick={() => onLaunch("support")}
                className="flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] transition hover:brightness-105 hover:bg-[var(--bg-secondary)] hover:scale-105 active:scale-95 shadow-sm"
              >
                <CupSoda size={14} className="text-[var(--accent-coral)]" />
                Buy me a drink
              </button>
            </div>

            {/* Socials: next line on mobile/responsive, inline with separator on larger screens */}
            <div className="flex items-center gap-4 text-[var(--text-muted)] pt-1 sm:pt-0 sm:border-l sm:border-[var(--border-color)] sm:pl-5">
              <a href="https://github.com/hiteshpanigrahi" target="_blank" rel="noreferrer" className="hover:text-[var(--accent-mint)] transition-colors" aria-label="GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"></path></svg>
              </a>
              <a href="https://www.linkedin.com/in/hitesh-panigrahi-2244312b7/" target="_blank" rel="noreferrer" className="hover:text-[var(--accent-mint)] transition-colors" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[var(--accent-mint)] transition-colors" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
