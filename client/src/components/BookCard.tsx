import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Star, ShoppingCart, Truck, Clock, Book as BookIcon, RotateCcw } from "lucide-react";
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
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's already a correct path, return as-is
  if (imageUrl.startsWith('/uploads/images/')) {
    return imageUrl;
  }
  
  // If it's just a filename, prepend the uploads path
  const filename = imageUrl.split('/').pop() || imageUrl;
  return `/uploads/images/${filename}`;
};

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { userCurrency, convertPrice, formatAmount } = useCurrency();
  const { shippingRate, shippingCost: shipCost } = useShipping();
  const [, setLocation] = useLocation();
  const [displayPrice, setDisplayPrice] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [shippingCost, setShippingCost] = useState<string>('');

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
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      });
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
              {isConverting ? (
                <span className="text-sm">Converting...</span>
              ) : (
                displayPrice || formatAmount(parseFloat(book.price), 'USD')
              )}
            </div>
            {book.condition && (
              <Badge variant="outline" className="text-xs">
                {book.condition}
              </Badge>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center mb-2 h-5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(Math.random() * 5 + 3) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">(4.5)</span>
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
          className="w-full bg-primary-aqua hover:bg-primary-aqua/90 text-white text-sm py-2 rounded-full"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}