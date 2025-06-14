import { useState, useEffect } from 'react';
import { 
  getUserLocation, 
  getShippingInfo, 
  getStoredLocationInfo, 
  storeLocationInfo,
  type LocationInfo,
  type ShippingInfo 
} from '@/lib/locationUtils';
import { useCurrency } from '@/hooks/useCurrency';
import { getCurrencyForCountry } from '@/lib/currencyUtils';

export interface UseShippingReturn {
  location: LocationInfo | null;
  shipping: ShippingInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  setManualCountry: (countryCode: string) => Promise<void>;
}

export function useShipping(): UseShippingReturn {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShippingInfo = async (countryCode: string) => {
    try {
      const shippingInfo = await getShippingInfo(countryCode);
      setShipping(shippingInfo);
      setError(null);
    } catch (err) {
      setError('Failed to get shipping information');
      console.error('Error fetching shipping info:', err);
    }
  };

  const detectLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First try to get stored location
      const storedLocation = getStoredLocationInfo();
      if (storedLocation) {
        setLocation(storedLocation);
        await fetchShippingInfo(storedLocation.countryCode);
        setIsLoading(false);
        return;
      }

      // If no stored location, detect it
      const detectedLocation = await getUserLocation();
      if (detectedLocation) {
        setLocation(detectedLocation);
        storeLocationInfo(detectedLocation);
        await fetchShippingInfo(detectedLocation.countryCode);
      } else {
        setError('Could not detect your location. Please select your country manually.');
      }
    } catch (err) {
      setError('Failed to detect location');
      console.error('Error detecting location:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLocation = async () => {
    await detectLocation();
  };

  const setManualCountry = async (countryCode: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create a basic location object for the selected country
      const manualLocation: LocationInfo = {
        country: countryCode,
        countryCode: countryCode.toUpperCase()
      };
      
      setLocation(manualLocation);
      storeLocationInfo(manualLocation);
      await fetchShippingInfo(countryCode);
    } catch (err) {
      setError('Failed to get shipping information for selected country');
      console.error('Error setting manual country:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  return {
    location,
    shipping,
    isLoading,
    error,
    refreshLocation,
    setManualCountry
  };
}