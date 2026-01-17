import { useUserLocation } from '@/contexts/userLocationContext';
import { useQuery } from '@tanstack/react-query';

interface ShippingRate {
  id: number;
  countryCode: string;
  countryName: string;
  shippingCost: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ShippingHook {
  shippingRate: ShippingRate | null;
  isLoading: boolean;
  error: string | null;
  shippingCost: number;
  deliveryTime: string;
  countryCode: string | null;
  countryName: string | null;
}

export const useShipping = (): ShippingHook => {
  const { location } = useUserLocation();

  const {
    data: shippingRate,
    isLoading: shippingLoading,
    error,
  } = useQuery<ShippingRate>({
    queryKey: ['/api/shipping-rates/country', location?.countryCode],
    queryFn: () => 
      fetch(`/api/shipping-rates/country/${location?.countryCode}`)
        .then(res => res.json()),
    enabled: !!location?.countryCode
  });

  const shippingCost = shippingRate ? parseFloat(shippingRate.shippingCost) : 0;
  
  const deliveryTime = shippingRate 
    ? shippingRate.minDeliveryDays === shippingRate.maxDeliveryDays
      ? `${shippingRate.minDeliveryDays} days`
      : `${shippingRate.minDeliveryDays}-${shippingRate.maxDeliveryDays} days`
    : 'TBD';

  return {
    shippingRate: shippingRate ?? null,
    isLoading: shippingLoading,
    error: error instanceof Error ? error.message : null,
    shippingCost,
    deliveryTime,
    countryCode: location?.countryCode || null,
    countryName: location?.country || null,
  };
};