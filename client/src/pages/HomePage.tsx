import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Book, Category } from "@/types";
import { Star, TrendingUp, Award, Flame, Package, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

export default function HomePage() {
  const [bestsellersSlide, setBestsellersSlide] = useState(0);
  const [featuredSlide, setFeaturedSlide] = useState(0);
  const [trendingSlide, setTrendingSlide] = useState(0);
  const [newArrivalsSlide, setNewArrivalsSlide] = useState(0);
  const [boxSetSlide, setBoxSetSlide] = useState(0);
  const [hasItemsInCart, setHasItemsInCart] = useState(false);
  
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
  
  const { data: featuredBooksResponse } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?featured=true&limit=12"],
  });
  const featuredBooks = featuredBooksResponse?.books || [];

  const { data: bestsellerBooksResponse } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?bestseller=true&limit=12"],
  });
  const bestsellerBooks = bestsellerBooksResponse?.books || [];

  const { data: trendingBooksResponse } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?trending=true&limit=12"],
  });
  const trendingBooks = trendingBooksResponse?.books || [];

  const { data: newArrivalsResponse } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?newArrival=true&limit=12"],
  });
  const newArrivals = newArrivalsResponse?.books || [];

  const { data: boxSetBooksResponse } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?boxSet=true&limit=12"],
  });
  const boxSetBooks = boxSetBooksResponse?.books || [];

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: cartItems = [], refetch } = useQuery<any[]>({
    queryKey: ["/api/cart"],
  });

  // Check if cart has items for gift offer
  useEffect(() => {
    setHasItemsInCart(Array.isArray(cartItems) && cartItems.length > 0);
  }, [cartItems]);

  // Auto-scroll for featured books section
  useEffect(() => {
    if (featuredBooks.length === 0) return;
    
    const interval = setInterval(() => {
      setFeaturedSlide((prev) => (prev + 1) % Math.max(1, Math.ceil(featuredBooks.length / 4)));
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredBooks.length]);

  const categoryImages = [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1495640452828-3df6795cf69b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=300&fit=crop",
  ];

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
      
      {/* Database-driven Gift with Purchase Section */}
      {/* <GiftWithPurchase 
        hasItemsInCart={hasItemsInCart} 
        onGiftAdded={() => refetch()}
      /> */}

      {/* Bestsellers Section - Moving Carousel */}
      <section className="py-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary-aqua" />
              <h3 className="text-3xl font-bookerly font-bold text-base-black">Bestsellers</h3>
            </div>
            <Link href="/catalog?bestseller=true">
              <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white">
                View All Bestsellers
              </Button>
            </Link>
          </div>
          
          {bestsellerBooks.length > 0 ? (
            <>
              {/* Mobile horizontal scroll view */}
              <div className="md:hidden overflow-x-auto">
                <div className="flex gap-3 pb-4" style={{ width: 'max-content' }}>
                  {bestsellerBooks.map((book) => (
                    <div key={book.id} className="flex-none" style={{ width: '200px' }}>
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop carousel view */}
              <div className="hidden md:block relative overflow-hidden">
                <button
                  onClick={() => setBestsellersSlide((prev) => Math.max(0, prev - 1))}
                  disabled={bestsellersSlide === 0}
                  className="absolute left-0 top-0 h-full z-10 bg-gray-200/30 hover:bg-gray-400/60 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <div 
                  className="flex transition-transform duration-500 ease-in-out gap-3 sm:gap-4"
                  style={{ transform: `translateX(-${bestsellersSlide * 25}%)` }}
                >
                  {bestsellerBooks.map((book) => (
                    <div key={book.id} className="flex-none w-56">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setBestsellersSlide((prev) => Math.min(Math.ceil(bestsellerBooks.length / 4) - 1, prev + 1))}
                  disabled={bestsellersSlide >= Math.ceil(bestsellerBooks.length / 4) - 1}
                  className="absolute right-0 top-0 h-full z-10 bg-gray-200/30 hover:bg-gray-400/60 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary-black text-lg">Loading bestsellers...</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Books Section - Moving Carousel */}
      <section className="py-12">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <h3 className="text-3xl font-bookerly font-bold text-base-black">Featured Books</h3>
            </div>
            <Link href="/catalog?featured=true">
              <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white">
                View All Featured
              </Button>
            </Link>
          </div>
          
          {featuredBooks.length > 0 ? (
            <>
              {/* Mobile horizontal scroll view */}
              <div className="md:hidden overflow-x-auto">
                <div className="flex gap-3 pb-4" style={{ width: 'max-content' }}>
                  {featuredBooks.map((book) => (
                    <div key={book.id} className="flex-none" style={{ width: '200px' }}>
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop carousel view */}
              <div className="hidden md:block relative overflow-hidden">
                <button
                  onClick={() => setFeaturedSlide((prev) => Math.max(0, prev - 1))}
                  disabled={featuredSlide === 0}
                  className="absolute left-0 top-0 h-full z-10 bg-gray-200/30 hover:bg-gray-400/60 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <div 
                  className="flex transition-transform duration-500 ease-in-out gap-3 sm:gap-4"
                  // style={{ transform: `translateX(-${featuredSlide * 25}%)` }}
                >
                  {featuredBooks.map((book) => (
                    <div key={book.id} className="flex-none w-56">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setFeaturedSlide((prev) => Math.min(Math.ceil(featuredBooks.length / 4) - 1, prev + 1))}
                  disabled={featuredSlide >= Math.ceil(featuredBooks.length / 4) - 1}
                  className="absolute right-0 top-0 h-full z-10 bg-gray-200/30 hover:bg-gray-400/60 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary-black text-lg">No featured books available at the moment.</p>
              <Link href="/catalog">
                <Button className="mt-4 bg-primary-aqua hover:bg-secondary-aqua">
                  Browse All Books
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Trending Items Section - Moving Carousel */}
      <section className="py-12 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-red-500" />
              <h3 className="text-3xl font-bookerly font-bold text-base-black">Trending Now</h3>
            </div>
            <Link href="/catalog?trending=true">
              <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                View All Trending
              </Button>
            </Link>
          </div>
          
          {trendingBooks.length > 0 ? (
            <>
              {/* Mobile horizontal scroll view */}
              <div className="md:hidden overflow-x-auto">
                <div className="flex gap-3 pb-4" style={{ width: 'max-content' }}>
                  {trendingBooks.map((book) => (
                    <div key={book.id} className="flex-none" style={{ width: '200px' }}>
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop carousel view */}
              <div className="hidden md:block relative overflow-hidden">
                <button
                  onClick={() => setTrendingSlide((prev) => Math.max(0, prev - 1))}
                  disabled={trendingSlide === 0}
                  className="absolute left-0 top-0 h-full z-10 bg-gray-200/30 hover:bg-gray-400/60 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <div
                  className="flex transition-transform duration-500 ease-in-out gap-3 sm:gap-4"
                  style={{ transform: `translateX(-${trendingSlide * 25}%)` }}
                >
                  {trendingBooks.map((book) => (
                    <div key={book.id} className="flex-none w-56">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setTrendingSlide((prev) => Math.min(Math.ceil(trendingBooks.length / 4) - 1, prev + 1))}
                  disabled={trendingSlide >= Math.ceil(trendingBooks.length / 4) - 1}
                  className="absolute right-0 top-0 h-full z-10 bg-gray-200/30 hover:bg-gray-400/60 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary-black text-lg">No trending books available at the moment.</p>
              <Link href="/catalog">
                <Button className="mt-4 bg-red-500 hover:bg-red-600 text-white">
                  Browse All Books
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals Section - Moving Carousel */}
      <section className="py-12 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-green-600" />
              <h3 className="text-3xl font-bookerly font-bold text-base-black">New Arrivals</h3>
            </div>
            <Link href="/catalog?newArrival=true">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                View All New Arrivals
              </Button>
            </Link>
          </div>
          
          {newArrivals.length > 0 ? (
            <>
              {/* Mobile horizontal scroll view */}
              <div className="md:hidden overflow-x-auto">
                <div className="flex gap-3 pb-4" style={{ width: 'max-content' }}>
                  {newArrivals.map((book) => (
                    <div key={book.id} className="flex-none" style={{ width: '200px' }}>
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop carousel view */}
              <div className="hidden md:block relative overflow-hidden">
                <button
                  onClick={() => setNewArrivalsSlide((prev) => Math.max(0, prev - 1))}
                  disabled={newArrivalsSlide === 0}
                  className="absolute left-0 top-0 h-full z-10 bg-gray-200/30 hover:bg-gray-400/60 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <div
                  className="flex transition-transform duration-500 ease-in-out gap-3 sm:gap-4"
                  style={{ transform: `translateX(-${newArrivalsSlide * 25}%)` }}
                >
                  {newArrivals.map((book) => (
                    <div key={book.id} className="flex-none w-56">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setNewArrivalsSlide((prev) => Math.min(Math.ceil(newArrivals.length / 4) - 1, prev + 1))}
                  disabled={newArrivalsSlide >= Math.ceil(newArrivals.length / 4) - 1}
                  className="absolute right-0 top-0 h-full z-10 bg-gray-200/30 hover:bg-gray-400/60 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary-black text-lg">No new arrivals available at the moment.</p>
              <Link href="/catalog">
                <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white">
                  Browse All Books
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Box Set Items Section - Moving Carousel */}
      <section className="py-12 bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <h3 className="text-3xl font-bookerly font-bold text-base-black">Box Set Collections</h3>
            </div>
            <Link href="/catalog?boxSet=true">
              <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white">
                View All Box Sets
              </Button>
            </Link>
          </div>
          
          {boxSetBooks.length > 0 ? (
            <>
              {/* Mobile horizontal scroll view */}
              <div className="md:hidden overflow-x-auto">
                <div className="flex gap-3 pb-4" style={{ width: 'max-content' }}>
                  {boxSetBooks.map((book) => (
                    <div key={book.id} className="flex-none" style={{ width: '200px' }}>
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop carousel view */}
              <div className="hidden md:block relative overflow-hidden">
                <button
                  onClick={() => setBoxSetSlide((prev) => Math.max(0, prev - 1))}
                  disabled={boxSetSlide === 0}
                  className="absolute left-0 top-0 h-full z-10 bg-gray-200/30 hover:bg-gray-400/60 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-800" />
                </button>
                <div
                  className="flex transition-transform duration-500 ease-in-out gap-3 sm:gap-4"
                  style={{ transform: `translateX(-${boxSetSlide * 25}%)` }}
                >
                  {boxSetBooks.map((book) => (
                    <div key={book.id} className="flex-none w-56">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setBoxSetSlide((prev) => Math.min(Math.ceil(boxSetBooks.length / 4) - 1, prev + 1))}
                  disabled={boxSetSlide >= Math.ceil(boxSetBooks.length / 4) - 1}
                  className="absolute right-0 top-0 h-full z-10 bg-gray-200/30 hover:bg-gray-400/60 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-6 w-6 text-gray-800" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary-black text-lg">No box set collections available at the moment.</p>
              <Link href="/catalog">
                <Button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                  Browse All Books
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Award className="h-8 w-8 text-primary-aqua" />
              <h3 className="text-3xl font-bookerly font-bold text-base-black">
                Browse by Category
              </h3>
            </div>
            <p className="text-lg text-secondary-black max-w-2xl mx-auto">
              Discover your next favorite book from our carefully curated categories
            </p>
          </div>
          
          {categories.length > 0 ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.slice(0, 6).map((category, index) => (
                <Link key={category.id} href={`/catalog?category=${category.slug}`}>
                  <Card className="group cursor-pointer hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-primary-aqua">
                    <CardContent className="p-4 text-center">
                      <div className="aspect-square mb-4 overflow-hidden rounded-xl">
                        <img
                          src={categoryImages[index % categoryImages.length]}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h4 className="font-bookerly font-semibold text-base-black group-hover:text-primary-aqua transition-colors">
                        {category.name}
                      </h4>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary-black">Categories will be displayed here once they are added.</p>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=600&fit=crop"
                  alt="A2Z Bookshop collection"
                  className="rounded-2xl shadow-lg w-full h-80 object-cover"
                />
                <div className="flex flex-col gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&h=300&fit=crop"
                    alt="A2Z Bookshop books"
                    className="rounded-2xl shadow-lg w-full h-36 object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=500&h=320&fit=crop"
                    alt="A2Z Bookshop library"
                    className="rounded-2xl shadow-lg w-full h-40 object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-4xl font-bookerly font-bold text-base-black mb-6">
                Why Choose A<span className="text-red-500">2</span>Z BOOKSHOP?
              </h3>
              <p className="text-lg text-secondary-black mb-8 leading-relaxed">
                We're passionate about connecting readers with extraordinary books. Our carefully 
                curated collection spans from rare first editions to contemporary bestsellers, 
                ensuring every book lover finds their perfect literary companion.
              </p>
              <div className="grid grid-cols-1 gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-aqua rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">1K+</span>
                  </div>
                  <div>
                    <p className="font-semibold text-base-black">Books Available</p>
                    <p className="text-secondary-black text-sm">Curated collection of quality books</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">4.8</span>
                  </div>
                  <div>
                    <p className="font-semibold text-base-black">Customer Rating</p>
                    <p className="text-secondary-black text-sm">Trusted by thousands of readers</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">50+</span>
                  </div>
                  <div>
                    <p className="font-semibold text-base-black">Countries Served</p>
                    <p className="text-secondary-black text-sm">Worldwide shipping available</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <Link href="/about">
                  <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white px-8 py-3 rounded-full">
                    Learn More About Us
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button className="bg-primary-aqua hover:bg-secondary-aqua text-white px-8 py-3 rounded-full">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </Layout>
  );
}
