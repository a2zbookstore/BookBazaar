import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Book, Category } from "@/types";
import { Star, TrendingUp, Award, Flame, Package, BookOpen, Library } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import BookCarousel from "@/components/BookCarousel";
import { useUserLocation } from "@/contexts/userLocationContext";

interface CategoryCarouselProps {
  category: Category;
}

function CategoryCarousel({ category }: CategoryCarouselProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div ref={containerRef} className="py-4 w-full">
      {isVisible ? (
        <>
          <div className="flex flex-row items-center sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center justify-between gap-3 group">
              {/* <Library className="h-8 w-8 text-primary-aqua" /> */}
              <div className="relative">
                <div className="absolute inset-0 bg-red-400 rounded-lg blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <BookOpen className="relative sm:h-6 sm:w-6 md:h-8 md:w-8 text-red-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
              </div>
              <div className="relative">
                <h3 className="text-2xl md:text-3xl font-bookerly font-bold bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                  {category.name}
                </h3>
                <div className="absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r from-red-600 to-amber-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
              </div>
            </div>
            <Link href={`/catalog?categoryId=${category.id}`}>
              <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-full">
                View All
              </Button>
            </Link>
          </div>
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
                  {category.name}</h3> </div>
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
  const [isNfpaVisible, setIsNfpaVisible] = useState(false);
  const [isDsmVisible, setIsDsmVisible] = useState(false);
  const [isBestsellersVisible, setIsBestsellersVisible] = useState(false);
  const [isFeaturedVisible, setIsFeaturedVisible] = useState(false);
  const [isTrendingVisible, setIsTrendingVisible] = useState(false);
  const [isNewArrivalsVisible, setIsNewArrivalsVisible] = useState(false);
  const [isBoxSetVisible, setIsBoxSetVisible] = useState(false);

  // Refs for Intersection Observer
  const nfpaRef = useRef<HTMLDivElement>(null);
  const dsmRef = useRef<HTMLDivElement>(null);
  const bestsellersRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const newArrivalsRef = useRef<HTMLDivElement>(null);
  const boxSetRef = useRef<HTMLDivElement>(null);

  // Setup Intersection Observers for lazy loading
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
      setupObserver(nfpaRef, setIsNfpaVisible),
      setupObserver(dsmRef, setIsDsmVisible),
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
  const {
    location } = useUserLocation();

  // NFPA Books Query (title only)
  const { data: nfpaBooksResponse, isLoading: nfpaLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?search=NFPA&titleOnly=true&limit=12"],
    enabled: isNfpaVisible,
  });
  const nfpaBooks = nfpaBooksResponse?.books || [];

  // DSM Books Query (title only)
  const { data: dsmBooksResponse, isLoading: dsmLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?search=DSM&titleOnly=true&limit=12"],
    enabled: isDsmVisible,
  });
  const dsmBooks = dsmBooksResponse?.books || [];

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
    <div className="xl:mx-16 sm:px-8">
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

      {/* NFPA Books Section - Moving Carousel */}
      {/* <div ref={nfpaRef} className="py-4 w-full">
        <div className="flex flex-row items-center sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center justify-between gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-red-400 rounded-lg blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <BookOpen className="relative sm:h-6 sm:w-6 md:h-8 md:w-8 text-red-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
            </div>
            <div className="relative">
              <h3 className="text-2xl md:text-3xl font-bookerly font-bold bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                NFPA Books
              </h3>
              <div className="absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r from-red-600 to-amber-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
            </div>
          </div>
          <Link href="/catalog?search=NFPA">
            <Button variant="outline" size={"sm"} className="border-primary-aqua text-primary-aqua 
            hover:bg-primary-aqua hover:text-white rounded-full whitespace-nowrap text-sm sm:text-base">
              View All
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={nfpaBooks}
          bgGradient="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50"
          emptyMessage="No NFPA books available at the moment."
          showEmptyBrowseButton={false}
          isLoading={nfpaLoading || !isNfpaVisible}
        />
      </div> */}

      {/* DSM Books Section - Moving Carousel */}
      {/* <div ref={dsmRef} className="py-4 w-full">
        <div className="flex flex-row items-center sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <Award className="relative h-8 w-8 text-purple-600 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" />
            </div>
            <div className="relative">
              <h3 className="text-2xl sm:text-3xl font-bookerly font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-sm">
                DSM Books
              </h3>
              <div className="absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
            </div>
          </div>
          <Link href="/catalog?search=DSM">
            <Button variant="outline" size={"sm"} className="border-primary-aqua text-primary-aqua 
            hover:bg-primary-aqua hover:text-white rounded-full whitespace-nowrap text-sm sm:text-base">
              View All
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={dsmBooks}
          bgGradient="bg-gradient-to-r from-purple-50 via-violet-50 to-fuchsia-50"
          emptyMessage="No DSM books available at the moment."
          showEmptyBrowseButton={false}
          isLoading={dsmLoading || !isDsmVisible}
        />
      </div>  */}

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
        .map((category) => (
          <CategoryCarousel
            key={category.id}
            category={category}
          />
        ))}

      {/* Bestsellers Section - Moving Carousel */}
      <div ref={bestsellersRef} className="py-4 w-full">
        <div className="flex flex-row items-center sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 rounded-lg blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <TrendingUp className="relative h-8 w-8 text-primary-aqua group-hover:scale-110 group-hover:translate-y-[-4px] transition-all duration-300" />
            </div>
            <div className="relative">
              <h3 className="text-2xl sm:text-3xl font-bookerly font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                Bestsellers
              </h3>
              <div className="absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
            </div>
          </div>
          <Link href="/catalog?bestseller=true">
            <Button variant="outline" size={"sm"} className="border-primary-aqua text-primary-aqua 
            hover:bg-primary-aqua hover:text-white rounded-full whitespace-nowrap text-sm sm:text-base">
              View All
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={bestsellerBooks}
          bgGradient="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50"
          emptyMessage="Loading bestsellers..."
          showEmptyBrowseButton={false}
          isLoading={bestsellerLoading || !isBestsellersVisible}
        />
      </div>

      {/* Featured Books Section - Moving Carousel */}
      <div ref={featuredRef} className="py-4 w-full">
        <div className="flex flex-row items-center sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
              <Star className="relative h-8 w-8 text-yellow-500 group-hover:scale-110 group-hover:rotate-[360deg] transition-all duration-500 fill-yellow-400" />
            </div>
            <div className="relative">
              <h3 className="text-2xl sm:text-3xl font-bookerly font-bold bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent drop-shadow-sm">
                Featured Books
              </h3>
              <div className="absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r from-yellow-600 to-orange-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
            </div>
          </div>
          <Link href="/catalog?featured=true">
            <Button variant="outline" size={"sm"} className="border-primary-aqua text-primary-aqua 
            hover:bg-primary-aqua hover:text-white rounded-full whitespace-nowrap text-sm sm:text-base">
              View All
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={featuredBooks}
          emptyMessage="No featured books available at the moment."
          isLoading={featuredLoading || !isFeaturedVisible}
        />
      </div>

      {/* Trending Items Section - Moving Carousel */}
      <div ref={trendingRef} className="py-4 w-full">
        <div className="flex flex-row items-center sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-lg blur-md opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
              <Flame className="relative h-8 w-8 text-red-500 group-hover:scale-110 group-hover:translate-y-[-2px] transition-all duration-300 fill-red-400" />
            </div>
            <div className="relative">
              <h3 className="text-2xl sm:text-3xl font-bookerly font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">
                Trending Now
              </h3>
              <div className="absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r from-red-600 to-yellow-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
            </div>
          </div>
          <Link href="/catalog?trending=true">
            <Button variant="outline" size={"sm"} className="border-primary-aqua text-primary-aqua 
            hover:bg-primary-aqua hover:text-white rounded-full whitespace-nowrap text-sm sm:text-base">
              View All
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={trendingBooks}
          bgGradient="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50"
          emptyMessage="No trending books available at the moment."
          isLoading={trendingLoading || !isTrendingVisible}
        />
      </div>

      {/* New Arrivals Section - Moving Carousel */}
      <div ref={newArrivalsRef} className="py-4 w-full">
        <div className="flex flex-row items-center sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-md blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <Package className="relative h-8 w-8 text-green-600 group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-3 transition-all duration-300" />
            </div>
            <div className="relative">
              <h3 className="text-2xl sm:text-3xl font-bookerly font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm">
                New Arrivals
              </h3>
              <div className="absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r from-green-600 to-teal-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
            </div>
          </div>
          <Link href="/catalog?newArrival=true">
            <Button variant="outline" size={"sm"} className="border-primary-aqua text-primary-aqua 
            hover:bg-primary-aqua hover:text-white rounded-full whitespace-nowrap text-sm sm:text-base">
              View All
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={newArrivals}
          bgGradient="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50"
          emptyMessage="No new arrivals available at the moment."
          isLoading={newArrivalsLoading || !isNewArrivalsVisible}
        />
      </div>

      {/* Box Set Items Section - Moving Carousel */}
      <div ref={boxSetRef} className="py-4 w-full">
        <div className="flex flex-row items-center sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <BookOpen className={`relative h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform`} />
            </div>
            <div className="relative">
              <h3 className="text-2xl sm:text-3xl font-bookerly font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-sm">
                Boxset Collections
              </h3>
              <div className="absolute -bottom-1 left-0 h-1 w-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
            </div>
          </div>
          <Link href="/catalog?boxSet=true">
            <Button variant="outline" size={"sm"} className="border-primary-aqua text-primary-aqua 
            hover:bg-primary-aqua hover:text-white rounded-full whitespace-nowrap text-sm sm:text-base">
              View All
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={boxSetBooks}
          bgGradient="bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50"
          emptyMessage="No box set collections available at the moment."
          isLoading={boxSetLoading || !isBoxSetVisible}
        />
      </div>

    </div>
  );
}
