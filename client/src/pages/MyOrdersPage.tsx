import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Package, Eye, FileDown } from "lucide-react";
import { Link } from "wouter";

interface Order {
  id: number;
  status: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  items: Array<{
    id: number;
    quantity: number;
    price: string;
    book: {
      id: number;
      title: string;
      author: string;
      imageUrl?: string;
    };
  }>;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed", 
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function MyOrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/my-orders"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-gray-800">Login Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Please log in to view your order history.
            </p>
            <Link href="/login">
              <Button className="bg-primary-aqua hover:bg-secondary-aqua">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const downloadInvoice = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">View and track your order history</p>
          </div>

          {!orders || orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                <p className="text-gray-600 mb-6">
                  You haven't placed any orders yet. Start shopping to see your orders here.
                </p>
                <Link href="/catalog">
                  <Button className="bg-primary-aqua hover:bg-secondary-aqua">
                    Browse Books
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order: Order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-gray-900">
                          Order #{order.id}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Placed {formatDistanceToNow(new Date(order.createdAt))} ago
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${statusColors[order.status as keyof typeof statusColors]} font-medium`}>
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </Badge>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ${parseFloat(order.total).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            {item.book.imageUrl ? (
                              <img
                                src={item.book.imageUrl}
                                alt={item.book.title}
                                className="w-12 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 line-clamp-1">
                                {item.book.title}
                              </h4>
                              <p className="text-sm text-gray-600">{item.book.author}</p>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tracking Information */}
                      {order.trackingNumber && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-900">Tracking Information</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Tracking Number:</span>
                              <span className="ml-2 font-mono text-blue-800">{order.trackingNumber}</span>
                            </div>
                            {order.shippingCarrier && (
                              <div>
                                <span className="text-gray-600">Carrier:</span>
                                <span className="ml-2 text-blue-800">{order.shippingCarrier}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadInvoice(order.id)}
                          className="flex items-center gap-2"
                        >
                          <FileDown className="h-4 w-4" />
                          Download Invoice
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}