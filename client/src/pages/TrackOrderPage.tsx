import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle, XCircle, Clock, AlertCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface TrackingInfo {
  id: number;
  status: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    title: string;
    author: string;
    quantity: number;
    price: string;
  }>;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-green-100 text-green-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const statusDescriptions = {
  pending: "Your order has been received and is awaiting confirmation.",
  confirmed: "Your order has been confirmed and is being prepared.",
  processing: "Your order is being processed and packaged.",
  shipped: "Your order has been shipped and is on its way to you.",
  delivered: "Your order has been delivered successfully.",
  cancelled: "Your order has been cancelled.",
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const { toast } = useToast();

  const trackOrderMutation = useMutation({
    mutationFn: async (data: { orderId: string; email: string }): Promise<TrackingInfo> => {
      try {
        const response = await apiRequest("POST", "/api/track-order", data);
        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Track order error:", error);
        throw error;
      }
    },
    onSuccess: (data: TrackingInfo) => {
      setTrackingInfo(data);
    },
    onError: (error: any) => {
      console.error("Track order mutation error:", error);
      toast({
        title: "Order Not Found",
        description: error.message || "Please check your order ID and email address.",
        variant: "destructive",
      });
      setTrackingInfo(null);
    },
  });

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both order ID and email address.",
        variant: "destructive",
      });
      return;
    }

    trackOrderMutation.mutate({
      orderId: orderId.trim(),
      email: email.trim(),
    });
  };

  const StatusIcon = trackingInfo
    ? statusIcons[trackingInfo.status as keyof typeof statusIcons] || AlertCircle
    : Search;

  return (
    <Layout>
      <SEO
        title="Track Your Order"
        description="Track your book order from A2Z BOOKSHOP. Check shipping status, delivery updates, and tracking information."
        keywords="track order, order status, shipping tracking, delivery status"
        url="https://a2zbookshop.com/track-order"
        type="website"
      />
      <div className="container-custom">
        <Breadcrumb
          items={[
            { label: "Track Order" }
          ]}
          className="mb-6"
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-black">Track Your Order</h1>
          <p className="text-secondary-black mt-2">
            Enter your order details to check the status of your shipment
          </p>
        </div>

        {/* Order Tracking Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Order Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrackOrder} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    type="text"
                    placeholder="Enter your order ID (e.g. 12345)"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center w-full justify-end">
                <Button
                  type="submit"
                  variant="outline"
                  className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-full"
                  disabled={trackOrderMutation.isPending}
                >
                  {trackOrderMutation.isPending ? "Searching..." : "Track Order"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* Order Tracking Results */}
        {trackingInfo && (
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <StatusIcon className="w-6 h-6" />
                  Order #{trackingInfo.id}
                  <Badge className={statusColors[trackingInfo.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                    {trackingInfo.status.charAt(0).toUpperCase() + trackingInfo.status.slice(1)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    {statusDescriptions[trackingInfo.status as keyof typeof statusDescriptions] ||
                      "Your order status has been updated."}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Order Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Order Date:</strong> {format(new Date(trackingInfo.createdAt), "PPP")}</p>
                      <p><strong>Last Updated:</strong> {format(new Date(trackingInfo.updatedAt), "PPP")}</p>
                    </div>
                  </div>
                  {trackingInfo.trackingNumber && (
                    <div>
                      <h4 className="font-semibold mb-2">Shipping Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Tracking Number:</strong> {trackingInfo.trackingNumber}</p>
                        {trackingInfo.shippingCarrier && (
                          <p><strong>Carrier:</strong> {trackingInfo.shippingCarrier}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trackingInfo.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-gray-600">by {item.author}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${parseFloat(item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Timeline items based on current status */}
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${['pending', 'confirmed', 'processing', 'shipped', 'delivered'].includes(trackingInfo.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    <div className="flex-1">
                      <p className="font-medium">Order Received</p>
                      <p className="text-sm text-gray-600">Your order has been placed successfully</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${['confirmed', 'processing', 'shipped', 'delivered'].includes(trackingInfo.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    <div className="flex-1">
                      <p className="font-medium">Order Confirmed</p>
                      <p className="text-sm text-gray-600">Your order has been confirmed and is being prepared</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${['processing', 'shipped', 'delivered'].includes(trackingInfo.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    <div className="flex-1">
                      <p className="font-medium">Processing</p>
                      <p className="text-sm text-gray-600">Your order is being processed and packaged</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${['shipped', 'delivered'].includes(trackingInfo.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    <div className="flex-1">
                      <p className="font-medium">Shipped</p>
                      <p className="text-sm text-gray-600">
                        Your order has been shipped
                        {trackingInfo.trackingNumber && ` (Tracking: ${trackingInfo.trackingNumber})`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${trackingInfo.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    <div className="flex-1">
                      <p className="font-medium">Delivered</p>
                      <p className="text-sm text-gray-600">Your order has been delivered successfully</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h4 className="font-semibold mb-2">Need Help?</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    If you have any questions about your order, please don't hesitate to contact us.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/contact">Contact Support</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Information */}
        {!trackingInfo && (
          <Card>
            <CardHeader>
              <CardTitle>How to Track Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-aqua text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Find Your Order ID</p>
                  <p className="text-sm text-gray-600">Check your order confirmation email for the order ID number.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-aqua text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Enter Your Email</p>
                  <p className="text-sm text-gray-600">Use the same email address you used when placing the order.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-aqua text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Track Your Package</p>
                  <p className="text-sm text-gray-600">Get real-time updates on your order status and shipping information.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}