import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useShipping } from "@/hooks/useShipping";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, Globe, CheckCircle, ChevronDown } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Country codes and phone validation data
const countryCodes = [
  { code: "+1", country: "US", name: "United States" },
  { code: "+1", country: "CA", name: "Canada" },
  { code: "+44", country: "GB", name: "United Kingdom" },
  { code: "+91", country: "IN", name: "India" },
  { code: "+86", country: "CN", name: "China" },
  { code: "+81", country: "JP", name: "Japan" },
  { code: "+49", country: "DE", name: "Germany" },
  { code: "+33", country: "FR", name: "France" },
  { code: "+39", country: "IT", name: "Italy" },
  { code: "+34", country: "ES", name: "Spain" },
  { code: "+61", country: "AU", name: "Australia" },
  { code: "+55", country: "BR", name: "Brazil" },
  { code: "+52", country: "MX", name: "Mexico" },
  { code: "+7", country: "RU", name: "Russia" },
  { code: "+82", country: "KR", name: "South Korea" },
  { code: "+31", country: "NL", name: "Netherlands" },
  { code: "+46", country: "SE", name: "Sweden" },
  { code: "+47", country: "NO", name: "Norway" },
  { code: "+45", country: "DK", name: "Denmark" },
  { code: "+41", country: "CH", name: "Switzerland" },
  { code: "+43", country: "AT", name: "Austria" },
  { code: "+32", country: "BE", name: "Belgium" },
  { code: "+351", country: "PT", name: "Portugal" },
  { code: "+353", country: "IE", name: "Ireland" },
  { code: "+358", country: "FI", name: "Finland" },
  { code: "+48", country: "PL", name: "Poland" },
  { code: "+420", country: "CZ", name: "Czech Republic" },
  { code: "+36", country: "HU", name: "Hungary" },
  { code: "+30", country: "GR", name: "Greece" },
  { code: "+90", country: "TR", name: "Turkey" },
  { code: "+972", country: "IL", name: "Israel" },
  { code: "+971", country: "AE", name: "UAE" },
  { code: "+966", country: "SA", name: "Saudi Arabia" },
  { code: "+20", country: "EG", name: "Egypt" },
  { code: "+27", country: "ZA", name: "South Africa" },
  { code: "+234", country: "NG", name: "Nigeria" },
  { code: "+254", country: "KE", name: "Kenya" },
  { code: "+65", country: "SG", name: "Singapore" },
  { code: "+60", country: "MY", name: "Malaysia" },
  { code: "+66", country: "TH", name: "Thailand" },
  { code: "+84", country: "VN", name: "Vietnam" },
  { code: "+63", country: "PH", name: "Philippines" },
  { code: "+62", country: "ID", name: "Indonesia" },
  { code: "+92", country: "PK", name: "Pakistan" },
  { code: "+880", country: "BD", name: "Bangladesh" },
  { code: "+94", country: "LK", name: "Sri Lanka" },
  { code: "+977", country: "NP", name: "Nepal" },
  { code: "+98", country: "IR", name: "Iran" },
  { code: "+964", country: "IQ", name: "Iraq" },
  { code: "+213", country: "DZ", name: "Algeria" },
  { code: "+212", country: "MA", name: "Morocco" },
  { code: "+216", country: "TN", name: "Tunisia" }
];

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria",
  "Cambodia", "Canada", "Chile", "China", "Colombia", "Croatia", "Czech Republic", "Denmark",
  "Ecuador", "Egypt", "Estonia", "Finland", "France", "Georgia", "Germany", "Ghana", "Greece",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon", "Lithuania", "Luxembourg",
  "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia",
  "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden",
  "Switzerland", "Thailand", "Tunisia", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", 
  "United States", "Uruguay", "Venezuela", "Vietnam"
];

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

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { cartItems, cartCount, clearCart } = useCart();
  const { userCurrency, convertPrice, formatAmount } = useCurrency();
  const { shipping } = useShipping();
  const { toast } = useToast();

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
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutType, setCheckoutType] = useState<"guest" | "register" | "login">("guest");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (parseFloat(item.book.price) * item.quantity), 0);
  const shippingCost = shipping?.cost ? parseFloat(shipping.cost) : 5.99;
  const tax = subtotal * 0.01; // 1% tax
  const total = subtotal + shippingCost + tax;

  // Razorpay config
  const { data: razorpayConfig } = useQuery({
    queryKey: ["/api/razorpay/config"],
  });

  // Pre-fill user data
  useEffect(() => {
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
    setShippingAddress({...shippingAddress, country: value});
    setShowCountryDropdown(value.length > 0);
  };

  const selectCountry = (country: string) => {
    setShippingAddress({...shippingAddress, country: country});
    setCountryQuery(country);
    setShowCountryDropdown(false);
  };

  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(countryQuery.toLowerCase())
  ).slice(0, 10);

  // Copy billing address
  useEffect(() => {
    if (sameBillingAddress) {
      setBillingAddress(shippingAddress);
    }
  }, [shippingAddress, sameBillingAddress]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartCount === 0) {
      setLocation("/cart");
      return;
    }
  }, [cartCount, setLocation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCountryDropdown]);

  const completeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders/complete", orderData);
      return await response.json();
    },
    onSuccess: (data: any) => {
      clearCart();
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${data.orderId} has been confirmed.`,
      });
      setLocation(`/orders/${data.orderId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayPalPayment = async () => {
    if (!isFormValid) {
      toast({
        title: "Invalid Form",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create PayPal order with return URLs
      const orderResponse = await apiRequest("POST", "/api/paypal/order", {
        amount: parseFloat(total.toFixed(2)),
        currency: "USD",
        intent: "CAPTURE",
        return_url: `${window.location.origin}/api/paypal/success`,
        cancel_url: `${window.location.origin}/checkout`
      });

      const orderData = await orderResponse.json();
      
      // Get approval URL from PayPal order response
      const approvalUrl = orderData.links?.find((link: any) => link.rel === 'approve')?.href;
      
      if (approvalUrl) {
        // Store order data in session storage for completion after redirect
        sessionStorage.setItem('pendingOrder', JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          billingAddress: sameBillingAddress ? shippingAddress : billingAddress,
          subtotal: subtotal.toFixed(2),
          shipping: shippingCost.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
          paymentMethod: "PayPal",
          items: cartItems.map(item => ({
            bookId: item.book.id,
            quantity: item.quantity,
            price: item.book.price,
            title: item.book.title,
            author: item.book.author
          }))
        }));

        toast({
          title: "Redirecting to PayPal",
          description: "Please complete your payment on PayPal's secure website...",
        });

        // Redirect to PayPal for payment
        setTimeout(() => {
          window.location.href = approvalUrl;
        }, 1000);
      } else {
        throw new Error("No approval URL received from PayPal");
      }
      
    } catch (error) {
      console.error("PayPal payment error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to create PayPal order",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handlePayPalSuccess = (details: any) => {
    const orderItems = cartItems.map(item => ({
      bookId: item.book.id,
      quantity: item.quantity,
      price: item.book.price,
      title: item.book.title,
      author: item.book.author
    }));

    completeOrderMutation.mutate({
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      billingAddress: sameBillingAddress ? shippingAddress : billingAddress,
      subtotal: subtotal.toFixed(2),
      shipping: shippingCost.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      paymentMethod: "PayPal",
      paymentId: details.id,
      items: orderItems
    });
  };

  const handleRazorpayPayment = async () => {
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

    try {
      // Create Razorpay order (convert USD to INR)
      const usdToInrRate = 83; // Current exchange rate
      const totalInINR = Math.round(total * usdToInrRate * 100) / 100; // Round to 2 decimal places
      
      // Check if amount is too small for live Razorpay
      if (totalInINR < 100) {
        toast({
          title: "Minimum Amount Required",
          description: "Razorpay requires a minimum transaction of ₹100. Please add more items to your cart.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      const orderResponse = await apiRequest("POST", "/api/razorpay/order", {
        amount: totalInINR,
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      }) as any;
      
      // Validate Razorpay response
      const orderData = await orderResponse.json();
      if (!orderData.amount || orderData.amount <= 100) {
        throw new Error(`Invalid Razorpay amount: ${orderData.amount}. Expected: ${Math.round(totalInINR * 100)} paise`);
      }
      
      const options = {
        key: (razorpayConfig as any).key_id,
        amount: orderData.amount, // Use server-validated amount
        currency: orderData.currency || "INR",
        name: "A2Z BOOKSHOP",
        description: `Book Purchase - Total: ₹${totalInINR.toFixed(2)}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            await apiRequest("POST", "/api/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            // Complete order
            const orderItems = cartItems.map(item => ({
              bookId: item.book.id,
              quantity: item.quantity,
              price: item.book.price,
              title: item.book.title,
              author: item.book.author
            }));

            completeOrderMutation.mutate({
              customerName,
              customerEmail,
              customerPhone,
              shippingAddress,
              billingAddress: sameBillingAddress ? shippingAddress : billingAddress,
              subtotal: subtotal.toFixed(2),
              shipping: shippingCost.toFixed(2),
              tax: tax.toFixed(2),
              total: total.toFixed(2),
              totalInINR: totalInINR.toFixed(2),
              paymentMethod: "Razorpay",
              paymentId: response.razorpay_payment_id,
              items: orderItems
            });
          } catch (error) {
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone
        },
        theme: {
          color: "#2563eb"
        }
      };

      const razorpay = new window.Razorpay(options);
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

  if (cartCount === 0) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-base-black mb-8">Checkout</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <div className="flex gap-2">
                    <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((country, index) => (
                          <SelectItem key={index} value={country.code}>
                            {country.code} {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="Enter phone number"
                      required
                      className={phoneError ? "border-red-500 flex-1" : "flex-1"}
                    />
                  </div>
                  {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
                  <p className="text-xs text-gray-500">Format: Numbers, spaces, hyphens, and parentheses only</p>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
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
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
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
                      onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})}
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
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <div className="flex items-center space-x-2 flex-1">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                          PayPal
                          <Badge variant="secondary" className="ml-2">International</Badge>
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <div className="flex items-center space-x-2 flex-1">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                          Credit/Debit Card & UPI
                          <Badge variant="secondary" className="ml-2">India</Badge>
                        </Label>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                <div className="mt-6">
                  {paymentMethod === "paypal" && isFormValid && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        You will be redirected to PayPal to complete your payment securely.
                      </p>
                      <Button
                        onClick={handlePayPalPayment}
                        disabled={isProcessing}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isProcessing ? "Processing..." : "Pay with PayPal"}
                      </Button>
                    </div>
                  )}

                  {paymentMethod === "razorpay" && isFormValid && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Pay securely with UPI, Credit/Debit cards, Net Banking, and more.
                      </p>
                      <Button
                        onClick={handleRazorpayPayment}
                        disabled={isProcessing}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {isProcessing ? "Processing..." : "Pay with Razorpay"}
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
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.book.title}</h4>
                        <p className="text-xs text-gray-600">by {item.book.author}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-sm">
                        ${(parseFloat(item.book.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (1%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary-aqua">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Secure Checkout</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Your payment information is encrypted and secure. We never store your payment details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Load Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </Layout>
  );
}