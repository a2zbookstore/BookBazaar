import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { Package, Eye, FileDown, Home, Calendar, CreditCard, Mail, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

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
  shippingAddress?: {
    street?: string;
    address?: string;
    city?: string;
    state?: string;
    region?: string;
    postalCode?: string;
    zip?: string;
    country?: string;
  };
  notes?: string;
  subtotal?: string;
  shipping?: string;
  tax?: string;
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
  processing: "bg-orange-100 text-orange-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-teal-100 text-teal-800",
};

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default function MyOrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const queryClient = useQueryClient();

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

  const cancelMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const body: Record<string, string> = {};
      if (!isAuthenticated && guestEmail) body.email = guestEmail;
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to cancel order");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Order Cancelled", description: "Your order has been successfully cancelled." });
      queryClient.invalidateQueries({ queryKey: ["/api/my-orders"] });
      setCancelOrderId(null);
      setSelectedOrder(null);
    },
    onError: (error: Error) => {
      toast({ title: "Cancellation Failed", description: error.message, variant: "destructive" });
      setCancelOrderId(null);
    },
  });

  const CANCELABLE_STATUSES = ["pending", "confirmed"];

  useEffect(() => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to access your orders.",
        variant: "destructive",
      });
      setLocation("/login?redirect=/");
      return;
    }
  }, [user]);

  if (!isAuthenticated) {
    return (
      <>
        <SEO
          title="My Orders"
          description="View and track your book orders at A2Z BOOKSHOP. Check order status, tracking information, and order history."
          url="https://a2zbookshop.com/my-orders"
          type="website"
          noindex
        />
        <div className="min-h-screen ">
          <div className="container-custom">
            <Breadcrumb items={[{ label: "My Orders" }]} />

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
                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="flex-1 rounded-lg"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              onClick={handleGuestLookup}
                              disabled={!guestEmail || guestLoading}
                              variant="outline"
                              className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white whitespace-nowrap rounded-full"
                            >
                              {guestLoading ? "Searching..." : "View Orders"}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {!guestEmail && (
                          <TooltipContent>
                            <p>Provide Email to View Orders</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
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
                    <Button variant="outline"
                      className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-full"
                    >
                      Go to Login
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      < >
        <div className="mt-8 min-h-screen">
          <div className="container-custom">
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
      </>
    );
  }

  const downloadInvoice = async (orderId: number) => {
    try {
      const emailParam = !isAuthenticated && guestEmail ? `?email=${encodeURIComponent(guestEmail)}` : '';
      const url = `/api/orders/${orderId}/invoice${emailParam}`;

      const response = await fetch(url, { credentials: 'include' });

      if (!response.ok) {
        toast({ title: "Failed to load invoice", description: "Please try again.", variant: "destructive" });
        return;
      }

      const html = await response.text();
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not open invoice.", variant: "destructive" });
    }
  };

  return (
    <>
      <SEO
        title="My Orders"
        description="View and track your book orders at A2Z BOOKSHOP. Check order status, tracking information, and order history."
        url="https://a2zbookshop.com/my-orders"
        type="website"
        noindex
      />
      <div className="min-h-screen ">
        <div className="container-custom">
          <Breadcrumb items={[{ label: "My Orders" }]} />

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
                  <Button className="bg-primary-aqua hover:bg-secondary-aqua rounded-full">
                    Browse Books
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order: Order) => (
                <Card key={order.id} className="overflow-hidden border border-gray-200 shadow-md rounded-2xl">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* Left: Order ID + Date */}
                      <div className="flex items-center gap-3">
                        {/* <div className="bg-white rounded-xl p-2 shadow-sm">
                          <Package className="h-5 w-5 text-primary-aqua" />
                        </div> */}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Order</p>
                            <p className="text-base font-bold text-gray-900">#{order.id}</p>
                            <Badge className={`${statusColors[order.status as keyof typeof statusColors]} px-3 py-1 text-xs font-semibold rounded-full ml-2`}>
                              {statusLabels[order.status as keyof typeof statusLabels]}
                            </Badge>
                          </div>

                          <p className="text-xs text-gray-500 mt-0.5">
                            Placed {formatDistanceToNow(new Date(order.createdAt))} ago
                          </p>

                        </div>
                      </div>

                      {/* Center: Status Badge */}
                      {/* <div className="flex flex-col items-center gap-1">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Status</p>
                        <Badge className={`${statusColors[order.status as keyof typeof statusColors]} px-3 py-1 text-xs font-semibold rounded-full`}>
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </Badge>
                      </div> */}

                      {/* Right: Total + Actions */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1.5 rounded-full border-gray-300 hover:bg-white hover:border-primary-aqua hover:text-primary-aqua transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadInvoice(order.id)}
                          className="flex items-center gap-1.5 rounded-full border-gray-300 hover:bg-white hover:border-primary-aqua hover:text-primary-aqua transition-colors"
                        >
                          <FileDown className="h-4 w-4" />
                          Invoice
                        </Button>
                        {CANCELABLE_STATUSES.includes(order.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelOrderId(order.id)}
                            className="flex items-center gap-1.5 rounded-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Section Label */}
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Items Ordered</p>

                      {/* Order Items */}
                      <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                        {order.items && order.items.length > 0 ? order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                            {item.book.imageUrl ? (
                              <img
                                src={item.book.imageUrl}
                                alt={item.book.title}
                                className="w-12 h-16 object-cover rounded-lg shadow-sm flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 line-clamp-1 text-sm">
                                {item.book.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">{item.book.author}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold text-gray-900">
                                ${(item.quantity * parseFloat(item.price)).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                              </p>
                            </div>

                          </div>
                        )) : (
                          <div className="text-center text-gray-400 py-6 text-sm">
                            No items found for this order
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end text-right mr-2">
                        <p className="text-xl font-bold text-gray-900">${parseFloat(order.total).toFixed(2)}</p>
                      </div>
                      {/* Tracking Information */}
                      {order.trackingNumber && (
                        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                         
                          <div className="flex-1">
                            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Tracking</p>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                              <span className="text-blue-900 font-mono font-medium">{order.trackingNumber}</span>
                              {order.shippingCarrier && (
                                <span className="text-blue-700">via <span className="font-semibold">{order.shippingCarrier}</span></span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

            </div>
          )}
        </div>
      </div>


      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelOrderId !== null} onOpenChange={(open) => { if (!open) setCancelOrderId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order #{cancelOrderId}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
              Once cancelled, you will need to place a new order if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelOrderId !== null && cancelMutation.mutate(cancelOrderId)}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">

          {/* Dialog Hero Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 text-white sticky top-0 z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">Order Details</p>
                <p className="text-xl font-bold">#{selectedOrder?.id}</p>
              </div>
              <div className="flex items-center gap-4">
                {selectedOrder && (
                  <Badge className={`${statusColors[selectedOrder.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'} px-3 py-1 text-xs font-semibold rounded-full`}>
                    {statusLabels[selectedOrder.status as keyof typeof statusLabels] || selectedOrder.status}
                  </Badge>
                )}
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">{"Total" + "  "}</p>
                  <p className="text-2xl font-bold">${parseFloat(selectedOrder?.total || '0').toFixed(2)}</p>
                </div>
              </div>
            </div>
            {selectedOrder && (
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-300">
                <span>Ordered {formatDistanceToNow(new Date(selectedOrder.createdAt), { addSuffix: true })}</span>
                <span>{selectedOrder.paymentMethod || 'Online Payment'}</span>
              </div>
            )}
          </div>

          {selectedOrder && (
            <div className="p-6 space-y-5">

              {/* Cancel button inside dialog */}
              {CANCELABLE_STATUSES.includes(selectedOrder.status) && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setCancelOrderId(selectedOrder.id); }}
                    className="flex items-center gap-1.5 rounded-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Order
                  </Button>
                </div>
              )}

              {/* Customer + Shipping grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Information */}
                <div className="rounded-xl border border-gray-200">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Customer</p>
                  </div>
                  <div className="px-4 py-3 space-y-2.5 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-14 flex-shrink-0">Name</span>
                      <span className="font-medium text-gray-900">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 w-14 flex-shrink-0">Email</span>
                      <span className="font-medium text-gray-900 break-all">{selectedOrder.customerEmail}</span>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400 w-14 flex-shrink-0">Phone</span>
                        <span className="font-medium text-gray-900">{selectedOrder.customerPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="rounded-xl border border-gray-200">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Ship To</p>
                  </div>
                  <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed">
                    {selectedOrder.shippingAddress ? (
                      <div className="space-y-0.5">
                        <p className="font-medium text-gray-900">{selectedOrder.shippingAddress.street || selectedOrder.shippingAddress.address}</p>
                        <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state || selectedOrder.shippingAddress.region}</p>
                        <p>{selectedOrder.shippingAddress.postalCode || selectedOrder.shippingAddress.zip} — {selectedOrder.shippingAddress.country}</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">No shipping address available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="rounded-xl border border-gray-200">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Items Ordered</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                      {item.book?.imageUrl ? (
                        <img
                          src={item.book.imageUrl}
                          alt={item.book.title}
                          className="w-12 h-16 object-cover rounded-lg shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug">
                          {item.book?.title || 'Unknown Book'}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{item.book?.author || 'Unknown Author'}</p>
                        <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-gray-400 py-8 text-sm italic">
                      No items found for this order
                    </div>
                  )}
                </div>
              </div>

              {/* Tracking Information */}
              {selectedOrder.trackingNumber && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">Tracking</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Number: </span>
                      <span className="font-mono font-semibold text-blue-800">{selectedOrder.trackingNumber}</span>
                    </div>
                    {selectedOrder.shippingCarrier && (
                      <div>
                        <span className="text-gray-500">Carrier: </span>
                        <span className="font-semibold text-blue-800">{selectedOrder.shippingCarrier}</span>
                      </div>
                    )}
                  </div>
                  {selectedOrder.notes && (
                    <p className="text-gray-500 text-xs italic mt-2">{selectedOrder.notes}</p>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="rounded-xl border border-gray-200">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Order Summary</p>
                </div>
                <div className="px-4 py-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${parseFloat(selectedOrder.subtotal || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>${parseFloat(selectedOrder.shipping || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${parseFloat(selectedOrder.tax || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-3 mt-2 text-base">
                    <span>{"Total" + "  "}</span>
                    <span className="text-lg">${parseFloat(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </ >
  );
}

