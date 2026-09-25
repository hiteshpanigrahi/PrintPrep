"use client";

import { useState } from "react";
import { RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { applyPixelFilter } from "../utils/pdfProcessor";

export default function Toolbar({ pages, setPages, onRequestReset, onRequestRestore, showFilters = true }) {
  const selected = pages.filter((page) => !page.isIncluded).length;
  const [working, setWorking] = useState(false);
  async function toggleInversion(mode) {
    if (working) return;
    setWorking(true);
    const nextPages = await Promise.all(pages.map(async (page) => {
      if (page.inverted === mode) {
        return { ...page, thumbnailUrl: page.originalThumbnailUrl || page.thumbnailUrl, inverted: false };
      }
      const source = page.originalThumbnailUrl || page.thumbnailUrl;
      return { ...page, originalThumbnailUrl: source, thumbnailUrl: await applyPixelFilter(source, mode), inverted: mode };
    }));
    setPages(nextPages);
    setWorking(false);
  }
  const allSelected = pages.length > 0 && pages.every(p => p.isIncluded);
  return (
    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full">
      {showFilters && (
        <>
          <button onClick={() => toggleInversion("smart")} disabled={working} className="flex justify-center items-center gap-2 rounded-xl bg-[var(--accent-mint)] px-3 py-2.5 text-xs font-bold text-[var(--bg-main)] transition hover:brightness-110 disabled:opacity-60">
            <Sparkles size={15} /> {working ? "Cleaning..." : "Smart clean"}
          </button>
          <button onClick={() => toggleInversion("full")} disabled={working} className="flex justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-2.5 text-xs font-bold text-[var(--text-main)] transition hover:border-[var(--accent-mint)] disabled:opacity-60">
            Invert colors
          </button>
        </>
      )}
      <button onClick={onRequestRestore} className="flex justify-center items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-2.5 text-xs font-bold text-[var(--text-main)] transition hover:border-[var(--accent-mint)] hover:bg-[var(--bg-secondary)]">
        <Trash2 size={15} /> {selected ? `Restore ${selected}` : "Restore all"}
      </button>
      <button onClick={onRequestReset} className="flex justify-center items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] px-3 py-2.5 text-xs font-bold text-[var(--text-main)] transition hover:border-[var(--accent-coral)]">
        <RotateCcw size={15} /> Start over
      </button>
    </div>
  );
}
