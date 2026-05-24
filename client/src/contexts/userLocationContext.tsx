import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

/* ================= TYPES ================= */

export type LocationSource =
  | "fetched_user_location"
  | "manual_country_selection";

export interface LocationState {
  source: LocationSource;
  country: string | null;
  countryCode: string | null;
  city: string | null;
}

interface LocationData {
  country: string;
  countryCode: string;
  city?: string;
}

interface LocationContextType {
  location: LocationState;
  setFetchedLocation: (data: LocationData) => void;
  setManualLocation: (data: {
    country: string;
    countryCode: string;
  }) => void;
}

/* ================= CONTEXT ================= */

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<LocationState>({
    source: "fetched_user_location",
    country: null,
    countryCode: null,
    city: null,
  });

  /* ================= INIT ON FIRST LOAD ================= */

  useEffect(() => {
    initLocation();
  }, []);

  const FETCHED_LOCATION_KEY = "fetched_location_cache";
  const FETCHED_LOCATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  const initLocation = async () => {
    // 1. Prefer manual selection (user explicitly chose a country)
    const manual = getManualLocationFromStorage();
    if (manual) {
      setManualLocation(manual);
      return;
    }

    // 2. Use cached auto-detected location to avoid re-prompting for permission
    const cached = getCachedFetchedLocation();
    if (cached) {
      setFetchedLocation(cached);
      return;
    }

    // 3. Fetch fresh (triggers geolocation permission prompt if not yet granted)
    const fetched = await fetchLocationFromAPI();
    if (fetched) {
      saveFetchedLocationToCache(fetched);
      setFetchedLocation(fetched);
    } else {
      setManualLocation({ country: "United States", countryCode: "US" });
    }
  };

  const getManualLocationFromStorage = (): {
    country: string;
    countryCode: string;
  } | null => {
    try {
      const stored = localStorage.getItem("manual_country_selection");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const getCachedFetchedLocation = (): LocationData | null => {
    try {
      const stored = localStorage.getItem(FETCHED_LOCATION_KEY);
      if (!stored) return null;
      const { data, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp > FETCHED_LOCATION_TTL_MS) {
        localStorage.removeItem(FETCHED_LOCATION_KEY);
        return null;
      }
      return data as LocationData;
    } catch {
      return null;
    }
  };

  const saveFetchedLocationToCache = (data: LocationData) => {
    try {
      localStorage.setItem(
        FETCHED_LOCATION_KEY,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch {
      // localStorage quota exceeded — silently ignore
    }
  };
  const fetchLocationFromAPI = async (): Promise<LocationData | null> => {
    // 1. Try browser Geolocation API first — GPS/Wi-Fi based, far more accurate than IP
    const browserLocation = await getBrowserGeolocation();
    if (browserLocation) return browserLocation;

    // 2. Fall back to IP-based geolocation (used when permission is denied/unavailable)
    try {
      const response = await Promise.race([
        fetch("https://ipapi.co/json/"),
        timeout(5000),
      ]);

      if (response.ok) {
        const data = await response.json();
        if (data.country_name && data.country_code) {
          return {
            country: data.country_name,
            countryCode: data.country_code,
            city: data.city,
          };
        }
      }
    } catch {
      console.warn("ipapi.co failed, trying ipinfo.io");
    }

    try {
      const response = await Promise.race([
        fetch("https://ipinfo.io/json"),
        timeout(5000),
      ]);

      if (response.ok) {
        const data = await response.json();
        if (data.country) {
          return {
            country: data.country_name || data.country,
            countryCode: data.country,
            city: data.city,
          };
        }
      }
    } catch {
      console.warn("ipinfo.io failed");
    }

    return null;
  };

  // Use the browser's native Geolocation API, then reverse-geocode with OpenStreetMap
  const getBrowserGeolocation = (): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      const timer = setTimeout(() => resolve(null), 8000);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timer);
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { "Accept-Language": "en" } }
            );
            if (!res.ok) { resolve(null); return; }
            const data = await res.json();
            const addr = data.address || {};
            const countryCode = (addr.country_code || "").toUpperCase();
            const country = addr.country || "";
            const city =
              addr.city || addr.town || addr.village || addr.county || null;
            if (country && countryCode) {
              resolve({ country, countryCode, city });
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        },
        () => {
          clearTimeout(timer);
          resolve(null); // permission denied — fall back to IP
        },
        { timeout: 7000, maximumAge: 3600000 } // cache for 1 hour
      );
    });
  };

  const timeout = (ms: number) =>
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    );

  const setFetchedLocation = (data: LocationData) => {
    saveFetchedLocationToCache(data);
    setLocation({
      source: "fetched_user_location",
      country: data.country,
      countryCode: data.countryCode,
      city: data.city ?? null,
    });
  };

  const setManualLocation = (data: {
    country: string;
    countryCode: string;
  }) => {
    setLocation({
      source: "manual_country_selection",
      country: data.country,
      countryCode: data.countryCode,
      city: null,
    });
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        setFetchedLocation,
        setManualLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useUserLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useUserLocation must be used within a LocationProvider");
  }
  return context;
};
