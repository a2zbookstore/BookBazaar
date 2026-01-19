import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  AlertCircle,
  Copy
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
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  const [selectedBillOrderId, setSelectedBillOrderId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [notes, setNotes] = useState("");
  
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

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

  const { data: selectedOrderDetails, isLoading: isLoadingOrderDetails } = useQuery({
    queryKey: [`/api/orders/${selectedBillOrderId}`],
    enabled: isAuthenticated && selectedBillOrderId !== null,
  });

  useEffect(() => {
    if (selectedOrderDetails) {
      console.log("Selected order details data:", selectedOrderDetails);
    }
  }, [selectedOrderDetails]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "pending"] });
      toast({
        title: "Success",
        description: "Order status updated successfully with email notification sent.",
      });
      setIsDialogOpen(false);
      setSelectedOrderId(null);
      setNewStatus("");
      setTrackingNumber("");
      setShippingCarrier("no-carrier");
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
    // Handle shipping carrier initialization properly
    const carrier = order.shippingCarrier || "";
    if (carrier === "" || carrier === null) {
      setShippingCarrier("no-carrier");
    } else {
      setShippingCarrier(carrier);
    }
    setNotes(order.notes || "");
    setIsDialogOpen(true);
  };

  const handleOrderNumberClick = (orderId: number) => {
    setSelectedBillOrderId(orderId);
    setIsBillDialogOpen(true);
  };

  const handleDownloadBill = () => {
    if (selectedOrderDetails) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(generateBillHTML(selectedOrderDetails));
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const generateBillHTML = (order: any) => {
    const items = order.items || [];
    const subtotal = parseFloat(order.subtotal || '0');
    const shipping = parseFloat(order.shipping || '0');
    const tax = parseFloat(order.tax || '0');
    const total = parseFloat(order.total || '0');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - Order #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #d32f2f; }
            .invoice-details { margin: 20px 0; }
            .customer-details { margin: 20px 0; }
            .order-items { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">A2Z BOOKSHOP</div>
            <p>International Online Bookstore</p>
            <p>Email: orders@a2zbookshop.com | Website: https://a2zbookshop.com</p>
          </div>
          
          <div class="invoice-details">
            <h2>INVOICE</h2>
            <p><strong>Order Number:</strong> #${order.id}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
            <p><strong>Order Status:</strong> ${order.status}</p>
            ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
          </div>
          
          <div class="customer-details">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${order.customerName}</p>
            <p><strong>Email:</strong> ${order.customerEmail}</p>
            ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
            
            <h4>Shipping Address</h4>
            <p>
              ${order.shippingAddress?.street || order.shippingAddress?.address || ''}<br>
              ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zip || order.shippingAddress?.postalCode || ''}<br>
              ${order.shippingAddress?.country || ''}
            </p>
          </div>
          
          <div class="order-items">
            <h3>Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                  <tr>
                    <td>${item.title}</td>
                    <td>${item.author}</td>
                    <td>$${parseFloat(item.price).toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>$${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <table style="margin-top: 20px;">
              <tr>
                <td style="border: none; text-align: right; padding-right: 10px;"><strong>Subtotal:</strong></td>
                <td style="border: none; text-align: right;">$${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="border: none; text-align: right; padding-right: 10px;"><strong>Shipping:</strong></td>
                <td style="border: none; text-align: right;">$${shipping.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="border: none; text-align: right; padding-right: 10px;"><strong>Tax:</strong></td>
                <td style="border: none; text-align: right;">$${tax.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td style="border: none; text-align: right; padding-right: 10px;"><strong>Total:</strong></td>
                <td style="border: none; text-align: right;"><strong>$${total.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>A2Z BOOKSHOP - Your Global Book Destination</p>
          </div>
        </body>
      </html>
    `;
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

    // Handle shipping carrier value properly
    let finalShippingCarrier = "";
    if (shippingCarrier && shippingCarrier !== "no-carrier") {
      finalShippingCarrier = shippingCarrier;
    }

    updateOrderMutation.mutate({
      orderId: selectedOrderId,
      status: newStatus,
      trackingNumber: trackingNumber || "",
      shippingCarrier: finalShippingCarrier,
      notes: notes || "",
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-aqua"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
      </div>
    );
  }

  const orders = (ordersData as any)?.orders || [];
  const filteredOrders = statusFilter === "all" 
    ? orders 
    : orders.filter((order: Order) => order.status === statusFilter);

  return (
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
                            <button 
                              onClick={() => handleOrderNumberClick(order.id)}
                              className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              Order #{order.id}
                            </button>
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
                <select
                  id="carrier"
                  value={shippingCarrier === "" ? "no-carrier" : shippingCarrier}
                  onChange={(e) => setShippingCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-aqua focus:border-transparent"
                >
                  <option value="no-carrier">No Carrier</option>
                  <option value="FedEx">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="DHL">DHL</option>
                  <option value="USPS">USPS</option>
                  <option value="India Post">India Post</option>
                  <option value="Blue Dart">Blue Dart</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="Other">Other</option>
                </select>
                {shippingCarrier === "Other" && (
                  <Input
                    placeholder="Enter custom carrier name"
                    value={shippingCarrier}
                    onChange={(e) => setShippingCarrier(e.target.value)}
                    className="mt-2"
                  />
                )}
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

        {/* Bill Details Dialog */}
        <Dialog open={isBillDialogOpen} onOpenChange={setIsBillDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Bill - Order #{selectedBillOrderId}</DialogTitle>
            </DialogHeader>
            
            {isLoadingOrderDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : selectedOrderDetails ? (
              <div className="space-y-6">
                {/* Order Overview */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-semibold">
                        {selectedOrderDetails.createdAt 
                          ? format(new Date(selectedOrderDetails.createdAt), 'MMM dd, yyyy')
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge variant={getStatusVariant(selectedOrderDetails.status || 'pending')}>
                        {selectedOrderDetails.status 
                          ? selectedOrderDetails.status.charAt(0).toUpperCase() + selectedOrderDetails.status.slice(1)
                          : 'Pending'
                        }
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment</p>
                      <Badge variant="outline">{selectedOrderDetails.paymentStatus || 'N/A'}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold text-lg">
                        ${selectedOrderDetails.total 
                          ? parseFloat(selectedOrderDetails.total).toFixed(2) 
                          : '0.00'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Customer Information</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const customerInfo = [
                            `Name: ${selectedOrderDetails.customerName || 'N/A'}`,
                            `Email: ${selectedOrderDetails.customerEmail || 'N/A'}`,
                            selectedOrderDetails.customerPhone ? `Phone: ${selectedOrderDetails.customerPhone}` : '',
                          ].filter(Boolean).join('\n');
                          copyToClipboard(customerInfo, "Customer information");
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p><strong>Name:</strong> {selectedOrderDetails.customerName || 'N/A'}</p>
                        {selectedOrderDetails.customerName && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(selectedOrderDetails.customerName, "Customer name")}
                            className="h-6 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p><strong>Email:</strong> {selectedOrderDetails.customerEmail || 'N/A'}</p>
                        {selectedOrderDetails.customerEmail && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(selectedOrderDetails.customerEmail, "Email")}
                            className="h-6 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      {selectedOrderDetails.customerPhone && (
                        <div className="flex items-center justify-between">
                          <p><strong>Phone:</strong> {selectedOrderDetails.customerPhone}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(selectedOrderDetails.customerPhone, "Phone number")}
                            className="h-6 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Shipping Address</h3>
                      {selectedOrderDetails.shippingAddress && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const address = [
                              selectedOrderDetails.shippingAddress?.street || selectedOrderDetails.shippingAddress?.address,
                              `${selectedOrderDetails.shippingAddress?.city || ''}, ${selectedOrderDetails.shippingAddress?.state || ''} ${selectedOrderDetails.shippingAddress?.zip || selectedOrderDetails.shippingAddress?.postalCode || ''}`,
                              selectedOrderDetails.shippingAddress?.country
                            ].filter(Boolean).join('\n');
                            copyToClipboard(address, "Shipping address");
                          }}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="text-sm">
                      <p>{selectedOrderDetails.shippingAddress?.street || selectedOrderDetails.shippingAddress?.address || 'N/A'}</p>
                      <p>
                        {selectedOrderDetails.shippingAddress?.city || 'N/A'}, {selectedOrderDetails.shippingAddress?.state || 'N/A'} {selectedOrderDetails.shippingAddress?.zip || selectedOrderDetails.shippingAddress?.postalCode || 'N/A'}
                      </p>
                      <p>{selectedOrderDetails.shippingAddress?.country || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left">Book</th>
                          <th className="px-4 py-3 text-left">Author</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-right">Quantity</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrderDetails.items?.map((item: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-3">{item.title || item.book?.title || 'N/A'}</td>
                            <td className="px-4 py-3">{item.author || item.book?.author || 'N/A'}</td>
                            <td className="px-4 py-3 text-right">
                              ${item.price ? parseFloat(item.price).toFixed(2) : item.book?.price ? parseFloat(item.book.price).toFixed(2) : '0.00'}
                            </td>
                            <td className="px-4 py-3 text-right">{item.quantity || 0}</td>
                            <td className="px-4 py-3 text-right">
                              ${item.price && item.quantity 
                                ? (parseFloat(item.price) * item.quantity).toFixed(2) 
                                : item.book?.price && item.quantity 
                                ? (parseFloat(item.book.price) * item.quantity).toFixed(2) 
                                : '0.00'
                              }
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={5} className="px-4 py-3 text-center text-gray-500">No items found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${selectedOrderDetails.subtotal ? parseFloat(selectedOrderDetails.subtotal).toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>${selectedOrderDetails.shipping ? parseFloat(selectedOrderDetails.shipping).toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${selectedOrderDetails.tax ? parseFloat(selectedOrderDetails.tax).toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>${selectedOrderDetails.total ? parseFloat(selectedOrderDetails.total).toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleDownloadBill} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Bill
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsBillDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Order details not found.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }