import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface StripeCheckoutFormProps {
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: any;
  billingAddress: any;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  items: any[];
  onSuccess: (orderId: number) => void;
  onCancel: () => void;
  disabled?: boolean;
}

function CheckoutForm({
  amount,
  customerEmail,
  customerName,
  customerPhone,
  shippingAddress,
  billingAddress,
  subtotal,
  shipping,
  tax,
  total,
  items,
  onSuccess,
  onCancel,
  disabled,
  paymentIntentId
}: StripeCheckoutFormProps & { paymentIntentId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Store order data in sessionStorage before potential redirect
      const orderData = {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        billingAddress,
        subtotal,
        shipping,
        tax,
        total,
        items,
        paymentIntentId,
      };
      sessionStorage.setItem("pendingStripeOrder", JSON.stringify(orderData));

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/stripe-complete",
          receipt_email: customerEmail,
        },
        redirect: "if_required",
      });

      if (error) {
        sessionStorage.removeItem("pendingStripeOrder");
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        sessionStorage.removeItem("pendingStripeOrder");
        const response = await apiRequest("POST", "/api/stripe/confirm-order", {
          paymentIntentId: paymentIntent.id,
          orderData: {
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            billingAddress,
            subtotal,
            shipping,
            tax,
            total,
            items,
          },
        });

        const data = await response.json();

        if (data.success) {
          toast({
            title: "Payment Successful!",
            description: `Your order #${data.orderId} has been placed.`,
          });
          onSuccess(data.orderId);
        } else {
          throw new Error(data.error || "Failed to create order");
        }
      }
    } catch (error: any) {
      console.error("Stripe payment error:", error);
      sessionStorage.removeItem("pendingStripeOrder");
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <div className="flex gap-3 mt-4">
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing || disabled}
          className="flex-1 w-full bg-primary-aqua hover:brightness-110 hover:shadow-md active:scale-[0.98] text-white rounded-xl transition-all duration-200 touch-target mobile-button "
          data-testid="button-stripe-pay"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          data-testid="button-stripe-cancel border rounded-xl"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function StripeCheckoutForm(props: StripeCheckoutFormProps) {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initStripe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const configResponse = await fetch("/api/stripe/config");

        if (!configResponse.ok) {
          throw new Error(`Failed to fetch Stripe config: ${configResponse.status}`);
        }

        const configData = await configResponse.json();

        if (!configData.publishableKey) {
          throw new Error("Stripe is not configured");
        }

        const stripe = await loadStripe(configData.publishableKey);
        setStripePromise(stripe);

        const intentResponse = await apiRequest("POST", "/api/stripe/create-payment-intent", {
          amount: props.amount,
          currency: "usd",
          customerEmail: props.customerEmail,
          customerName: props.customerName,
        });

        if (!intentResponse.ok) {
          const errorData = await intentResponse.json();
          throw new Error(errorData.error || "Failed to create payment intent");
        }

        const intentData = await intentResponse.json();

        if (intentData.clientSecret) {
          setClientSecret(intentData.clientSecret);
          setPaymentIntentId(intentData.paymentIntentId);
        } else {
          throw new Error(intentData.error || "Failed to create payment intent");
        }
      } catch (err: any) {
        console.error("Stripe init error:", err);
        setError(err.message || "Failed to initialize Stripe");
        toast({
          title: "Payment Setup Error",
          description: err.message || "Failed to set up payment",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (props.amount > 0 && props.customerEmail) {
      initStripe();
    }
  }, [props.amount, props.customerEmail, props.customerName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="stripe-loading">
        <Loader2 className="w-8 h-8 animate-spin text-[#635BFF]" />
        <span className="ml-2 text-gray-600">Loading payment form...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="stripe-error">
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          onClick={props.onCancel}
          className="mt-2 rounded-xl"
          data-testid="button-stripe-back"

        >
          Go Back
        </Button>
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return null;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#635BFF",
          },
        },
      }}
    >
      <CheckoutForm {...props} paymentIntentId={paymentIntentId} />
    </Elements>
  );
}
