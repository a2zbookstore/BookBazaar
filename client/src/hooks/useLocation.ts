import { useState, useEffect } from 'react';

interface LocationData {
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
  timezone?: string;
}

interface LocationHook {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  setManualCountry: (countryCode: string, countryName: string) => void;
  refetch: () => void;
}

const STORAGE_KEY = 'user_location';
const MANUAL_SELECTION_KEY = 'manual_country_selection';

export const useLocation = (): LocationHook => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocationFromAPI = async (): Promise<LocationData | null> => {
    try {
      // Try ipapi.co first
      const response = await Promise.race([
        fetch('https://ipapi.co/json/'),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      
      if (response.ok) {
        const data = await response.json();
        if (data.country_code && data.country_name) {
          return {
            country: data.country_name,
            countryCode: data.country_code,
            city: data.city,
            region: data.region,
            timezone: data.timezone,
          };
        }
      }
    } catch (err) {
      console.warn('ipapi.co failed, trying ipinfo.io');
    }

    try {
      // Fallback to ipinfo.io
      const response = await Promise.race([
        fetch('https://ipinfo.io/json'),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      
      if (response.ok) {
        const data = await response.json();
        if (data.country) {
          return {
            country: getCountryName(data.country),
            countryCode: data.country,
            city: data.city,
            region: data.region,
            timezone: data.timezone,
          };
        }
      }
    } catch (err) {
      console.warn('ipinfo.io failed');
    }

    return null;
  };

  const getDefaultLocation = (): LocationData => {
    return {
      country: 'United States',
      countryCode: 'US',
    };
  };

  const saveToStorage = (locationData: LocationData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locationData));
    } catch (err) {
      // Storage not available, continue without saving
    }
  };

  const getFromStorage = (): LocationData | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      // Storage not available or invalid data
    }
    return null;
  };

  const getManualSelection = (): LocationData | null => {
    try {
      const stored = localStorage.getItem(MANUAL_SELECTION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      // Storage not available or invalid data
    }
    return null;
  };

  const fetchLocation = async () => {
    setIsLoading(true);
    setError(null);

    // Check for manual selection first
    const manualSelection = getManualSelection();
    if (manualSelection) {
      setLocation(manualSelection);
      setIsLoading(false);
      return;
    }

    // Check storage for recent location
    const storedLocation = getFromStorage();
    if (storedLocation) {
      setLocation(storedLocation);
      setIsLoading(false);
      return;
    }

    // Fetch from IP geolocation API
    try {
      const locationData = await fetchLocationFromAPI();
      
      if (locationData) {
        setLocation(locationData);
        saveToStorage(locationData);
      } else {
        // Use default location (USA) if all fails
        const defaultLocation = getDefaultLocation();
        setLocation(defaultLocation);
        saveToStorage(defaultLocation);
        setError('Unable to detect location, defaulting to United States');
      }
    } catch (err) {
      const defaultLocation = getDefaultLocation();
      setLocation(defaultLocation);
      saveToStorage(defaultLocation);
      setError('Location detection failed, using default location');
    }

    setIsLoading(false);
  };

  const setManualCountry = (countryCode: string, countryName: string) => {
    const manualLocation: LocationData = {
      country: countryName,
      countryCode: countryCode,
    };
    
    setLocation(manualLocation);
    
    try {
      localStorage.setItem(MANUAL_SELECTION_KEY, JSON.stringify(manualLocation));
      // Remove automatic detection from storage
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      // Storage not available, continue
    }
  };

  const refetch = () => {
    // Clear manual selection and stored location, then refetch
    try {
      localStorage.removeItem(MANUAL_SELECTION_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      // Storage not available
    }
    fetchLocation();
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return {
    location,
    isLoading,
    error,
    setManualCountry,
    refetch,
  };
};

// Helper function to get country name from country code
const getCountryName = (countryCode: string): string => {
  const countryNames: Record<string, string> = {
    'US': 'United States',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IN': 'India',
    'JP': 'Japan',
    'CN': 'China',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'BE': 'Belgium',
    'IE': 'Ireland',
    'NZ': 'New Zealand',
    'SG': 'Singapore',
    'HK': 'Hong Kong',
    'KR': 'South Korea',
    'TH': 'Thailand',
    'MY': 'Malaysia',
    'PH': 'Philippines',
    'ID': 'Indonesia',
    'VN': 'Vietnam',
    'TW': 'Taiwan',
    'AE': 'United Arab Emirates',
    'SA': 'Saudi Arabia',
    'IL': 'Israel',
    'TR': 'Turkey',
    'GR': 'Greece',
    'PT': 'Portugal',
    'CZ': 'Czech Republic',
    'PL': 'Poland',
    'HU': 'Hungary',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'HR': 'Croatia',
    'SI': 'Slovenia',
    'SK': 'Slovakia',
    'LT': 'Lithuania',
    'LV': 'Latvia',
    'EE': 'Estonia',
  };

  return countryNames[countryCode] || countryCode;
};