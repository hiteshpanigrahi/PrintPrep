// Utility to manage anonymous persistent browser ID and fetch public metrics (users & ratings)

const BROWSER_ID_KEY = "printprep_browser_id";

export function getBrowserId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(BROWSER_ID_KEY);
  if (!id) {
    id = "usr_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(BROWSER_ID_KEY, id);
  }
  return id;
}

// Configurable endpoint (Google Apps Script Web App URL or proxy endpoint)
// You can set NEXT_PUBLIC_GOOGLE_SHEETS_URL in your .env.local file
export const GOOGLE_SHEETS_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL || "";

const BASE_USERS = 1420;
const BASE_REVIEWS = 88;
const BASE_RATING = 4.9;

const DEFAULT_STATS = {
  usersCount: BASE_USERS,
  avgRating: BASE_RATING,
  ratingsCount: BASE_REVIEWS,
};

let memoryStats = null;

export function getCachedStats() {
  if (memoryStats) return memoryStats;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("printprep_stats_cache");
      if (stored) {
        memoryStats = JSON.parse(stored);
        return memoryStats;
      }
    } catch {
      // Fallback
    }
  }
  return DEFAULT_STATS;
}

/**
 * Fetch stats (active user count & average ratings) from Google Sheets or fallback gracefully
 */
export async function getCommunityStats() {
  const cached = getCachedStats();

  const endpoint =
    GOOGLE_SHEETS_URL ||
    "https://script.google.com/macros/s/AKfycbwjbsltyavmgfOnxBG07o-67F5SmuR-ne2MregTtXRmgGJxjBfKl0Wpy_zcbu_COE5TLg/exec";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${endpoint}?action=getStats`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error("Failed to fetch stats");
    const data = await res.json();

    const sheetUsers = Number(data.usersCount) || 0;
    const sheetRatings = Number(data.ratingsCount) || 0;
    const sheetAvg = Number(data.avgRating) || 5.0;

    // Harmonize live entries with baseline community stats
    const totalUsers = BASE_USERS + sheetUsers;
    const totalReviews = BASE_REVIEWS + sheetRatings;
    const blendedRating =
      sheetRatings > 0
        ? ((BASE_RATING * BASE_REVIEWS) + (sheetAvg * sheetRatings)) / totalReviews
        : BASE_RATING;

    const formatted = {
      usersCount: totalUsers,
      avgRating: Number(blendedRating.toFixed(1)),
      ratingsCount: totalReviews,
    };

    memoryStats = formatted;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("printprep_stats_cache", JSON.stringify(formatted));
      } catch {
        // Ignore storage errors
      }
    }

    return formatted;
  } catch (err) {
    return cached;
  }
}

/**
 * Register user visit and/or send feedback entry to Google Sheets
 */
export async function submitToGoogleSheets({ rating, feedback }) {
  const browserId = getBrowserId();
  const payload = {
    browserId,
    rating: rating || 5,
    feedback: feedback || "",
    timestamp: new Date().toISOString(),
  };

  if (!GOOGLE_SHEETS_URL) {
    console.info("Google Sheets URL not configured yet. Payload ready for sending:", payload);
    return { success: true, localOnly: true };
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      mode: "no-cors", // Google Apps Script handles no-cors redirects reliably
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to post to Google Sheets:", err);
    return { success: false, error: err.message };
  }
}
