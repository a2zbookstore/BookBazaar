import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumb";
import BookCard from "@/components/BookCard";
import FiltersSidebar from "@/components/FiltersSidebar";
import SortFilterHeader from "@/components/SortFilterHeader";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Book, Category, SubCategory } from "@/types";
import { ArrowLeft, ArrowRight, Filter } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { SUPPORTED_CURRENCIES } from "@/lib/currencyUtils";

interface BooksResponse {
  books: Book[];
  total: number;
}

export default function CatalogPage() {
  const [location, setLocation] = useLocation();
  const searchParams = useSearch();
  // URL is the single source of truth for all filters
  const params = new URLSearchParams(searchParams);

  const search             = params.get('search') || '';
  const selectedCategories = params.get('categoryId') ? [params.get('categoryId')!] : [];
  const selectedSubCategories = params.get('subCategoryId') ? [params.get('subCategoryId')!] : [];
  const selectedConditions = params.get('condition')  ? [params.get('condition')!]  : [];
  const TAG_KEYS = ['bestseller', 'trending', 'newArrival', 'featured', 'boxSet'] as const;
  const selectedTags = TAG_KEYS.filter(k => params.get(k) === 'true');
  const minPrice           = params.get('minPrice')   || '';
  const maxPrice           = params.get('maxPrice')   || '';
  const sortBy             = params.get('sortBy')     || 'createdAt';
  const sortOrder          = params.get('sortOrder')  || 'desc';
  const urlCoupon          = params.get('coupon')     || '';

  // Capture coupon from URL → localStorage, then remove it from the URL
  useEffect(() => {
    if (urlCoupon) {
      localStorage.setItem('pendingCoupon', urlCoupon.toUpperCase());
      const next = new URLSearchParams(searchParams);
      next.delete('coupon');
      const qs = next.toString();
      setLocation('/catalog' + (qs ? '?' + qs : ''), { replace: true });
    }
  }, [urlCoupon]);

  // Show the coupon notice as long as localStorage has one
  const [savedCoupon, setSavedCoupon] = useState<string>(() => localStorage.getItem('pendingCoupon') || '');
  const [couponInfo, setCouponInfo] = useState<{ minimumOrderAmount: number; discountType: string; discountValue: string; description?: string | null; maximumDiscountAmount?: number | null } | null>(() => {
    const stored = localStorage.getItem('pendingCouponInfo');
    return stored ? JSON.parse(stored) : null;
  });
  useEffect(() => {
    // Refresh whenever we save a new one
    if (urlCoupon) setSavedCoupon(urlCoupon.toUpperCase());
  }, [urlCoupon]);

  // Fetch coupon details when we have a saved coupon code
  useEffect(() => {
    const code = savedCoupon || localStorage.getItem('pendingCoupon');
    if (!code) return;
    fetch(`/api/coupons/info/${encodeURIComponent(code)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCouponInfo(data);
          localStorage.setItem('pendingCouponInfo', JSON.stringify(data));
          // Auto-apply minPrice filter based on minimum order amount
          if (data.minimumOrderAmount > 0 && !params.get('minPrice')) {
            updateParams({ minPrice: String(data.minimumOrderAmount) });
          }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCoupon]);

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 15;

  // Currency for price display in the active filter banner
  const { userCurrency, exchangeRates } = useCurrency();
  const currencySymbol = SUPPORTED_CURRENCIES.find(c => c.code === userCurrency)?.symbol ?? '$';
  const usdToDisplay = (usdVal: string): string => {
    if (!usdVal || userCurrency === 'USD' || !exchangeRates) return usdVal;
    const rate = exchangeRates[userCurrency] ?? 1;
    return Math.round(Number(usdVal) * rate).toLocaleString();
  };

  // Reset to page 1 whenever the filter params change
  useEffect(() => { setCurrentPage(1); }, [searchParams]);

  // Helper: push filter changes into the URL
  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') next.delete(key);
      else next.set(key, val);
    });
    const qs = next.toString();
    setLocation('/catalog' + (qs ? '?' + qs : ''));
    setCurrentPage(1);
  };

  // Build query params for the API directly from the URL string
  const queryParams = new URLSearchParams(searchParams);
  queryParams.delete('coupon'); // coupon is not an API filter
  if (!queryParams.has('sortBy'))    queryParams.set('sortBy', 'createdAt');
  if (!queryParams.has('sortOrder')) queryParams.set('sortOrder', 'desc');
  queryParams.set('limit',  itemsPerPage.toString());
  queryParams.set('offset', ((currentPage - 1) * itemsPerPage).toString());

  const apiUrl = `/api/books?${queryParams.toString()}`;

  const { data: booksResponse, isLoading, isFetching } = useQuery<BooksResponse>({
    queryKey: ['/api/books', searchParams, currentPage],
    queryFn: async () => {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      return data;
    },
    staleTime: 0,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const selectedCategoryId = selectedCategories[0] || null;

  const { data: subcategories = [] } = useQuery<SubCategory[]>({
    queryKey: ["/api/subcategories", selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      const res = await fetch(`/api/subcategories?categoryId=${selectedCategoryId}`);
      if (!res.ok) throw new Error('Failed to fetch subcategories');
      return res.json();
    },
    enabled: !!selectedCategoryId,
  });

  const books = booksResponse?.books || [];
  const totalBooks = booksResponse?.total || 0;
  const totalPages = Math.ceil(totalBooks / itemsPerPage);
  const conditions = ["New", "Like New", "Very Good", "Good", "Fair"];

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    // Changing category clears any existing subcategory selection
    updateParams({ categoryId: checked ? categoryId : null, subCategoryId: null });
  };

  const handleSubCategoryChange = (subCategoryId: string, checked: boolean) => {
    updateParams({ subCategoryId: checked ? subCategoryId : null });
  };

  const handleConditionChange = (condition: string, checked: boolean) => {
    updateParams({ condition: checked ? condition : null });
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    updateParams({ [tag]: checked ? 'true' : null });
  };

  const handleApplyFilters = ({ categories, subcategories, conditions: conds, tags, minPrice: min, maxPrice: max }: import('@/components/FiltersSidebar').AppliedFilters) => {
    const TAG_KEYS = ['bestseller', 'trending', 'newArrival', 'featured', 'boxSet'];
    updateParams({
      categoryId:    categories[0]    ?? null,
      subCategoryId: subcategories[0] ?? null,
      condition:     conds[0]         ?? null,
      minPrice:      min              || null,
      maxPrice:      max              || null,
      ...Object.fromEntries(TAG_KEYS.map(k => [k, tags.includes(k) ? 'true' : null])),
    });
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    updateParams({ sortBy: newSortBy, sortOrder: newSortOrder });
  };

  const sortOptions = [
    { value: 'createdAt-desc', label: 'New to Old' },
    { value: 'createdAt-asc', label: 'Old to New' },
    { value: 'price-asc', label: 'Low to High' },
    { value: 'price-desc', label: 'High to Low' },
    { value: 'title-asc', label: 'Title: A to Z' },
    { value: 'title-desc', label: 'Title: Z to A' },
  ];

  const clearFilters = () => {
    setLocation('/catalog');
    setCurrentPage(1);
  };

  // Dynamic SEO based on filters
  const activeCategory = categories.find(c => c.id.toString() === (selectedCategories[0] || ''));
  const activeSubCategory = subcategories.find(s => s.id.toString() === (selectedSubCategories[0] || ''));

  const getPageTitle = () => {
    if (search) return `Search Results for "${search}"`;
    if (params.get('featured') === 'true') return 'Featured Books';
    if (params.get('bestseller') === 'true') return 'Bestselling Books';
    if (params.get('trending') === 'true') return 'Trending Books';
    if (params.get('newArrival') === 'true') return 'New Arrivals';
    if (params.get('boxSet') === 'true') return 'Box Sets';
    if (activeSubCategory && activeCategory) return `${activeCategory.name} – ${activeSubCategory.name} Books`;
    if (activeCategory) return `${activeCategory.name} Books`;
    return 'All Books - Browse Our Complete Collection';
  };

  const getPageDescription = () => {
    if (search) return `Find books matching "${search}". Browse our extensive collection with ${totalBooks} results.`;
    if (activeSubCategory && activeCategory) {
      return `Explore our ${activeCategory.name} › ${activeSubCategory.name} collection. ${totalBooks} books available with fast delivery.`;
    }
    if (activeCategory) {
      return `Explore our ${activeCategory.name} collection. ${totalBooks} books available with fast delivery.`;
    }
    return 'Browse thousands of books across all categories. Fiction, non-fiction, bestsellers and more. Best prices with fast delivery.';
  };

  const getPageKeywords = () => {
    const baseKeywords = 'buy books online, online bookstore, book catalog';
    if (search) return `${search}, ${baseKeywords}`;
    if (activeSubCategory && activeCategory) {
      return `${activeSubCategory.name} books, ${activeCategory.name} ${activeSubCategory.name}, ${baseKeywords}`;
    }
    if (activeCategory) {
      return `${activeCategory.name} books, buy ${activeCategory.name}, ${baseKeywords}`;
    }
    return `${baseKeywords}, fiction, non-fiction, bestsellers`;
  };

  const getCanonicalUrl = () => {
    const base = 'https://a2zbookshop.com/catalog';
    const qs = searchParams ? '?' + searchParams : '';
    return base + qs;
  };

  return (
    <>
      <SEO
        title={getPageTitle()}
        description={getPageDescription()}
        keywords={getPageKeywords()}
        url={getCanonicalUrl()}
        type="website"
      />
      <div className="container-custom">
        <Breadcrumb items={[{ label: "Catalog" }]} />

        {/* Coupon notice — shown when a coupon is saved in session */}
        {savedCoupon && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
            <span className="text-base">🎟️</span>
            <span>
              Coupon <strong>{savedCoupon}</strong>
              {couponInfo && (
                <>
                  {' — '}
                  {couponInfo.discountType === 'percentage'
                    ? `${couponInfo.discountValue}% off`
                    : `₹${couponInfo.discountValue} off`}
                  {couponInfo.minimumOrderAmount > 0 && ` on orders above ₹${couponInfo.minimumOrderAmount}`}
                </>
              )}
              {' '}saved — will be auto-applied at checkout.
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('pendingCoupon');
                localStorage.removeItem('pendingCouponInfo');
                setSavedCoupon('');
                setCouponInfo(null);
                if (params.get('minPrice') && couponInfo?.minimumOrderAmount &&
                    params.get('minPrice') === String(couponInfo.minimumOrderAmount)) {
                  updateParams({ minPrice: null });
                }
              }}
              className="ml-auto text-xs underline underline-offset-2 hover:text-green-900"
            >
              Remove
            </button>
          </div>
        )}

        {/* Active filter banner — shown when arriving via banner/category/subcategory links */}
        {(() => {
          const labels: string[] = [];
          if (activeCategory) {
            labels.push(activeSubCategory
              ? `${activeCategory.name} › ${activeSubCategory.name}`
              : activeCategory.name);
          }
          if (params.get('featured') === 'true')   labels.push('Featured Books');
          if (params.get('bestseller') === 'true')  labels.push('Bestsellers');
          if (params.get('trending') === 'true')    labels.push('Trending');
          if (params.get('newArrival') === 'true')  labels.push('New Arrivals');
          if (params.get('boxSet') === 'true')      labels.push('Box Sets');
          if (params.get('minPrice') || params.get('maxPrice')) {
            const min = params.get('minPrice') || '0';
            const max = params.get('maxPrice');
            labels.push(max
              ? `Price: ${currencySymbol}${usdToDisplay(min)} – ${currencySymbol}${usdToDisplay(max)}`
              : `Price: from ${currencySymbol}${usdToDisplay(min)}`);
          }
          if (!labels.length) return null;
          return (
            <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <span className="font-semibold shrink-0">Showing:</span>
              <span className="flex flex-wrap gap-x-1">
                {labels.map((l, i) => (
                  <span key={i} className="whitespace-nowrap">
                    {i > 0 && <span className="text-amber-400 mx-0.5">·</span>}
                    {l}
                  </span>
                ))}
              </span>
              <button onClick={clearFilters} className="ml-auto shrink-0 text-xs underline underline-offset-2 hover:text-amber-900">Clear</button>
            </div>
          );
        })()}

        {/* Floating Filters Sidebar */}
        <FiltersSidebar
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          categories={categories}
          selectedCategories={selectedCategories}
          subcategories={subcategories}
          selectedSubCategories={selectedSubCategories}
          minPrice={minPrice}
          maxPrice={maxPrice}
          conditions={conditions}
          selectedConditions={selectedConditions}
          selectedTags={selectedTags}
          onClearFilters={clearFilters}
          onApplyFilters={handleApplyFilters}
        />


        {/* Main Content - Full Width */}
        <div className="w-full">
          {/* Filter Button & Sort Options */}
          <div className="flex sm:flex-row justify-between items-center sm:items-center gap-4 mb-6">
            <Button
              onClick={() => setShowFilters(true)}
              variant="outline"
              size={"sm"}
              className="flex items-center gap-2 border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-full"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(selectedCategories.length > 0 || selectedSubCategories.length > 0 || selectedConditions.length > 0 || minPrice || maxPrice) && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-primary-aqua text-white rounded-full">
                  {selectedCategories.length + selectedSubCategories.length + selectedConditions.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0)}
                </span>
              )}
            </Button>

            <SortFilterHeader
              currentCount={books.length}
              totalCount={totalBooks}
              startIndex={books.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}
              endIndex={Math.min(currentPage * itemsPerPage, totalBooks)}
              sortValue={`${sortBy}-${sortOrder}`}
              onSortChange={handleSortChange}
              sortOptions={sortOptions ?? []}
              showResults={false}
            />
          </div>

          {/* Results Count */}
          <p className="text-secondary-black mb-4">
            Showing {books.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, totalBooks)} of {totalBooks} results
          </p>

          {/* Search Results Info */}
          {search && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                Search results for: <strong>"{search}"</strong> ({totalBooks} {totalBooks === 1 ? 'book' : 'books'} found)
              </p>
            </div>
          )}

          {/* Books Grid */}
          {isLoading || isFetching ? (
            <div className="catalog-books-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="rounded-xl border bg-white shadow-sm overflow-hidden animate-pulse">
                  {/* cover image */}
                  <div className="bg-gray-200 h-[180px] sm:h-[260px] w-full" />
                  {/* details */}
                  <div className="px-2 sm:px-4 pt-2 pb-3 space-y-2">
                    {/* title — 2 lines */}
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-4/5" />
                    {/* author */}
                    <div className="h-2.5 bg-gray-100 rounded w-3/5" />
                    {/* price row */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                    {/* shipping row */}
                    <div className="flex justify-between pt-0.5">
                      <div className="h-2.5 bg-gray-100 rounded w-2/5" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : books.length > 0 ? (
            <>
              <div className="catalog-books-grid grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex flex-wrap gap-2 justify-center items-center w-full max-w-xs sm:max-w-none">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-full px-3 py-1 text-xs sm:px-4 sm:py-2 sm:text-base"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    {[...Array(Math.min(totalPages, 4))].map((_, i) => {
                      const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                      if (pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`rounded-full px-3 py-1 text-xs sm:px-4 sm:py-2 sm:text-base ${currentPage === pageNum ? "bg-primary-aqua hover:bg-secondary-aqua" : ""}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-full px-3 py-1 text-xs sm:px-4 sm:py-2 sm:text-base"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-full text-center bg-white rounded-2xl shadow-md p-8 border border-gray-100">
                {/* Icon / Illustration */}
                <div className="w-28 h-28 mx-auto bg-primary-aqua/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <span className="text-5xl">📚</span>
                </div>

                {/* Heading */}
                <h3 className="text-2xl sm:text-3xl font-bookerly font-semibold text-base-black mb-3">
                  No books found
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  We couldn’t find any books matching your search. Try adjusting your filters, or explore our featured books below.
                </p>

                {/* Clear Filters Button */}
                <Button
                  onClick={clearFilters}
                  className="bg-primary-aqua hover:bg-secondary-aqua text-white font-medium px-6 py-3 rounded-full transition-transform transform hover:scale-105 focus:outline-none"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
