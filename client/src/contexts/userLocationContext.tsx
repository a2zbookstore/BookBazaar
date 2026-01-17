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

  const initLocation = async () => {
    const manual = getManualLocationFromStorage();

    if (manual) {
      setManualLocation(manual);
      return;
    }

    const fetched = await fetchLocationFromAPI();
    if (fetched) {
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
  const fetchLocationFromAPI = async (): Promise<LocationData | null> => {
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
            country: getCountryName(data.country),
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

  const timeout = (ms: number) =>
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    );

  const setFetchedLocation = (data: LocationData) => {
    console.log("fetchinglocation");

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
    console.log("manuallocation");
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
