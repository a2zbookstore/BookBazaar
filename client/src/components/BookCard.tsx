import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Star, StarHalf, ShoppingCart, Truck, Clock, Book as BookIcon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { useShipping } from "@/hooks/useShipping";
import WishlistHeart from "@/components/WishlistHeart";
import { Book } from "@/types";

// Image helper functions
const getImageSrc = (imageUrl: string | null | undefined): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
  }

  // If it's already a full external URL, return as-is
  // if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
  //   return imageUrl;
  // }

  // // If it's already a correct path, return as-is
  // if (imageUrl.startsWith('/uploads/images/')) {
  //   return imageUrl;
  // }

  // // If it's just a filename, prepend the uploads path
  // const filename = imageUrl.split('/').pop() || imageUrl;
  // return `/uploads/images/${filename}`;

  return imageUrl;
};

interface BookCardProps {
  book: Book;
  isGift?: boolean;
}

export default function BookCard({ book, isGift = false }: BookCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { userCurrency, convertPrice, formatAmount } = useCurrency();
  const { shippingRate, shippingCost: shipCost } = useShipping();
  const [, setLocation] = useLocation();
  const [displayPrice, setDisplayPrice] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [shippingCost, setShippingCost] = useState<string>('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Generate consistent rating based on book ID (3.5 to 5 stars)
  const bookRating = useMemo(() => {
    const hash = book.id * 2654435761;
    const normalized = (hash % 100) / 100;
    return 3.5 + (normalized * 1.5); // Range: 3.5 to 5.0
  }, [book.id]);

  // Calculate star display accurately
  const { fullStars, hasHalfStar, emptyStars } = useMemo(() => {
    const full = Math.floor(bookRating);
    const decimal = bookRating - full;
    const half = decimal >= 0.25 && decimal < 0.75; // Show half star for .25 to .74
    const empty = 5 - full - (half ? 1 : 0);

    return {
      fullStars: full,
      hasHalfStar: half,
      emptyStars: empty
    };
  }, [bookRating]);

  const reviewCount = useMemo(() => Math.floor(50 + (book.id * 7) % 450), [book.id]); // 50-500 reviews

  // Convert price and shipping cost to user's currency
  const convertPrices = React.useCallback(async () => {
    if (userCurrency !== 'USD') {
      setIsConverting(true);
      try {
        const converted = await convertPrice(parseFloat(book.price));
        if (converted) {
          setDisplayPrice(formatAmount(converted.convertedAmount, userCurrency));
        } else {
          setDisplayPrice(formatAmount(parseFloat(book.price), 'USD'));
        }

        // Convert shipping cost if available from location-based shipping
        if (shipCost !== undefined) {
          if (shipCost === 0) {
            setShippingCost('Free Delivery');
          } else {
            const convertedShipping = await convertPrice(shipCost);
            if (convertedShipping) {
              setShippingCost(formatAmount(convertedShipping.convertedAmount, userCurrency));
            } else {
              setShippingCost(formatAmount(shipCost, 'USD'));
            }
          }
        }
      } catch (error) {
        setDisplayPrice(formatAmount(parseFloat(book.price), 'USD'));
        if (shipCost !== undefined) {
          if (shipCost === 0) {
            setShippingCost('Free Delivery');
          } else {
            setShippingCost(formatAmount(shipCost, 'USD'));
          }
        }
      } finally {
        setIsConverting(false);
      }
    } else {
      setDisplayPrice(formatAmount(parseFloat(book.price), 'USD'));
      if (shipCost !== undefined) {
        if (shipCost === 0) {
          setShippingCost('Free Delivery');
        } else {
          setShippingCost(formatAmount(shipCost, 'USD'));
        }
      }
    }
  }, [book.price, userCurrency, convertPrice, formatAmount, shipCost]);

  // Listen for currency changes to force re-conversion
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      // Force re-conversion when currency changes
      setIsConverting(true);
      convertPrices();
    };

    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
  }, [convertPrices]);

  // Convert prices when dependencies change
  useEffect(() => {
    convertPrices();
  }, [convertPrices]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAddingToCart(true);
    try {
      await addToCart(book.id);
      toast({
        title: "Added to cart",
        description: `${book.title} has been added to your cart!`,
      });

      // Show gift suggestion toast with action
      toast({
        title: "Don't forget your gift!",
        description: "Please select a gift with your purchase.",
        action: (
          <button
            onClick={() => setLocation("/gift-items")}
            className="ml-auto inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium hover:bg-green-100 focus:outline-none"
          >
            Select Gift
          </button>
        ),
      });

      // Redirect to checkout page after successful add to cart
      // setTimeout(() => {
      //   setLocation("/checkout");
      // }, 500);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="group relative bg-white shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border rounded-[5px]">
      {/* Wishlist Heart */}
      <div className="absolute top-2 right-2 z-10">
        <WishlistHeart bookId={book.id} />
      </div>

      <Link to={`/books/${book.id}`} className="block">
        <div className="aspect-[3/4] overflow-hidden bg-white relative p-4">
          <img
            src={getImageSrc(book.imageUrl)}
            alt={book.title}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
            }}
          />
          {book.featured && (
            <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
              Featured
            </Badge>
          )}
          {book.bestseller && (
            <Badge className="absolute top-8 left-2 bg-purple-500 text-white">
              Bestseller
            </Badge>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm h-10">
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2 truncate">{book.author}</p>

          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold text-secondary-aqua">
              {isGift ? (
                <span>
                  <span className="text-xs text-gray-400 line-through mr-2">
                    {displayPrice || formatAmount(parseFloat(book.price), 'USD')}
                  </span>
                  <Badge className="bg-green-500 text-white font-bold">FREE</Badge>
                </span>
              ) : (
                isConverting ? (
                  <span className="text-sm">Converting...</span>
                ) : (
                  displayPrice || formatAmount(parseFloat(book.price), 'USD')
                )
              )}
            </div>
            {book.condition && (
              <Badge variant="outline" className="text-xs">
                {book.condition}
              </Badge>
            )}
          </div>

          {/* Rating - Enhanced with Half Stars */}
          <div className="flex items-center mb-2 bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-1.5 rounded-lg border border-amber-100">
            <div className="flex gap-0.5">
              {/* Full Stars */}
              {[...Array(fullStars)].map((_, i) => (
                <Star
                  key={`full-${i}`}
                  className="h-4 w-4 text-amber-400 fill-amber-400 drop-shadow-sm transition-transform hover:scale-110"
                />
              ))}
              {/* Half Star */}
              {hasHalfStar && (
                <div className="relative">
                  <Star className="h-4 w-4 text-gray-300 fill-gray-300" />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400 drop-shadow-sm" />
                  </div>
                </div>
              )}
              {/* Empty Stars */}
              {[...Array(emptyStars)].map((_, i) => (
                <Star
                  key={`empty-${i}`}
                  className="h-4 w-4 text-gray-300 fill-gray-200"
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-700 ml-2">
              {bookRating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500 ml-1">
              ({reviewCount})
            </span>
          </div>

          {/* Shipping and Return Info */}
          <div className="space-y-1 text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3 text-green-600" />
              <span className="text-secondary-black font-medium">
                {shippingCost || 'Calculating shipping...'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <span className="text-secondary-black">
                {shippingRate?.minDeliveryDays && shippingRate?.maxDeliveryDays ?
                  `${shippingRate.minDeliveryDays}-${shippingRate.maxDeliveryDays} days delivery` :
                  '5-7 days delivery'
                }
              </span>
            </div>
            <div className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3 text-green-600" />
              <span className="text-secondary-black">30-day returns</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <div className="px-4 pb-4">
        <Button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="py-2 bg-primary-aqua hover:bg-secondary-aqua text-white px-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed w-full shadow-md hover:shadow-lg transition-shadow"
          // className="w-full bg-primary-aqua hover:bg-primary-aqua/90 text-white text-sm py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          size="sm"
        >
          <ShoppingCart
            className={`h-4 w-4 mr-2 ${isAddingToCart ? 'animate-cart-slide' : ''}`}
          />
          {isAddingToCart ? 'Adding...' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}