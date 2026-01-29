import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useShipping } from "@/hooks/useShipping";
import { useToast } from "@/hooks/use-toast";
import { calculateDeliveryDate } from "@/lib/deliveryUtils";
import { COUNTRY_CODES, COUNTRIES } from "@/lib/countryData";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Globe, CheckCircle, ScrollText, MapPinPlusInside, UserPen, ChevronDown } from "lucide-react";
import { PaymentSpinner } from "@/components/PaymentSpinner";
import StripeCheckoutForm from "@/components/StripeCheckoutForm";
import { Book } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";



declare global {
  interface Window {
    Razorpay: any;
  }
}

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
};

const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  return nameRegex.test(name) && name.trim().length >= 2;
};

// Component to handle individual item price conversion in checkout
function CheckoutItemPrice({ bookPrice, quantity }: { bookPrice: number; quantity: number }) {
  const { formatAmount, convertPrice } = useCurrency();
  const [convertedPrice, setConvertedPrice] = useState<number>(bookPrice * quantity);

  const convertItemPrice = React.useCallback(async () => {
    try {
      const converted = await convertPrice(bookPrice * quantity);
      setConvertedPrice(converted?.convertedAmount || (bookPrice * quantity));
    } catch (error) {
      console.error('Error converting checkout item price:', error);
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
    <p className="font-medium text-sm">
      {formatAmount(convertedPrice)}
    </p>
  );
}

export default function CheckoutPage() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { cartItems: cartContent, cartCount, clearCart, isLoading: isCartLoading } = useGlobalContext();
  const { userCurrency, convertPrice, formatAmount, exchangeRates } = useCurrency();
  const { shippingCost, shippingRate } = useShipping();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState(cartContent);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phoneCountryQuery, setPhoneCountryQuery] = useState("");
  const [showPhoneCountryDropdown, setShowPhoneCountryDropdown] = useState(false);
  const [selectedCountryIndex, setSelectedCountryIndex] = useState(-1);
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: ""
  });
  const [billingAddress, setBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: ""
  });
  const [sameBillingAddress, setSameBillingAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [giftItem, setGiftItem] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const { mode, bookId, quantity } = useParams();

  const { data: book, isLoading: isBookLoading } = useQuery<Book>({
    queryKey: [`/api/books/${bookId}`],
    enabled: mode === "buyNow" && !!bookId,
  });

  useEffect(() => {
    if (mode === "buyNow" && book && !isBookLoading) {

      if (book.stock <= 0 || book.stock < ( quantity ? parseInt(quantity) : 1)) {
        toast({
          title: "Out of Stock",
          description: "This book is currently out of stock.",
        });
        setLocation("/catalog");
        return;
      }
      setCartItems([{
        id: book.id ?? "temp-buy-now-item",
        createdAt: new Date().toISOString(),
        userId: user?.id ?? null,
        bookId: book.id,
        book: book,
        quantity: quantity ? parseInt(quantity) : 1
      }]);
    }
    if (mode === "cart" && !isCartLoading) {
      setCartItems(cartContent);
    }
  }, [cartContent, mode, book, isCartLoading, isBookLoading]);

  // Check if cart has any non-gift books
  const hasNonGiftBooks = cartItems.some(item => !(item as any).isGift);

  // Apply coupon function
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError("");

    try {
      const response = await apiRequest("POST", "/api/coupons/validate", {
        code: couponCode.trim(),
        orderAmount: convertedAmounts.subtotal
      });

      const data = await response.json();
      setAppliedCoupon(data);
      setCouponCode("");
      toast({
        title: "Coupon Applied!",
        description: `You saved ${data.discountType === 'percentage' ? data.discountValue + '%' : formatAmount(data.discountValue)}`,
      });
    } catch (error: any) {
      setCouponError("Invalid coupon code");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Remove coupon function
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order",
    });
  };

  // Calculate discount amount
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.discountType === 'percentage') {
      const discountAmount = (convertedAmounts.subtotal * appliedCoupon.discountValue) / 100;
      // Apply maximum discount limit if exists
      if (appliedCoupon.maximumDiscountAmount) {
        return Math.min(discountAmount, appliedCoupon.maximumDiscountAmount);
      }
      return discountAmount;
    } else {
      // Fixed amount discount
      return Math.min(appliedCoupon.discountValue, convertedAmounts.subtotal);
    }
  };

  // Calculate final total with discount
  const calculateFinalTotal = () => {
    const discount = calculateDiscount();
    return Math.max(0, convertedAmounts.total - discount);
  };

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

  // Calculate totals - Use detected location's shipping rate as primary source
  const subtotal = cartItems.reduce((total, item) => {
    // Skip gift items in subtotal calculation
    if ((item as any).isGift) return total;
    return total + (parseFloat(item.book.price) * item.quantity);
  }, 0);


  // Use dynamic shipping cost based on user location
  const checkoutShippingCost = shippingCost || 0;

  const tax = subtotal * 0.01; // 1% tax
  const total = subtotal + checkoutShippingCost + tax;

  // Convert all amounts to user's currency for display
  const [convertedAmounts, setConvertedAmounts] = useState({
    subtotal: subtotal,
    shipping: shippingCost,
    tax: tax,
    total: total
  });

  // Convert amounts function
  const convertAmounts = React.useCallback(async () => {
    try {
      console.log('Checkout conversion attempt:', { subtotal, userCurrency, exchangeRates });

      const convertedSubtotal = await convertPrice(subtotal);
      const convertedShipping = await convertPrice(checkoutShippingCost);
      const convertedTax = await convertPrice(tax);
      const convertedTotal = await convertPrice(total);

      console.log('Checkout conversion results:', {
        original: { subtotal, checkoutShippingCost, tax, total },
        converted: { convertedSubtotal, convertedShipping, convertedTax, convertedTotal }
      });

      setConvertedAmounts({
        subtotal: convertedSubtotal?.convertedAmount || subtotal,
        shipping: convertedShipping?.convertedAmount || checkoutShippingCost,
        tax: convertedTax?.convertedAmount || tax,
        total: convertedTotal?.convertedAmount || total
      });
    } catch (error) {
      console.error('Error converting currencies:', error);
      // Fallback to original amounts
      setConvertedAmounts({
        subtotal: subtotal,
        shipping: checkoutShippingCost,
        tax: tax,
        total: total
      });
    }
  }, [subtotal, checkoutShippingCost, tax, total, userCurrency, convertPrice, exchangeRates]);

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
        subtotal: subtotal,
        shipping: checkoutShippingCost,
        tax: tax,
        total: total
      });
    }
  }, [convertAmounts, exchangeRates, userCurrency]);

  // Razorpay config
  const { data: razorpayConfig } = useQuery({
    queryKey: ["/api/razorpay/config"],
  });

  // Pre-fill user data
  useEffect(() => {
    if (!user) {
      setLocation("/login?redirect=/");
      return;
    }
    if (user) {
      setCustomerName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
      setCustomerEmail(user.email || "");
    }
  }, [user]);

  // Validation handlers
  const handleNameChange = (value: string) => {
    setCustomerName(value);
    if (value && !validateName(value)) {
      setNameError("Name should only contain letters, spaces, hyphens, and apostrophes");
    } else {
      setNameError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setCustomerEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (value: string) => {
    // Allow only numbers, spaces, hyphens, and parentheses
    const cleanedValue = value.replace(/[^0-9\s\-\(\)]/g, '');
    setCustomerPhone(cleanedValue);
    if (cleanedValue && !validatePhone(cleanedValue)) {
      setPhoneError("Please enter a valid phone number (minimum 7 digits)");
    } else {
      setPhoneError("");
    }
  };

  const handleCountrySearch = (value: string) => {
    setCountryQuery(value);
    setShippingAddress({ ...shippingAddress, country: value });
    setShowCountryDropdown(value.length > 0);
  };

  const selectCountry = (country: string) => {
    setShippingAddress({ ...shippingAddress, country: country });
    setCountryQuery(country);
    setShowCountryDropdown(false);
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.toLowerCase().includes(countryQuery.toLowerCase())
  ).slice(0, 10);

  const filteredCountryCodes = COUNTRY_CODES.filter(country =>
    country.name.toLowerCase().includes(phoneCountryQuery.toLowerCase()) ||
    country.code.includes(phoneCountryQuery)
  ).slice(0, 10);

  const handlePhoneCountrySearch = (value: string) => {
    setPhoneCountryQuery(value);
    setShowPhoneCountryDropdown(true);
    setSelectedCountryIndex(-1);
  };

  const selectPhoneCountry = (countryCode: string) => {
    setPhoneCountryCode(countryCode);
    setPhoneCountryQuery("");
    setShowPhoneCountryDropdown(false);
    setSelectedCountryIndex(-1);
  };

  const handlePhoneCountryKeyDown = (e: React.KeyboardEvent) => {
    const filtered = phoneCountryQuery ? filteredCountryCodes : countryCodes;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!showPhoneCountryDropdown) {
          setShowPhoneCountryDropdown(true);
        }
        setSelectedCountryIndex(prev =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!showPhoneCountryDropdown) {
          setShowPhoneCountryDropdown(true);
        }
        setSelectedCountryIndex(prev =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedCountryIndex >= 0 && filtered[selectedCountryIndex]) {
          selectPhoneCountry(filtered[selectedCountryIndex].code);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowPhoneCountryDropdown(false);
        setPhoneCountryQuery("");
        setSelectedCountryIndex(-1);
        break;
    }
  };

  // Copy billing address
  useEffect(() => {
    if (sameBillingAddress) {
      setBillingAddress(shippingAddress);
    }
  }, [shippingAddress, sameBillingAddress]);

  // Redirect if cart is empty

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
      }
      if (!target.closest('.phone-country-dropdown-container')) {
        setShowPhoneCountryDropdown(false);
      }
    };

    if (showCountryDropdown || showPhoneCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCountryDropdown, showPhoneCountryDropdown]);

  const completeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders/complete", orderData);
      return await response.json();
    },
    onSuccess: (data: any) => {
      clearCart();
      // Invalidate pending orders cache for admin dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${data.orderId} has been confirmed.`,
      });
      // Navigate to order detail page with email for guest access
      setLocation(`/orders/${data.orderId}?email=${encodeURIComponent(customerEmail)}`);
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });


  const handleRazorpayInternationalPayment = async () => {
    await processRazorpayPayment(true); // International payment
  };

  const processRazorpayPayment = async (isInternational: boolean = true) => {
    if (!(razorpayConfig as any)?.key_id) {
      toast({
        title: "Payment Error",
        description: "Razorpay configuration not available",
        variant: "destructive",
      });
      return;
    }

    if (!window.Razorpay) {
      toast({
        title: "Payment Error",
        description: "Razorpay payment system not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentMethod("razorpay");

    try {
      let finalAmount;
      let currency;
      let paymentDescription;

      // International payment in USD only
      finalAmount = total;
      currency = "USD";
      paymentDescription = "International Book Order Payment";

      // Check minimum amount for USD (usually $0.50)
      if (finalAmount < 0.50) {
        toast({
          title: "Minimum Amount Required",
          description: "International payments require a minimum of $0.50. Please add more items to your cart.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const orderResponse = await apiRequest("POST", "/api/razorpay/order", {
        amount: finalAmount,
        currency: currency,
        receipt: `order_${Date.now()}`,
        international: isInternational
      });

      const orderData = await orderResponse.json();
      console.log("Razorpay order created:", orderData);

      const options = {
        key: (razorpayConfig as any).key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "A2Z BOOKSHOP",
        description: paymentDescription,
        order_id: orderData.id,
        handler: async (response: any) => {
          console.log("Razorpay payment response:", response);

          try {
            const verifyResult = await apiRequest("POST", "/api/razorpay/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderData: {
                customerName,
                customerEmail,
                customerPhone,
                shippingAddress,
                billingAddress: sameBillingAddress ? shippingAddress : billingAddress,
                subtotal: subtotal.toFixed(2),
                shipping: shippingCost.toFixed(2),
                tax: tax.toFixed(2),
                total: total.toFixed(2),
                paymentMethod: "razorpay-international",
                items: cartItems.map(item => ({
                  bookId: item.book.id,
                  quantity: item.quantity,
                  price: item.book.price,
                  title: item.book.title,
                  author: item.book.author
                }))
              }
            });

            const verifyData = await verifyResult.json();
            console.log("Payment verification result:", verifyData);

            if (verifyData.status === "success") {
              setIsProcessing(false);
              clearCart();
              // Invalidate pending orders cache for admin dashboard
              queryClient.invalidateQueries({ queryKey: ["/api/orders", "pending"] });
              queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
              toast({
                title: "Payment Successful!",
                description: `Your order #${verifyData.orderId} has been placed successfully.`,
              });

              // Navigate to order detail page with email for guest access
              setLocation(`/orders/${verifyData.orderId}?email=${encodeURIComponent(customerEmail)}`);
            } else {
              console.error("Payment verification failed:", verifyData);
              throw new Error(verifyData.message || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);

            // Check if it's a network error or parsing error
            if (error instanceof TypeError && error.message.includes('fetch')) {
              toast({
                title: "Connection Error",
                description: "Unable to connect to payment server. Please check your internet connection and try again.",
                variant: "destructive",
              });
            } else if (error instanceof SyntaxError) {
              toast({
                title: "Server Error",
                description: "Server responded with invalid data. Please try again or contact support.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Payment Verification Failed",
                description: error instanceof Error ? error.message : "Payment verification failed. Please contact support with your payment ID.",
                variant: "destructive",
              });
            }
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone
        },
        theme: {
          color: isInternational ? "#2563EB" : "#7C3AED"
        },
        modal: {
          ondismiss: () => {
            console.log("Payment modal dismissed by user");
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "Payment was cancelled. Please try again.",
              variant: "destructive",
            });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error("Payment failed:", response.error);
        setIsProcessing(false);

        let errorMessage = "Payment failed. Please try again.";
        let errorTitle = "Payment Failed";

        if (response.error?.description) {
          errorMessage = response.error.description;

          // Handle business verification errors
          if (response.error.description.includes("business is not allowed") ||
            response.error.description.includes("not allowed to accept payments")) {
            errorTitle = "Payment Service Issue";
            errorMessage = "Our international payment service is temporarily unavailable. Please use PayPal payment instead.";
          }
        } else if (response.error?.reason) {
          errorMessage = response.error.reason;
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      });

      razorpay.open();
    } catch (error) {
      console.error("Razorpay payment error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = customerName && customerEmail && customerPhone &&
    shippingAddress.street && shippingAddress.city && shippingAddress.country && shippingAddress.zip &&
    validateName(customerName) && validateEmail(customerEmail) && validatePhone(customerPhone) &&
    !nameError && !emailError && !phoneError;


  if ((mode === "cart" && isCartLoading) || (mode === "buyNow" && isBookLoading)) {
    return (
      <>
        <div className="container-custom mt-6">
          <h1 className="text-3xl font-bold text-base-black mb-8">Checkout</h1>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Checkout"
        description="Complete your book purchase securely at A2Z BOOKSHOP. Multiple payment options including PayPal, credit cards, and Razorpay."
        keywords="checkout, secure payment, buy books, online payment, book purchase"
        url="https://a2zbookshop.com/checkout"
        type="website"
      />
      <div className="container-custom mt-6">
        <h1 className="text-3xl font-bold text-base-black mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="border-2 border-gray-100 shadow-lg overflow-hidden rounded-xl">
              <CardHeader className="bg-white px-6 pt-4 pb-3 border-b-2 border-gray-100">
                <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2 text-primary-aqua">
                  <UserPen className="w-6 h-6" />
                  Customer Information
                </CardTitle>
                <p className="text-gray-600 text-sm mt-1 ml-8">Tell us who you are</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className={nameError ? "border-red-500" : ""}
                    />
                    {nameError && <p className="text-sm text-red-600">{nameError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className={emailError ? "border-red-500" : ""}
                    />
                    {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <div className="flex flex-row gap-2 w-full">
                    <div className="relative phone-country-dropdown-container w-32">
                      <div className="flex flex-col sm:flex-row">
                        <Input
                          value={phoneCountryQuery || phoneCountryCode}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.startsWith('+') || /^\+?\d*$/.test(value)) {
                              // Manual country code entry
                              const formattedValue = value.startsWith('+') ? value : (value ? `+${value}` : '');
                              setPhoneCountryCode(formattedValue);
                              setPhoneCountryQuery("");
                              if (value.length > 1) {
                                setShowPhoneCountryDropdown(false);
                              }
                            } else {
                              // Search functionality
                              handlePhoneCountrySearch(value);
                            }
                          }}
                          onFocus={() => setShowPhoneCountryDropdown(true)}
                          onKeyDown={handlePhoneCountryKeyDown}
                          placeholder="Country code or type to search"
                          className="w-full rounded-b-none sm:rounded-b-md sm:rounded-r-none min-h-[44px] touch-target text-sm"
                        />
                        <button
                          type="button"
                          className="px-3 border border-t-0 sm:border-t sm:border-l-0 border-gray-300 rounded-t-none sm:rounded-t-md sm:rounded-l-none bg-gray-50 hover:bg-gray-100 touch-target min-h-[44px]"
                          onClick={() => setShowPhoneCountryDropdown(!showPhoneCountryDropdown)}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      {showPhoneCountryDropdown && (
                        <div
                          className="absolute z-50 w-80 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto"
                          onMouseLeave={() => {
                            if (!phoneCountryQuery) {
                              setShowPhoneCountryDropdown(false);
                            }
                          }}
                        >
                          {phoneCountryQuery && (
                            <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                              Search: "{phoneCountryQuery}" - {filteredCountryCodes.length} results
                            </div>
                          )}
                          {(phoneCountryQuery ? filteredCountryCodes : COUNTRY_CODES).map((country, index) => (
                            <div
                              key={index}
                              className={`px-3 py-2 cursor-pointer text-sm flex items-center gap-2 ${selectedCountryIndex === index
                                ? 'bg-blue-100 text-blue-900'
                                : 'hover:bg-gray-100'
                                }`}
                              onClick={() => selectPhoneCountry(country.code)}
                              onMouseEnter={() => setSelectedCountryIndex(index)}
                            >
                              <span className="font-medium text-blue-600 min-w-[3rem]">{country.code}</span>
                              <span className="text-gray-700">{country.name}</span>
                            </div>
                          ))}
                          {phoneCountryQuery && filteredCountryCodes.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No countries found for "{phoneCountryQuery}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="Enter phone number"
                      required
                      className={phoneError ? "border-red-500 flex-1 min-h-[44px] touch-target" : "flex-1 min-h-[44px] touch-target"}
                    />
                  </div>
                  {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
                  <p className="text-xs text-gray-500">Type +1, +91 etc. for manual entry or country letters to search. Phone format: Numbers, spaces, hyphens, and parentheses only</p>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="border-2 border-gray-100 shadow-lg overflow-hidden rounded-xl">
              <CardHeader className="px-6 pt-4 pb-2 bg-white border-b-2 border-gray-100">
                <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2 text-primary-aqua">
                  <MapPinPlusInside className="w-5 h-5" />
                  Shipping Address
                </CardTitle>
                <p className="text-gray-600 text-sm mt-1 ml-8">Where should we deliver?</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    placeholder="Enter street address"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      placeholder="Enter state/province"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP/Postal Code *</Label>
                    <Input
                      id="zip"
                      value={shippingAddress.zip}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                      placeholder="Enter ZIP/postal code"
                      required
                    />
                  </div>
                  <div className="space-y-2 relative country-dropdown-container">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={countryQuery || shippingAddress.country}
                      onChange={(e) => handleCountrySearch(e.target.value)}
                      onFocus={() => setShowCountryDropdown(true)}
                      placeholder="Type to search countries..."
                      required
                    />
                    {showCountryDropdown && filteredCountries.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredCountries.map((country, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                            onClick={() => selectCountry(country)}
                          >
                            {country}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border-2 border-gray-100 shadow-lg overflow-hidden rounded-xl">
              <CardHeader className="bg-white px-6 pt-4 pb-3 border-b-2 border-gray-100">
                <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2 text-primary-aqua">
                  <svg className="w-6 h-6 text-primary-aqua" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  Payment Method
                </CardTitle>
                <p className="text-gray-600 text-sm mt-1 ml-8">Choose how to pay</p>
              </CardHeader>
              <CardContent className="pt-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-4">

                    <div className="flex items-center space-x-3 p-4 border rounded-xl border-[#635BFF]/30 bg-[#635BFF]/5">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <div className="flex items-center space-x-2 flex-1">
                        <CreditCard className="w-5 h-5 text-[#635BFF]" />
                        <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                          <span className="font-semibold text-[#635BFF]">Stripe</span> - Credit/Debit Card
                          <Badge variant="secondary" className="ml-2 bg-[#635BFF]/10 text-[#635BFF]">Recommended</Badge>
                          <p className="text-xs text-gray-500 mt-1">Visa, Mastercard, Amex, and more</p>
                        </Label>
                      </div>
                    </div>

                    {/* <div className="flex items-center space-x-3 p-4 border rounded-xl">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <div className="flex items-center space-x-2 flex-1">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                          PayPal
                          <Badge variant="secondary" className="ml-2">International</Badge>
                        </Label>
                      </div>
                    </div> */}

                    <div className="flex items-center space-x-3 p-4 border rounded-xl">
                      <RadioGroupItem value="razorpay-international" id="razorpay-international" />
                      <div className="flex items-center space-x-2 flex-1">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <Label htmlFor="razorpay-international" className="flex-1 cursor-pointer">
                          International Cards
                          <Badge variant="secondary" className="ml-2">Global</Badge>
                          <p className="text-xs text-gray-500 mt-1">Visa, Mastercard, Amex worldwide</p>
                        </Label>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                <div className="mt-6">
                  {paymentMethod === "stripe" && isFormValid && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Enter your card details below to complete the payment
                        securely.
                      </p>
                      <StripeCheckoutForm
                        amount={total}
                        customerEmail={customerEmail}
                        customerName={customerName}
                        customerPhone={customerPhone}
                        shippingAddress={shippingAddress}
                        billingAddress={sameBillingAddress ? shippingAddress : billingAddress}
                        subtotal={subtotal.toFixed(2)}
                        shipping={shippingCost.toFixed(2)}
                        tax={tax.toFixed(2)}
                        total={total.toFixed(2)}
                        items={cartItems.map((item) => ({
                          bookId: item.book?.id,
                          quantity: item.quantity,
                          price: item.book?.price,
                          title: item.book?.title,
                          author: item.book?.author,
                        }))}
                        onSuccess={(orderId) => {
                          clearCart();
                          queryClient.invalidateQueries({
                            queryKey: ["/api/orders"],
                          });
                          setLocation(
                            `/orders/${orderId}?email=${encodeURIComponent(
                              customerEmail
                            )}`
                          );
                        }}
                        onCancel={() => setPaymentMethod("stripe")}
                        disabled={isProcessing}
                      />
                    </div>
                  )}

                  {paymentMethod === "razorpay-international" && isFormValid && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Pay with international credit/debit cards. Supports Visa, Mastercard, and Amex worldwide.
                      </p>
                      <Button
                        onClick={handleRazorpayInternationalPayment}
                        disabled={isProcessing}
                        className="w-full bg-primary-aqua hover:brightness-110 hover:shadow-md active:scale-[0.98] text-white rounded-full touch-target mobile-button transition-all duration-200"
                      >
                        {isProcessing ? "Processing..." : "Pay with International Card"}
                      </Button>
                    </div>
                  )}

                  {!isFormValid && (
                    <p className="text-sm text-red-600 mt-4">
                      Please fill in all required fields to proceed with payment.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card className="border-2 border-gray-100 shadow-lg overflow-hidden rounded-xl">
              <CardHeader className="bg-white px-6 pt-4 pb-3 border-b-2 border-gray-100">
                <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2 text-primary-aqua">
                  <ScrollText className="w-6 h-6 text-primary-aqua" />
                  Order Summary
                </CardTitle>
                <p className="text-gray-600 text-sm mt-1 ml-9">Review your items before checkout</p>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pt-2 pb-6">
                {/* Order Items */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-aqua" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    Items ({cartItems.length})
                  </h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-primary-aqua/30 transition-all duration-200">
                        {item.book?.imageUrl && (
                          <div className="flex-shrink-0 w-16 h-20 rounded overflow-hidden bg-white shadow-sm">
                            <img
                              src={item.book.imageUrl}
                              alt={item.book.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {(item as any).isGift ? (
                            <>
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-lg">🎁</span>
                                <h4 className="font-semibold text-sm text-green-700">Free Gift</h4>
                              </div>
                              <p className="text-xs text-green-600 mb-1">Complimentary item</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Qty: {item.quantity}</span>
                                <p className="text-sm font-bold text-green-600">FREE</p>
                              </div>
                            </>
                          ) : item.book ? (
                            <>
                              <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">{item.book.title}</h4>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-1">by {item.book.author}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full font-medium">Qty: {item.quantity}</span>
                                <div className="text-right font-semibold text-sm text-gray-900">
                                  <CheckoutItemPrice bookPrice={parseFloat(item.book.price)} quantity={item.quantity} />
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <h4 className="font-medium text-sm text-gray-600">Unknown Item</h4>
                              <p className="text-xs text-gray-500">Details unavailable</p>
                              <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">Qty: {item.quantity}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-gray-200"></div>

                {/* Coupon Code Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-aqua" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                      <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                    </svg>
                    Promo Code
                  </h3>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-green-800 block">{appliedCoupon.code}</span>
                          <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={removeCoupon}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 rounded-full h-8 px-3 font-medium"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError("");
                        }}
                        className="flex-1 border-2 border-gray-200 focus:border-primary-aqua rounded-lg"
                        onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                      />
                      <Button
                        size="sm"
                        onClick={applyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className="bg-gradient-to-r from-primary-aqua to-secondary-aqua hover:from-secondary-aqua hover:to-primary-aqua text-white rounded-full px-6 font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                      >
                        {isApplyingCoupon ? "Applying..." : "Apply"}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-red-600 font-medium">{couponError}</p>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-dashed border-gray-200"></div>

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-aqua" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    Price Details
                  </h3>
                  <div className="space-y-2.5 text-sm bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-900">{formatAmount(convertedAmounts.subtotal)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between items-center text-green-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Discount ({appliedCoupon.code})
                        </span>
                        <span className="font-bold">-{formatAmount(calculateDiscount())}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-semibold">
                        {convertedAmounts.shipping === 0 ?
                          <span className="text-green-600 font-bold flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                            </svg>
                            FREE
                          </span> :
                          <span className="text-gray-900">{formatAmount(convertedAmounts.shipping)}</span>
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax (1%)</span>
                      <span className="font-semibold text-gray-900">{formatAmount(convertedAmounts.tax)}</span>
                    </div>
                    <div className="border-t-2 border-gray-200 my-2"></div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-base font-bold text-gray-900">Total Amount</span>
                      <span className="text-xl font-bold text-primary-aqua">{formatAmount(calculateFinalTotal())}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Date */}
                {shippingRate && (
                  <>
                    <div className="border-t-2 border-dashed border-gray-200"></div>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-blue-900 mb-1">
                            Expected Delivery
                          </h4>
                          <p className="text-sm text-blue-700 font-semibold mb-2">
                            {(() => {
                              const deliveryEstimate = calculateDeliveryDate(
                                shippingRate.minDeliveryDays,
                                shippingRate.maxDeliveryDays
                              );
                              return deliveryEstimate.deliveryText;
                            })()}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            Shipping to {shippingRate.countryName}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className=" rounded-xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 ">
                    <h4 className="font-bold text-base text-green-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      100% Secure Checkout
                    </h4>
                    <p className="text-sm text-green-800 leading-relaxed">
                      Your payment information is encrypted with industry-standard SSL security. We never store your payment details on our servers.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs px-2 py-1 bg-white/70 text-green-800 rounded-full font-medium shadow-sm">🔒 SSL Encrypted</span>
                      <span className="text-xs px-2 py-1 bg-white/70 text-green-800 rounded-full font-medium shadow-sm">✓ PCI Compliant</span>
                      <span className="text-xs px-2 py-1 bg-white/70 text-green-800 rounded-full font-medium shadow-sm">🛡️ Secure Payment</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Load Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

      {/* Payment Loading Spinner */}
      {isProcessing && (
        <PaymentSpinner
          message={paymentMethod === 'paypal' ? 'Redirecting to PayPal...' : 'Processing payment...'}
          paymentMethod={paymentMethod === 'paypal' ? 'paypal' : 'razorpay'}
        />
      )}
    </>
  );
}