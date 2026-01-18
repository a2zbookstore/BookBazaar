import { useState, useEffect, useCallback } from 'react';
import {
  convertCurrency,
  getPreferredCurrency,
  getCurrencyForCountry,
  formatPrice,
  getCachedExchangeRates,
  cacheExchangeRates,
  getExchangeRates,
  type ConvertedPrice,
  type CurrencyInfo,
  SUPPORTED_CURRENCIES
} from '@/lib/currencyUtils';
import { useUserLocation } from '@/contexts/userLocationContext';

export interface UseCurrencyReturn {
  userCurrency: string;
  exchangeRates: Record<string, number> | null;
  isLoading: boolean;
  error: string | null;
  convertPrice: (amount: number, fromCurrency?: string) => Promise<ConvertedPrice | null>;
  formatAmount: (amount: number, currency?: string) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  setCurrency: (currencyCode: string) => void;
  getSupportedCurrencies: () => CurrencyInfo[];
  refreshRates: () => Promise<void>;
}

export function useCurrency(countryCode?: string): UseCurrencyReturn {
  const { location } = useUserLocation();

  // Always derive currency from location.countryCode
  const derivedCurrency = location?.countryCode ? getCurrencyForCountry(location.countryCode) : 'USD';
  const [userCurrency, setUserCurrency] = useState<string>(derivedCurrency);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update userCurrency when location.countryCode changes
  useEffect(() => {
    const newCurrency = location?.countryCode ? getCurrencyForCountry(location.countryCode) : 'USD';
    setUserCurrency(newCurrency);
  }, [location?.countryCode]);

  // Initialize user currency based on location or preference
  const initializeCurrency = useCallback(async () => {
    setIsLoading(true);
    setUserCurrency(location?.countryCode ? getCurrencyForCountry(location.countryCode) : 'USD');
    setIsLoading(false);
  }, [location?.countryCode]);

  // Load exchange rates
  const loadExchangeRates = useCallback(async (baseCurrency: string = 'USD') => {
    try {
      setError(null);
      // Try to get cached rates first
      const cachedRates = getCachedExchangeRates(baseCurrency);
      if (cachedRates) {        
        setExchangeRates(cachedRates);
        setIsLoading(false);
        return;
      }

      // Fetch fresh rates      
      const rates = await getExchangeRates(baseCurrency);
      if (rates) {
        setExchangeRates(rates);
        cacheExchangeRates(rates, baseCurrency);
      } else {
        setError('Failed to load exchange rates');
      }
    } catch (err) {
      console.error('Error loading exchange rates:', err);
      setError('Failed to load exchange rates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Convert price to user's currency
  const convertPrice = useCallback(async (
    amount: number,
    fromCurrency: string = 'USD'
  ): Promise<ConvertedPrice | null> => {
    try {
      return await convertCurrency(amount, fromCurrency, userCurrency);
    } catch (err) {
      console.error('Error converting price:', err);
      return null;
    }
  }, [userCurrency]);

  // Format amount with currency symbol
  const formatAmount = useCallback((amount: number, currency?: string): string => {
    const currencyCode = currency || userCurrency;
    return formatPrice(amount, currencyCode);
  }, [userCurrency]);

  // Set user currency preference
  const setCurrency = useCallback((currencyCode: string) => {
    if (SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)) {
      setUserCurrency(currencyCode);
      // Reload exchange rates if needed
      if (currencyCode !== 'USD') {
        loadExchangeRates('USD');
      }
    }
  }, [loadExchangeRates, location]);

  // Get list of supported currencies
  const getSupportedCurrencies = useCallback((): CurrencyInfo[] => {
    return SUPPORTED_CURRENCIES;
  }, []);

  // Only load exchange rates once per currency, not per component
  useEffect(() => {
    // Only fetch if exchangeRates is null or userCurrency changed
    if (!exchangeRates || exchangeRates[userCurrency] === undefined) {
      loadExchangeRates(userCurrency);
    }
  }, [userCurrency]);

  // Remove loadExchangeRates from initialize and mount effect
  const initialize = async () => {
    await initializeCurrency();
  };

  // Refresh exchange rates
  const refreshRates = useCallback(async (): Promise<void> => {
    // Clear cache and reload fresh rates
    localStorage.removeItem('exchange_rates_cache');
    await loadExchangeRates('USD');
  }, [loadExchangeRates]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initializeCurrency]);

  // Update currency when country code changes
  useEffect(() => {
    if (countryCode) {
      const newCurrency = getCurrencyForCountry(countryCode);
      if (newCurrency !== userCurrency) {
        setCurrency(newCurrency);
      }
    }
  }, [countryCode, userCurrency, setCurrency]);

  return {
    userCurrency,
    exchangeRates,
    isLoading,
    error,
    convertPrice,
    formatAmount,
    formatCurrency: formatAmount, // Alias for consistency
    setCurrency,
    getSupportedCurrencies,
    refreshRates,
  };
}