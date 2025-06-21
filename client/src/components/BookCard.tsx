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

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { userCurrency, convertPrice, formatAmount } = useCurrency();
  const { shipping } = useShipping();
  const [, setLocation] = useLocation();
  const [displayPrice, setDisplayPrice] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [shippingCost, setShippingCost] = useState<string>('');

  // Convert price and shipping cost to user's currency
  useEffect(() => {
    const convertPrices = async () => {
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
          if (shipping?.cost) {
            const shippingAmount = parseFloat(shipping.cost);
            if (shippingAmount === 0) {
              setShippingCost('Free Delivery');
            } else {
              const convertedShipping = await convertPrice(shippingAmount);
              if (convertedShipping) {
                setShippingCost(formatAmount(convertedShipping.convertedAmount, userCurrency));
              } else {
                setShippingCost(formatAmount(shippingAmount, 'USD'));
              }
            }
          }
        } catch (error) {
          setDisplayPrice(formatAmount(parseFloat(book.price), 'USD'));
          if (shipping?.cost) {
            const shippingAmount = parseFloat(shipping.cost);
            if (shippingAmount === 0) {
              setShippingCost('Free Delivery');
            } else {
              setShippingCost(formatAmount(shippingAmount, 'USD'));
            }
          }
        } finally {
          setIsConverting(false);
        }
      } else {
        setDisplayPrice(formatAmount(parseFloat(book.price), 'USD'));
        if (shipping?.cost) {
          const shippingAmount = parseFloat(shipping.cost);
          if (shippingAmount === 0) {
            setShippingCost('Free Delivery');
          } else {
            setShippingCost(formatAmount(shippingAmount, 'USD'));
          }
        }
      }
    };

    convertPrices();
  }, [book.price, userCurrency, convertPrice, formatAmount, shipping]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  return (
    <Link href={`/books/${book.id}`}>
      <div className="book-card group cursor-pointer">
        {/* Book Image */}
        <div className="aspect-[3/4] mb-4 overflow-hidden rounded-lg bg-gray-100 relative">
          {book.imageUrl ? (
            <img
              src={book.imageUrl.replace('https://www.a2zbookshop.com', window.location.origin)}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.querySelector('.fallback-icon')?.setAttribute('style', 'display: flex');
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 fallback-icon" style={{display: 'none'}}>
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-2 bg-primary-aqua/10 rounded-full flex items-center justify-center">
                  <span className="text-primary-aqua font-bookerly text-lg">📚</span>
                </div>
                <p className="text-xs text-gray-500 font-medium">No Image</p>
              </div>
            </div>
          )}
          
          {/* Wishlist Heart */}
          <div className="absolute top-2 right-2 z-10">
            <WishlistHeart bookId={book.id} size={24} className="bg-white/80 backdrop-blur-sm rounded-full p-1" />
          </div>
        </div>

        {/* Book Info */}
        <div className="space-y-3">
          <div>
            <h3 className="font-bookerly font-semibold text-base-black line-clamp-2 group-hover:text-primary-aqua transition-colors">
              {book.title}
            </h3>
            <p className="text-secondary-black text-sm">{book.author}</p>
          </div>
          
          {/* Book Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Condition */}
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className={`text-xs ${getConditionColor(book.condition)}`}>
                {book.condition}
              </Badge>
            </div>
            
            {/* Binding */}
            <div className="flex items-center gap-1">
              <BookIcon className="h-3 w-3 text-gray-500" />
              <span className="text-secondary-black">{book.binding || 'Paperback'}</span>
            </div>
          </div>

          {/* Shipping & Delivery Info */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3 text-green-600" />
              <span className="text-secondary-black">
                Shipping: {shippingCost || '$25.00'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <span className="text-secondary-black">
                {shipping?.minDeliveryDays && shipping?.maxDeliveryDays ? 
                  `${shipping.minDeliveryDays}-${shipping.maxDeliveryDays} days delivery` : 
                  '5-7 days delivery'
                }
              </span>
            </div>
            <div className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3 text-green-600" />
              <span className="text-secondary-black">15-day returns</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-3 w-3 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span className="text-xs text-secondary-black">(4.8)</span>
          </div>

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex flex-col">
              {isConverting ? (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <span className="text-xs text-secondary-black">Converting...</span>
                </div>
              ) : (
                <>
                  <span className="text-xl font-bold text-primary-aqua">
                    {displayPrice || `$${parseFloat(book.price).toFixed(2)}`}
                  </span>
                  {userCurrency !== 'USD' && displayPrice && (
                    <span className="text-xs text-secondary-black">
                      from ${parseFloat(book.price).toFixed(2)} USD
                    </span>
                  )}
                  {userCurrency !== 'USD' && (
                    <Badge variant="secondary" className="text-xs mt-1 bg-green-50 text-green-700 border-green-200">
                      Your Currency
                    </Badge>
                  )}
                </>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-primary-aqua hover:bg-secondary-aqua text-white px-4 py-3 text-sm flex items-center gap-2 touch-target min-h-[44px] w-full sm:w-auto"
              disabled={book.stock === 0}
            >
              {book.stock === 0 ? (
                "Out of Stock"
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>

          {book.stock > 0 && book.stock <= 5 && (
            <p className="text-xs text-abe-red font-medium">Only {book.stock} left in stock!</p>
          )}
        </div>
      </div>
    </Link>
  );
}
