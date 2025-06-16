import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SearchInput from "@/components/SearchInput";
import Logo from "@/components/Logo";
import { Book, Category } from "@/types";
import { Search, Star, TrendingUp, Award } from "lucide-react";

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const { data: featuredBooksResponse } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?featured=true&limit=12"],
  });
  const featuredBooks = featuredBooksResponse?.books || [];

  const { data: bestsellerBooksResponse } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books?sortBy=createdAt&sortOrder=desc&limit=10"],
  });
  const bestsellerBooks = bestsellerBooksResponse?.books || [];

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Auto-scroll for moving sections - pauses when hovering
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(1, Math.ceil(featuredBooks.length / 4)));
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredBooks.length, isPaused]);



  const bookImages = [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
  ];

  const categoryImages = [
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
  ];

  return (
    <Layout>
      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-6 gap-4 h-full">
            {bookImages.map((img, i) => (
              <div key={i} className="animate-pulse">
                <img src={img} alt="books" className="w-full h-full object-cover opacity-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="container-custom relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Featured Logo */}
            <div className="flex justify-center mb-8">
              <Logo size="xl" variant="default" showText={true} />
            </div>
            <p className="text-xl text-secondary-black mb-8 leading-relaxed">
              Your ultimate destination for rare books, bestsellers, and literary treasures from around the world
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <SearchInput 
                placeholder="Search by title, author, ISBN, or description..."
                className="w-full"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/catalog">
                <Button className="bg-primary-aqua hover:bg-secondary-aqua text-white px-8 py-3 rounded-full">
                  Browse All Books
                </Button>
              </Link>
              <Link href="/catalog?featured=true">
                <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white px-8 py-3 rounded-full">
                  Featured Collection
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bestsellers Section - Moving Carousel */}
      <section className="py-16 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary-aqua" />
              <h3 className="text-3xl font-bookerly font-bold text-base-black">Bestsellers</h3>
            </div>
            <Link href="/catalog?sortBy=createdAt&sortOrder=desc">
              <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white">
                View All Bestsellers
              </Button>
            </Link>
          </div>
          
          {bestsellerBooks.length > 0 ? (
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-1000 ease-in-out gap-4 sm:gap-6"
                style={{ transform: `translateX(-${currentSlide * (window.innerWidth < 640 ? 100 : 25)}%)` }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {bestsellerBooks.map((book) => (
                  <div key={book.id} className="flex-none w-full sm:w-72">
                    <BookCard book={book} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary-black text-lg">Loading bestsellers...</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Books Section - Moving Carousel */}
      <section className="py-16">
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
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-1000 ease-in-out gap-4 sm:gap-6"
                style={{ transform: `translateX(-${(currentSlide * (window.innerWidth < 640 ? 100 : 25)) % 100}%)` }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {featuredBooks.map((book) => (
                  <div key={book.id} className="flex-none w-full sm:w-72">
                    <BookCard book={book} />
                  </div>
                ))}
              </div>
            </div>
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
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500"
                  alt="Stack of vintage books"
                  className="rounded-2xl shadow-lg w-full h-80 object-cover"
                />
                <div className="flex flex-col gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"
                    alt="Open book with reading glasses"
                    className="rounded-2xl shadow-lg w-full h-36 object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"
                    alt="Bookstore shelves with colorful books"
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
