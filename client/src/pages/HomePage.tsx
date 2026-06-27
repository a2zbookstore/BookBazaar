import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Book, Category } from "@/types";
import { Clock, Sparkles, Search, ChevronLeft, ChevronRight } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import HeroBannerGrid from "@/components/HeroBannerGrid";
import BookCarousel from "@/components/BookCarousel";
import PocketBannerSection from "@/components/PocketBannerSection";
import LuckyDrawSpinner from "@/components/LuckyDrawSpinner";
import { useBrowsingHistory } from "@/hooks/useBrowsingHistory";

interface CategoryCarouselProps {
  category: Category;
  variant?: 'default' | 'warm' | 'cool' | 'neutral' | 'soft';
  forceVisible?: boolean;
}

function CategoryCarousel({ category, variant = 'default', forceVisible = false }: CategoryCarouselProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = forceVisible || isIntersecting;
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (forceVisible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [forceVisible]);

  const { data: categoryBooksResponse, isLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: [`/api/books?categoryId=${category.id}&limit=12`],
    enabled: isVisible, // Only fetch when visible
  });

  const categoryBooks = categoryBooksResponse?.books || [];

  // Mirror the same maxSlide formula used inside BookCarousel
  const CARD_WIDTH_PX = 14 * 16; // w-56 = 14rem
  const GAP_PX = 1 * 16;         // gap-4 = 1rem
  const visibleCards = typeof window !== 'undefined' && window.innerWidth >= 768
    ? Math.floor((window.innerWidth - 64) / (CARD_WIDTH_PX + GAP_PX))
    : 2;
  const maxSlide = Math.max(0, categoryBooks.length - visibleCards);

  if (isVisible && !isLoading && categoryBooks.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full mb-12">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 gap-2">

        {/* ── Title block ── */}
        <Link
          href={`/catalog?categoryId=${category.id}`}
          className="group relative flex items-center gap-2 sm:gap-3 min-w-0 py-1"
        >
          <span className="shrink-0 w-1 rounded-full bg-primary-aqua h-6 sm:h-7" />
          <div className="min-w-0">
            <h3 className="text-lg sm:text-2xl md:text-3xl font-bookerly font-extrabold tracking-tight text-slate-900 leading-none truncate">
              {category.name}
            </h3>
            <span className="flex items-center gap-0.5 mt-0.5 sm:mt-1">
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-primary-aqua whitespace-nowrap">
                Explore all
              </span>
              <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-aqua" />
            </span>
          </div>
        </Link>

        {/* ── Right: dots + arrows (desktop only) ── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* progress dots */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(categoryBooks.length > 0 ? maxSlide + 1 : 0, 5) }).map((_, i) => (
              <span
                key={i}
                className={`block rounded-full transition-all duration-300 ${
                  i === Math.min(currentSlide, 4)
                    ? 'w-4 h-1.5 bg-primary-aqua'
                    : 'w-1.5 h-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Prev */}
          <button
            onClick={() => setCurrentSlide((s) => Math.max(s - 1, 0))}
            disabled={currentSlide === 0}
            className="group/btn relative flex items-center justify-center w-8 h-8 disabled:opacity-25 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <span className="absolute inset-0 rounded-full border border-gray-200 group-hover/btn:border-primary-aqua group-hover/btn:bg-primary-aqua/5 transition-all duration-200" />
            <span className="relative flex items-center -space-x-1.5">
              <ChevronLeft className="h-3.5 w-3.5 text-primary-aqua" />
              <ChevronLeft className="h-3.5 w-3.5 text-primary-aqua/35" />
            </span>
          </button>

          {/* Next */}
          <button
            onClick={() => setCurrentSlide((s) => Math.min(s + 1, maxSlide))}
            disabled={currentSlide >= maxSlide}
            className="group/btn relative flex items-center justify-center w-8 h-8 disabled:opacity-25 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <span className="absolute inset-0 rounded-full bg-primary-aqua group-hover/btn:scale-110 transition-transform duration-200" />
            <span className="relative flex items-center -space-x-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-white" />
              <ChevronRight className="h-3.5 w-3.5 text-white/35" />
            </span>
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-primary-aqua/40 via-gray-200 to-transparent" />

      <BookCarousel
        books={categoryBooks}
        emptyMessage={`No ${category.name} books available at the moment.`}
        showEmptyBrowseButton={false}
        isLoading={isLoading || !isVisible}
        currentSlide={currentSlide}
        onSlideChange={setCurrentSlide}
      />
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="w-full mb-12 animate-pulse">
      {/* header row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-7 bg-gray-300 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <div className="h-7 bg-gray-200 rounded w-44" />
          <div className="h-2.5 bg-gray-100 rounded w-16" />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-gray-200 rounded-full" />)}
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="w-8 h-8 rounded-full bg-gray-300" />
        </div>
      </div>
      <div className="h-px w-full mb-6 bg-gradient-to-r from-gray-300/60 via-gray-200 to-transparent" />
      {/* book cards */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-56 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="h-[180px] sm:h-[260px] bg-gray-200 w-full" />
            <div className="px-3 pt-2 pb-3 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-4/5" />
              <div className="h-2.5 bg-gray-100 rounded w-3/5" />
              <div className="flex gap-2 pt-1">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="flex justify-between pt-0.5">
                <div className="h-2.5 bg-gray-100 rounded w-2/5" />
                <div className="h-2.5 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [isNewArrivalsVisible, setIsNewArrivalsVisible] = useState(false);
  const [isBoxSetVisible, setIsBoxSetVisible] = useState(false);
  const newArrivalsRef = useRef<HTMLDivElement>(null);
  const boxSetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      rootMargin: '200px',
      threshold: 0.1,
    };

    const setupObserver = (ref: React.RefObject<HTMLDivElement>, setVisible: (visible: boolean) => void) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisible(true);
              observer.disconnect();
            }
          });
        },
        observerOptions
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return observer;
    };

    const observers = [
      setupObserver(newArrivalsRef, setIsNewArrivalsVisible),
      setupObserver(boxSetRef, setIsBoxSetVisible),
    ];

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  // Structured data for homepage - both WebSite and Organization schemas
  const structuredData = [
    // WebSite schema for search functionality
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://a2zbookshop.com/#website",
      "name": "A2Z BOOKSHOP",
      "alternateName": ["A2Z Bookshop", "A2Z Book Shop", "a2z bookshop", "a2z books", "A to Z Bookshop"],
      "url": "https://a2zbookshop.com",
      "description": "Buy books online at best prices. Fiction, non-fiction, bestsellers and more.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://a2zbookshop.com/catalog?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    // Organization schema for logo and business details (required for Google logo display)
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "A2Z BOOKSHOP",
      "alternateName": ["A2Z Bookshop", "A2Z Book Shop", "a2z bookshop", "a2z books", "A to Z Bookshop"],
      "url": "https://a2zbookshop.com",
      "logo": "https://a2zbookshop.com/logo.jpeg",
      "image": "https://a2zbookshop.com/logo.jpeg",
      "description": "A2Z BOOKSHOP is your premier online destination for new and used books. We offer thousands of titles across all genres with fast shipping and competitive prices.",
      "sameAs": [
        // Add your social media profiles here when you create them
        // "https://www.facebook.com/a2zbookshop",
        // "https://www.instagram.com/a2zbookshop",
        // "https://twitter.com/a2zbookshop"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Service",
        "email": "support@a2zbookshop.com"
      }
    }
  ];

  // const { data: featuredBooksResponse, isLoading: featuredLoading } = useQuery<{ books: Book[]; total: number }>({
  //   queryKey: ["/api/books?featured=true&limit=12"],
  //   enabled: isFeaturedVisible,
  // });
  // const featuredBooks = featuredBooksResponse?.books || [];

  // const { data: bestsellerBooksResponse, isLoading: bestsellerLoading } = useQuery<{ books: Book[]; total: number }>({
  //   queryKey: ["/api/books?bestseller=true&limit=12"],
  //   enabled: isBestsellersVisible,
  // });
  // const bestsellerBooks = bestsellerBooksResponse?.books || [];

  // const { data: trendingBooksResponse, isLoading: trendingLoading } = useQuery<{ books: Book[]; total: number }>({
  //   queryKey: ["/api/books?trending=true&limit=12"],
  //   enabled: isTrendingVisible,
  // });
  // const trendingBooks = trendingBooksResponse?.books || [];

  const { data: newArrivalsResponse, isLoading: newArrivalsLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?newArrival=true&limit=12"],
    enabled: isNewArrivalsVisible,
  });
  const newArrivals = newArrivalsResponse?.books || [];

  const { data: boxSetBooksResponse, isLoading: boxSetLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?boxSet=true&limit=12"],
    enabled: isBoxSetVisible,
  });
  const boxSetBooks = boxSetBooksResponse?.books || [];

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const sortedCategories = useMemo(() =>
    categories
      .filter(c => c.showOnHomepage !== false)
      .slice().sort((a, b) => {
      if (a.sort_order != null && b.sort_order != null) return a.sort_order - b.sort_order;
      if (a.sort_order != null) return -1;
      if (b.sort_order != null) return 1;
      return 0;
    }), [categories]);

  const cat0 = sortedCategories[0];
  const cat1 = sortedCategories[1];
  const cat2 = sortedCategories[2];

  const { isLoading: cat0Loading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: [`/api/books?categoryId=${cat0?.id ?? 0}&limit=12`],
    enabled: !!cat0,
  });
  const { isLoading: cat1Loading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: [`/api/books?categoryId=${cat1?.id ?? 0}&limit=12`],
    enabled: !!cat1,
  });
  const { isLoading: cat2Loading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: [`/api/books?categoryId=${cat2?.id ?? 0}&limit=12`],
    enabled: !!cat2,
  });

  const isPageReady = !categoriesLoading && (
    sortedCategories.length === 0 ||
    ((!cat0 || !cat0Loading) && (!cat1 || !cat1Loading) && (!cat2 || !cat2Loading))
  );

  // ── Browsing history & personalisation ──
  const {
    recentlyViewed,
    suggestedBooks,
    recentSearches,
    hasHistory,
  } = useBrowsingHistory();

  return (
    <div className="sm:px-8">
      <SEO
        title="A2Z BOOKSHOP - Buy Books Online | New & Used Books"
        description="A2Z Bookshop — your global online bookstore for new & used books. Browse 1000s of titles — fiction, non-fiction, children's, academic & more. Filter by genre, condition or price. Secure checkout via PayPal, Stripe & Razorpay. Worldwide shipping."
        keywords="buy books online, online bookstore india, a2z bookshop, a2z book shop, a2z books, a to z bookshop, a2zbookshop, new books, used books, second hand books, pre owned books, cheap books, affordable books, discount books, fiction books, non fiction books, nonfiction books, children books, kids books, academic books, textbooks, bestsellers, trending books, book shop, book store, bookshop, bookstore, books online, order books online, book delivery india, buy books india, international book delivery, worldwide book shipping, english books online, buy novels online, buy story books, school books online, college books online, buy paperback books, buy hardcover books"
        image="https://a2zbookshop.com/logo.svg"
        url="https://a2zbookshop.com"
        type="website"
        structuredData={structuredData}
      />

      {/* Lucky Draw Spinner Widget */}
      {/* <LuckyDrawSpinner /> */}

      <div className="my-4 md:my-8">
        <HeroBannerGrid mainPageName="home" sidePageName="home_side" stripPageName="home_strip" />
      </div>

      {/* ── Personalised: For You ── */}
      {false && (
        <div className="mb-8">
          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <div
              className="
                w-full mb-6 p-4 md:p-6
                rounded-2xl
                bg-gradient-to-br from-white/80 via-orange-50/20 to-amber-50/40
                backdrop-blur-xl
                border border-orange-200/20
                shadow-[0_8px_32px_rgba(31,38,135,0.12),0_2px_8px_rgba(0,0,0,0.08)]
                relative overflow-hidden
              "
            >
              <div className="relative z-10 flex items-center justify-between gap-4 mb-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-white via-white to-orange-50 border border-orange-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <h3 className="text-xl sm:text-2xl font-bookerly font-extrabold text-slate-800">
                    Recently Viewed
                  </h3>
                </div>
              </div>
              <div className="h-px w-full mb-5 bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
              <BookCarousel
                books={recentlyViewed}
                emptyMessage=""
                showEmptyBrowseButton={false}
                isLoading={false}
              />
            </div>
          )}

          {/* Recommended For You */}
          {suggestedBooks.length > 0 && (
            <div
              className="
                w-full mb-6 p-4 md:p-6
                rounded-2xl
                bg-gradient-to-br from-white/80 via-purple-50/20 to-violet-50/40
                backdrop-blur-xl
                border border-purple-200/20
                shadow-[0_8px_32px_rgba(31,38,135,0.12),0_2px_8px_rgba(0,0,0,0.08)]
                relative overflow-hidden
              "
            >
              <div className="relative z-10 flex items-center justify-between gap-4 mb-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-white via-white to-purple-50 border border-purple-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="text-xl sm:text-2xl font-bookerly font-extrabold text-slate-800">
                    Recommended For You
                  </h3>
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium hidden sm:inline-flex">
                    Based on your browsing
                  </span>
                </div>
              </div>
              <div className="h-px w-full mb-5 bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
              <BookCarousel
                books={suggestedBooks}
                emptyMessage=""
                showEmptyBrowseButton={false}
                isLoading={false}
              />
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6 px-1">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-500">Recent searches:</span>
              {recentSearches.map((q) => (
                <Link key={q} href={`/catalog?search=${encodeURIComponent(q)}`}>
                  <span className="text-sm px-3 py-1 bg-white border border-gray-200 hover:border-primary-aqua hover:text-primary-aqua rounded-full cursor-pointer transition-colors shadow-sm">
                    {q}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!isPageReady ? (
        <>
          <CategorySkeleton />
          <CategorySkeleton />
          <CategorySkeleton />
        </>
      ) : (
        sortedCategories.map((category, index) => {
          const variants: Array<'default' | 'warm' | 'cool' | 'neutral' | 'soft'> = ['default', 'warm', 'cool', 'neutral', 'soft'];
          const variant = variants[index % variants.length];
          return (
            <React.Fragment key={category.id}>
              {/* Pocket-style banner images for this category */}
              <div className="mt-6 md:mt-10 mb-3 md:mb-4">
                <PocketBannerSection
                  pageName={`category_${category.id}`}
                  fallbackPageNames={[category.name, category.name.toLowerCase()]}
                  categoryName={category.name}
                />
              </div>
              <CategoryCarousel
                category={category}
                variant={variant}
                forceVisible={index < 3}
              />
            </React.Fragment>
          );
        })
      )}

    </div>
  );
}
