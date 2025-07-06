import React, { useState } from 'react';
import { Globe, ChevronDown, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useLocation } from '@/hooks/useLocation';
import { useShipping } from '@/hooks/useShipping';

const POPULAR_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
];

interface CountrySelectorProps {
  className?: string;
  showShippingCost?: boolean;
}

export default function CountrySelector({ 
  className = "", 
  showShippingCost = true 
}: CountrySelectorProps) {
  const { location, setManualCountry, isLoading: locationLoading } = useLocation();
  const { shippingCost, isLoading: shippingLoading, error: shippingError } = useShipping();
  const [isOpen, setIsOpen] = useState(false);

  const handleCountrySelect = (countryCode: string, countryName: string) => {
    try {
      setManualCountry(countryCode, countryName);
      setIsOpen(false);
      // Refresh page to update shipping costs and currency
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error selecting country:', error);
      setIsOpen(false);
    }
  };

  const getCurrentFlag = () => {
    try {
      const country = POPULAR_COUNTRIES.find(c => c.code === location?.countryCode);
      return country?.flag || '🌍';
    } catch (error) {
      console.error('Error getting flag:', error);
      return '🌍';
    }
  };

  const isLoading = locationLoading || shippingLoading;

  // Return error state if shipping error
  if (shippingError) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className={`text-xs px-2 py-1 rounded border hover:bg-gray-50 ${className}`}
        disabled
      >
        <Globe className="h-3 w-3 mr-1" />
        Error
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`text-xs px-2 py-1 rounded border hover:bg-gray-50 ${className}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Globe className="h-3 w-3 mr-1" />
              Loading...
            </>
          ) : (
            <>
              <span className="mr-1">{getCurrentFlag()}</span>
              <span className="hidden sm:inline">{location?.country || 'Select Country'}</span>
              <span className="sm:hidden">{location?.countryCode || 'Country'}</span>
              {showShippingCost && shippingCost > 0 && (
                <span className="ml-1 text-green-600">
                  (${shippingCost.toFixed(2)})
                </span>
              )}
              {showShippingCost && shippingCost === 0 && (
                <span className="ml-1 text-green-600">
                  (Free)
                </span>
              )}
              <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b">
          <MapPin className="h-3 w-3 inline mr-1" />
          Select Your Country
        </div>
        {POPULAR_COUNTRIES.map((country) => (
          <DropdownMenuItem
            key={country.code}
            onClick={() => handleCountrySelect(country.code, country.name)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center">
              <span className="mr-2">{country.flag}</span>
              <span>{country.name}</span>
            </div>
            {location?.countryCode === country.code && (
              <span className="text-green-600 text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
        <div className="px-2 py-1 text-xs text-gray-500 border-t">
          Shipping costs will update automatically
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}