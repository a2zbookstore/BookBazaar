import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUserLocation } from "@/contexts/userLocationContext";

const HEARTBEAT_INTERVAL_MS = 30_000;       // 30 seconds
const INACTIVITY_TIMEOUT_MS = 5 * 60_000;  // 5 minutes — suppress heartbeats after this

/**
 * Sends a periodic heartbeat to the server so that:
 * 1. `lastActivity` stays fresh for real-time visitor counts (SPA doesn't reload HTML)
 * 2. `userId` gets backfilled on the analytics session once the user logs in
 * 3. `country`/`city` get stored in the session from client-side geo detection
 *
 * Heartbeats are suppressed when the user has been idle for 5+ minutes so that
 * open-but-abandoned tabs no longer appear as "online" in the admin analytics panel.
 * Also fires immediately on mount and on every client-side route change.
 */
export function useAnalyticsHeartbeat() {
  const [location] = useLocation();
  const { location: userLocation } = useUserLocation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks the timestamp of the last meaningful user interaction
  const lastActivityRef = useRef<number>(Date.now());

  // Stamp lastActivityRef on any real user interaction
  useEffect(() => {
    const markActive = () => { lastActivityRef.current = Date.now(); };
    const events = ["mousemove", "keydown", "scroll", "touchstart", "click"] as const;
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, markActive));
  }, []);

  const sendHeartbeat = (currentPage: string) => {
    // Don't track admin page visits
    if (currentPage.startsWith("/admin")) return;
    // Suppress heartbeat if user has been idle beyond the inactivity threshold
    if (Date.now() - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS) return;
    // fire-and-forget, never block the UI
    fetch("/api/analytics/heartbeat", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPage,
        country: userLocation.country,
        countryCode: userLocation.countryCode,
        city: userLocation.city,
      }),
    }).catch(() => {
      // silently ignore network errors
    });
  };

  // Navigation counts as activity — fire immediately on every route change
  useEffect(() => {
    lastActivityRef.current = Date.now();
    sendHeartbeat(location);
  }, [location]);

  // Set up interval heartbeat
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      sendHeartbeat(location);
    }, HEARTBEAT_INTERVAL_MS);

    // Also send when tab becomes visible again after being hidden
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat(location);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []); // only mount/unmount
}
