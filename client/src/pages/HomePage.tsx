import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Book, Category } from "@/types";
import { Star, TrendingUp, Award, Flame, Package, BookOpen, Library } from "lucide-react";
import BannerCarousel from "@/components/BannerCarousel";
import BookCarousel from "@/components/BookCarousel";

// Lazy-loaded Category Carousel Component with Intersection Observer
interface CategoryCarouselProps {
  category: Category;
  currentSlide: number;
  onSlideChange: (slide: number) => void;
}

function CategoryCarousel({ category, currentSlide, onSlideChange }: CategoryCarouselProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect when carousel comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, stop observing
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before the element comes into view
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
    <div ref={containerRef} className="container-custom py-8">
      {isVisible ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Library className="h-8 w-8 text-primary-aqua" />
              <h3 className="text-3xl font-bookerly font-bold text-base-black">
                {category.name}
                {/* {isLoading && <span className="text-sm text-gray-500 ml-3">Loading...</span>} */}
              </h3>
            </div>
            <Link href={`/catalog?category=${category.slug}`}>
              <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-xl">
                View All {category.name}
              </Button>
            </Link>
          </div>
          
          <BookCarousel
            books={categoryBooks}
            currentSlide={currentSlide}
            onSlideChange={onSlideChange}
            emptyMessage={`No ${category.name} books available at the moment.`}
            showEmptyBrowseButton={false}
            isLoading={isLoading}
          />
        </>
      ) : (
        // Placeholder while waiting to scroll into view - show category name
        <div className="py-8">
          <div className="flex items-center gap-3 mb-8 opacity-50">
            <Library className="h-8 w-8 text-gray-400" />
            <h3 className="text-3xl font-bookerly font-bold text-gray-400">{category.name}</h3>
          </div>
          <BookCarousel
            books={[]}
            currentSlide={0}
            onSlideChange={() => {}}
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
  const [nfpaSlide, setNfpaSlide] = useState(0);
  const [dsmSlide, setDsmSlide] = useState(0);
  const [bestsellersSlide, setBestsellersSlide] = useState(0);
  const [featuredSlide, setFeaturedSlide] = useState(0);
  const [trendingSlide, setTrendingSlide] = useState(0);
  const [newArrivalsSlide, setNewArrivalsSlide] = useState(0);
  const [boxSetSlide, setBoxSetSlide] = useState(0);
  const [hasItemsInCart, setHasItemsInCart] = useState(false);
  const [categorySlides, setCategorySlides] = useState<Record<number, number>>({});
  
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

  // NFPA Books Query
  const { data: nfpaBooksResponse, isLoading: nfpaLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?search=NFPA&limit=12"],
    enabled: isNfpaVisible,
  });
  const nfpaBooks = nfpaBooksResponse?.books || [];

  // DSM Books Query
  const { data: dsmBooksResponse, isLoading: dsmLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?search=DSM&limit=12"],
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

  const { data: cartItems = [], refetch } = useQuery<any[]>({
    queryKey: ["/api/cart"],
  });

  useEffect(() => {
    setHasItemsInCart(Array.isArray(cartItems) && cartItems.length > 0);
  }, [cartItems]);

  return (
    <Layout>
      <SEO
        title="A2Z BOOKSHOP - Buy Books Online | New & Used Books"
        description="Discover thousands of books at A2Z Bookshop. Best prices on fiction, non-fiction, bestsellers, trending books and more. Fast shipping across India with secure payment options."
        keywords="buy books online, online bookstore India, new books, used books, fiction books, non-fiction books, bestsellers, trending books, book store"
        image="https://a2zbookshop.com/logo.svg"
        url="https://a2zbookshop.com"
        type="website"
        structuredData={structuredData}
      />

      <div className="container-custom py-8 mt-4">
        <BannerCarousel
          banners={[{
            id: 1,
            image: "/uploads/images/banner/banner-1.png",
            alt: "Buy 3 Books Offer",
            link: "/catalog"
          },
          {
            id: 2,
            image: "/uploads/images/banner/banner-2.png",
            alt: "Shop for $499",
            link: "/catalog"
          },
          {
            id: 3,
            image: "/uploads/images/banner/banner-3.png",
            alt: "Shop for $999",
            link: "/catalog"
          }]}
          autoPlayInterval={5000}
          showIndicators={true}
          showNavigation={true}
          height="h-48 md:h-64"
        />
      </div>

      {/* NFPA Books Section - Moving Carousel */}
      <div ref={nfpaRef} className="container-custom py-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-red-600" />
            <h3 className="text-3xl font-bookerly font-bold text-base-black">NFPA Books</h3>
          </div>
          <Link href="/catalog?search=NFPA">
            <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-xl">
              View All NFPA Books
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={nfpaBooks}
          currentSlide={nfpaSlide}
          onSlideChange={setNfpaSlide}
          bgGradient="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50"
          emptyMessage="No NFPA books available at the moment."
          showEmptyBrowseButton={false}
          isLoading={nfpaLoading || !isNfpaVisible}
        />
      </div>

      {/* DSM Books Section - Moving Carousel */}
      <div ref={dsmRef} className="container-custom py-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-purple-600" />
            <h3 className="text-3xl font-bookerly font-bold text-base-black">DSM Books</h3>
          </div>
          <Link href="/catalog?search=DSM">
            <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-xl">
              View All DSM Books
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={dsmBooks}
          currentSlide={dsmSlide}
          onSlideChange={setDsmSlide}
          bgGradient="bg-gradient-to-r from-purple-50 via-violet-50 to-fuchsia-50"
          emptyMessage="No DSM books available at the moment."
          showEmptyBrowseButton={false}
          isLoading={dsmLoading || !isDsmVisible}
        />
      </div>

      {/* Bestsellers Section - Moving Carousel */}
      <div ref={bestsellersRef} className="container-custom py-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className={`h-8 w-8 text-primary-aqua`} />
            <h3 className="text-3xl font-bookerly font-bold text-base-black">Bestsellers</h3>
          </div>
          <Link href="/catalog?bestseller=true">
            <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-xl">
              View All Bestsellers
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={bestsellerBooks}
          currentSlide={bestsellersSlide}
          onSlideChange={setBestsellersSlide}
          bgGradient="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50"
          emptyMessage="Loading bestsellers..."
          showEmptyBrowseButton={false}
          isLoading={bestsellerLoading || !isBestsellersVisible}
        />
      </div>

      {/* Featured Books Section - Moving Carousel */}
      <div ref={featuredRef} className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Star className={`h-8 w-8 text-yellow-500`} />
            <h3 className="text-3xl font-bookerly font-bold text-base-black">Featured Books</h3>
          </div>
          <Link href="/catalog?featured=true">
            <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-xl">
              View All Featured
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={featuredBooks}
          currentSlide={featuredSlide}
          onSlideChange={setFeaturedSlide}
          emptyMessage="No featured books available at the moment."
          isLoading={featuredLoading || !isFeaturedVisible}
        />
      </div>

      {/* Trending Items Section - Moving Carousel */}
      <div ref={trendingRef} className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Flame className={`h-8 w-8 text-red-500`} />
            <h3 className="text-3xl font-bookerly font-bold text-base-black">Trending Now</h3>
          </div>
          <Link href="/catalog?trending=true">
            <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-xl">
              View All Trending
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={trendingBooks}
          currentSlide={trendingSlide}
          onSlideChange={setTrendingSlide}
          bgGradient="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50"
          emptyMessage="No trending books available at the moment."
          isLoading={trendingLoading || !isTrendingVisible}
        />
      </div>

      {/* New Arrivals Section - Moving Carousel */}
      <div ref={newArrivalsRef} className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Package className={`h-8 w-8 text-green-600`} />
            <h3 className="text-3xl font-bookerly font-bold text-base-black">New Arrivals</h3>
          </div>
          <Link href="/catalog?newArrival=true">
            <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-xl">
              View All New Arrivals
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={newArrivals}
          currentSlide={newArrivalsSlide}
          onSlideChange={setNewArrivalsSlide}
          bgGradient="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50"
          emptyMessage="No new arrivals available at the moment."
          isLoading={newArrivalsLoading || !isNewArrivalsVisible}
        />
      </div>

      {/* Box Set Items Section - Moving Carousel */}
      <div ref={boxSetRef} className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className={`h-8 w-8 text-purple-600`} />
            <h3 className="text-3xl font-bookerly font-bold text-base-black">Box Set Collections</h3>
          </div>
          <Link href="/catalog?boxSet=true">
            <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-xl">
              View All Box Sets
            </Button>
          </Link>
        </div>
        <BookCarousel
          books={boxSetBooks}
          currentSlide={boxSetSlide}
          onSlideChange={setBoxSetSlide}
          bgGradient="bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50"
          emptyMessage="No box set collections available at the moment."
          isLoading={boxSetLoading || !isBoxSetVisible}
        />
      </div>

      {/* Category-Based Carousels */}
      {categories.length > 0 && categories.map((category) => (
        <CategoryCarousel 
          key={category.id} 
          category={category}
          currentSlide={categorySlides[category.id] || 0}
          onSlideChange={(slide) => setCategorySlides(prev => ({ ...prev, [category.id]: slide }))}
        />
      ))}
    </Layout>
  );
}
