import { useState, useEffect, useRef } from "react";
import { Globe, ChevronDown, Search, X } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useUserLocation } from "@/contexts/userLocationContext";

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
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCountry, setCurrentCountry] =
    useState<(typeof POPULAR_COUNTRIES)[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { location, setManualLocation } = useUserLocation();
  const { setCurrency } = useCurrency();

  useEffect(() => {
    if (!location?.countryCode) return;

    const country = POPULAR_COUNTRIES.find(
      (c) => c.code === location.countryCode
    );

    if (country) {
      setCurrentCountry(country);      
      setCurrency(country?.currency);
    }
  }, [location?.countryCode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredCountries = POPULAR_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.currency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (country: typeof POPULAR_COUNTRIES[0]) => {
    localStorage.setItem('manual_country_selection', JSON.stringify({
      countryCode: country.code,
      country: country.name
    }));
    setCurrentCountry(country);
    setIsOpen(false);
    setManualLocation({countryCode: country.code, country: country.name});
    setCurrency(country.currency);

  };

  if (!currentCountry) {
    return (
      <button
        className={`text-xs px-2 py-1 rounded border ${className}`}
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
        className={`text-xs px-2 py-2 rounded-xl border bg-white flex items-center gap-1.5 w-[90px] ${className}`}
      >
        <span className="text-base">{currentCountry.flag}</span>
        <span className="font-medium">{currentCountry.code}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-xl z-50">
          {/* Search */}
          <div className="p-3">
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country..."
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {filteredCountries.map((country) => (
              <div
                key={country.code}
                onClick={() => handleCountrySelect(country)}
                className={`px-4 py-3 cursor-pointer flex justify-between ${currentCountry.code === country.code
                  ? "bg-primary-aqua/10"
                  : "hover:bg-gray-50"
                  }`}
              >
                <div>
                  {country.flag} {country.name}
                </div>
                {currentCountry.code === country.code && "✓"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
