"use client";

import { useEffect, useState } from "react";
import { Users, Star } from "lucide-react";
import { getBrowserId, getCommunityStats, getCachedStats, registerUniqueVisit } from "../utils/analytics";

export default function NavStatsBadge({ className = "" }) {
  const [stats, setStats] = useState(() => getCachedStats());

  useEffect(() => {
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
      className={`flex items-center gap-1.5 sm:gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 sm:px-2.5 py-1 text-xs font-semibold text-[var(--text-main)] shrink-0 select-none antialiased ${className}`}
      style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
    >
      {/* Users Count */}
      <div className="flex items-center gap-1 text-[var(--text-muted)]" title={`${stats.usersCount?.toLocaleString()} total users`}>
        <Users size={12} className="text-[var(--accent-mint)] shrink-0 sm:w-3.5 sm:h-3.5" />
        <span 
          className="text-[11px] sm:text-xs font-semibold tabular-nums text-[var(--text-main)] whitespace-nowrap"
          style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
        >
          {stats.usersCount ? `${stats.usersCount.toLocaleString()}+` : "1,420+"}
        </span>
      </div>

      <span className="h-2.5 w-[1px] bg-[var(--border-color)] shrink-0 opacity-70" />

      {/* Average Rating */}
      <div className="flex items-center gap-1 text-[var(--text-muted)]" title={`${stats.avgRating} average rating (${stats.ratingsCount || 88} reviews)`}>
        <Star size={12} className="fill-yellow-400 text-yellow-400 shrink-0 sm:w-3.5 sm:h-3.5" />
        <span 
          className="text-[11px] sm:text-xs font-semibold tabular-nums text-[var(--text-main)] whitespace-nowrap"
          style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
        >
          {stats.avgRating ? Number(stats.avgRating).toFixed(1) : "4.9"}
        </span>
      </div>
    </div>
  );
}
