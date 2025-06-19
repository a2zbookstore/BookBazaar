import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useShipping } from "@/hooks/useShipping";
import { COUNTRY_CURRENCY_MAP, SUPPORTED_CURRENCIES } from "@/lib/currencyUtils";

interface Country {
  code: string;
  name: string;
  currency: string;
  flag: string;
}

// Popular countries with their details
const POPULAR_COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  { code: 'CN', name: 'China', currency: 'CNY', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬' },
  { code: 'AE', name: 'UAE', currency: 'AED', flag: '🇦🇪' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', currency: 'NOK', flag: '🇳🇴' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', flag: '🇳🇱' },
  { code: 'IT', name: 'Italy', currency: 'EUR', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', currency: 'EUR', flag: '🇪🇸' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' }
];

interface CountrySelectorProps {
  className?: string;
  compact?: boolean;
}

export default function CountrySelector({ className = "", compact = false }: CountrySelectorProps) {
  const { location, setManualCountry } = useShipping();
  const { userCurrency, setCurrency, getSupportedCurrencies } = useCurrency();
  const [isChanging, setIsChanging] = useState(false);

  const currentCountry = POPULAR_COUNTRIES.find(c => c.code === location?.countryCode) || 
                        POPULAR_COUNTRIES.find(c => c.code === 'US');

  const handleCountryChange = async (countryCode: string) => {
    setIsChanging(true);
    try {
      const selectedCountry = POPULAR_COUNTRIES.find(c => c.code === countryCode);
      if (selectedCountry) {
        // Update currency based on selected country
        const newCurrency = COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
        setCurrency(newCurrency);
        
        // Set manual country which will update shipping rates and location
        await setManualCountry(countryCode);
        
        // Store selected country preference
        localStorage.setItem('user_selected_country', countryCode);
        localStorage.setItem('user_selected_country_name', selectedCountry.name);
        
        console.log(`Country changed to ${selectedCountry.name}, currency set to ${newCurrency}`);
        
        // Auto-refresh page to reflect changes immediately
        setTimeout(() => {
          window.location.reload();
        }, 500); // Small delay to ensure state updates are complete
      }
    } catch (error) {
      console.error('Error changing country:', error);
      setIsChanging(false);
    }
    // Don't set isChanging to false here since page will reload
  };

  const getCurrentCurrencySymbol = () => {
    return getSupportedCurrencies().find(c => c.code === userCurrency)?.symbol || '$';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Select value={currentCountry?.code} onValueChange={handleCountryChange} disabled={isChanging}>
          <SelectTrigger className="w-20 h-8 text-xs border-primary-aqua">
            <SelectValue>
              <div className="flex items-center gap-1">
                <span>{currentCountry?.flag}</span>
                <span className="font-medium">{currentCountry?.code}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {POPULAR_COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span className="text-sm">{country.name}</span>
                  </div>
                  <span className="text-xs text-secondary-black ml-2">
                    {SUPPORTED_CURRENCIES.find(c => c.code === country.currency)?.symbol} {country.currency}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={currentCountry?.code} onValueChange={handleCountryChange} disabled={isChanging}>
        <SelectTrigger className="text-xs px-2 py-1 rounded hover:bg-primary-aqua hover:text-white transition-colors border border-gray-300 w-auto h-8 text-gray-600">
          <SelectValue>
            <div className="flex items-center gap-1">
              <span className="text-sm">{currentCountry?.flag}</span>
              <span className="font-medium text-xs">{currentCountry?.code}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60 w-64">
          <div className="px-2 py-1 text-xs text-secondary-black border-b">
            Select your country for local pricing
          </div>
          {POPULAR_COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-base">{country.flag}</span>
                  <span className="text-sm">{country.name}</span>
                </div>
                <Badge variant="outline" className="text-xs ml-2">
                  {SUPPORTED_CURRENCIES.find(c => c.code === country.currency)?.symbol} {country.currency}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {isChanging && (
        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
          Updating...
        </Badge>
      )}
    </div>
  );
}