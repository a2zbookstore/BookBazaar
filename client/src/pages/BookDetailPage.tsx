import React from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star, ShoppingCart, Truck, Shield, ChevronRight } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/types";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const { data: book, isLoading } = useQuery<Book>({
    queryKey: [`/api/books/${id}`],
    enabled: !!id,
  });

  const handleAddToCart = async () => {
    if (!book) return;
    
    try {
      await addToCart(book.id);
      toast({
        title: "Added to cart",
        description: `${book.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to cart",
        variant: "destructive",
      });
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "new":
        return "bg-green-100 text-green-800";
      case "like new":
        return "bg-blue-100 text-blue-800";
      case "very good":
        return "bg-yellow-100 text-yellow-800";
      case "good":
        return "bg-orange-100 text-orange-800";
      case "fair":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="bg-gray-200 h-8 rounded"></div>
                <div className="bg-gray-200 h-6 rounded w-2/3"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                <div className="bg-gray-200 h-20 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bookerly font-bold text-base-black mb-4">Book Not Found</h2>
            <p className="text-secondary-black mb-6">The book you're looking for doesn't exist.</p>
            <Link href="/catalog">
              <Button className="bg-primary-aqua hover:bg-secondary-aqua">
                Browse Catalog
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-secondary-black">
            <Link href="/" className="hover:text-primary-aqua">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/catalog" className="hover:text-primary-aqua">Catalog</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="truncate max-w-48">{book.title}</span>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Book Image */}
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
              {book.imageUrl ? (
                <img
                  src={book.imageUrl}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-4 bg-primary-aqua/10 rounded-full flex items-center justify-center">
                      <span className="text-primary-aqua font-bookerly text-3xl">📚</span>
                    </div>
                    <p className="text-gray-500 font-medium">No Image Available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bookerly font-bold text-base-black mb-2">
                {book.title}
              </h1>
              <p className="text-xl text-secondary-black mb-4">by {book.author}</p>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-sm text-secondary-black">(4.8 out of 5)</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className={getConditionColor(book.condition)}>
                  {book.condition}
                </Badge>
                {book.category && (
                  <Badge variant="outline">{book.category.name}</Badge>
                )}
                {book.featured && (
                  <Badge className="bg-abe-red text-white">Featured</Badge>
                )}
              </div>
            </div>

            {/* Price and Stock */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary-aqua">
                  ${parseFloat(book.price).toFixed(2)}
                </span>
                {book.stock > 0 && book.stock <= 5 && (
                  <span className="text-sm text-abe-red font-medium">
                    Only {book.stock} left in stock!
                  </span>
                )}
              </div>

              {book.stock === 0 ? (
                <div className="text-abe-red font-medium">Out of Stock</div>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  className="bg-primary-aqua hover:bg-secondary-aqua text-white px-8 py-3"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              )}
            </div>

            <Separator />

            {/* Book Information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {book.isbn && (
                <div>
                  <span className="font-semibold text-base-black">ISBN:</span>
                  <p className="text-secondary-black">{book.isbn}</p>
                </div>
              )}
              {book.publisher && (
                <div>
                  <span className="font-semibold text-base-black">Publisher:</span>
                  <p className="text-secondary-black">{book.publisher}</p>
                </div>
              )}
              {book.publishedYear && (
                <div>
                  <span className="font-semibold text-base-black">Published:</span>
                  <p className="text-secondary-black">{book.publishedYear}</p>
                </div>
              )}
              {book.pages && (
                <div>
                  <span className="font-semibold text-base-black">Pages:</span>
                  <p className="text-secondary-black">{book.pages}</p>
                </div>
              )}
              {book.language && (
                <div>
                  <span className="font-semibold text-base-black">Language:</span>
                  <p className="text-secondary-black">{book.language}</p>
                </div>
              )}
              {book.dimensions && (
                <div>
                  <span className="font-semibold text-base-black">Dimensions:</span>
                  <p className="text-secondary-black">{book.dimensions}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {book.description && (
              <div>
                <h3 className="font-bookerly font-semibold text-base-black mb-3">Description</h3>
                <p className="text-secondary-black leading-relaxed whitespace-pre-wrap">
                  {book.description}
                </p>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-base-black text-sm">Quality Guaranteed</p>
                  <p className="text-xs text-secondary-black">Accurately described</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-base-black text-sm">Fast Shipping</p>
                  <p className="text-xs text-secondary-black">Secure packaging</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
