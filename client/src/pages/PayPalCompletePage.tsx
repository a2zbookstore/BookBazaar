import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

export default function PayPalCompletePage() {
  const [, setLocation] = useLocation();
  const { clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderCompleted, setOrderCompleted] = useState(false);

  const completeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders/complete", orderData);
      return await response.json();
    },
    onSuccess: (data: any) => {
      clearCart();
      setOrderCompleted(true);
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${data.orderId} has been confirmed.`,
      });
      
      // Redirect to order detail page after 3 seconds
      setTimeout(() => {
        const orderData = JSON.parse(sessionStorage.getItem('pendingOrder') || '{}');
        const email = orderData.customerEmail;
        setLocation(`/orders/${data.orderId}${email ? `?email=${encodeURIComponent(email)}` : ''}`);
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to complete order. Please contact support.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  useEffect(() => {

    const completePayPalOrder = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const PayerID = urlParams.get('PayerID');

        if (!token || !PayerID) {
          throw new Error('Missing payment parameters');
        }

        // Get pending order data from session storage
        const pendingOrderData = sessionStorage.getItem('pendingOrder');
        if (!pendingOrderData) {
          throw new Error('No pending order data found');
        }

        const orderData = JSON.parse(pendingOrderData);

        // Capture PayPal payment with order data
        const captureResponse = await fetch(`/api/paypal/order/${token}/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderData: orderData
          }),
        });
        
        if (!captureResponse.ok) {
          const errorData = await captureResponse.json();
          throw new Error(errorData.error || "Failed to capture PayPal payment");
        }
        
        const captureData = await captureResponse.json();

        // If PayPal capture included order creation, handle success
        if (captureData.orderId) {
          clearCart();
          setOrderCompleted(true);
          toast({
            title: "Order Placed Successfully!",
            description: `Your order #${captureData.orderId} has been confirmed.`,
          });
          
          // Clear session storage
          sessionStorage.removeItem('pendingOrder');
          
          // Redirect to order detail page after 3 seconds
          setTimeout(() => {
            const email = orderData.customerEmail;
            setLocation(`/orders/${captureData.orderId}${email ? `?email=${encodeURIComponent(email)}` : ''}`);
          }, 3000);
        } else {
          // Fallback to complete order mutation if needed
          completeOrderMutation.mutate({
            ...orderData,
            paymentId: captureData.id || token,
            paypalToken: token,
            paypalPayerId: PayerID
          });
        }

        // Clear session storage
        sessionStorage.removeItem('pendingOrder');
        
      } catch (error) {
        console.error('PayPal completion error:', error);
        toast({
          title: "Payment Error",
          description: error instanceof Error ? error.message : "Failed to complete PayPal payment",
          variant: "destructive",
        });
        setIsProcessing(false);
        
        // Redirect back to checkout after error
        setTimeout(() => {
          setLocation('/checkout');
        }, 3000);
      }
    };

    completePayPalOrder();
  }, [isAuthenticated, setLocation, completeOrderMutation, toast]);

  if (!isAuthenticated) {
    return <Layout><div>Redirecting...</div></Layout>;
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {orderCompleted ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Payment Successful!
                </>
              ) : (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-primary-aqua" />
                  Processing Payment...
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {orderCompleted ? (
              <>
                <p className="text-secondary-black">
                  Your PayPal payment has been processed successfully.
                </p>
                <p className="text-sm text-secondary-black">
                  You will be redirected to your order details shortly.
                </p>
              </>
            ) : isProcessing ? (
              <>
                <p className="text-secondary-black">
                  Please wait while we confirm your PayPal payment and create your order...
                </p>
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-aqua" />
                </div>
              </>
            ) : (
              <>
                <p className="text-red-600">
                  There was an error processing your payment.
                </p>
                <p className="text-sm text-secondary-black">
                  You will be redirected back to checkout.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}