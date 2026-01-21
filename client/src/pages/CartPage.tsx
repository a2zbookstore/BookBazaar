import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, Gift, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { useShipping } from "@/hooks/useShipping";
import { calculateDeliveryDate } from "@/lib/deliveryUtils";
// import {  } from "lucide-react";


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

// Component to handle individual item price conversion
function ItemPrice({ bookPrice, quantity }: { bookPrice: number; quantity: number }) {
  const { formatAmount, convertPrice } = useCurrency();
  const [convertedPrice, setConvertedPrice] = useState<number>(bookPrice * quantity);

  const convertItemPrice = React.useCallback(async () => {
    try {
      const converted = await convertPrice(bookPrice * quantity);
      setConvertedPrice(converted?.convertedAmount || (bookPrice * quantity));
    } catch (error) {
      console.error('Error converting item price:', error);
      setConvertedPrice(bookPrice * quantity);
    }
  }, [bookPrice, quantity, convertPrice]);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      convertItemPrice();
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, [convertItemPrice]);

  useEffect(() => {
    convertItemPrice();
  }, [convertItemPrice]);

  return (
    <p className="text-xl font-bold text-primary-aqua">
      {formatAmount(convertedPrice)}
    </p>
  );
}

export default function CartPage() {
  const { cartItems, updateCartItem, removeFromCart, isLoading,cartCount } = useGlobalContext();
  const [optimisticCartItems, setOptimisticCartItems] = useState<CartItem[] | null>(null);
  const [optimisticallyRemovedId, setOptimisticallyRemovedId] = useState<number | null>(null);
  const { toast } = useToast();
  const { userCurrency, convertPrice, formatAmount, exchangeRates } = useCurrency();
  const { shippingCost, shippingRate, isLoading: isShippingLoading } = useShipping();
  const [giftItem, setGiftItem] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [localQuantities, setLocalQuantities] = useState<Record<number, number>>({});
  const updateTimeouts = React.useRef<Record<number, NodeJS.Timeout>>({});
  const hasNonGiftBooks = cartItems.some(item => !(item as any).isGift);

  useEffect(() => {
    const currentItems = optimisticCartItems !== null ? optimisticCartItems : cartItems;
    const quantities: Record<number, number> = {};
    currentItems.forEach(item => {
      quantities[item.id] = item.quantity;
    });
    setLocalQuantities(quantities);
  }, [cartItems.length, optimisticCartItems]);

  // Load gift item from localStorage and auto-remove if no books
  useEffect(() => {
    const savedGift = localStorage.getItem('giftDetails');
    if (savedGift && cartItems.length > 0 && hasNonGiftBooks) {
      try {
        setGiftItem(JSON.parse(savedGift));
      } catch (error) {
        console.error('Error parsing gift details:', error);
      }
    } else {
      setGiftItem(null);
      // Clear localStorage if no books remain and show notification
      if (!hasNonGiftBooks && localStorage.getItem('selectedGift')) {
        localStorage.removeItem('giftDetails');
        localStorage.removeItem('selectedGift');
        if (cartItems.length > 0) {
          toast({
            title: "Gift Removed",
            description: "Your free gift has been removed because no books remain in your cart. Add a book to select a gift again.",
            variant: "default",
          });
        }
      }
    }
  }, [cartItems, hasNonGiftBooks, toast]);

  // Calculate cart totals using dynamic shipping rates
  const cartSubtotal = cartItems.reduce((total, item) => {
    if ((item as any).isGift) return total;
    return total + (parseFloat(item.book.price) * item.quantity);
  }, 0);

  // Use dynamic shipping rates based on user location
  const cartShipping = shippingCost || 0;
  const cartTax = cartSubtotal * 0.01;
  const cartTotal = cartSubtotal + cartShipping + cartTax;

  // Convert all amounts to user's currency for display
  const [convertedAmounts, setConvertedAmounts] = useState({
    subtotal: cartSubtotal,
    shipping: cartShipping,
    tax: cartTax,
    total: cartTotal
  });

  // Convert amounts function
  const convertAmounts = React.useCallback(async () => {
    try {
      const convertedSubtotal = await convertPrice(cartSubtotal);
      const convertedShipping = await convertPrice(cartShipping);
      const convertedTax = await convertPrice(cartTax);
      const convertedTotal = await convertPrice(cartTotal);

      setConvertedAmounts({
        subtotal: convertedSubtotal?.convertedAmount || cartSubtotal,
        shipping: convertedShipping?.convertedAmount || cartShipping,
        tax: convertedTax?.convertedAmount || cartTax,
        total: convertedTotal?.convertedAmount || cartTotal
      });
    } catch (error) {
      setConvertedAmounts({
        subtotal: cartSubtotal,
        shipping: cartShipping,
        tax: cartTax,
        total: cartTotal
      });
    }
  }, [cartSubtotal, cartShipping, cartTax, cartTotal, userCurrency, convertPrice, exchangeRates]);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      convertAmounts();
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, [convertAmounts]);

  // Convert prices when currency or amounts change
  useEffect(() => {
    // Only convert if we have exchange rates and the currency is not USD
    if (exchangeRates && userCurrency !== 'USD') {
      convertAmounts();
    } else {
      // For USD or when no exchange rates, use original amounts
      setConvertedAmounts({
        subtotal: cartSubtotal,
        shipping: cartShipping,
        tax: cartTax,
        total: cartTotal
      });
    }
  }, [convertAmounts, exchangeRates, userCurrency]);

  // Debounced update function - waits 800ms after user stops changing quantity
  const debouncedUpdateQuantity = React.useCallback((itemId: number, newQuantity: number) => {
    if (updateTimeouts.current[itemId]) {
      clearTimeout(updateTimeouts.current[itemId]);
    }

    // Set new timeout
    updateTimeouts.current[itemId] = setTimeout(async () => {
      // Check if quantity actually changed from server state
      const currentItem = cartItems.find(item => item.id === itemId);
      if (currentItem && currentItem.quantity === newQuantity) {
        // No change, skip API call
        return;
      }

      setIsUpdating(itemId);
      try {
        await updateCartItem(itemId, newQuantity);
      } catch (error) {
        console.error('Error updating cart item:', error);
        // Revert to original quantity on error
        if (currentItem) {
          setLocalQuantities(prev => ({
            ...prev,
            [itemId]: currentItem.quantity
          }));
        }
        toast({
          title: "Failed to update",
          description: `${error ? error : 'Failed to update quantity. Please try again.'} `,
          variant: "destructive",
        });
      } finally {
        setIsUpdating(null);
      }
    }, 800); // 800ms debounce delay
  }, [cartItems, updateCartItem, toast]);

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setLocalQuantities(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));
    debouncedUpdateQuantity(itemId, newQuantity);
  };

  const handleBlurUpdate = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const currentItem = cartItems.find(item => item.id === itemId);
    if (currentItem && currentItem.quantity === newQuantity) {
      return;
    }

    if (updateTimeouts.current[itemId]) {
      clearTimeout(updateTimeouts.current[itemId]);
    }

    // Call API immediately on blur
    setIsUpdating(itemId);
    updateCartItem(itemId, newQuantity)
      .catch((error) => {
        console.error('Error updating cart item:', error);
        // Revert to original quantity on error
        if (currentItem) {
          setLocalQuantities(prev => ({
            ...prev,
            [itemId]: currentItem.quantity
          }));
        }
        toast({
          title: "Failed to update",
          description: `${error ? error : 'Failed to update quantity. Please try again.'} `,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsUpdating(null);
      });
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(updateTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const handleRemoveItem = async (itemId: number) => {
    if (removingItemId !== null) return; // Prevent double click
    setRemovingItemId(itemId);
    const currentItems = optimisticCartItems !== null ? optimisticCartItems : cartItems;
    const itemToRemove = currentItems.find(item => item.id === itemId);
    // Optimistically remove from UI
    setOptimisticCartItems(currentItems.filter(item => item.id !== itemId));
    setOptimisticallyRemovedId(itemId);
    toast({
      title: "Removed from cart",
      description: itemToRemove?.book?.title ? `${itemToRemove.book.title} removed` : "Item removed from cart",
    });
    try {
      await removeFromCart(itemId);
    } finally {
      setRemovingItemId(null);
    }
  };

  useEffect(() => {
    if (
      optimisticCartItems !== null &&
      optimisticallyRemovedId !== null &&
      !cartItems.some(item => item.id === optimisticallyRemovedId)
    ) {
      setOptimisticCartItems(null);
      setOptimisticallyRemovedId(null);
    }
  }, [cartItems, optimisticCartItems, optimisticallyRemovedId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading cart...</div>
        </div>
      </Layout>
    );
  }

  const isCartEmpty = (optimisticCartItems !== null ? optimisticCartItems.length === 0 : cartItems.length === 0);
  if (isCartEmpty) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 mt-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add some books to get started!</p>
            <div className="flex flex-row gap-4 items-center justify-center">
              <Link to="/">
                <Button variant="outline" className="rounded-full ">
                  ← Back to Home
                </Button>
              </Link>
              <Link to="/catalog">
                <Button className="rounded-full">Browse Books</Button>
              </Link>

            </div>

          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Shopping Cart"
        description="Review your cart and proceed to checkout. Buy books online at A2Z BOOKSHOP with secure payment and fast shipping."
        keywords="shopping cart, book checkout, buy books, online bookstore"
        url="https://a2zbookshop.com/cart"
        type="website"
      />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: "Cart" }]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>

            {(optimisticCartItems !== null ? optimisticCartItems : cartItems).map((item) => {
              const isGift = (item as any).isGift;
              const imageUrl = item.book?.imageUrl;
              const title = item.book?.title;
              const author = isGift ? null : item.book?.author;
              const displayQuantity = localQuantities[item.id] ?? item.quantity;

              return (
                <Card key={item.id} className="p-4 rounded-xl">
                  <div className="flex items-center gap-4">
                    {!isGift && item.book?.id ? (
                      <Link href={`/book/${item.book.id}`} className="w-20 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                        <img
                          src={imageUrl?.startsWith('data:') ? imageUrl : getImageSrc(imageUrl)}
                          alt={title || 'Item'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
                          }}
                        />
                      </Link>
                    ) : (
                      <div className="w-20 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={imageUrl?.startsWith('data:') ? imageUrl : getImageSrc(imageUrl)}
                          alt={title || 'Item'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = isGift
                              ? 'https://via.placeholder.com/300x400/f0f0f0/666?text=Gift'
                              : 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          {!isGift && item.book?.id ? (
                            <Link href={`/books/${item.book.id}`}>
                              <h3 className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-primary-aqua transition-colors">
                                {title}
                              </h3>
                            </Link>
                          ) : (
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {title}
                            </h3>
                          )}
                          {author && (
                            <p className="text-sm text-gray-600 mb-2">
                              by {author}
                            </p>
                          )}
                          {isGift && (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              FREE Gift
                            </span>
                          )}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-500 hover:bg-red-700 hover:text-white hover:rounded-full"
                                disabled={removingItemId === item.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove from cart</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, displayQuantity - 1)}
                            disabled={displayQuantity <= 1 || isUpdating === item.id}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <input
                            type="number"
                            min="1"
                            value={displayQuantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value >= 1) {
                                handleUpdateQuantity(item.id, value);
                              }
                            }}
                            onBlur={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value >= 1) {
                                handleBlurUpdate(item.id, value);
                              }
                            }}
                            className="w-12 text-center border rounded px-1 py-1"
                            disabled={isUpdating === item.id}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, displayQuantity + 1)}
                            disabled={isUpdating === item.id}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          {isGift ? (
                            <p className="text-xl font-bold text-green-600">FREE</p>
                          ) : (
                            <ItemPrice bookPrice={parseFloat(item.book.price)} quantity={displayQuantity} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Gift Item Display */}
            {giftItem && (
              <Card className="p-4 border-green-200 bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600 font-semibold">🎁 Selected Gift:</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={giftItem.imageUrl?.startsWith('data:') ? giftItem.imageUrl : getImageSrc(giftItem.imageUrl)}
                      alt={giftItem.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x400/f0f0f0/666?text=Gift';
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{giftItem.name}</h4>
                    <p className="text-sm text-gray-600 mb-1">{giftItem.description}</p>
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      FREE with your order
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Gift Reminder Banner - Show only if user has books but no gift selected */}
            {hasNonGiftBooks && !giftItem && (
              <Card className="rounded-xl bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 border-2 border-purple-300 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full p-3 shadow-lg animate-bounce">
                        <Gift className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Don't forget your FREE gift! 🎁
                          </h3>
                          <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
                        </div>
                        <p className="text-gray-700 text-sm">
                          You qualify for a complimentary gift with your purchase. Pick your favorite now!
                        </p>
                      </div>
                    </div>
                    <Link href="/gift-items">
                      <Button className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                        <Gift className="h-4 w-4 mr-2" />
                        Choose Gift
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 rounded-xl shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-primary-aqua to-secondary-aqua text-white rounded-t-xl">
                <CardTitle className="text-2xl font-bold text-primary-aqua">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <div className="flex justify-between text-base text-secondary-black">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-semibold">{formatAmount(convertedAmounts.subtotal, userCurrency)}</span>
                </div>
                <div className="flex justify-between text-base text-secondary-black">
                  <span className="font-medium">Shipping</span>
                  {!isShippingLoading ? (
                    <span className="font-semibold">
                      {convertedAmounts.shipping === 0 ? (
                        <span className="text-green-600 font-bold flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          FREE
                        </span>
                      ) : formatAmount(convertedAmounts.shipping)}
                    </span>
                  ) : (
                    <span className="inline-block h-[1em] w-24 align-middle rounded bg-gray-300 animate-pulse" />
                  )}
                </div>
                <div className="flex justify-between text-base text-secondary-black">
                  <span className="font-medium">Tax (1%)</span>
                  <span className="font-semibold">{formatAmount(convertedAmounts.tax, userCurrency)}</span>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <span className="text-lg font-bold text-base-black">Total</span>
                  <span className="text-2xl font-bold text-primary-aqua">{formatAmount(convertedAmounts.total, userCurrency)}</span>
                </div>

                {/* Delivery Date */}
                {shippingRate ? (
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg mt-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-blue-900 mb-1">
                          📦 Expected Delivery
                        </p>
                        <p className="text-sm text-blue-700 font-semibold">
                          {(() => {
                            const deliveryEstimate = calculateDeliveryDate(
                              shippingRate.minDeliveryDays,
                              shippingRate.maxDeliveryDays
                            );
                            return deliveryEstimate.deliveryText;
                          })()}
                        </p>
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          To {shippingRate.countryName}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg mt-4 shadow-sm animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-3 bg-gray-300 rounded w-48"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 flex-col">

                  <Button
                    disabled={isShippingLoading}
                    className="w-full bg-gradient-to-r from-primary-aqua to-secondary-aqua 
                    hover:from-secondary-aqua hover:to-primary-aqua text-white font-semibold 
                    py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 
                    transform hover:scale-[1.02]">
                    <Link to={`/checkout/cart/${cartCount}`} className="flex items-center gap-2 justify-center w-full">
                      <ShoppingBag className="h-6 w-6" />
                      Proceed to Checkout
                    </Link>

                  </Button>

                  {/* <Link to="/catalog">
                    <Button variant="outline" className="w-full border-2 border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white font-medium py-4 rounded-full transition-all duration-200">
                      ← Continue Shopping
                    </Button>
                  </Link> */}
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Multiple payment options</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>30-day return policy</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout >
  );
}