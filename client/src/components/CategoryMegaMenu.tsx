import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronUp, ChevronDown } from "lucide-react";
import { generateBookSlug } from "@/lib/slugUtils";
import type { Book, Category, SubCategory } from "@/types";

interface CategoryMegaMenuProps {
  /** Called after a category or subcategory is selected (e.g. to close the menu). */
  onNavigate?: () => void;
  /** Render in mobile-friendly single-column stacked layout */
  mobile?: boolean;
}

const BOOKS_PER_PAGE = 1;

/**
 * Full-width "sitemap" mega menu — every category and its subcategories are
 * visible simultaneously in a responsive column grid so users can navigate
 * anywhere in one click without first selecting a category.
 *
 * Layout:
 *  • Left  — category + subcategory grid
 *  • Right — featured book covers vertical carousel
 */
export default function CategoryMegaMenu({ onNavigate, mobile = false }: CategoryMegaMenuProps) {
  const [, setLocation] = useLocation();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const { data: categories = [], isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allSubCategories = [], isLoading: loadingSubCategories } = useQuery<SubCategory[]>({
    queryKey: ["/api/subcategories"],
  });

  const { data: featuredData, isLoading: loadingFeatured } = useQuery<{ books: Book[] }>({
    queryKey: ["/api/books?featured=true&limit=10"],
  });
  const featuredBooks = featuredData?.books ?? [];

  const isLoading = loadingCategories || loadingSubCategories || loadingFeatured;

  // Auto-advance every 5 s; resets when user manually navigates (resetKey bump)
  useEffect(() => {
    if (featuredBooks.length <= BOOKS_PER_PAGE) return;
    const id = setInterval(() => {
      setCarouselIndex((i) =>
        i + BOOKS_PER_PAGE >= featuredBooks.length ? 0 : i + BOOKS_PER_PAGE
      );
    }, 5000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredBooks.length, resetKey]);

  // Group subcategories by categoryId for O(1) lookup
  const subCategoriesByCategory = useMemo(() => {
    const map = new Map<number, SubCategory[]>();
    for (const sub of allSubCategories) {
      const list = map.get(sub.categoryId) ?? [];
      list.push(sub);
      map.set(sub.categoryId, list);
    }
    return map;
  }, [allSubCategories]);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
      ),
    [categories],
  );

  const visibleCategories = useMemo(
    () =>
      sortedCategories.map((c) => ({
        category: c,
        subs: subCategoriesByCategory.get(c.id) ?? [],
      })),
    [sortedCategories, subCategoriesByCategory],
  );

  // Manual nav — bumps resetKey so the 5s timer restarts from this position
  const navTo = (nextIndex: number) => {
    setCarouselIndex(nextIndex);
    setResetKey((k) => k + 1);
  };
  const goToCatalog = () => { setLocation(`/catalog`); onNavigate?.(); };
  const goToCategory = (categoryId: number) => { setLocation(`/catalog?categoryId=${categoryId}`); onNavigate?.(); };
  const goToSubcategory = (categoryId: number, subCategoryId: number) => {
    setLocation(`/catalog?categoryId=${categoryId}&subCategoryId=${subCategoryId}`);
    onNavigate?.();
  };
  const goToBook = (book: Book) => {
    setLocation(`/books/${generateBookSlug(book.title, book.id)}`);
    onNavigate?.();
  };


  if (isLoading) {
    // Mobile skeleton
    if (mobile) {
      return (
        <div className="animate-pulse space-y-3 px-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-2/3 ml-4" />
              <div className="h-3 bg-gray-100 rounded w-1/2 ml-4" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex gap-6 h-[360px] animate-pulse">
        {/* Left skeleton — mirrors the category grid */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* header row */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="h-3 w-28 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-200" />
          </div>
          {/* grid of fake category columns */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-6">
              {Array.from({ length: 15 }).map((_, colIdx) => (
                <div key={colIdx} className="min-w-0 space-y-2">
                  {/* category heading — matches text-base */}
                  <div className="h-4 w-full rounded bg-gray-200 mb-3" />
                  {/* subcategory lines — matches text-sm */}
                  {Array.from({ length: 4 }).map((_, rowIdx) => (
                    <div
                      key={rowIdx}
                      className="h-3 rounded bg-gray-100"
                      style={{ width: `${70 + ((colIdx * 3 + rowIdx * 7) % 25)}%` }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right skeleton — mirrors the featured panel */}
        <div className="w-[20%] flex-shrink-0 border-l border-gray-100 pl-5 flex flex-col gap-2">
          {/* "Featured" label */}
          <div className="h-2.5 w-14 rounded bg-gray-200 flex-shrink-0" />
          {/* up arrow placeholder */}
          <div className="h-6 w-6 rounded bg-gray-100 mx-auto flex-shrink-0" />
          {/* book cover */}
          <div className="flex-1 min-h-0 rounded bg-gray-200" />
          {/* title lines */}
          <div className="flex-shrink-0 space-y-1.5">
            <div className="h-2.5 w-full rounded bg-gray-200" />
            <div className="h-2.5 w-3/4 rounded bg-gray-200" />
            <div className="h-2 w-1/2 rounded bg-gray-100 mt-0.5" />
          </div>
          {/* dot indicators */}
          <div className="flex justify-center gap-1 flex-shrink-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full bg-gray-200 ${i === 0 ? "w-4" : "w-1.5"}`} />
            ))}
          </div>
          {/* down arrow placeholder */}
          <div className="h-6 w-6 rounded bg-gray-100 mx-auto flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (sortedCategories.length === 0) {
    return <div className="py-16 text-center text-sm text-gray-500">No categories available.</div>;
  }

  // ── Mobile layout: single-column list with subcategories inline ──
  if (mobile) {
    return (
      <div className="space-y-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">All Categories</p>
          <button type="button" onClick={goToCatalog} className="text-sm font-medium text-primary-aqua hover:underline">
            Browse all books
          </button>
        </div>
        {visibleCategories.map(({ category, subs }) => (
          <div key={category.id}>
            <button
              type="button"
              onClick={() => goToCategory(category.id)}
              className="group/cat w-full text-left text-sm font-semibold text-gray-900 hover:text-primary-aqua transition-colors py-2 px-1 flex items-center gap-1 border-b border-gray-100"
            >
              <span className="flex-1 truncate">{category.name}</span>
              <span className="text-primary-aqua text-xs opacity-0 group-hover/cat:opacity-100 transition-opacity">›</span>
            </button>
            {subs.length > 0 && (
              <div className="pl-4 border-l-2 border-gray-100 ml-1 space-y-0.5 py-1">
                {subs.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => goToSubcategory(category.id, sub.id)}
                    className="group/sub flex items-center gap-1 w-full text-left text-sm text-gray-500 hover:text-primary-aqua transition-colors py-1 px-1 rounded hover:bg-primary-aqua/5 truncate"
                  >
                    <span className="w-0 overflow-hidden group-hover/sub:w-2.5 transition-all duration-150 text-primary-aqua opacity-0 group-hover/sub:opacity-100 flex-shrink-0">›</span>
                    <span className="truncate flex-1">{sub.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[360px]">

      {/* ── Left: category grid ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {/* header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">All Categories</p>
          <button
            type="button"
            onClick={goToCatalog}
            className="text-sm font-medium text-primary-aqua hover:underline"
          >
            Browse all books
          </button>
        </div>
        {/* scrollable grid */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-6 pb-1">
            {visibleCategories.map(({ category, subs }) => (
              <div key={category.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => goToCategory(category.id)}
                  className="group/cat w-full text-left text-base font-semibold text-gray-900 hover:text-primary-aqua transition-all duration-200 truncate mb-2 pb-1.5 border-b border-gray-100 hover:border-primary-aqua/40 flex items-center gap-1"
                >
                  <span className="flex-1 truncate transition-transform duration-200 group-hover/cat:translate-x-0.5">{category.name}</span>
                  <span className="opacity-0 group-hover/cat:opacity-100 transition-opacity duration-200 text-primary-aqua text-xs">›</span>
                </button>
                <div className="space-y-0.5 pl-2 border-l-2 border-gray-100">
                  {subs.length === 0 && <span className="text-sm text-gray-300 italic">No subcategories</span>}
                  {subs.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => goToSubcategory(category.id, sub.id)}
                      className="group/sub flex items-center gap-1 w-full text-left text-sm text-gray-500 hover:text-primary-aqua transition-all duration-150 py-0.5 px-1 rounded hover:bg-primary-aqua/8 truncate"
                    >
                      <span className="w-0 overflow-hidden group-hover/sub:w-2.5 transition-all duration-150 text-primary-aqua opacity-0 group-hover/sub:opacity-100 flex-shrink-0">›</span>
                      <span className="truncate flex-1 transition-transform duration-150 group-hover/sub:translate-x-0.5">{sub.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: featured book covers carousel ── */}
      {featuredBooks.length > 0 && (
        <div className="w-[20%] flex-shrink-0 border-l border-gray-100 pl-5 flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-primary font-semibold flex-shrink-0">
            Featured
          </p>

          {/* up arrow */}
          <button
            type="button"
            onClick={() => navTo(Math.max(0, carouselIndex - BOOKS_PER_PAGE))}
            disabled={carouselIndex === 0 && featuredBooks.length <= BOOKS_PER_PAGE}
            aria-label="Previous books"
            className="flex-shrink-0 flex items-center justify-center h-6 rounded text-gray-300 hover:text-primary-aqua disabled:opacity-20 disabled:cursor-default transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
          </button>

          {/* single book cover */}
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            {(() => {
              const book = featuredBooks[carouselIndex];
              if (!book) return null;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => goToBook(book)}
                  className="group relative flex-1 min-h-0 w-full rounded overflow-hidden shadow hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-aqua/50"
                >
                  {book.imageUrl ? (
                    <img
                      src={book.imageUrl}
                      alt={book.title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 flex items-end p-2">
                      <span className="text-[9px] text-gray-600 leading-tight line-clamp-4 font-medium">
                        {book.title}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              );
            })()}
            {/* title + author below the cover */}
            {featuredBooks[carouselIndex] && (
              <div className="flex-shrink-0">
                <p className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2">
                  {featuredBooks[carouselIndex].title}
                </p>
                {featuredBooks[carouselIndex].author && (
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {featuredBooks[carouselIndex].author}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* dot indicators */}
          <div className="flex justify-center gap-1 flex-shrink-0">
            {Array.from({ length: Math.ceil(featuredBooks.length / BOOKS_PER_PAGE) }).map((_, p) => (
              <button
                key={p}
                type="button"
                aria-label={`Go to page ${p + 1}`}
                onClick={() => navTo(p * BOOKS_PER_PAGE)}
                className={`h-1.5 rounded-full transition-all ${
                  p === Math.floor(carouselIndex / BOOKS_PER_PAGE)
                    ? "w-4 bg-primary-aqua"
                    : "w-1.5 bg-gray-200 hover:bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* down arrow */}
          <button
            type="button"
            onClick={() => navTo(
              carouselIndex + BOOKS_PER_PAGE >= featuredBooks.length
                ? 0
                : carouselIndex + BOOKS_PER_PAGE
            )}
            aria-label="Next books"
            className="flex-shrink-0 flex items-center justify-center h-6 rounded text-gray-300 hover:text-primary-aqua transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
