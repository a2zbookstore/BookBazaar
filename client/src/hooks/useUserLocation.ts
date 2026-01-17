// import { useEffect, useState } from "react";
// import { useLocation } from "../contexts/UserLocationContext";

// interface LocationData {
//   country: string;
//   countryCode: string;
//   city?: string;
//   region?: string;
//   timezone?: string;
// }

// interface LocationHook {
//   location: LocationData | null;
//   isLoading: boolean;
//   error: string | null;
//   setManualCountry: (countryCode: string, countryName: string) => void;
//   refetch: () => void;
// }
// export const useUserLocation = (): LocationHook => {
//   const { location, setFetchedLocation, setManualLocation } = useLocation();
//   const MANUAL_SELECTION_KEY = 'manual_country_selection';
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const fetchLocationFromAPI = async (): Promise<LocationData | null> => {
//     try {
//       const response = await Promise.race([
//         fetch("https://ipapi.co/json/"),
//         new Promise<never>((_, reject) =>
//           setTimeout(() => reject(new Error("Timeout")), 5000)
//         ),
//       ]);

//       if (response.ok) {
//         const data = await response.json();
//         if (data.country_code && data.country_name) {
//           return {
//             country: data.country_name,
//             countryCode: data.country_code,
//             city: data.city,
//             region: data.region,
//             timezone: data.timezone,
//           };
//         }
//       }
//     } catch {
//       console.warn("ipapi.co failed, trying ipinfo.io");
//     }

//     try {
//       const response = await Promise.race([
//         fetch("https://ipinfo.io/json"),
//         new Promise<never>((_, reject) =>
//           setTimeout(() => reject(new Error("Timeout")), 5000)
//         ),
//       ]);

//       if (response.ok) {
//         const data = await response.json();
//         if (data.country) {
//           return {
//             country: getCountryName(data.country),
//             countryCode: data.country,
//             city: data.city,
//             region: data.region,
//             timezone: data.timezone,
//           };
//         }
//       }
//     } catch {
//       console.warn("ipinfo.io failed");
//     }

//     return null;
//   };


//   const getDefaultLocation = (): LocationData => ({
//     country: "United States",
//     countryCode: "US",
//   });

//   const getManualSelection = (): LocationData | null => {
//     try {
//       const stored = localStorage.getItem(MANUAL_SELECTION_KEY);
//       if (stored) {
//         return JSON.parse(stored);
//       }
//     } catch (err) {
//       // Storage not available or invalid data
//     }
//     return null;
//   };
//   const fetchLocation = async () => {
//     setIsLoading(true);
//     setError(null);

//     const manualSelection = getManualSelection();
//     if (manualSelection) {
//       setManualLocation(manualSelection);
//       setIsLoading(false);
//       return;
//     }

//     try {
//       const locationData = await fetchLocationFromAPI();

//       if (locationData) {
//         setFetchedLocation(locationData);
//       } else {
//         const fallback = getDefaultLocation();
//         setFetchedLocation(fallback);
//         setError("Unable to detect location, defaulting to United States");
//       }
//     } catch {
//       const fallback = getDefaultLocation();
//       setFetchedLocation(fallback);
//       setError("Location detection failed, using default location");
//     }

//     setIsLoading(false);
//   };
//   const setManualCountry = (countryCode: string, countryName: string) => {

//     setManualLocation({
//       country: countryName,
//       countryCode,
//     });
//   };
//   const refetch = () => {
//     fetchLocation();
//   };

//   useEffect(() => {
//     fetchLocation();
//   }, []);

//   return {
//     location: location
//       ? {
//         country: location.country!,
//         countryCode: location.countryCode!,
//         city: location.city ?? undefined,
//       }
//       : null,
//     isLoading,
//     error,
//     setManualCountry,
//     refetch,
//   };
// };

// /* ================= HELPERS ================= */

// const getCountryName = (countryCode: string): string => {
//   const countryNames: Record<string, string> = {
//     'US': 'United States', 'CA': 'Canada', 'GB': 'United Kingdom', 'AU': 'Australia',
//     'DE': 'Germany', 'FR': 'France', 'IN': 'India', 'JP': 'Japan', 'CN': 'China',
//     'BR': 'Brazil', 'MX': 'Mexico', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
//     'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'CH': 'Switzerland',
//     'AT': 'Austria', 'BE': 'Belgium', 'IE': 'Ireland', 'NZ': 'New Zealand',
//     'SG': 'Singapore', 'HK': 'Hong Kong', 'KR': 'South Korea', 'TH': 'Thailand', 'MY': 'Malaysia',
//     'PH': 'Philippines', 'ID': 'Indonesia', 'VN': 'Vietnam', 'TW': 'Taiwan',
//     'AE': 'United Arab Emirates', 'SA': 'Saudi Arabia', 'IL': 'Israel', 'TR': 'Turkey',
//     'GR': 'Greece', 'PT': 'Portugal', 'CZ': 'Czech Republic', 'PL': 'Poland',
//     'HU': 'Hungary', 'RO': 'Romania', 'BG': 'Bulgaria', 'HR': 'Croatia', 'SI': 'Slovenia',
//     'SK': 'Slovakia', 'LT': 'Lithuania', 'LV': 'Latvia', 'EE': 'Estonia',
//   };

//   return countryNames[countryCode] || countryCode;
// };
