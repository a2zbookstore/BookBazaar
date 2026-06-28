import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Star, Truck, Clock, ShoppingCart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { useShipping } from "@/hooks/useShipping";
import WishlistHeart from "@/components/WishlistHeart";
import { Book } from "@/types";
import { useUserLocation } from "@/contexts/userLocationContext";
import { generateBookSlug } from "@/lib/slugUtils";

// Image helper functions
const getImageSrc = (imageUrl: string | null | undefined): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
  }

  return imageUrl;
};

interface BookCardProps {
  book: Book;
  isGift?: boolean;
}

export default function BookCard({ book, isGift = false }: BookCardProps) {
  const { addToCart } = useGlobalContext();
  const { toast } = useToast();
  const { userCurrency, convertPrice, formatAmount } = useCurrency();
  const { shippingRate, shippingCost: shipCost, isLoading: isShippingLoading } = useShipping();
  const [, setLocation] = useLocation();
  const [displayPrice, setDisplayPrice] = useState<string>('');
  const [displayCostPrice, setDisplayCostPrice] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [shippingCost, setShippingCost] = useState<string>('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isCartWalking, setIsCartWalking] = useState(false);
  const {
    location,
  } = useUserLocation();

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
      } catch (error) {
        setDisplayPrice(formatAmount(parseFloat(book.price), 'USD'));
      }

      // Cost price conversion — isolated so it never affects the main price
      try {
        if (book.costPrice && parseFloat(book.costPrice) > parseFloat(book.price)) {
          const convertedCost = await convertPrice(parseFloat(book.costPrice));
          setDisplayCostPrice(convertedCost
            ? formatAmount(convertedCost.convertedAmount, userCurrency)
            : formatAmount(parseFloat(book.costPrice), 'USD'));
        } else {
          setDisplayCostPrice('');
        }
      } catch {
        setDisplayCostPrice('');
      }

      // Shipping conversion — isolated so it never affects the main price
      try {
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
      } catch {
        if (shipCost !== undefined) {
          setShippingCost(shipCost === 0 ? 'Free Delivery' : formatAmount(shipCost, 'USD'));
        }
      }

      setIsConverting(false);
    } else {
      setDisplayPrice(formatAmount(parseFloat(book.price), 'USD'));
      if (book.costPrice && parseFloat(book.costPrice) > parseFloat(book.price)) {
        setDisplayCostPrice(formatAmount(parseFloat(book.costPrice), 'USD'));
      } else {
        setDisplayCostPrice('');
      }
      if (shipCost !== undefined) {
        if (shipCost === 0) {
          setShippingCost('Free Delivery');
        } else {
          setShippingCost(formatAmount(shipCost, 'USD'));
        }
      }
      setIsConverting(false);

    }
  }, [book.price, userCurrency, convertPrice, formatAmount, shipCost, location]);

  useEffect(() => {
    setIsConverting(true);
    convertPrices();
  }, [convertPrices, location]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsCartWalking(true);
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

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`/checkout/buyNow/${book.id}/1`, '_blank', 'noopener,noreferrer');
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const slug = generateBookSlug(book.title, book.id);
    const url = `${window.location.origin}/books/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: book.title, url });
      } catch (_) {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Book link copied to clipboard." });
    }
  };

  return (
    <div className="group relative bg-white shadow-lg hover:shadow-lg transition-shadow duration-300 overflow-hidden border rounded-xl w-full">
      <div className="absolute top-2 right-2 z-20 flex flex-col justify-center items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleShare}
          className="p-1.5 rounded-full bg-white shadow-md text-gray-400 hover:text-primary-aqua transition-colors"
          aria-label="Share book"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
        <WishlistHeart bookId={book.id} />
      </div>
      <a href={`/books/${generateBookSlug(book.title, book.id)}`} target="_blank" rel="noopener noreferrer" className="block min-w-0">

        {/* image container */}
        <div className="relative bg-white p-2 sm:p-4 h-[180px] sm:h-[260px] flex items-center justify-center overflow-hidden">
          <img
            src={getImageSrc(book.imageUrl)}
            alt={book.title}
            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
            }}
          />
          {/* Stacked ribbon badges */}
          <div className="absolute top-2 left-0 flex flex-col gap-1.5 z-10">
            {book.newArrival && (
              <div className="badge-tag inline-flex items-center gap-1 bg-emerald-500 text-white font-bold text-[9px] sm:text-[11px] px-2 py-0.5 sm:px-3 sm:py-1 rounded-r-md shadow-md">
                <span className="text-[8px] sm:text-[10px]">🆕</span> New
              </div>
            )}
            {book.bestseller && (
              <div className="badge-tag badge-bestseller inline-flex items-center gap-1 bg-purple-600 text-white font-bold text-[9px] sm:text-[11px] px-2 py-0.5 sm:px-3 sm:py-1 rounded-r-md shadow-md">
                <span className="text-[8px] sm:text-[10px]">★</span> Bestseller
              </div>
            )}
          </div>
        </div>

        {/* book-details */}
        <div className="px-2 sm:px-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-[10px] sm:text-sm h-8 sm:h-10">
            {book.title}
          </h3>
          <p className="text-[9px] sm:text-sm text-gray-600 mb-1 sm:mb-2 truncate">{book.author}</p>

          {/* Swap zone: info slides out, buttons slide in on hover */}
          <div className="relative overflow-hidden">

            {/* INFO LAYER — price slides left, delivery slides right */}
            <div className="flex flex-col gap-1 pb-2 sm:pb-3">
              {/* Price row */}
              <div className="transition-transform duration-300 ease-in-out group-hover:-translate-x-full">
                <div className="min-w-0 truncate">
                  {isGift ? (
                    <span>
                      <span className="text-xs text-gray-400 line-through mr-2">
                        {displayPrice || formatAmount(parseFloat(book.price), 'USD')}
                      </span>
                      <Badge className="bg-green-500 text-white font-bold">FREE</Badge>
                    </span>
                  ) : (
                    isConverting ? (
                      <span className="text-sm">
                        <span className="inline-block h-[1em] w-20 align-middle rounded bg-gray-300 animate-pulse" />
                      </span>
                    ) : (
                      <span className="flex items-baseline gap-1.5 flex-nowrap overflow-hidden">
                        <span className="text-xs sm:text-lg font-bold text-secondary-aqua">
                          {displayPrice || formatAmount(parseFloat(book.price), 'USD')}
                        </span>
                        {displayCostPrice && (
                          <span className="text-[9px] sm:text-sm text-gray-400 line-through">
                            {displayCostPrice}
                          </span>
                        )}
                        {book.costPrice && parseFloat(book.costPrice) > parseFloat(book.price) && (
                          <span className="text-[9px] sm:text-xs font-bold text-white bg-green-500 px-1 py-0.5 rounded">
                            {Math.round(((parseFloat(book.costPrice) - parseFloat(book.price)) / parseFloat(book.costPrice)) * 100)}% off
                          </span>
                        )}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Shipping row */}
              <div className="flex justify-between text-[8px] sm:text-xs text-gray-500 transition-transform duration-300 ease-in-out group-hover:translate-x-full">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Truck className="h-2 w-2 sm:h-3 sm:w-3 text-green-600" />
                  <span className="text-secondary-black font-medium truncate">
                    {isShippingLoading ? (
                      <span className="inline-block h-[1em] w-16 align-middle rounded bg-gray-300 animate-pulse" />
                    ) : shippingCost}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Clock className="h-2 w-2 sm:h-3 sm:w-3 text-blue-600" />
                  <span className="text-secondary-black">
                    {isShippingLoading ? (
                      <span className="inline-block h-[1em] w-16 align-middle rounded bg-gray-300 animate-pulse" />
                    ) : (
                      shippingRate?.minDeliveryDays && shippingRate?.maxDeliveryDays ?
                        `${shippingRate.minDeliveryDays}-${shippingRate.maxDeliveryDays} days` :
                        '5-7 days'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* BUTTONS LAYER — absolutely fills the same space, slides in on hover */}
            <div className="absolute inset-0 flex items-center gap-1 sm:gap-2 pointer-events-none group-hover:pointer-events-auto pb-2 sm:pb-3">
              <Button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="
                  w-[30%] aspect-square
                  bg-primary-aqua hover:bg-secondary-aqua
                  text-white
                  rounded-full
                  shadow-md
                  transition-all duration-300 ease-in-out
                  -translate-x-full group-hover:translate-x-0
                  flex items-center justify-center
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${isAddingToCart ? 'cart-walk-loop' : isCartWalking ? 'cart-walk' : ''}`}
                    onAnimationEnd={() => { if (!isAddingToCart) setIsCartWalking(false); }}
                  />
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={isAddingToCart}
                className="
                  flex-1 min-w-0
                  bg-red-500 hover:bg-red-600
                  text-white text-[9px] sm:text-xs font-semibold
                  rounded-full py-1.5 sm:py-2
                  shadow-md
                  transition-all duration-300 ease-in-out
                  translate-x-full group-hover:translate-x-0
                  flex items-center justify-center gap-1
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Buy Now</span>
              </Button>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}