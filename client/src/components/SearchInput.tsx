import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, ArrowRight, BookOpen } from "lucide-react";
import { useBrowsingHistory } from "@/hooks/useBrowsingHistory";

interface SearchPreviewBook {
  id: number;
  title: string;
  author: string;
  imageUrl?: string | null;
  price: string;
}

interface SearchPreviewResult {
  books: SearchPreviewBook[];
}

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  showButton?: boolean;
  enableTypingAnimation?: boolean;
  staticKeyword?: string;
}

function SkeletonBookRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
      <div className="w-8 h-10 bg-gray-200 rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="h-3.5 bg-gray-200 rounded w-12 flex-shrink-0" />
    </div>
  );
}

export default function SearchInput({
  placeholder = "Search books, authors, ISBN...",
  className = "",
  onSearch,
  showButton = true,
  enableTypingAnimation = false,
  staticKeyword = "",
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [typedPlaceholder, setTypedPlaceholder] = useState(placeholder);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [, setLocation] = useLocation();
  const search = useSearch();
  const { trackSearch, removeSearch, recentSearches } = useBrowsingHistory();

  // Sync input to URL search param on mount / navigation
  useEffect(() => {
    const params = new URLSearchParams(search);
    setQuery(params.get("search") || "");
  }, [search]);

  // Debounce the query for API calls
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Rich search preview fetch
  const { data, isFetching } = useQuery<SearchPreviewResult>({
    queryKey: ["/api/books/search-preview", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return { books: [] };
      const res = await fetch(
        `/api/books/search-preview?q=${encodeURIComponent(debouncedQuery)}`
      );
      if (!res.ok) return { books: [] };
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const books = data?.books ?? [];
  const recentItems = recentSearches.slice(0, 5);

  // The dropdown shows when focused AND there's something to show
  const showDropdown =
    isFocused && (query.length >= 2 || recentItems.length > 0);

  // Skeleton: query entered but debounced query hasn't caught up yet, or still fetching
  const showSkeleton =
    query.trim().length >= 2 && (isFetching || debouncedQuery !== query.trim());

  // Keyboard-navigable items: recents when empty, books when typing
  const navItems =
    query.trim().length >= 2
      ? books.map((b) => ({ type: "book" as const, book: b }))
      : recentItems.map((s) => ({ type: "recent" as const, label: s }));

  // Update dropdown anchor position
  const updatePos = useCallback(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setDropdownPos({ top: r.bottom, left: r.left, width: r.width });
  }, []);

  useEffect(() => {
    if (showDropdown) {
      updatePos();
      window.addEventListener("scroll", updatePos, true);
      window.addEventListener("resize", updatePos);
      return () => {
        window.removeEventListener("scroll", updatePos, true);
        window.removeEventListener("resize", updatePos);
      };
    }
  }, [showDropdown, updatePos]);

  // Close on click outside
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (
        containerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setIsFocused(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Typing animation for placeholder
  useEffect(() => {
    if (!enableTypingAnimation || query) {
      setTypedPlaceholder(placeholder);
      return;
    }
    const staticPart = staticKeyword;
    const dynamicPart = placeholder.startsWith(staticPart)
      ? placeholder.slice(staticPart.length)
      : placeholder;
    let idx = 0;
    let cancelled = false;
    const type = () => {
      if (cancelled) return;
      if (idx < dynamicPart.length) {
        setTypedPlaceholder(staticPart + dynamicPart.slice(0, idx + 1));
        idx++;
        setTimeout(type, 120);
      } else {
        setTimeout(() => {
          if (cancelled) return;
          idx = 0;
          setTypedPlaceholder(staticPart);
          type();
        }, 2000);
      }
    };
    setTypedPlaceholder(staticPart);
    type();
    return () => {
      cancelled = true;
    };
  }, [placeholder, enableTypingAnimation, query, staticKeyword]);

  const navigate = (q: string) => {
    setIsFocused(false);
    setActiveIndex(-1);
    const trimmed = q.trim();
    if (!trimmed) return;
    trackSearch(trimmed);
    if (onSearch) {
      onSearch(trimmed);
    } else {
      setLocation(`/catalog?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && activeIndex < navItems.length) {
      const item = navItems[activeIndex];
      if (item.type === "recent") navigate(item.label);
      else navigate(item.book.title);
    } else {
      navigate(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, navItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setIsFocused(false);
      setActiveIndex(-1);
    }
  };

  const handleBookClick = (book: SearchPreviewBook) => {
    setIsFocused(false);
    setActiveIndex(-1);
    setLocation(`/books/${book.id}`);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-center rounded-full bg-white border-2 transition-all duration-200 ${
            isFocused
              ? "border-[hsl(188,100%,29%)] shadow-[0_0_0_3px_hsl(188,100%,29%,0.15)]"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Search
            className={`ml-4 h-4 w-4 flex-shrink-0 transition-colors duration-200 ${
              isFocused ? "text-[hsl(188,100%,29%)]" : "text-gray-400"
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent py-2.5 px-3 text-sm outline-none focus:outline-none focus:ring-0 placeholder-gray-400 min-w-0"
            placeholder={typedPlaceholder}
            value={query}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
          />
          <AnimatePresence>
            {query && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.12 }}
                onClick={() => {
                  setQuery("");
                  setActiveIndex(-1);
                  inputRef.current?.focus();
                }}
                className="mr-1 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
          {showButton && (
            <button
              type="submit"
              className="mr-1.5 h-7 md:h-auto px-2.5 md:px-4 md:py-1.5 rounded-full bg-[hsl(188,100%,29%)] hover:bg-[hsl(188,100%,26%)] text-white text-xs md:text-sm font-medium transition-all duration-150 active:scale-95 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(188,100%,29%)]/60"
              style={{ minHeight: 'unset' }}
            >
              Search
            </button>
          )}
        </div>
      </form>

      {createPortal(
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              ref={dropdownRef}
              key="search-dropdown"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: "fixed",
                top: dropdownPos.top + 8,
                left: Math.max(8, Math.min(dropdownPos.left, window.innerWidth - Math.max(dropdownPos.width, 320) - 8)),
                width: Math.min(Math.max(dropdownPos.width, 320), window.innerWidth - 16),
                zIndex: 9999,
              }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              {/* ── Recent searches (top when empty, bottom when typing) ── */}
              {recentItems.length > 0 && query.trim().length < 2 && (
                <section>
                  <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[hsl(188,100%,29%)]" />
                      <span className="text-xs font-semibold text-[hsl(188,100%,29%)] uppercase tracking-wider">
                        Recent Searches
                      </span>
                    </div>
                  </div>
                  {recentItems.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors group ${
                        i === activeIndex
                          ? "bg-[hsl(188,100%,29%)]/10 text-[hsl(188,100%,29%)]"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(-1)}
                    >
                      <button
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        onClick={() => navigate(s)}
                      >
                        <Clock className="h-3.5 w-3.5 text-[hsl(188,100%,35%)] flex-shrink-0" />
                        <span className="text-sm truncate flex-1">{s}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      </button>
                      <button
                        className="p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                        aria-label={`Remove ${s} from recent searches`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearch(s);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="mx-4 border-t border-gray-100 my-1" />
                </section>
              )}

              {/* ── Skeleton while loading ───────────────────── */}
              {query.trim().length >= 2 && showSkeleton && (
                <section>
                  <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Relevant Results
                    </span>
                  </div>
                  <SkeletonBookRow />
                  <SkeletonBookRow />
                  <SkeletonBookRow />
                </section>
              )}

              {/* ── Book results ─────────────────────────────── */}
              {query.trim().length >= 2 && !showSkeleton && books.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[hsl(188,100%,29%)]" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Books
                    </span>
                  </div>
                  {books.map((book, i) => {
                    return (
                      <button
                        key={book.id}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          i === activeIndex
                            ? "bg-[hsl(188,100%,29%)]/10"
                            : "hover:bg-gray-50"
                        }`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseLeave={() => setActiveIndex(-1)}
                        onClick={() => handleBookClick(book)}
                      >
                        <div className="w-8 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-100">
                          {book.imageUrl ? (
                            <img
                              src={book.imageUrl}
                              alt={book.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <BookOpen className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate leading-snug">
                            {book.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {book.author}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-[hsl(188,100%,29%)] flex-shrink-0 ml-2">
                          ${parseFloat(book.price).toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </section>
              )}

              {/* ── No results ───────────────────────────────── */}
              {query.trim().length >= 2 && !showSkeleton && books.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                  <Search className="h-7 w-7" />
                  <p className="text-sm">No books found for "{query.trim()}"</p>
                  <p className="text-xs text-gray-300">Try a different title or author</p>
                </div>
              )}

              {/* ── Recent searches (compact, below results) ─── */}
              {query.trim().length >= 2 && !showSkeleton && recentItems.length > 0 && (
                <section className="border-t border-gray-100">
                  <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
                    <Clock className="h-3 w-3 text-[hsl(188,100%,29%)]" />
                    <span className="text-xs font-semibold text-[hsl(188,100%,29%)] uppercase tracking-wider">
                      Recent
                    </span>
                  </div>
                  {recentItems.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 group transition-colors"
                    >
                      <button
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        onClick={() => navigate(s)}
                      >
                        <Clock className="h-3 w-3 text-gray-300 flex-shrink-0" />
                        <span className="text-xs text-gray-500 truncate">{s}</span>
                      </button>
                      <button
                        className="p-0.5 rounded-full hover:bg-gray-200 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                        aria-label={`Remove ${s}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearch(s);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="pb-1" />
                </section>
              )}

              {/* ── See all results footer ───────────────────── */}
              {query.trim().length >= 2 && (
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-[hsl(188,100%,29%)]/5 border-t border-gray-100 text-sm font-medium text-[hsl(188,100%,29%)] hover:text-[hsl(188,100%,26%)] transition-colors"
                  onClick={() => navigate(query)}
                >
                  <span>
                    See all results for{" "}
                    <span className="font-semibold">"{query.trim()}"</span>
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}