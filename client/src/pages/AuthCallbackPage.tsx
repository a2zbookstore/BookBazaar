import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function AuthCallbackPage() {
  const params = new URLSearchParams(window.location.search);
  const destination = params.get("to") || "/";
  const [, setLocation] = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Force a real network request and wait for it to settle before navigating
    queryClient
      .refetchQueries({ queryKey: ["/api/auth/user"] })
      .then(() => setReady(true))
      .catch(() => setReady(true)); // navigate anyway on error — user will see login page
  }, []);

  useEffect(() => {
    if (ready) {
      // Guard: only allow same-origin paths
      const safe = destination.startsWith("/") ? destination : "/";
      setLocation(safe);
    }
  }, [ready, destination, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-aqua mx-auto" />
        <p className="mt-4 text-secondary-black">Signing you in…</p>
      </div>
    </div>
  );
}
