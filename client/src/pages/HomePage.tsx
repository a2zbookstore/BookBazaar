import React from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Book, Category } from "@/types";

export default function HomePage() {
  const { data: featuredBooks = [] } = useQuery<Book[]>({
    queryKey: ["/api/books?featured=true&limit=8"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

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
      {/* Hero Section */}
      <section className="bg-site-bg py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bookerly font-bold text-base-black mb-6">
                Welcome to A2Z BOOKSHOP
              </h2>
              <p className="text-lg text-secondary-black mb-8">
                Discover a curated collection of rare, collectible, and contemporary books. 
                From first editions to everyday reads, find your next literary treasure with us.
              </p>
              <Link href="/catalog">
                <Button className="bg-primary-aqua hover:bg-secondary-aqua text-white px-8 py-3">
                  Browse Our Collection
                </Button>
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Cozy bookshop interior"
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-16">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bookerly font-bold text-base-black">Featured Books</h3>
            <Link href="/catalog?featured=true">
              <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white">
                View All Featured
              </Button>
            </Link>
          </div>
          
          {featuredBooks.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
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
      <section className="bg-site-bg py-16">
        <div className="container-custom">
          <h3 className="text-3xl font-bookerly font-bold text-base-black text-center mb-8">
            Browse by Category
          </h3>
          
          {categories.length > 0 ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.slice(0, 6).map((category, index) => (
                <Link key={category.id} href={`/catalog?category=${category.slug}`}>
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-4 text-center">
                      <div className="aspect-square mb-4 overflow-hidden rounded-lg">
                        <img
                          src={categoryImages[index % categoryImages.length]}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
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
      <section className="py-16">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Reading corner"
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>
            <div>
              <h3 className="text-3xl font-bookerly font-bold text-base-black mb-6">
                About A2Z BOOKSHOP
              </h3>
              <p className="text-secondary-black mb-6">
                We're passionate about connecting readers with extraordinary books. Our carefully 
                curated collection spans from rare first editions to contemporary bestsellers, 
                ensuring every book lover finds their perfect literary companion.
              </p>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-aqua">1,200+</p>
                  <p className="text-secondary-black text-sm">Books Available</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-aqua">4.8/5</p>
                  <p className="text-secondary-black text-sm">Customer Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-aqua">50+</p>
                  <p className="text-secondary-black text-sm">Countries Served</p>
                </div>
              </div>
              <Link href="/about">
                <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white">
                  Learn More About Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
