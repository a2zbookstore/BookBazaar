import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Package, Truck, CheckCircle, X, Search } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Order } from "@/types";

interface OrdersResponse {
  orders: Order[];
  total: number;
}

export default function OrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const itemsPerPage = 20;

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (statusFilter !== "all") queryParams.set('status', statusFilter);
  queryParams.set('limit', itemsPerPage.toString());
  queryParams.set('offset', ((currentPage - 1) * itemsPerPage).toString());

  const { data: ordersResponse, isLoading } = useQuery<OrdersResponse>({
    queryKey: [`/api/orders?${queryParams.toString()}`],
  });

  const orders = ordersResponse?.orders || [];
  const totalOrders = ordersResponse?.total || 0;
  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleViewOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
      });
      if (response.ok) {
        const orderData = await response.json();
        setSelectedOrder(orderData);
        setIsOrderDialogOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Package className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <X className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const statusCounts = {
    all: totalOrders,
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bookerly font-bold text-base-black">Order Management</h1>
          <p className="text-secondary-black">Track and manage customer orders.</p>
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
            <TabsTrigger value="processing">Processing ({statusCounts.processing})</TabsTrigger>
            <TabsTrigger value="shipped">Shipped ({statusCounts.shipped})</TabsTrigger>
            <TabsTrigger value="delivered">Delivered ({statusCounts.delivered})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({statusCounts.cancelled})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders by ID, customer name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-4 p-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-4 p-4 border rounded">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="divide-y">
                {orders
                  .filter(order => 
                    !search || 
                    order.id.toString().includes(search) ||
                    order.customerName.toLowerCase().includes(search.toLowerCase()) ||
                    order.customerEmail.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((order) => (
                  <div key={order.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-semibold text-base-black">
                              Order #{order.id}
                            </h3>
                            <p className="text-sm text-secondary-black">
                              {order.customerName} • {order.customerEmail}
                            </p>
                            <p className="text-xs text-tertiary-black">
                              {new Date(order.createdAt).toLocaleDateString()} at{" "}
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-primary-aqua">
                            €{parseFloat(order.total).toFixed(2)}
                          </p>
                          <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>

                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, "processing")}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Process
                            </Button>
                          )}

                          {order.status === "processing" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, "shipped")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Ship
                            </Button>
                          )}

                          {order.status === "shipped" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, "delivered")}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-base-black mb-2">No orders found</h3>
                <p className="text-secondary-black">
                  {search ? "No orders match your search criteria" : "No orders have been placed yet"}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center p-6 border-t">
                <nav className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "bg-primary-aqua hover:bg-secondary-aqua" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </nav>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - #{selectedOrder?.id}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-base-black mb-2">Customer Information</h4>
                    <p className="text-sm"><strong>Name:</strong> {selectedOrder.customerName}</p>
                    <p className="text-sm"><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                    {selectedOrder.customerPhone && (
                      <p className="text-sm"><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-base-black mb-2">Order Information</h4>
                    <p className="text-sm"><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm">
                      <strong>Status:</strong>{" "}
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </p>
                    {selectedOrder.trackingNumber && (
                      <p className="text-sm"><strong>Tracking:</strong> {selectedOrder.trackingNumber}</p>
                    )}
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-base-black mb-2">Shipping Address</h4>
                    <div className="text-sm space-y-1">
                      <p>{selectedOrder.shippingAddress.street}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                      <p>{selectedOrder.shippingAddress.zip}</p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-base-black mb-2">Billing Address</h4>
                    <div className="text-sm space-y-1">
                      <p>{selectedOrder.billingAddress.street}</p>
                      <p>{selectedOrder.billingAddress.city}, {selectedOrder.billingAddress.state}</p>
                      <p>{selectedOrder.billingAddress.zip}</p>
                      <p>{selectedOrder.billingAddress.country}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold text-base-black mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-secondary-black">by {item.author}</p>
                          <p className="text-sm text-tertiary-black">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{parseFloat(item.price).toFixed(2)}</p>
                          <p className="text-sm text-secondary-black">
                            Total: €{(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>€{parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>€{parseFloat(selectedOrder.shipping).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>€{parseFloat(selectedOrder.tax).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-primary-aqua">€{parseFloat(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-base-black mb-2">Update Status</h4>
                  <div className="flex gap-2">
                    {selectedOrder.status === "pending" && (
                      <Button
                        onClick={() => {
                          handleStatusUpdate(selectedOrder.id, "processing");
                          setIsOrderDialogOpen(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Mark as Processing
                      </Button>
                    )}
                    {selectedOrder.status === "processing" && (
                      <Button
                        onClick={() => {
                          handleStatusUpdate(selectedOrder.id, "shipped");
                          setIsOrderDialogOpen(false);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark as Shipped
                      </Button>
                    )}
                    {selectedOrder.status === "shipped" && (
                      <Button
                        onClick={() => {
                          handleStatusUpdate(selectedOrder.id, "delivered");
                          setIsOrderDialogOpen(false);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Mark as Delivered
                      </Button>
                    )}
                    {(selectedOrder.status === "pending" || selectedOrder.status === "processing") && (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleStatusUpdate(selectedOrder.id, "cancelled");
                          setIsOrderDialogOpen(false);
                        }}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
