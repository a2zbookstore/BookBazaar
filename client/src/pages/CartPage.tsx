import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useShipping } from "@/hooks/useShipping";
import { useQuery } from "@tanstack/react-query";
import CurrencySelector from "@/components/CurrencySelector";
import ShippingCostDisplay from "@/components/ShippingCostDisplay";

// Component to handle individual item price conversion
function ItemPrice({ bookPrice, quantity }: { bookPrice: number; quantity: number }) {
  const { formatAmount, convertPrice } = useCurrency();
  const [convertedPrice, setConvertedPrice] = useState<number>(bookPrice * quantity);

  useEffect(() => {
    const convertItemPrice = async () => {
      try {
        const converted = await convertPrice(bookPrice * quantity);
        setConvertedPrice(converted?.convertedAmount || (bookPrice * quantity));
      } catch (error) {
        console.error('Error converting item price:', error);
        setConvertedPrice(bookPrice * quantity);
      }
    };

    convertItemPrice();
  }, [bookPrice, quantity, convertPrice]);

  return (
    <p className="text-xl font-bold text-primary-aqua">
      {formatAmount(convertedPrice)}
    </p>
  );
}

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { cartItems, updateCartItem, removeFromCart, clearCart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { userCurrency, convertPrice, formatCurrency, formatAmount, exchangeRates } = useCurrency();
  const { shipping } = useShipping();
  const [giftItem, setGiftItem] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  
  // Check if cart has any non-gift books
  const hasNonGiftBooks = cartItems.some(item => !item.isGift);

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


  // Get shipping rate from admin panel - default to India if no location detected
  const { data: adminShippingRate } = useQuery({
    queryKey: ["/api/shipping-rates/country/IN"],
  });

  // Calculate cart totals using admin panel shipping rates
  const cartSubtotal = cartItems.reduce((total, item) => {
    // Skip gift items in subtotal calculation
    if (item.isGift) return total;
    return total + (parseFloat(item.book.price) * item.quantity);
  }, 0);
  
  // Use admin panel shipping rates
  let cartShipping = 5.99; // Default fallback
  
  if ((adminShippingRate as any)?.shippingCost) {
    cartShipping = parseFloat((adminShippingRate as any).shippingCost.toString());
  } else if (shipping?.cost) {
    cartShipping = parseFloat(shipping.cost.toString());
  }

  const cartTax = cartSubtotal * 0.01; // 1% tax
  const cartTotal = cartSubtotal + cartShipping + cartTax;
  
  // Convert all amounts to user's currency for display
  const [convertedAmounts, setConvertedAmounts] = useState({
    subtotal: cartSubtotal,
    shipping: cartShipping,
    tax: cartTax,
    total: cartTotal
  });

  // Convert prices when currency or amounts change
  useEffect(() => {
    const convertAmounts = async () => {
      try {
        console.log('Cart conversion attempt:', { cartSubtotal, userCurrency, exchangeRates });
        
        const convertedSubtotal = await convertPrice(cartSubtotal);
        const convertedShipping = await convertPrice(cartShipping);
        const convertedTax = await convertPrice(cartTax);
        const convertedTotal = await convertPrice(cartTotal);

        console.log('Cart conversion results:', {
          original: { cartSubtotal, cartShipping, cartTax, cartTotal },
          converted: { convertedSubtotal, convertedShipping, convertedTax, convertedTotal }
        });

        setConvertedAmounts({
          subtotal: convertedSubtotal?.convertedAmount || cartSubtotal,
          shipping: convertedShipping?.convertedAmount || cartShipping,
          tax: convertedTax?.convertedAmount || cartTax,
          total: convertedTotal?.convertedAmount || cartTotal
        });
      } catch (error) {
        console.error('Error converting currencies:', error);
        // Fallback to original amounts
        setConvertedAmounts({
          subtotal: cartSubtotal,
          shipping: cartShipping,
          tax: cartTax,
          total: cartTotal
        });
      }
    };

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
  }, [cartSubtotal, cartShipping, cartTax, cartTotal, userCurrency, convertPrice, exchangeRates]);


  // Debug shipping cost
  console.log('Cart Page - Admin Shipping Debug:', {
    adminShippingRate: adminShippingRate,
    finalShippingCost: cartShipping,
    isUsingAdminRate: !!(adminShippingRate as any)?.shippingCost
  });



  // Note: Currency conversion is now handled directly in the display components



  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(itemId);
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number, title: string) => {
    try {
      await removeFromCart(itemId);
      toast({
        title: "Item removed",
        description: `${title} has been removed from your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 p-4 border rounded-lg">
                    <div className="w-16 h-20 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
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
            <span>Shopping Cart</span>
          </div>
        </nav>

        <h1 className="text-3xl font-bookerly font-bold text-base-black mb-8">
          Shopping Cart
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🛒</span>
            </div>
            <h3 className="text-xl font-bookerly font-semibold text-base-black mb-2">
              Your cart is empty
            </h3>
            <p className="text-secondary-black mb-6">
              Looks like you haven't added any books to your cart yet.
            </p>
            <Link href="/catalog">
              <Button className="bg-primary-aqua hover:bg-secondary-aqua">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Card>
                <CardHeader>
                  <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-4 border-b last:border-b-0">
                      {/* Book/Gift Image */}
                      <div className="w-16 h-20 flex-shrink-0">
                        {item.isGift ? (
                          <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 rounded flex items-center justify-center border-2 border-green-300">
                            <span className="text-2xl">🎁</span>
                          </div>
                        ) : item.book.imageUrl ? (
                          <img
                            src={item.book.imageUrl}
                            alt={item.book.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-xs">📚</span>
                          </div>
                        )}
                      </div>

                      {/* Book/Gift Info */}
                      <div className="flex-1 min-w-0">
                        {item.isGift ? (
                          <>
                            <h4 className="font-bookerly font-semibold text-green-700 line-clamp-2">
                              🎁 Free Gift
                            </h4>
                            <p className="text-green-600 text-sm">Selected gift item</p>
                            <p className="text-green-500 text-xs font-medium">Complimentary with your purchase</p>
                          </>
                        ) : (
                          <>
                            <Link href={`/books/${item.book.id}`}>
                              <h4 className="font-bookerly font-semibold text-base-black hover:text-primary-aqua transition-colors line-clamp-2">
                                {item.book.title}
                              </h4>
                            </Link>
                            <p className="text-secondary-black text-sm">{item.book.author}</p>
                            <p className="text-tertiary-black text-xs">Condition: {item.book.condition}</p>
                          </>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        {item.isGift ? (
                          <div className="bg-green-100 border border-green-300 rounded px-3 py-1">
                            <span className="text-sm font-medium text-green-700">FREE GIFT - Qty: 1</span>
                          </div>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || isUpdating === item.id}
                              className="w-8 h-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value);
                                if (newQuantity > 0) {
                                  handleUpdateQuantity(item.id, newQuantity);
                                }
                              }}
                              disabled={isUpdating === item.id}
                              className="w-16 text-center"
                              min="1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={isUpdating === item.id}
                              className="w-8 h-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Price and Remove */}
                      <div className="text-right">
                        {item.isGift ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-green-600">FREE</span>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Gift</span>
                          </div>
                        ) : (
                          <ItemPrice bookPrice={parseFloat(item.book.price)} quantity={item.quantity} />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id, item.isGift ? 'Free Gift' : item.book.title)}
                          className="text-abe-red hover:text-abe-red hover:bg-red-50 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Gift Item Display */}
                  {giftItem && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">🎁</span>
                        </div>
                        <h3 className="text-lg font-semibold text-green-700">Your Free Gift</h3>
                      </div>
                      <div className="flex items-center gap-4 py-3 bg-white rounded-lg p-3">
                        <div className="w-16 h-20 flex-shrink-0">
                          <img 
                            src={giftItem.image} 
                            alt={giftItem.name}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{giftItem.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">
                            {giftItem.type === 'novel' ? '📚 Novel' : '📓 Notebook'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Quantity: 1</p>
                          <div className="text-lg font-bold text-green-600">FREE</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-secondary-black">Subtotal:</span>
                      <span className="text-base-black">{formatAmount(convertedAmounts.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-black">Shipping:</span>
                      <span className="text-base-black">
                        {convertedAmounts.shipping === 0 ? 'Free Delivery' : formatAmount(convertedAmounts.shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-black">Tax (1%):</span>
                      <span className="text-base-black">{formatAmount(convertedAmounts.tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-base-black">Total:</span>
                      <span className="text-primary-aqua">{formatAmount(convertedAmounts.total)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-primary-aqua hover:bg-secondary-aqua py-3"
                      onClick={() => setLocation('/checkout')}
                    >
                      Proceed to Checkout
                    </Button>
                    <Link href="/catalog">
                      <Button variant="outline" className="w-full border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
