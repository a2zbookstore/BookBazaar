import React from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star, ShoppingCart, Truck, Shield, ChevronRight, RotateCcw } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useShipping } from "@/hooks/useShipping";
import { calculateDeliveryDate } from "@/lib/deliveryUtils";
import { Book } from "@/types";

// Image helper function
const getImageSrc = (imageUrl: string | null | undefined): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/uploads/images/')) {
    return imageUrl;
  }
  const filename = imageUrl.split('/').pop() || imageUrl;
  return `/uploads/images/${filename}`;
};

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { shippingRate } = useShipping();
  const [, setLocation] = useLocation();

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
        description: `${book.title} has been added to your cart. Redirecting to checkout...`,
      });
      
      // Redirect to checkout page after successful add to cart
      setTimeout(() => {
        setLocation("/checkout");
      }, 500);
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
              <img
                src={getImageSrc(book.imageUrl)}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image') {
                    target.src = 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
                  }
                }}
              />
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
                {book.binding && (
                  <Badge className="bg-purple-100 text-purple-800">
                    {book.binding}
                  </Badge>
                )}
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
              <div>
                <span className="font-semibold text-base-black">Condition:</span>
                <p className="text-secondary-black">{book.condition}</p>
              </div>
              {book.binding && (
                <div>
                  <span className="font-semibold text-base-black">Binding:</span>
                  <p className="text-secondary-black">{book.binding}</p>
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

            {/* 30-Day Return Policy */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">30-Day Return Policy</h3>
                  <p className="text-sm text-green-700 leading-relaxed">
                    Not satisfied with your purchase? Return this book within <strong>30 days</strong> of delivery for a full refund. 
                    Books must be in the same condition as when received. Return shipping is free for damaged or incorrectly described items.
                  </p>
                  <Link href="/return-request" className="inline-flex items-center text-sm text-green-600 hover:text-green-800 font-medium mt-2">
                    Start a return request <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </div>
            </div>

            <Separator />

            {/* Delivery Information */}
            {shippingRate && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">Expected Delivery</h3>
                    <p className="text-blue-800 text-sm">
                      {(() => {
                        const deliveryEstimate = calculateDeliveryDate(
                          shippingRate.minDeliveryDays,
                          shippingRate.maxDeliveryDays
                        );
                        return deliveryEstimate.deliveryText;
                      })()}
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
                      To {shippingRate.countryName} • Order today for fastest delivery
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                  {shippingRate ? (
                    <p className="text-xs text-secondary-black">
                      {(() => {
                        const deliveryEstimate = calculateDeliveryDate(
                          shippingRate.minDeliveryDays,
                          shippingRate.maxDeliveryDays
                        );
                        return `Arrives ${deliveryEstimate.deliveryRange}`;
                      })()}
                    </p>
                  ) : (
                    <p className="text-xs text-secondary-black">Secure packaging</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
