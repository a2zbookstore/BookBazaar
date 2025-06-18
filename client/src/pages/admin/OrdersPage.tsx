import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Edit,
  FileText, 
  Download, 
  Printer,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";

interface Order {
  id: number;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: any;
  billingAddress: any;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  status: string;
  paymentStatus: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: any[];
}

export default function OrdersPage() {
  const [location] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [notes, setNotes] = useState("");
  
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'pending' || location.includes('pending')) {
      setStatusFilter('pending');
    }
  }, [location]);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: { 
      orderId: number; 
      status: string; 
      trackingNumber?: string; 
      shippingCarrier?: string; 
      notes?: string; 
    }) => {
      console.log('Updating order:', data);
      const response = await apiRequest("PUT", `/api/orders/${data.orderId}/status`, {
        status: data.status,
        trackingNumber: data.trackingNumber || "",
        shippingCarrier: data.shippingCarrier || "",
        notes: data.notes || "",
      });
      console.log('Update response:', response);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully with email notification sent.",
      });
      setIsDialogOpen(false);
      setSelectedOrderId(null);
      setNewStatus("");
      setTrackingNumber("");
      setShippingCarrier("none");
      setNotes("");
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast({
        title: "Error", 
        description: error?.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (order: Order) => {
    setSelectedOrderId(order.id);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || "");
    setShippingCarrier(order.shippingCarrier || "none");
    setNotes(order.notes || "");
    setIsDialogOpen(true);
  };

  const handleUpdateOrder = () => {
    if (!selectedOrderId || !newStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    updateOrderMutation.mutate({
      orderId: selectedOrderId,
      status: newStatus,
      trackingNumber,
      shippingCarrier: shippingCarrier === "none" ? "" : shippingCarrier,
      notes,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'refunded': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'processing': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'destructive';
      default: return 'secondary';
    }
  };

  if (authLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-aqua"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
        </div>
      </AdminLayout>
    );
  }

  const orders = (ordersData as any)?.orders || [];
  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter((order: Order) => order.status === statusFilter);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-base-black">Order Management</h2>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-aqua focus:border-transparent"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order: Order) => {
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <span className="font-semibold">Order #{order.id}</span>
                          </div>
                          <Badge variant={getStatusVariant(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <Badge variant="outline">{order.paymentStatus}</Badge>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p><strong>Customer:</strong> {order.customerName}</p>
                            <p><strong>Email:</strong> {order.customerEmail}</p>
                            <p><strong>Phone:</strong> {order.customerPhone}</p>
                          </div>
                          <div>
                            <p><strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}</p>
                            <p><strong>Order Date:</strong> {format(new Date(order.createdAt), "PPP")}</p>
                            {order.trackingNumber && (
                              <p><strong>Tracking:</strong> {order.trackingNumber}</p>
                            )}
                          </div>
                        </div>

                        {order.shippingCarrier && (
                          <p className="text-sm"><strong>Carrier:</strong> {order.shippingCarrier}</p>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(order)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Update Status
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Order Status Update Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Order Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrier">Shipping Carrier</Label>
                <Select value={shippingCarrier} onValueChange={setShippingCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Carrier</SelectItem>
                    <SelectItem value="FedEx">FedEx</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="DHL">DHL</SelectItem>
                    <SelectItem value="USPS">USPS</SelectItem>
                    <SelectItem value="India Post">India Post</SelectItem>
                    <SelectItem value="Blue Dart">Blue Dart</SelectItem>
                    <SelectItem value="Delhivery">Delhivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this order..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleUpdateOrder}
                  disabled={updateOrderMutation.isPending || !newStatus}
                  className="flex-1"
                >
                  {updateOrderMutation.isPending ? "Updating..." : "Update Order"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}