"use client";

import { useEffect, useState } from "react";
import { Users, Star } from "lucide-react";
import { 
  getBrowserId, 
  getCommunityStats, 
  getCachedStats, 
  registerUniqueVisit, 
  DEFAULT_STATS 
} from "../utils/analytics";

export default function NavStatsBadge({ className = "", onClick }) {
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
    // Read cached stats after mount to prevent server-client hydration mismatch
    const cached = getCachedStats();
    if (cached) {
      setStats(cached);
    }

    // Ensure browser id is initialized and unique visit is registered once
    getBrowserId();
    registerUniqueVisit();

    // Fetch live community stats
    getCommunityStats().then((data) => {
      if (data) {
        setStats(data);
      }
    });
  }, []);

  return (
    <div 
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`flex items-center gap-1.5 sm:gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 sm:px-2.5 py-1 text-xs font-semibold text-[var(--text-main)] shrink-0 select-none antialiased ${onClick ? "cursor-pointer hover:border-[var(--accent-mint)] hover:scale-105 active:scale-95 transition-all" : ""} ${className}`}
      style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
      title={onClick ? "Click to view ratings or give feedback" : undefined}
    >
      {/* Users Count */}
      <div className="flex items-center gap-1 text-[var(--text-muted)]" title={`${stats.usersCount || 0} unique users`}>
        <Users size={12} className="text-[var(--accent-mint)] shrink-0 sm:w-3.5 sm:h-3.5" />
        <span 
          className="text-[11px] sm:text-xs font-semibold tabular-nums text-[var(--text-main)] whitespace-nowrap"
          style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
        >
          {stats.usersCount ?? 0}
        </span>
      </div>

      <span className="h-2.5 w-[1px] bg-[var(--border-color)] shrink-0 opacity-70" />

      {/* Average Rating */}
      <div className="flex items-center gap-1 text-[var(--text-muted)]" title={`${stats.avgRating || 5.0} rating (${stats.ratingsCount || 0} reviews)`}>
        <Star size={12} className="fill-yellow-400 text-yellow-400 shrink-0 sm:w-3.5 sm:h-3.5" />
        <span 
          className="text-[11px] sm:text-xs font-semibold tabular-nums text-[var(--text-main)] whitespace-nowrap"
          style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
        >
          {stats.avgRating ? Number(stats.avgRating).toFixed(1) : "5.0"}
        </span>
      </div>
    </div>
  );
}
