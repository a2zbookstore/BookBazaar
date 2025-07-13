import { format, addDays, addBusinessDays } from 'date-fns';

export interface DeliveryEstimate {
  minDate: Date;
  maxDate: Date;
  minDateFormatted: string;
  maxDateFormatted: string;
  deliveryRange: string;
  deliveryText: string;
}

/**
 * Calculate expected delivery date range based on shipping configuration
 * @param minDeliveryDays - Minimum delivery days from admin panel
 * @param maxDeliveryDays - Maximum delivery days from admin panel
 * @param useBusinessDays - Whether to use business days (excludes weekends)
 * @returns Delivery date estimate object
 */
export const calculateDeliveryDate = (
  minDeliveryDays: number,
  maxDeliveryDays: number,
  useBusinessDays: boolean = true
): DeliveryEstimate => {
  const today = new Date();
  
  // Use business days for more accurate estimation (excludes weekends)
  const minDate = useBusinessDays 
    ? addBusinessDays(today, minDeliveryDays)
    : addDays(today, minDeliveryDays);
    
  const maxDate = useBusinessDays 
    ? addBusinessDays(today, maxDeliveryDays)
    : addDays(today, maxDeliveryDays);

  // Format dates for display
  const minDateFormatted = format(minDate, 'dd/MM/yyyy');
  const maxDateFormatted = format(maxDate, 'dd/MM/yyyy');

  // Create delivery range text
  const deliveryRange = minDeliveryDays === maxDeliveryDays 
    ? minDateFormatted 
    : `${minDateFormatted} - ${maxDateFormatted}`;

  // Create delivery text with days
  const deliveryText = minDeliveryDays === maxDeliveryDays
    ? `Expected delivery: ${minDateFormatted} (${minDeliveryDays} business days)`
    : `Expected delivery: ${minDateFormatted} - ${maxDateFormatted} (${minDeliveryDays}-${maxDeliveryDays} business days)`;

  return {
    minDate,
    maxDate,
    minDateFormatted,
    maxDateFormatted,
    deliveryRange,
    deliveryText
  };
};

/**
 * Get delivery estimate text for display
 * @param minDeliveryDays - Minimum delivery days
 * @param maxDeliveryDays - Maximum delivery days  
 * @param countryName - Country name for context
 * @returns Formatted delivery text
 */
export const getDeliveryEstimateText = (
  minDeliveryDays: number,
  maxDeliveryDays: number,
  countryName?: string
): string => {
  const estimate = calculateDeliveryDate(minDeliveryDays, maxDeliveryDays);
  
  if (countryName) {
    return `${estimate.deliveryText} to ${countryName}`;
  }
  
  return estimate.deliveryText;
};

/**
 * Get short delivery range for compact display
 * @param minDeliveryDays - Minimum delivery days
 * @param maxDeliveryDays - Maximum delivery days
 * @returns Short delivery range text
 */
export const getShortDeliveryRange = (
  minDeliveryDays: number,
  maxDeliveryDays: number
): string => {
  const estimate = calculateDeliveryDate(minDeliveryDays, maxDeliveryDays);
  return estimate.deliveryRange;
};