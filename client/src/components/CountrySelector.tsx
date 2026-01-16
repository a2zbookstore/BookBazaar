import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Search, X } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { getCurrencyForCountry } from '@/lib/currencyUtils';

const POPULAR_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'SEK' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', currency: 'NOK' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', currency: 'DKK' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', currency: 'NZD' },
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
  const [currentCountry, setCurrentCountry] = useState<{ code: string, name: string, flag: string, currency: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { setCurrency } = useCurrency();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      // Add small delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Filter countries based on search
  const filteredCountries = POPULAR_COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.currency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (country: { code: string, name: string, flag: string, currency: string }) => {
    try {
      setCurrentCountry(country);
      setIsOpen(false);

      // Save to localStorage
      localStorage.setItem('manual_country_selection', JSON.stringify({
        countryCode: country.code,
        country: country.name
      }));

      // Update currency without page refresh
      setCurrency(country.currency);

      // Save the currency preference
      localStorage.setItem('user_preferred_currency', country.currency);

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group text-xs px-2 py-2 rounded-xl border border-gray-300 hover:border-primary-aqua bg-white hover:bg-gray-50 flex items-center justify-between gap-1.5 transition-all duration-200 shadow-sm w-[90px] ${className} ${isOpen ? 'ring-2 ring-primary-aqua/20 border-primary-aqua' : ''}`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {/* <Globe className={`h-3.5 w-3.5 transition-colors flex-shrink-0 ${isOpen ? 'text-primary-aqua' : 'text-gray-500 group-hover:text-primary-aqua'}`} /> */}
          <span className="text-base flex-shrink-0">{currentCountry.flag}</span>
          <span className="font-medium text-gray-700 flex-shrink-0 truncate">{currentCountry.code}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-primary-aqua' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary-aqua to-cyan-500 text-black">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Select Your Country</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 " />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country, code, or currency..."
                className="w-full pl-9 pr-3 py-2 bg-white/20 border text-black text-sm focus:outline-none focus:ring-2 focus:ring-white/50 rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 text-white/70" />
                </button>
              )}
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <div
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-150 ${currentCountry && currentCountry.code === country.code
                      ? 'bg-primary-aqua/10 border-l-4 border-primary-aqua'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{country.name}</div>
                      <div className="text-xs text-gray-500">{country.code} • {country.currency}</div>
                    </div>
                  </div>
                  {currentCountry && currentCountry.code === country.code && (
                    <span className="text-primary-aqua font-bold text-lg">✓</span>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <Globe className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No countries found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Auto-updates currency & shipping</span>
              </div>
            </div>
            Currency and shipping costs will update automatically
          </div>
        </div>
      )}
    </div>
  );
}