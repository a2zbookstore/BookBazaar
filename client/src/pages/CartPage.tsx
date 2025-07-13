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
  const [, setLocation] = useLocation();
  const { cartItems, updateCartItem, removeFromCart, clearCart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { userCurrency, convertPrice, formatCurrency, formatAmount, exchangeRates } = useCurrency();
  const { shippingCost } = useShipping();
  const [giftItem, setGiftItem] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  
  // Check if cart has any non-gift books
  const hasNonGiftBooks = cartItems.some(item => !(item as any).isGift);

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
    // Skip gift items in subtotal calculation
    if ((item as any).isGift) return total;
    return total + (parseFloat(item.book.price) * item.quantity);
  }, 0);
  
  // Use dynamic shipping rates based on user location
  const cartShipping = shippingCost || 0;
  const cartTax = cartSubtotal * 0.01; // 1% tax
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

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(itemId);
    try {
      await updateCartItem(itemId, newQuantity);
      toast({
        title: "Cart updated",
        description: "Item quantity has been updated.",
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    await removeFromCart(itemId);
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading cart...</div>
        </div>
      </Layout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add some books to get started!</p>
            <Link to="/catalog">
              <Button>Browse Books</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/" className="text-primary-aqua hover:underline">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-700">Cart</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
            
            {cartItems.map((item) => {
              const isGift = (item as any).isGift;
              const imageUrl = isGift ? (item as any).imageUrl : item.book?.imageUrl;
              const title = isGift ? (item as any).name : item.book?.title;
              const author = isGift ? null : item.book?.author;
              
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center gap-4">
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
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {title}
                          </h3>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating === item.id}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={isUpdating === item.id}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          {isGift ? (
                            <p className="text-xl font-bold text-green-600">FREE</p>
                          ) : (
                            <ItemPrice bookPrice={parseFloat(item.book.price)} quantity={item.quantity} />
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
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatAmount(convertedAmounts.subtotal, userCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {convertedAmounts.shipping === 0 ? 'Free Delivery' : formatAmount(convertedAmounts.shipping, userCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatAmount(convertedAmounts.tax, userCurrency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatAmount(convertedAmounts.total, userCurrency)}</span>
                </div>
                
                <div className="pt-4">
                  <Link to="/checkout">
                    <Button className="w-full bg-primary-aqua hover:bg-primary-aqua/90">
                      Proceed to Checkout
                    </Button>
                  </Link>
                </div>
                
                <div className="pt-2">
                  <Link to="/catalog">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}