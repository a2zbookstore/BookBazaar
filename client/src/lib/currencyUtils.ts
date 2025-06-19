// Real-time currency conversion utilities for international shipping

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

export interface ConvertedPrice {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  symbol: string;
}

// Popular currencies with their symbols
export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
];

// Country to currency mapping
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // Major currencies
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'AU': 'AUD', 'JP': 'JPY',
  'CH': 'CHF', 'CN': 'CNY', 'IN': 'INR', 'KR': 'KRW', 'SG': 'SGD',
  'HK': 'HKD', 'NO': 'NOK', 'SE': 'SEK', 'DK': 'DKK', 'PL': 'PLN',
  'CZ': 'CZK', 'HU': 'HUF', 'RU': 'RUB', 'BR': 'BRL', 'MX': 'MXN',
  'ZA': 'ZAR', 'TR': 'TRY', 'AE': 'AED', 'SA': 'SAR',
  
  // EU countries using EUR
  'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
  'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR', 'IE': 'EUR', 'FI': 'EUR',
  'GR': 'EUR', 'LU': 'EUR', 'MT': 'EUR', 'CY': 'EUR', 'SK': 'EUR',
  'SI': 'EUR', 'EE': 'EUR', 'LV': 'EUR', 'LT': 'EUR',
  
  // Additional Asian countries
  'TH': 'USD', 'VN': 'USD', 'MY': 'USD', 'ID': 'USD', 'PH': 'USD',
  'BD': 'USD', 'PK': 'USD', 'LK': 'USD', 'NP': 'USD', 'MM': 'USD',
  
  // Additional Middle East countries
  'QA': 'USD', 'KW': 'USD', 'BH': 'USD', 'OM': 'USD', 'JO': 'USD',
  'LB': 'USD', 'IL': 'USD', 'IQ': 'USD', 'IR': 'USD', 'SY': 'USD',
  
  // African countries
  'EG': 'USD', 'NG': 'USD', 'KE': 'USD', 'GH': 'USD', 'UG': 'USD',
  'TZ': 'USD', 'ZW': 'USD', 'ZM': 'USD', 'BW': 'USD', 'NA': 'USD',
  'MU': 'USD', 'MG': 'USD', 'SN': 'USD', 'CI': 'USD', 'MA': 'USD',
  'TN': 'USD', 'DZ': 'USD', 'LY': 'USD', 'SD': 'USD', 'ET': 'USD',
  
  // Latin American countries
  'AR': 'USD', 'CL': 'USD', 'CO': 'USD', 'PE': 'USD', 'VE': 'USD',
  'EC': 'USD', 'BO': 'USD', 'PY': 'USD', 'UY': 'USD', 'CR': 'USD',
  'PA': 'USD', 'GT': 'USD', 'HN': 'USD', 'NI': 'USD', 'SV': 'USD',
  'DO': 'USD', 'CU': 'USD', 'JM': 'USD', 'TT': 'USD', 'BB': 'USD',
  
  // Oceania
  'NZ': 'USD', 'FJ': 'USD', 'PG': 'USD', 'NC': 'EUR', 'PF': 'EUR',
  
  // Eastern Europe
  'UA': 'USD', 'BY': 'USD', 'MD': 'USD', 'GE': 'USD', 'AM': 'USD',
  'AZ': 'USD', 'KZ': 'USD', 'UZ': 'USD', 'TM': 'USD', 'KG': 'USD',
  'TJ': 'USD', 'MN': 'USD', 'AF': 'USD',
  
  // Other regions - default to USD for easier currency conversion
};

/**
 * Get exchange rates from a free API service
 */
export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number> | null> {
  try {
    // Using exchangerate-api.com free tier (1,500 requests/month)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.rates;
    }
    
    // Fallback to fixer.io if first API fails
    const fallbackResponse = await fetch(`https://api.fixer.io/latest?base=${baseCurrency}&access_key=free`);
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      return fallbackData.rates;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
}

/**
 * Convert price from USD to target currency
 */
export async function convertCurrency(
  amount: number, 
  fromCurrency: string = 'USD', 
  toCurrency: string
): Promise<ConvertedPrice | null> {
  try {
    if (fromCurrency === toCurrency) {
      const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency);
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: toCurrency,
        exchangeRate: 1,
        symbol: currencyInfo?.symbol || '$'
      };
    }

    const rates = await getExchangeRates(fromCurrency);
    if (!rates || !rates[toCurrency]) {
      return null;
    }

    const exchangeRate = rates[toCurrency];
    const convertedAmount = amount * exchangeRate;
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency);

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: convertedAmount,
      convertedCurrency: toCurrency,
      exchangeRate: exchangeRate,
      symbol: currencyInfo?.symbol || toCurrency
    };
  } catch (error) {
    console.error('Error converting currency:', error);
    return null;
  }
}

/**
 * Get currency for a specific country
 */
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] || 'USD';
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currencyCode: string): string {
  // Ensure amount is a number
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  
  // Handle special formatting for different currencies
  switch (currencyCode) {
    case 'JPY':
    case 'KRW':
      // No decimal places for these currencies
      return `${symbol}${Math.round(numAmount).toLocaleString()}`;
    case 'EUR':
      // Euro symbol after amount in some locales, but we'll keep it before
      return `${symbol}${numAmount.toFixed(2)}`;
    default:
      return `${symbol}${numAmount.toFixed(2)}`;
  }
}

/**
 * Get user's preferred currency based on location
 */
export async function getPreferredCurrency(countryCode?: string): Promise<string> {
  try {
    // If country code is provided, use it
    if (countryCode) {
      return getCurrencyForCountry(countryCode);
    }
    
    // Try to detect from browser locale
    const locale = navigator.language || navigator.languages?.[0];
    if (locale) {
      const countryFromLocale = locale.split('-')[1];
      if (countryFromLocale) {
        return getCurrencyForCountry(countryFromLocale);
      }
    }
    
    // Default to USD
    return 'USD';
  } catch (error) {
    console.error('Error getting preferred currency:', error);
    return 'USD';
  }
}

/**
 * Cache exchange rates in localStorage to reduce API calls
 */
export function cacheExchangeRates(rates: Record<string, number>, baseCurrency: string): void {
  try {
    const cacheData = {
      rates,
      baseCurrency,
      timestamp: Date.now(),
      expiry: Date.now() + (60 * 60 * 1000) // 1 hour expiry
    };
    localStorage.setItem('exchange_rates_cache', JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache exchange rates:', error);
  }
}

/**
 * Get cached exchange rates if still valid
 */
export function getCachedExchangeRates(baseCurrency: string): Record<string, number> | null {
  try {
    const cached = localStorage.getItem('exchange_rates_cache');
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    
    // Check if cache is still valid and for correct base currency
    if (cacheData.baseCurrency === baseCurrency && Date.now() < cacheData.expiry) {
      return cacheData.rates;
    }
    
    // Clear expired cache
    localStorage.removeItem('exchange_rates_cache');
    return null;
  } catch (error) {
    console.warn('Failed to read cached exchange rates:', error);
    return null;
  }
}