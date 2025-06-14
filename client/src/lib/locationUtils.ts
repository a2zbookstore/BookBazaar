// Location detection and shipping calculation utilities

export interface LocationInfo {
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
}

export interface ShippingInfo {
  cost: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  isDefault: boolean;
}

/**
 * Get user's location using IP geolocation
 */
export async function getUserLocation(): Promise<LocationInfo | null> {
  try {
    // Try multiple geolocation services for better reliability
    const services = [
      'https://ipapi.co/json/',
      'https://api.ipgeolocation.io/ipgeo?apiKey=free',
      'https://freegeoip.app/json/'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        if (response.ok) {
          const data = await response.json();
          
          // Normalize response based on service
          if (service.includes('ipapi.co')) {
            return {
              country: data.country_name,
              countryCode: data.country_code,
              city: data.city,
              region: data.region
            };
          } else if (service.includes('ipgeolocation.io')) {
            return {
              country: data.country_name,
              countryCode: data.country_code2,
              city: data.city,
              region: data.state_prov
            };
          } else if (service.includes('freegeoip.app')) {
            return {
              country: data.country_name,
              countryCode: data.country_code,
              city: data.city,
              region: data.region_name
            };
          }
        }
      } catch (error) {
        console.warn(`Failed to get location from ${service}:`, error);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
}

/**
 * Get shipping information for a specific country
 */
export async function getShippingInfo(countryCode: string): Promise<ShippingInfo | null> {
  try {
    const response = await fetch(`/api/shipping-rates/country/${countryCode.toUpperCase()}`);
    if (response.ok) {
      const data = await response.json();
      return {
        cost: data.shippingCost,
        minDeliveryDays: data.minDeliveryDays,
        maxDeliveryDays: data.maxDeliveryDays,
        isDefault: data.isDefault
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting shipping info:', error);
    return null;
  }
}

/**
 * Get shipping information for user's current location
 */
export async function getShippingForUserLocation(): Promise<{
  location: LocationInfo | null;
  shipping: ShippingInfo | null;
}> {
  const location = await getUserLocation();
  let shipping = null;
  
  if (location?.countryCode) {
    shipping = await getShippingInfo(location.countryCode);
  }
  
  return { location, shipping };
}

/**
 * Format delivery time range
 */
export function formatDeliveryTime(minDays: number, maxDays: number): string {
  if (minDays === maxDays) {
    return `${minDays} ${minDays === 1 ? 'day' : 'days'}`;
  }
  return `${minDays}-${maxDays} days`;
}

/**
 * Format shipping cost
 */
export function formatShippingCost(cost: string, currency: string = 'USD'): string {
  const numericCost = parseFloat(cost);
  if (numericCost === 0) {
    return 'Free shipping';
  }
  return `$${numericCost.toFixed(2)}`;
}

/**
 * Calculate estimated delivery date
 */
export function calculateDeliveryDate(minDays: number, maxDays: number): {
  earliest: Date;
  latest: Date;
  formatted: string;
} {
  const today = new Date();
  const earliest = new Date(today);
  earliest.setDate(today.getDate() + minDays);
  
  const latest = new Date(today);
  latest.setDate(today.getDate() + maxDays);
  
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  };
  
  const formatted = minDays === maxDays 
    ? earliest.toLocaleDateString('en-US', options)
    : `${earliest.toLocaleDateString('en-US', options)} - ${latest.toLocaleDateString('en-US', options)}`;
  
  return { earliest, latest, formatted };
}

/**
 * Store location in localStorage for future use
 */
export function storeLocationInfo(location: LocationInfo): void {
  try {
    localStorage.setItem('userLocation', JSON.stringify(location));
  } catch (error) {
    console.warn('Failed to store location info:', error);
  }
}

/**
 * Get stored location from localStorage
 */
export function getStoredLocationInfo(): LocationInfo | null {
  try {
    const stored = localStorage.getItem('userLocation');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to get stored location info:', error);
    return null;
  }
}

/**
 * Clear stored location information
 */
export function clearStoredLocationInfo(): void {
  try {
    localStorage.removeItem('userLocation');
  } catch (error) {
    console.warn('Failed to clear stored location info:', error);
  }
}