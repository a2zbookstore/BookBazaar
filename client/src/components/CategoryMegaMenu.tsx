import { useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import type { Category, SubCategory } from "@/types";

interface CategoryMegaMenuProps {
  /** Called after a category or subcategory is selected (e.g. to close the menu). */
  onNavigate?: () => void;
  /** Render in mobile-friendly single-column stacked layout */
  mobile?: boolean;
}

/**
 * Full-width "sitemap" mega menu — every category is shown as a bold heading
 * with its subcategories listed beneath in a responsive masonry grid, so users
 * can see the whole catalogue at a glance and jump anywhere in one click
 * (eBay-style "All Categories" panel).
 */
export default function CategoryMegaMenu({ onNavigate, mobile = false }: CategoryMegaMenuProps) {
  const [, setLocation] = useLocation();

  const { data: categories = [], isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allSubCategories = [], isLoading: loadingSubCategories } = useQuery<SubCategory[]>({
    queryKey: ["/api/subcategories"],
  });

  const isLoading = loadingCategories || loadingSubCategories;

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
        subs: (subCategoriesByCategory.get(c.id) ?? [])
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name)),
      })),
    [sortedCategories, subCategoriesByCategory],
  );

  const goToCatalog = () => { setLocation(`/catalog`); onNavigate?.(); };
  const goToTag = (tag: string) => { setLocation(`/catalog?${tag}=true`); onNavigate?.(); };
  const goToCategory = (categoryId: number) => { setLocation(`/catalog?categoryId=${categoryId}`); onNavigate?.(); };
  const goToSubcategory = (categoryId: number, subCategoryId: number) => {
    setLocation(`/catalog?categoryId=${categoryId}&subCategoryId=${subCategoryId}`);
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
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-5">
          <div className="h-3 w-28 rounded bg-gray-200" />
          <div className="h-3 w-24 rounded bg-gray-200" />
        </div>
        <div className="columns-2 md:columns-3 xl:columns-4 gap-x-10">
          {Array.from({ length: 12 }).map((_, colIdx) => (
            <div key={colIdx} className="break-inside-avoid mb-8 space-y-2.5">
              <div className="h-4 w-2/3 rounded bg-gray-200 mb-3" />
              {Array.from({ length: 4 }).map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="h-3 rounded bg-gray-100"
                  style={{ width: `${55 + ((colIdx * 3 + rowIdx * 7) % 35)}%` }}
                />
              ))}
            </div>
          ))}
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
              <div className="pl-4 border-l-2 border-gray-100 ml-1 py-1 grid grid-cols-2 gap-x-2">
                {subs.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => goToSubcategory(category.id, sub.id)}
                    className="group/sub flex items-start gap-1.5 w-full text-left text-sm text-gray-500 hover:text-primary-aqua transition-colors py-1 px-1 rounded hover:bg-primary-aqua/5 leading-snug"
                  >
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-gray-300 group-hover/sub:bg-primary-aqua flex-shrink-0 transition-colors" />
                    <span className="flex-1">{sub.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── Desktop layout: full-width eBay-style "All Categories" sitemap ──
  return (
    <div className="flex flex-col max-h-[72vh]">
      {/* header */}
      <div className="flex items-center justify-between flex-shrink-0 pb-4">
        <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">All Categories</p>
        <button
          type="button"
          onClick={goToCatalog}
          className="text-sm font-medium text-primary-aqua hover:underline"
        >
          Browse all books
        </button>
      </div>

      {/* masonry grid — every category heading + its subcategories, full names */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        <div className="columns-2 md:columns-3 xl:columns-4 gap-x-10">
          {visibleCategories.map(({ category, subs }) => (
            <div key={category.id} className="break-inside-avoid mb-8">
              <button
                type="button"
                onClick={() => goToCategory(category.id)}
                className="group/cat w-full text-left text-[15px] font-bold text-gray-900 hover:text-primary-aqua transition-colors mb-3 flex items-center gap-1"
              >
                <span className="flex-1">{category.name}</span>
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-0 -translate-x-1 group-hover/cat:opacity-100 group-hover/cat:translate-x-0 transition-all text-primary-aqua" />
              </button>
              {subs.length > 0 ? (
                <ul className="space-y-2">
                  {subs.map((sub) => (
                    <li key={sub.id}>
                      <button
                        type="button"
                        onClick={() => goToSubcategory(category.id, sub.id)}
                        className="text-left text-sm text-gray-500 hover:text-primary-aqua hover:underline underline-offset-2 transition-colors leading-snug"
                      >
                        {sub.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <button
                  type="button"
                  onClick={() => goToCategory(category.id)}
                  className="text-sm text-gray-400 hover:text-primary-aqua transition-colors"
                >
                  View all
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* footer row — quick links like the eBay "All Categories" panel */}
      <div className="flex-shrink-0 border-t border-gray-100 mt-2 pt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-2">
        <button
          type="button"
          onClick={goToCatalog}
          className="group/foot flex items-center gap-1 text-left text-sm font-semibold text-gray-900 hover:text-primary-aqua transition-colors"
        >
          All Categories
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/foot:translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={() => goToTag("newArrival")}
          className="group/foot flex items-center gap-1 text-left text-sm font-semibold text-gray-900 hover:text-primary-aqua transition-colors"
        >
          New Arrivals
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/foot:translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={() => goToTag("bestseller")}
          className="group/foot flex items-center gap-1 text-left text-sm font-semibold text-gray-900 hover:text-primary-aqua transition-colors"
        >
          Bestsellers
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/foot:translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={() => goToTag("featured")}
          className="group/foot flex items-center gap-1 text-left text-sm font-semibold text-gray-900 hover:text-primary-aqua transition-colors"
        >
          Featured Books
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/foot:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

