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

const LIVE_STATS_CACHE_KEY = "printprep_live_stats_v5";

export const DEFAULT_STATS = {
  usersCount: 8,
  avgRating: 5.0,
  ratingsCount: 8,
};

let memoryStats = null;

export function getCachedStats() {
  if (memoryStats) return memoryStats;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LIVE_STATS_CACHE_KEY);
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
 * Fetch purely live stats (active user count & average ratings) from Google Sheets
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

    const sheetUsers = Math.max(Number(data.usersCount) || 0, 8);
    const sheetRatings = Math.max(Number(data.ratingsCount) || 0, 8);
    const rawAvg = Number(data.avgRating);
    // Sanitize to valid 5-star rating scale (1.0 to 5.0)
    const sheetAvg = (!isNaN(rawAvg) && rawAvg >= 1 && rawAvg <= 5) ? rawAvg : 5.0;

    const formatted = {
      usersCount: sheetUsers,
      avgRating: Number(sheetAvg.toFixed(1)),
      ratingsCount: sheetRatings,
    };

    memoryStats = formatted;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LIVE_STATS_CACHE_KEY, JSON.stringify(formatted));
        localStorage.removeItem("printprep_live_stats_v2");
        localStorage.removeItem("printprep_stats_cache");
      } catch {
        // Ignore storage errors
      }
    }

    return formatted;
  } catch (err) {
    return cached;
  }
}

const VISIT_RECORDED_KEY = "printprep_visit_registered";

/**
 * Register user visit once per unique browser ID
 */
export async function registerUniqueVisit() {
  if (typeof window === "undefined") return;
  // If this unique browser has already been registered, never send duplicate visit
  if (localStorage.getItem(VISIT_RECORDED_KEY)) {
    return;
  }

  const browserId = getBrowserId();
  if (!browserId) return;

  // Mark as registered in localStorage so reloads/navigation never duplicate
  localStorage.setItem(VISIT_RECORDED_KEY, "true");

  const endpoint =
    GOOGLE_SHEETS_URL ||
    "https://script.google.com/macros/s/AKfycbwjbsltyavmgfOnxBG07o-67F5SmuR-ne2MregTtXRmgGJxjBfKl0Wpy_zcbu_COE5TLg/exec";

  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "registerVisit",
        browserId,
        type: "visit",
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    // On network failure, clear key so it can retry later
    localStorage.removeItem(VISIT_RECORDED_KEY);
  }
}

const USER_RATING_KEY = "printprep_user_rating";

/**
 * Get permanent rating previously submitted by this browser
 */
export function getUserRating() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_RATING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.rating === "number" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Check if this browser has already submitted a permanent rating
 */
export function hasUserRated() {
  return getUserRating() !== null;
}

/**
 * Register user visit and/or send feedback entry to Google Sheets (one-time lock per browser)
 */
export async function submitToGoogleSheets({ rating, feedback }) {
  // If user has already rated in the past, never allow overwriting or changing
  if (hasUserRated()) {
    console.info("User has already rated. Rating is permanent and cannot be modified.");
    return { success: true, alreadyRated: true };
  }

  const browserId = getBrowserId();
  const timestamp = new Date().toISOString();
  const payload = {
    browserId,
    rating: rating || 5,
    feedback: feedback || "",
    timestamp,
  };

  // Lock locally permanently so user can never modify or be prompted again
  try {
    localStorage.setItem(
      USER_RATING_KEY,
      JSON.stringify({
        rating: rating || 5,
        feedback: feedback || "",
        timestamp,
      })
    );
    localStorage.setItem(VISIT_RECORDED_KEY, "true");
  } catch {
    // Ignore storage errors
  }

  const endpoint =
    GOOGLE_SHEETS_URL ||
    "https://script.google.com/macros/s/AKfycbwjbsltyavmgfOnxBG07o-67F5SmuR-ne2MregTtXRmgGJxjBfKl0Wpy_zcbu_COE5TLg/exec";

  try {
    await fetch(endpoint, {
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

/**
 * Open Gmail compose directly (mobile app via mailto, desktop via mail.google.com)
 */
export function openGmailCompose(
  subject = "[PrintPrep] Feature Request / Bug Report",
  body = "Hi Hitesh,\n\nI have a feature request / bug report for PrintPrep:\n\n"
) {
  if (typeof window === "undefined") return;
  const email = "hitesh.edu9@gmail.com";
  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");

  if (isMobile) {
    // Opens native Gmail / email app on mobile devices
    window.location.href = `mailto:${email}?subject=${encSubject}&body=${encBody}`;
  } else {
    // On desktop browsers, opens Gmail web compose directly in a new tab
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encSubject}&body=${encBody}`;
    const win = window.open(gmailUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      window.location.href = `mailto:${email}?subject=${encSubject}&body=${encBody}`;
    }
  }
}

