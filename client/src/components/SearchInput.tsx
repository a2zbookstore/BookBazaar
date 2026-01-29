import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Cross, Search, X } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  showButton?: boolean;
  enableTypingAnimation?: boolean;
  staticKeyword?: string;
}

export default function SearchInput({
  placeholder = "Search books, authors, ISBN...",
  className = "",
  onSearch,
  showButton = true,
  enableTypingAnimation = false,
  staticKeyword = ""
}: SearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [location, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Typing animation for placeholder
  const [typedPlaceholder, setTypedPlaceholder] = useState("");


  // On mount, read search query from URL if present

  useEffect(() => {
    const queryString = location.split('?')[1] || '';
    const params = new URLSearchParams(queryString);
    const urlQuery = params.get('search') || '';

    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [location]);

  useEffect(() => {
    if (!enableTypingAnimation || searchQuery) {
      setTypedPlaceholder(placeholder);
      return;
    }

    // Split placeholder: "Search " is static, rest is typed
    const staticPart = staticKeyword;
    const dynamicPart = placeholder.startsWith(staticPart)
      ? placeholder.slice(staticPart.length)
      : placeholder;

    let currentIndex = 0;
    const typingSpeed = 100; // milliseconds per character
    const pauseBeforeRestart = 2000; // pause at end before restarting

    const typeNextChar = () => {
      if (currentIndex < dynamicPart.length) {
        setTypedPlaceholder(staticPart + dynamicPart.slice(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeNextChar, typingSpeed);
      } else {
        // Pause at end, then restart
        setTimeout(() => {
          currentIndex = 0;
          setTypedPlaceholder(staticPart);
          typeNextChar();
        }, pauseBeforeRestart);
      }
    };
    setTypedPlaceholder(staticPart);
    typeNextChar();
    return () => {
      setTypedPlaceholder("");
    };

  }, [placeholder, enableTypingAnimation, searchQuery]);

  // Fetch search suggestions
  const { data: suggestions = [] } = useQuery<string[]>({
    queryKey: ["/api/books/search-suggestions", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const response = await fetch(`/api/books/search-suggestions?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.length >= 2,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search submitted with query:", searchQuery);
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      const searchTerm = searchQuery.trim();
      if (onSearch) {
        onSearch(searchTerm);
      } else {
        console.log("Navigating to catalog with search:", searchTerm);
        // Use client-side navigation to prevent full page reload
        setLocation(`/catalog?search=${encodeURIComponent(searchTerm)}`);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(suggestion);
    } else {
      setLocation(`/catalog?search=${encodeURIComponent(suggestion)}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleInputFocus = () => {
    if (searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
      }
    }, 100);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={typedPlaceholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          // Let form's onSubmit handle Enter key
          className={`w-full pr-10 sm:pr-12 rounded-full text-sm sm:text-base h-9 sm:h-11`}
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute mx-2 right-8 sm:right-10 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center hover:bg-gray-200 rounded-full justify-center text-gray-400 hover:text-primary-aqua focus:outline-none"
            onClick={() => setSearchQuery("")}
            tabIndex={0}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {showButton && (
          <Button
            type="submit"
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-8 sm:w-8 rounded-full bg-primary-aqua hover:bg-secondary-aqua p-0 transition-colors"
          >
            <Search className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        )}
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute rounded-b-xl top-full left-0 right-0 z-[999] bg-white border border-primary-aqua shadow-lg mt-2 sm:mt-4 overflow-hidden max-h-80 overflow-y-auto"
          style={{ minWidth: '100%' }}
        >
          <ul className="divide-y divide-gray-100">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center px-3 sm:px-5 py-2 sm:py-3 text-left hover:bg-primary-aqua/70 focus:bg-primary-aqua/20 transition-colors duration-150 outline-none"
                >
                  <Search className="h-3.5 sm:h-4 w-3.5 sm:w-4 min-w-[14px] sm:min-w-[16px] shrink-0 text-primary-aqua mr-2 sm:mr-3" />
                  <span className="text-sm sm:text-base text-gray-800 font-medium truncate">{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}