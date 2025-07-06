import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<{code: string, name: string, flag: string} | null>(null);

  useEffect(() => {
    // Get saved country from localStorage or default to US
    try {
      const saved = localStorage.getItem('manual_country_selection');
      if (saved) {
        const parsed = JSON.parse(saved);
        const country = POPULAR_COUNTRIES.find(c => c.code === parsed.countryCode);
        if (country) {
          setCurrentCountry(country);
        }
      } else {
        // Default to US
        setCurrentCountry(POPULAR_COUNTRIES[0]);
      }
    } catch (error) {
      // Default to US if any error
      setCurrentCountry(POPULAR_COUNTRIES[0]);
    }
  }, []);

  const handleCountrySelect = (country: {code: string, name: string, flag: string}) => {
    try {
      setCurrentCountry(country);
      setIsOpen(false);
      
      // Save to localStorage
      localStorage.setItem('manual_country_selection', JSON.stringify({
        countryCode: country.code,
        country: country.name
      }));
      
      // Refresh page to update shipping costs and currency
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error selecting country:', error);
      setIsOpen(false);
    }
  };

  if (!currentCountry) {
    return (
      <button 
        className={`text-xs px-2 py-1 rounded border hover:bg-gray-50 ${className}`}
        disabled
      >
        <Globe className="h-3 w-3 mr-1 inline" />
        Loading...
      </button>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`text-xs px-2 py-1 rounded border hover:bg-gray-50 flex items-center ${className}`}
      >
        <span className="mr-1">{currentCountry.flag}</span>
        <span className="hidden sm:inline">{currentCountry.name}</span>
        <span className="sm:hidden">{currentCountry.code}</span>
        <ChevronDown className="h-3 w-3 ml-1" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b">
            Select Your Country
          </div>
          <div className="max-h-64 overflow-y-auto">
            {POPULAR_COUNTRIES.map((country) => (
              <div
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <span className="mr-2">{country.flag}</span>
                  <span>{country.name}</span>
                </div>
                {currentCountry.code === country.code && (
                  <span className="text-green-600 text-xs">✓</span>
                )}
              </div>
            ))}
          </div>
          <div className="px-2 py-1 text-xs text-gray-500 border-t">
            Shipping costs will update automatically
          </div>
        </div>
      )}
      
      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}