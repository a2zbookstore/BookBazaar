import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  showButton?: boolean;
}

export default function SearchInput({ 
  placeholder = "Search books, authors, ISBN...", 
  className = "",
  onSearch,
  showButton = true 
}: SearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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
        // Force page refresh to ensure proper search parameter handling
        window.location.href = `/catalog?search=${encodeURIComponent(searchTerm)}`;
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
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              console.log("Enter key pressed, submitting search");
              handleSubmit(e as any);
            }
          }}
          className="w-full pr-12"
        />
        {showButton && (
          <Button
            type="submit"
            className="absolute right-1 top-1 h-8 w-8 rounded-lg bg-primary-aqua hover:bg-secondary-aqua p-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center">
                <Search className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-700">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}