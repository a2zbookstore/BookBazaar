import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Book, Category } from "@/types";
import { Library } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import BookCarousel from "@/components/BookCarousel";

interface CategoryCarouselProps {
  category: Category;
  variant?: 'default' | 'warm' | 'cool' | 'neutral' | 'soft';
}

function CategoryCarousel({ category, variant = 'default' }: CategoryCarouselProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Define style variants - subtle and classic
  const styleVariants = {
    default: {
      container: "bg-gradient-to-br from-white/80 via-white/60 to-slate-50/40 border-white/30",
      glow: "from-slate-100/30 via-transparent to-gray-100/30",
      hover: "before:from-gray-500/3 before:via-slate-500/3 before:to-gray-500/3"
    },
    warm: {
      container: "bg-gradient-to-br from-white/80 via-amber-50/20 to-orange-50/40 border-amber-200/20",
      glow: "from-amber-100/25 via-transparent to-orange-100/25",
      hover: "before:from-amber-500/4 before:via-orange-500/4 before:to-amber-500/4"
    },
    cool: {
      container: "bg-gradient-to-br from-white/80 via-blue-50/20 to-indigo-50/40 border-blue-200/20",
      glow: "from-blue-100/25 via-transparent to-indigo-100/25",
      hover: "before:from-blue-500/4 before:via-indigo-500/4 before:to-blue-500/4"
    },
    neutral: {
      container: "bg-gradient-to-br from-white/80 via-stone-50/20 to-neutral-50/40 border-stone-200/20",
      glow: "from-stone-100/25 via-transparent to-neutral-100/25",
      hover: "before:from-stone-500/4 before:via-neutral-500/4 before:to-stone-500/4"
    },
    soft: {
      container: "bg-gradient-to-br from-white/80 via-rose-50/15 to-pink-50/30 border-rose-200/15",
      glow: "from-rose-100/20 via-transparent to-pink-100/20",
      hover: "before:from-rose-500/3 before:via-pink-500/3 before:to-rose-500/3"
    }
  };

  const currentStyle = styleVariants[variant];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
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
  }, []);

  // Only fetch data when carousel is visible
  const { data: categoryBooksResponse, isLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: [`/api/books?categoryId=${category.id}&limit=12`],
    enabled: isVisible, // Only fetch when visible
  });

  const categoryBooks = categoryBooksResponse?.books || [];

  // Don't render if no books after loading
  if (isVisible && !isLoading && categoryBooks.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`
    w-full mb-8 p-4 md:p-6
    rounded-2xl
    ${currentStyle.container}
    backdrop-blur-xl
    border
    shadow-[0_8px_32px_rgba(31,38,135,0.15),0_2px_8px_rgba(0,0,0,0.1)]
    hover:shadow-[0_12px_48px_rgba(31,38,135,0.2),0_4px_16px_rgba(0,0,0,0.15)]
    relative overflow-hidden
    transition-all duration-500 ease-out
    before:absolute before:inset-0 before:rounded-2xl 
    before:bg-gradient-to-br ${currentStyle.hover}
    before:opacity-0 before:transition-opacity before:duration-500
    hover:before:opacity-100
  `}
    >
      {/* Soft background glow */}
      <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${currentStyle.glow}`} />

      {isVisible ? (
        <>
          <div
            className="
          relative z-10
          flex items-center justify-between gap-4 mb-8 p-3
          sm:p-5 rounded-xl
          bg-gradient-to-r from-white via-white to-blue-50
          border border-blue-100
          shadow-sm
          group
        "
          >
            {/* Title */}
            <div className="flex items-center gap-4 group w-full">

              <div className=" flex flex-row justify-between items-center w-full ">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bookerly font-extrabold tracking-wider leading-tight text-transparent 
                bg-clip-text bg-gradient-to-r !text-black drop-shadow-[0_2px_6px_rgba(34,211,238,0.25)] relative">
                  {category.name}
                </h3>

                <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-1">
                  {category.description}
                </p>

                {/* CTA */}
                {/* /catalog?search=DSM */}
                <Link href={`/catalog?categoryId=${category.id}`}>
                  <Button
                    variant="outline"
                    size={"sm"}
                    className="
                              rounded-full px-6
                              border-primary-aqua text-primary-aqua
                              hover:bg-primary-aqua hover:text-white
                              transition-all duration-300
                              hover:shadow-lg hover:scale-[1.05]"
                  >
                    View All
                  </Button>
                </Link>
              </div>
              <p className="hidden text-xs sm:text-sm text-gray-500 mt-1">
                {category.description}
              </p>
            </div>
          </div>


          {/* Divider */}
          <div className="h-px w-full mb-6 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Carousel */}
          <BookCarousel
            books={categoryBooks}
            emptyMessage={`No ${category.name} books available at the moment.`}
            showEmptyBrowseButton={false}
            isLoading={isLoading}
          />
        </>

      ) : (
        // Placeholder while waiting to scroll into view - show category name
        <div className="py-4 w-full">
          <div className="flex flex-row items-center sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center justify-between gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-red-400 rounded-lg blur-md opacity-30 group-hover:opacity-50 transition-opacity"> </div>
                <Library className="relative sm:h-6 sm:w-6 md:h-8 md:w-8 text-red-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
              </div>
              <div className="relative">
                <h3 className="text-2xl md:text-3xl font-bookerly font-bold bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                  {category.name}</h3>
              </div>
              <div className="absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r from-red-600 to-amber-600 group-hover:w-full transition-all duration-300 rounded-full"></div>

            </div>
          </div>
          <BookCarousel
            books={[]}
            emptyMessage=""
            showEmptyBrowseButton={false}
            isLoading={true}
          />
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  // Visibility states for lazy loading
  const [isBestsellersVisible, setIsBestsellersVisible] = useState(false);
  const [isFeaturedVisible, setIsFeaturedVisible] = useState(false);
  const [isTrendingVisible, setIsTrendingVisible] = useState(false);
  const [isNewArrivalsVisible, setIsNewArrivalsVisible] = useState(false);
  const [isBoxSetVisible, setIsBoxSetVisible] = useState(false);
  const bestsellersRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
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
      setupObserver(bestsellersRef, setIsBestsellersVisible),
      setupObserver(featuredRef, setIsFeaturedVisible),
      setupObserver(trendingRef, setIsTrendingVisible),
      setupObserver(newArrivalsRef, setIsNewArrivalsVisible),
      setupObserver(boxSetRef, setIsBoxSetVisible),
    ];

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  // Structured data for homepage
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "A2Z BOOKSHOP",
    "url": "https://a2zbookshop.com",
    "description": "Buy books online at best prices. Fiction, non-fiction, bestsellers and more.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://a2zbookshop.com/catalog?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const { data: featuredBooksResponse, isLoading: featuredLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?featured=true&limit=12"],
    enabled: isFeaturedVisible,
  });
  const featuredBooks = featuredBooksResponse?.books || [];

  const { data: bestsellerBooksResponse, isLoading: bestsellerLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?bestseller=true&limit=12"],
    enabled: isBestsellersVisible,
  });
  const bestsellerBooks = bestsellerBooksResponse?.books || [];

  const { data: trendingBooksResponse, isLoading: trendingLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?trending=true&limit=12"],
    enabled: isTrendingVisible,
  });
  const trendingBooks = trendingBooksResponse?.books || [];

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

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <div className="sm:px-8">
      <SEO
        title="A2Z BOOKSHOP - Buy Books Online | New & Used Books"
        description="Discover thousands of books at A2Z Bookshop. Best prices on fiction, non-fiction, bestsellers, trending books and more. Fast shipping across India with secure payment options."
        keywords="buy books online, online bookstore India, new books, used books, fiction books, non-fiction books, bestsellers, trending books, book store"
        image="https://a2zbookshop.com/logo.svg"
        url="https://a2zbookshop.com"
        type="website"
        structuredData={structuredData}
      />

      <div className="hidden md:block my-8">
        <BannerCarousel
          pageName="home"
          autoPlayInterval={5000}
          showIndicators={true}
          showNavigation={true}
          height="h-48 md:h-64"
        />
      </div>

      {/* Category-Based Carousels */}
      {categories.length > 0 && categories
        .slice() // copy array to avoid mutating original
        .sort((a, b) => {
          if (a.sort_order != null && b.sort_order != null) {
            return a.sort_order - b.sort_order;
          }
          if (a.sort_order != null) return -1;
          if (b.sort_order != null) return 1;
          return 0;
        })
        .map((category, index) => {
          // Assign variants in a subtle rotating pattern
          const variants: Array<'default' | 'warm' | 'cool' | 'neutral' | 'soft'> = ['default', 'warm', 'cool', 'neutral', 'soft'];
          const variant = variants[index % variants.length];

          return (
            <CategoryCarousel
              key={category.id}
              category={category}
              variant={variant}
            />
          );
        })}

      {/* Bestsellers Section - Moving Carousel */}
      <div
        ref={bestsellersRef}
        className="
          w-full mb-8 p-4 md:p-6
          rounded-2xl
          bg-gradient-to-br from-white/80 via-blue-50/20 to-indigo-50/40
          backdrop-blur-xl
          border border-blue-200/20
          shadow-[0_8px_32px_rgba(31,38,135,0.15),0_2px_8px_rgba(0,0,0,0.1)]
          hover:shadow-[0_12px_48px_rgba(31,38,135,0.2),0_4px_16px_rgba(0,0,0,0.15)]
          relative overflow-hidden
          transition-all duration-500 ease-out
          before:absolute before:inset-0 before:rounded-2xl 
          before:bg-gradient-to-br before:from-blue-500/4 before:via-indigo-500/4 before:to-blue-500/4
          before:opacity-0 before:transition-opacity before:duration-500
          hover:before:opacity-100
        "
      >
        {/* Soft background glow */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-100/25 via-transparent to-indigo-100/25" />

        <div className="
          relative z-10
          flex items-center justify-between gap-4 mb-8 p-3
          sm:p-5 rounded-xl
          bg-gradient-to-r from-white via-white to-blue-50
          border border-blue-100
          shadow-sm
          group
        ">
          <div className="flex items-center gap-4 group w-full">
            <div className="flex flex-row justify-between items-center w-full">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bookerly font-extrabold tracking-wider leading-tight text-slate-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                Bestsellers
              </h3>
              <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-1">
                Top selling books
              </p>
              <Link href="/catalog?bestseller=true">
                <Button variant="outline" size={"sm"} className="
                  rounded-full px-6
                  border-primary-aqua text-primary-aqua
                  hover:bg-primary-aqua hover:text-white
                  transition-all duration-300
                  hover:shadow-lg hover:scale-[1.05]
                ">
                  View All
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full mb-6 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <BookCarousel
          books={bestsellerBooks}
          emptyMessage="Loading bestsellers..."
          showEmptyBrowseButton={false}
          isLoading={bestsellerLoading || !isBestsellersVisible}
        />
      </div>

      {/* Featured Books Section - Moving Carousel */}
      <div
        ref={featuredRef}
        className="
          w-full mb-8 p-4 md:p-6
          rounded-2xl
          bg-gradient-to-br from-white/80 via-amber-50/20 to-orange-50/40
          backdrop-blur-xl
          border border-amber-200/20
          shadow-[0_8px_32px_rgba(31,38,135,0.15),0_2px_8px_rgba(0,0,0,0.1)]
          hover:shadow-[0_12px_48px_rgba(31,38,135,0.2),0_4px_16px_rgba(0,0,0,0.15)]
          relative overflow-hidden
          transition-all duration-500 ease-out
          before:absolute before:inset-0 before:rounded-2xl 
          before:bg-gradient-to-br before:from-amber-500/4 before:via-orange-500/4 before:to-amber-500/4
          before:opacity-0 before:transition-opacity before:duration-500
          hover:before:opacity-100
        "
      >
        {/* Soft background glow */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-100/25 via-transparent to-orange-100/25" />

        <div className="
          relative z-10
          flex items-center justify-between gap-4 mb-8 p-3
          sm:p-5 rounded-xl
          bg-gradient-to-r from-white via-white to-blue-50
          border border-blue-100
          shadow-sm
          group
        ">
          <div className="flex items-center gap-4 group w-full">
            <div className="flex flex-row justify-between items-center w-full">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bookerly font-extrabold tracking-wider leading-tight text-slate-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                Featured Books
              </h3>
              <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-1">
                Editor's choice
              </p>
              <Link href="/catalog?featured=true">
                <Button variant="outline" size={"sm"} className="
                  rounded-full px-6
                  border-primary-aqua text-primary-aqua
                  hover:bg-primary-aqua hover:text-white
                  transition-all duration-300
                  hover:shadow-lg hover:scale-[1.05]
                ">
                  View All
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full mb-6 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <BookCarousel
          books={featuredBooks}
          emptyMessage="No featured books available at the moment."
          isLoading={featuredLoading || !isFeaturedVisible}
        />
      </div>

      {/* Trending Items Section - Moving Carousel */}
      <div
        ref={trendingRef}
        className="
          w-full mb-8 p-4 md:p-6
          rounded-2xl
          bg-gradient-to-br from-white/80 via-rose-50/15 to-pink-50/30
          backdrop-blur-xl
          border border-rose-200/15
          shadow-[0_8px_32px_rgba(31,38,135,0.15),0_2px_8px_rgba(0,0,0,0.1)]
          hover:shadow-[0_12px_48px_rgba(31,38,135,0.2),0_4px_16px_rgba(0,0,0,0.15)]
          relative overflow-hidden
          transition-all duration-500 ease-out
          before:absolute before:inset-0 before:rounded-2xl 
          before:bg-gradient-to-br before:from-rose-500/3 before:via-pink-500/3 before:to-rose-500/3
          before:opacity-0 before:transition-opacity before:duration-500
          hover:before:opacity-100
        "
      >
        {/* Soft background glow */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rose-100/20 via-transparent to-pink-100/20" />

        <div className="
          relative z-10
          flex items-center justify-between gap-4 mb-8 p-3
          sm:p-5 rounded-xl
          bg-gradient-to-r from-white via-white to-blue-50
          border border-blue-100
          shadow-sm
          group
        ">
          <div className="flex items-center gap-4 group w-full">
            <div className="flex flex-row justify-between items-center w-full">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bookerly font-extrabold tracking-wider leading-tight text-slate-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                Trending Now
              </h3>
              <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-1">
                Popular this week
              </p>
              <Link href="/catalog?trending=true">
                <Button variant="outline" size={"sm"} className="
                  rounded-full px-6
                  border-primary-aqua text-primary-aqua
                  hover:bg-primary-aqua hover:text-white
                  transition-all duration-300
                  hover:shadow-lg hover:scale-[1.05]
                ">
                  View All
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full mb-6 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <BookCarousel
          books={trendingBooks}
          emptyMessage="No trending books available at the moment."
          isLoading={trendingLoading || !isTrendingVisible}
        />
      </div>

      {/* New Arrivals Section - Moving Carousel */}
      <div
        ref={newArrivalsRef}
        className="
          w-full mb-8 p-4 md:p-6
          rounded-2xl
          bg-gradient-to-br from-white/80 via-stone-50/20 to-neutral-50/40
          backdrop-blur-xl
          border border-stone-200/20
          shadow-[0_8px_32px_rgba(31,38,135,0.15),0_2px_8px_rgba(0,0,0,0.1)]
          hover:shadow-[0_12px_48px_rgba(31,38,135,0.2),0_4px_16px_rgba(0,0,0,0.15)]
          relative overflow-hidden
          transition-all duration-500 ease-out
          before:absolute before:inset-0 before:rounded-2xl 
          before:bg-gradient-to-br before:from-stone-500/4 before:via-neutral-500/4 before:to-stone-500/4
          before:opacity-0 before:transition-opacity before:duration-500
          hover:before:opacity-100
        "
      >
        {/* Soft background glow */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-stone-100/25 via-transparent to-neutral-100/25" />

        <div className="
          relative z-10
          flex items-center justify-between gap-4 mb-8 p-3
          sm:p-5 rounded-xl
          bg-gradient-to-r from-white via-white to-blue-50
          border border-blue-100
          shadow-sm
          group
        ">
          <div className="flex items-center gap-4 group w-full">
            <div className="flex flex-row justify-between items-center w-full">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bookerly font-extrabold tracking-wider leading-tight text-slate-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                New Arrivals
              </h3>
              <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-1">
                Latest additions
              </p>
              <Link href="/catalog?newArrival=true">
                <Button variant="outline" size={"sm"} className="
                  rounded-full px-6
                  border-primary-aqua text-primary-aqua
                  hover:bg-primary-aqua hover:text-white
                  transition-all duration-300
                  hover:shadow-lg hover:scale-[1.05]
                ">
                  View All
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full mb-6 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <BookCarousel
          books={newArrivals}
          emptyMessage="No new arrivals available at the moment."
          isLoading={newArrivalsLoading || !isNewArrivalsVisible}
        />
      </div>

      {/* Box Set Items Section - Moving Carousel */}
      <div
        ref={boxSetRef}
        className="
          w-full mb-8 p-4 md:p-6
          rounded-2xl
          bg-gradient-to-br from-white/80 via-white/60 to-slate-50/40
          backdrop-blur-xl
          border border-white/30
          shadow-[0_8px_32px_rgba(31,38,135,0.15),0_2px_8px_rgba(0,0,0,0.1)]
          hover:shadow-[0_12px_48px_rgba(31,38,135,0.2),0_4px_16px_rgba(0,0,0,0.15)]
          relative overflow-hidden
          transition-all duration-500 ease-out
          before:absolute before:inset-0 before:rounded-2xl 
          before:bg-gradient-to-br before:from-gray-500/3 before:via-slate-500/3 before:to-gray-500/3
          before:opacity-0 before:transition-opacity before:duration-500
          hover:before:opacity-100
        "
      >
        {/* Soft background glow */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-slate-100/30 via-transparent to-gray-100/30" />

        <div className="
          relative z-10
          flex items-center justify-between gap-4 mb-8 p-3
          sm:p-5 rounded-xl
          bg-gradient-to-r from-white via-white to-blue-50
          border border-blue-100
          shadow-sm
          group
        ">
          <div className="flex items-center gap-4 group w-full">
            <div className="flex flex-row justify-between items-center w-full">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bookerly font-extrabold tracking-wider leading-tight text-slate-800 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                Boxset Collections
              </h3>
              <p className="hidden sm:block text-xs sm:text-sm text-gray-500 mt-1">
                Complete series
              </p>
              <Link href="/catalog?boxSet=true">
                <Button variant="outline" size={"sm"} className="
                  rounded-full px-6
                  border-primary-aqua text-primary-aqua
                  hover:bg-primary-aqua hover:text-white
                  transition-all duration-300
                  hover:shadow-lg hover:scale-[1.05]
                ">
                  View All
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full mb-6 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <BookCarousel
          books={boxSetBooks}
          emptyMessage="No box set collections available at the moment."
          isLoading={boxSetLoading || !isBoxSetVisible}
        />
      </div>

    </div>
  );
}
