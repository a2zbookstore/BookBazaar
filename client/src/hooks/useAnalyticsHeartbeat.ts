import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUserLocation } from "@/contexts/userLocationContext";

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

/**
 * Sends a periodic heartbeat to the server so that:
 * 1. `lastActivity` stays fresh for real-time visitor counts (SPA doesn't reload HTML)
 * 2. `userId` gets backfilled on the analytics session once the user logs in
 * 3. `country`/`city` get stored in the session from client-side geo detection
 *
 * Also fires immediately on mount and on every client-side route change.
 */
export function useAnalyticsHeartbeat() {
  const [location] = useLocation();
  const { location: userLocation } = useUserLocation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendHeartbeat = (currentPage: string) => {
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

  // Fire on every route change
  useEffect(() => {
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
