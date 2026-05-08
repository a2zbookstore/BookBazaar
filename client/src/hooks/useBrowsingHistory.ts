import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Book } from "@/types";

const STORAGE_KEY = "bb_browsing_history";
const MAX_HISTORY = 50;

interface BrowsingEntry {
  bookId: number;
  categoryId?: number;
  timestamp: number;
  searchQuery?: string;
}

interface BrowsingHistory {
  entries: BrowsingEntry[];
  searches: string[];
}

function getStoredHistory(): BrowsingHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { entries: [], searches: [] };
}

function saveHistory(history: BrowsingHistory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {}
}

export function useBrowsingHistory() {
  const [history, setHistory] = useState<BrowsingHistory>(getStoredHistory);

  const trackBookView = useCallback((bookId: number, categoryId?: number) => {
    setHistory((prev) => {
      const filtered = prev.entries.filter((e) => e.bookId !== bookId);
      const updated: BrowsingHistory = {
        ...prev,
        entries: [{ bookId, categoryId, timestamp: Date.now() }, ...filtered].slice(0, MAX_HISTORY),
      };
      saveHistory(updated);
      return updated;
    });
  }, []);

  const trackSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setHistory((prev) => {
      const filtered = prev.searches.filter((s) => s.toLowerCase() !== query.toLowerCase());
      const updated: BrowsingHistory = {
        ...prev,
        searches: [query, ...filtered].slice(0, 20),
      };
      saveHistory(updated);
      return updated;
    });
  }, []);

  // Get most browsed category IDs (ranked by frequency)
  const topCategoryIds = (() => {
    const freq: Record<number, number> = {};
    history.entries.forEach((e) => {
      if (e.categoryId) freq[e.categoryId] = (freq[e.categoryId] || 0) + 1;
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => Number(id));
  })();

  // Recently viewed book IDs
  const recentBookIds = history.entries.slice(0, 12).map((e) => e.bookId);

  // Fetch personalized suggestions based on top categories
  const suggestionsQuery = topCategoryIds.length > 0 ? topCategoryIds[0] : null;
  const { data: suggestedBooksResponse } = useQuery<{ books: Book[]; total: number }>({
    queryKey: [`/api/books?categoryId=${suggestionsQuery}&limit=12`],
    enabled: suggestionsQuery !== null,
  });

  // Fetch recently viewed books
  const recentIds = recentBookIds.join(",");
  const { data: recentBooksData } = useQuery<{ books: Book[]; total: number }>({
    queryKey: [`/api/books?limit=50`],
    enabled: recentBookIds.length > 0,
  });

  const recentlyViewed = (recentBooksData?.books || []).filter((b) =>
    recentBookIds.includes(b.id)
  ).slice(0, 12);

  const suggestedBooks = (suggestedBooksResponse?.books || []).filter(
    (b) => !recentBookIds.includes(b.id)
  );

  return {
    trackBookView,
    trackSearch,
    recentlyViewed,
    suggestedBooks,
    topCategoryIds,
    recentSearches: history.searches.slice(0, 5),
    hasHistory: history.entries.length > 0,
  };
}
