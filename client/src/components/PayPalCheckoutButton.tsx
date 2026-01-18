import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";

interface PayPalCheckoutButtonProps {
  amount: number;
  currency: string;
  customerData: {
    name: string;
    email: string;
    phone: string;
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  cartItems: any[];
  onSuccess?: (orderId: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export default function PayPalCheckoutButton({
  amount,
  currency,
  customerData,
  cartItems,
  onSuccess,
  onError,
  disabled = false
}: PayPalCheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayPalPayment = async () => {
    if (disabled) {
      toast({
        title: "Form Incomplete",
        description: "Please fill in all required fields before proceeding",
        variant: "destructive",
      });
      return;
    }


    setIsProcessing(true);

    try {
      // Validate required data
      if (!amount || amount <= 0) {
        throw new Error("Invalid payment amount");
      }

      if (!customerData.name || !customerData.email || !customerData.phone) {
        throw new Error("Customer information is incomplete");
      }

      if (!customerData.shippingAddress.street || !customerData.shippingAddress.city || 
          !customerData.shippingAddress.country || !customerData.shippingAddress.zip) {
        throw new Error("Shipping address is incomplete");
      }

      if (!cartItems || cartItems.length === 0) {
        throw new Error("Cart is empty");
      }


      // Prepare PayPal order data
      const paypalOrderData = {
        amount: amount.toFixed(2),
        currency: currency,
        intent: "CAPTURE",
        return_url: `${window.location.origin}/paypal-complete`,
        cancel_url: `${window.location.origin}/checkout`,
        orderData: {
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          shippingAddress: customerData.shippingAddress,
          billingAddress: customerData.shippingAddress, // Same as shipping
          subtotal: (amount - 2.00).toFixed(2), // Assume $2 shipping
          shipping: "2.00",
          tax: "0.00",
          total: amount.toFixed(2),
          paymentMethod: "paypal",
          items: cartItems.map(item => ({
            bookId: item.book.id,
            quantity: item.quantity,
            price: item.book.price,
            title: item.book.title,
            author: item.book.author
          }))
        }
      };
      const response = await fetch("/api/paypal/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paypalOrderData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PayPal order failed: ${errorText}`);
      }

      const data = await response.json();

      // Find approval URL
      const approvalUrl = data.links?.find((link: any) => link.rel === 'approve')?.href;

      if (!approvalUrl) {
        throw new Error("No PayPal approval URL received");
      }

      // Store order data for completion
      const orderDataForStorage = {
        orderId: data.id,
        customerData,
        cartItems,
        amount,
        currency,
        paymentMethod: "paypal"
      };

      try {
        sessionStorage.setItem('pendingPayPalOrder', JSON.stringify(orderDataForStorage));
          // ...removed console.log...
      } catch (storageError) {
        // ...removed console.error...
        // Continue anyway - payment can still work without storage
      }

      toast({
        title: "Redirecting to PayPal",
        description: "Please complete your payment on PayPal's secure website",
      });

        // ...removed console.log...

      // Redirect to PayPal after short delay
      setTimeout(() => {
        window.location.href = approvalUrl;
      }, 1000);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(data.id);
      }

    } catch (error) {
      // ...removed console.error...
      
      const errorMessage = error instanceof Error ? error.message : "Failed to create PayPal order";
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handlePayPalPayment}
      disabled={disabled || isProcessing}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
    >
      <CreditCard className="w-5 h-5 mr-2" />
      {isProcessing ? "Processing..." : `Pay ${currency} ${amount.toFixed(2)} with PayPal`}
    </Button>
  );
}