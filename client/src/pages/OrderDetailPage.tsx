import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Package, Truck } from "lucide-react";

export default function OrderDetailPage() {
  const { id } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: [`/api/orders/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-aqua"></div>
            <p className="mt-4 text-secondary-black">Loading order details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-base-black mb-4">Order Not Found</h1>
            <p className="text-secondary-black">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-black mb-2">Order Details</h1>
          <p className="text-secondary-black">Order #{order.id}</p>
        </div>

        <div className="grid gap-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`${getStatusColor(order.status)} border`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <div className="mt-4 text-sm text-secondary-black">
                <p>Order placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
                {order.trackingNumber && (
                  <p>Tracking number: <span className="font-mono">{order.trackingNumber}</span></p>
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
              <div className="space-y-4">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-start p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base-black">{item.title}</h3>
                      <p className="text-sm text-secondary-black">by {item.author}</p>
                      <p className="text-sm text-secondary-black">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.price}</p>
                      <p className="text-sm text-secondary-black">
                        Total: ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Contact Details</h4>
                  <p className="text-sm text-secondary-black">{order.customerName}</p>
                  <p className="text-sm text-secondary-black">{order.customerEmail}</p>
                  <p className="text-sm text-secondary-black">{order.customerPhone}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Shipping Address</h4>
                  <div className="text-sm text-secondary-black">
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>${order.shipping}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${order.tax}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>${order.total}</span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-secondary-black">
                    Payment Method: {order.paymentMethod}
                  </p>
                  {order.paymentId && (
                    <p className="text-sm text-secondary-black">
                      Payment ID: <span className="font-mono">{order.paymentId}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}