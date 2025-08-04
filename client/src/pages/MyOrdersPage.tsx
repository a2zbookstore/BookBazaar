import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { Package, Eye, FileDown, Home, Calendar, CreditCard, Mail } from "lucide-react";
import { Link } from "wouter";

interface Order {
  id: number;
  status: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
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

  // Guest email input for order lookup
  const [guestEmail, setGuestEmail] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/my-orders"],
    enabled: isAuthenticated,
  });
  
  // Guest order lookup functionality - only enabled after user searches
  const { data: guestOrders = [], isLoading: guestLoading, refetch: refetchGuestOrders } = useQuery<Order[]>({
    queryKey: ["/api/guest-orders", guestEmail],
    queryFn: async () => {
      if (!guestEmail) return [];
      const response = await fetch(`/api/guest-orders?email=${encodeURIComponent(guestEmail)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    },
    enabled: !isAuthenticated && hasSearched && guestEmail.length > 0,
  });

  const handleGuestLookup = () => {
    if (guestEmail) {
      setHasSearched(true);
      refetchGuestOrders();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-800 flex items-center justify-center gap-2">
                  <Package className="w-6 h-6" />
                  View Your Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    Enter your email address to view your order history
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button 
                      onClick={handleGuestLookup}
                      disabled={!guestEmail || guestLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {guestLoading ? "Searching..." : "View Orders"}
                    </Button>
                  </div>
                </div>
                
                {hasSearched && guestOrders.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Your Orders</h3>
                    {guestOrders.map((order) => (
                      <Card key={order.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">Order #{order.id}</p>
                              <p className="text-sm text-gray-600">
                                {formatDistanceToNow(new Date(order.createdAt))} ago
                              </p>
                              <p className="text-sm">
                                {order.items?.length || 0} item(s) - ${order.total}
                              </p>
                            </div>
                            <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                              {statusLabels[order.status as keyof typeof statusLabels]}
                            </Badge>
                          </div>
                          {order.trackingNumber && (
                            <p className="text-sm text-blue-600 mt-2">
                              Tracking: {order.trackingNumber}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {guestEmail && guestOrders.length === 0 && !guestLoading && (
                  <p className="text-center text-gray-500">
                    No orders found for this email address
                  </p>
                )}
                
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">
                    Have an account? Log in for full order management
                  </p>
                  <Link href="/login">
                    <Button variant="outline" className="bg-primary-aqua hover:bg-secondary-aqua text-white">
                      Go to Login
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
      console.log('Downloading invoice for order:', orderId, 'isAuthenticated:', isAuthenticated);
      
      // For authenticated users, no email parameter needed
      // For guest users, use the email from the form
      const emailParam = !isAuthenticated && guestEmail ? `?email=${encodeURIComponent(guestEmail)}` : '';
      const url = `/api/orders/${orderId}/invoice${emailParam}`;
      
      console.log('Invoice URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      console.log('Invoice response status:', response.status);
      
      if (response.ok) {
        const htmlContent = await response.text();
        console.log('Invoice HTML content length:', htmlContent.length);
        
        // Open in new tab for printing as PDF
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          
          // Add print button and auto-focus for user convenience
          newWindow.onload = () => {
            // Add print button to the page
            const printButton = newWindow.document.createElement('button');
            printButton.textContent = 'Print / Save as PDF';
            printButton.style.cssText = `
              position: fixed;
              top: 10px;
              right: 10px;
              z-index: 1000;
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 15px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            `;
            printButton.onclick = () => newWindow.print();
            newWindow.document.body.appendChild(printButton);
            
            // Auto-focus the window
            newWindow.focus();
          };
        }
      } else {
        console.error('Invoice request failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  return (
    <Layout>
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
                        {order.items && order.items.length > 0 ? order.items.map((item) => (
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
                        )) : (
                          <div className="text-center text-gray-500 py-4">
                            No items found for this order
                          </div>
                        )}
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
                          View Invoice
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
        
      {/* View Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status and Info */}
              <div className="flex flex-wrap gap-4 items-center">
                <Badge className={`${statusColors[selectedOrder.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'} px-3 py-1`}>
                  {statusLabels[selectedOrder.status as keyof typeof statusLabels] || selectedOrder.status}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Ordered {formatDistanceToNow(new Date(selectedOrder.createdAt), { addSuffix: true })}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard className="h-4 w-4" />
                  ${parseFloat(selectedOrder.total).toFixed(2)}
                </div>
              </div>
              
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-medium">Name:</span> {selectedOrder.customerName}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedOrder.customerEmail}
                    </div>
                    {selectedOrder.customerPhone && (
                      <div>
                        <span className="font-medium">Phone:</span> {selectedOrder.customerPhone}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {selectedOrder.shippingAddress ? (
                        <div className="space-y-1">
                          <div>{selectedOrder.shippingAddress.street || selectedOrder.shippingAddress.address}</div>
                          <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state || selectedOrder.shippingAddress.region}</div>
                          <div>{selectedOrder.shippingAddress.postalCode || selectedOrder.shippingAddress.zip} {selectedOrder.shippingAddress.country}</div>
                        </div>
                      ) : (
                        <div className="text-gray-500">No shipping address available</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        {item.book?.imageUrl ? (
                          <img
                            src={item.book.imageUrl}
                            alt={item.book.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 line-clamp-2">
                            {item.book?.title || 'Unknown Book'}
                          </h4>
                          <p className="text-sm text-gray-600">{item.book?.author || 'Unknown Author'}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-gray-500 py-4">
                        No items found for this order
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Tracking Information */}
              {selectedOrder.trackingNumber && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tracking Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Tracking Number:</span> {selectedOrder.trackingNumber}
                      </div>
                      {selectedOrder.shippingCarrier && (
                        <div>
                          <span className="font-medium">Shipping Carrier:</span> {selectedOrder.shippingCarrier}
                        </div>
                      )}
                      {selectedOrder.notes && (
                        <div>
                          <span className="font-medium">Notes:</span> {selectedOrder.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${parseFloat(selectedOrder.subtotal || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>${parseFloat(selectedOrder.shipping || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${parseFloat(selectedOrder.tax || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${parseFloat(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}