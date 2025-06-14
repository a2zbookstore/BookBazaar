import { useState, useEffect } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    Razorpay: any;
  }
}
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useShipping } from "@/hooks/useShipping";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
// PayPal button component will be implemented inline
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, Globe, CheckCircle } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (parseFloat(item.book.price) * item.quantity), 0);
  const shippingCost = (shipping as any)?.shippingCost ? parseFloat((shipping as any).shippingCost) : 5.99;
  const tax = subtotal * 0.21; // 21% VAT
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

  // Copy billing address
  useEffect(() => {
    if (sameBillingAddress) {
      setBillingAddress(shippingAddress);
    }
  }, [shippingAddress, sameBillingAddress]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }
    if (cartCount === 0) {
      setLocation("/cart");
      return;
    }
  }, [isAuthenticated, cartCount, setLocation]);

  const completeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await apiRequest("POST", "/api/orders/complete", orderData);
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
    setIsProcessing(true);
    
    try {
      // Create PayPal order
      const orderResponse = await apiRequest("POST", "/api/paypal/order", {
        amount: total.toFixed(2),
        currency: "USD",
        intent: "CAPTURE"
      }) as any;

      // Simulate PayPal redirect and completion
      toast({
        title: "PayPal Payment",
        description: "Redirecting to PayPal for secure payment...",
      });

      // For demo purposes, complete the order directly
      // In production, this would happen after PayPal redirect
      setTimeout(() => {
        handlePayPalSuccess({ id: orderResponse.id });
      }, 2000);
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Failed to initialize PayPal payment",
        variant: "destructive",
      });
    } finally {
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
      // Create Razorpay order
      console.log("Creating Razorpay order with:", { amount: total, currency: "INR" });
      const orderResponse = await apiRequest("POST", "/api/razorpay/order", {
        amount: total,
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      }) as any;
      console.log("Razorpay order created:", orderResponse);

      const options = {
        key: (razorpayConfig as any).key_id,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: "A2Z BOOKSHOP",
        description: "Book Purchase",
        order_id: orderResponse.id,
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
          color: "#0EA5E9"
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
    shippingAddress.street && shippingAddress.city && shippingAddress.country;

  if (!isAuthenticated || cartCount === 0) {
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
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
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
                    <Label htmlFor="zip">ZIP/Postal Code</Label>
                    <Input
                      id="zip"
                      value={shippingAddress.zip}
                      onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})}
                      placeholder="Enter ZIP/postal code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      placeholder="Enter country"
                      required
                    />
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
                    <span>Tax (21%):</span>
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