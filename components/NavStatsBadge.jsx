"use client";

import { useEffect, useState } from "react";
import { Users, Star } from "lucide-react";
import { getBrowserId, getCommunityStats } from "../utils/analytics";

export default function NavStatsBadge({ className = "" }) {
  const [stats, setStats] = useState({
    usersCount: null,
    avgRating: null,
    ratingsCount: null,
  });

  useEffect(() => {
    // Ensure browser id is initialized
    getBrowserId();

    // Load stats
    getCommunityStats().then((data) => {
      if (data) {
        setStats(data);
      }
    });
  }, []);

  if (!stats.usersCount && !stats.avgRating) return null;

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-bold text-[var(--text-main)] shadow-sm ${className}`}>
      {/* Users Count */}
      <div className="flex items-center gap-1 text-[var(--text-muted)]" title={`${stats.usersCount?.toLocaleString()} total users`}>
        <Users size={13} className="text-[var(--accent-mint)]" />
        <span className="font-mono text-[11px] sm:text-xs text-[var(--text-main)]">
          {stats.usersCount ? `${stats.usersCount.toLocaleString()}+` : "1,400+"}
        </span>
      </div>

      <span className="h-3 w-[1px] bg-[var(--border-color)]" />

      {/* Average Rating */}
      <div className="flex items-center gap-1 text-[var(--text-muted)]" title={`${stats.avgRating} average rating (${stats.ratingsCount || 0} reviews)`}>
        <Star size={13} className="fill-yellow-400 text-yellow-400" />
        <span className="font-mono text-[11px] sm:text-xs text-[var(--text-main)]">
          {stats.avgRating ? Number(stats.avgRating).toFixed(1) : "4.9"}
        </span>
      </div>
    </div>
  );
}
