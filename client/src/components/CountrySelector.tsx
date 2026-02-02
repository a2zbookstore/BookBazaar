import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Globe, ChevronDown, Search, X } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useUserLocation } from "@/contexts/userLocationContext";
import 'flag-icons/css/flag-icons.min.css';

const POPULAR_COUNTRIES = [
  { code: 'US', name: 'United States', countryCode: 'us', currency: 'USD' },
  { code: 'CA', name: 'Canada', countryCode: 'ca', currency: 'CAD' },
  { code: 'GB', name: 'United Kingdom', countryCode: 'gb', currency: 'GBP' },
  { code: 'AU', name: 'Australia', countryCode: 'au', currency: 'AUD' },
  { code: 'DE', name: 'Germany', countryCode: 'de', currency: 'EUR' },
  { code: 'FR', name: 'France', countryCode: 'fr', currency: 'EUR' },
  { code: 'IN', name: 'India', countryCode: 'in', currency: 'INR' },
  { code: 'JP', name: 'Japan', countryCode: 'jp', currency: 'JPY' },
  { code: 'CN', name: 'China', countryCode: 'cn', currency: 'CNY' },
  { code: 'BR', name: 'Brazil', countryCode: 'br', currency: 'BRL' },
  { code: 'MX', name: 'Mexico', countryCode: 'mx', currency: 'MXN' },
  { code: 'IT', name: 'Italy', countryCode: 'it', currency: 'EUR' },
  { code: 'ES', name: 'Spain', countryCode: 'es', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', countryCode: 'nl', currency: 'EUR' },
  { code: 'SE', name: 'Sweden', countryCode: 'se', currency: 'SEK' },
  { code: 'NO', name: 'Norway', countryCode: 'no', currency: 'NOK' },
  { code: 'DK', name: 'Denmark', countryCode: 'dk', currency: 'DKK' },
  { code: 'CH', name: 'Switzerland', countryCode: 'ch', currency: 'CHF' },
  { code: 'SG', name: 'Singapore', countryCode: 'sg', currency: 'SGD' },
  { code: 'NZ', name: 'New Zealand', countryCode: 'nz', currency: 'NZD' },
];

interface CountrySelectorProps {
  className?: string;
  showShippingCost?: boolean;
  compact?: boolean;
}

export default function CountrySelector({
  className = "",
  compact = false,
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCountry, setCurrentCountry] =
    useState<(typeof POPULAR_COUNTRIES)[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);
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
      const target = e.target as Node;
      const insideTrigger = dropdownRef.current?.contains(target);
      const insideContent = dropdownContentRef.current?.contains(target);

      if (!insideTrigger && !insideContent) {
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

  // Detect mobile viewport to decide portal rendering
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

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
        className={`text-xs px-2 py-2 rounded-xl border bg-white flex items-center gap-1.5 ${className}`}
      >
        <span className={`fi fi-${currentCountry.countryCode} h-4 w-6`}></span>
        {compact ? null : <span className="font-medium">{currentCountry.code}</span>}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {isOpen && (
        (() => {
          const content = (
            <div
              ref={dropdownContentRef}
              className={
                compact && isMobile
                  ? "mobile-dropdown bg-white border rounded-xl shadow-xl"
                  : "absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-xl z-50"
              }
            >
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
                    className={`px-4 py-3 cursor-pointer flex justify-between items-center ${currentCountry.code === country.code
                      ? "bg-primary-aqua/10"
                      : "hover:bg-gray-50"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`fi fi-${country.countryCode} h-5 w-7`}></span>
                      {country.name}
                    </div>
                    {currentCountry.code === country.code && "✓"}
                  </div>
                ))}
              </div>
            </div>
          );

          // On mobile, render in a portal with a backdrop
          if (compact && isMobile) {
            return ReactDOM.createPortal(
              <div className="fixed inset-0 z-[1000]">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setIsOpen(false)}
                />
                {content}
              </div>,
              document.body
            );
          }

          // Desktop or non-compact: render inline
          return content;
        })()
      )}
    </div>
  );
}
