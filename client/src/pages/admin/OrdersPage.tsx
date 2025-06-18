import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Package, Truck, CheckCircle, XCircle, Clock, AlertCircle, Download, Printer, Edit, FileText } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

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
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  orderId: number;
  bookId: number;
  quantity: number;
  price: string;
  title: string;
  author: string;
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

export default function OrdersPage() {
  const { admin, isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Auto-set filter to pending if coming from dashboard
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'pending' || location.includes('pending')) {
      setStatusFilter('pending');
    }
  }, [location]);

  // Form states for order update
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [customCarrier, setCustomCarrier] = useState("");
  const [notes, setNotes] = useState("");

  // Invoice functions
  const generateInvoiceHTML = (order: Order) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - Order #${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #dc2626; padding-bottom: 20px; }
          .company-logo { font-size: 32px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .company-logo .red { color: #dc2626; }
          .invoice-title { font-size: 24px; color: #666; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .invoice-details, .company-details { width: 48%; }
          .company-details { text-align: right; }
          .customer-info { margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f2f2f2; font-weight: bold; }
          .items-table tr:nth-child(even) { background-color: #f9f9f9; }
          .totals { text-align: right; margin-top: 20px; }
          .totals table { margin-left: auto; border-collapse: collapse; }
          .totals td { padding: 8px 15px; }
          .total-row { border-top: 2px solid #333; font-weight: bold; font-size: 18px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          .status-badge { display: inline-block; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
          .status-confirmed { background: #d1ecf1; color: #0c5460; }
          .address-section { margin: 15px 0; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">A<span class="red">2</span>Z BOOKSHOP</div>
          <div class="invoice-title">INVOICE</div>
        </div>
        
        <div class="invoice-info">
          <div class="invoice-details">
            <strong>Invoice #:</strong> A2Z-${order.id.toString().padStart(6, '0')}<br>
            <strong>Order #:</strong> ${order.id}<br>
            <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br>
            <strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span><br>
            <strong>Payment:</strong> ${order.paymentStatus.toUpperCase()}
          </div>
          <div class="company-details">
            <strong>A2Z BOOKSHOP</strong><br>
            Online Bookstore<br>
            Email: support@a2zbookshop.com<br>
            Phone: +1 (555) 123-4567<br>
            Website: www.a2zbookshop.com
          </div>
        </div>
        
        <div class="customer-info">
          <h3 style="margin-top: 0; color: #dc2626;">Bill To:</h3>
          <strong>${order.customerName}</strong><br>
          Email: ${order.customerEmail}<br>
          Phone: ${order.customerPhone || 'N/A'}
          
          <div class="address-section">
            <strong>Shipping Address:</strong><br>
            ${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
            ${order.shippingAddress.country}
          </div>
          
          ${order.trackingNumber ? `
          <div class="address-section">
            <strong>Tracking Information:</strong><br>
            Carrier: ${order.shippingCarrier || 'N/A'}<br>
            Tracking #: ${order.trackingNumber}
          </div>
          ` : ''}
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40%;">Book Title</th>
              <th style="width: 25%;">Author</th>
              <th style="width: 10%;">Qty</th>
              <th style="width: 12%;">Unit Price</th>
              <th style="width: 13%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map((item) => `
              <tr>
                <td>${item.title}</td>
                <td>${item.author}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">$${parseFloat(item.price).toFixed(2)}</td>
                <td style="text-align: right;">$${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <table>
            <tr><td>Subtotal:</td><td style="text-align: right;">$${parseFloat(order.subtotal).toFixed(2)}</td></tr>
            <tr><td>Shipping:</td><td style="text-align: right;">$${parseFloat(order.shipping).toFixed(2)}</td></tr>
            <tr><td>Tax:</td><td style="text-align: right;">$${parseFloat(order.tax).toFixed(2)}</td></tr>
            <tr class="total-row"><td>Total:</td><td style="text-align: right;">$${parseFloat(order.total).toFixed(2)}</td></tr>
          </table>
        </div>
        
        ${order.notes ? `
        <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
          <strong>Notes:</strong><br>
          ${order.notes}
        </div>
        ` : ''}
        
        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>For questions about this invoice, contact us at support@a2zbookshop.com</p>
          <p>A2Z BOOKSHOP - Your trusted online bookstore</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadInvoice = (order: Order) => {
    const invoiceContent = generateInvoiceHTML(order);
    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-A2Z-${order.id.toString().padStart(6, '0')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Invoice Downloaded",
      description: `Invoice for Order #${order.id} has been downloaded.`,
    });
  };

  const handlePrintInvoice = (order: Order) => {
    const invoiceContent = generateInvoiceHTML(order);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
    
    toast({
      title: "Invoice Opened for Printing",
      description: `Invoice for Order #${order.id} opened in new window.`,
    });
  };

  const handleViewInvoice = (order: Order) => {
    const invoiceContent = generateInvoiceHTML(order);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(invoiceContent);
      newWindow.document.close();
    }
  };

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
      console.log('Order update data:', data);
      try {
        const response = await apiRequest("PUT", `/api/orders/${data.orderId}/status`, {
          status: data.status,
          trackingNumber: data.trackingNumber || "",
          shippingCarrier: data.shippingCarrier || "",
          notes: data.notes || "",
        });
        console.log('Order update response:', response);
        return response;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Order update success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully. Email notification sent.",
      });
      setSelectedOrder(null);
      setNewStatus("");
      setTrackingNumber("");
      setShippingCarrier("");
      setCustomCarrier("");
      setNotes("");
    },
    onError: (error: any) => {
      console.error('Order update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleUpdateOrder = () => {
    if (!selectedOrder || !newStatus) {
      console.error('Missing required fields:', { selectedOrder: !!selectedOrder, newStatus });
      return;
    }

    // Handle shipping carrier: use custom carrier if "other" is selected
    let carrierValue = "";
    if (shippingCarrier === "none") {
      carrierValue = "";
    } else if (shippingCarrier === "other") {
      carrierValue = customCarrier;
    } else {
      carrierValue = shippingCarrier;
    }

    const updateData = {
      orderId: selectedOrder.id,
      status: newStatus,
      trackingNumber: trackingNumber || undefined,
      shippingCarrier: carrierValue || undefined,
      notes: notes || undefined,
    };

    console.log('Attempting to update order with data:', updateData);
    updateOrderMutation.mutate(updateData);
  };

  // Set form values when order is selected
  useEffect(() => {
    if (selectedOrder) {
      setNewStatus(selectedOrder.status);
      setTrackingNumber(selectedOrder.trackingNumber || "");
      
      // Handle shipping carrier initialization
      const carrier = selectedOrder.shippingCarrier || "";
      const predefinedCarriers = ["FedEx", "UPS", "DHL", "USPS", "India Post", "Blue Dart", "Delhivery"];
      
      if (!carrier) {
        setShippingCarrier("none");
        setCustomCarrier("");
      } else if (predefinedCarriers.includes(carrier)) {
        setShippingCarrier(carrier);
        setCustomCarrier("");
      } else {
        setShippingCarrier("other");
        setCustomCarrier(carrier);
      }
      
      setNotes(selectedOrder.notes || "");
    }
  }, [selectedOrder]);

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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-gray-500">
                {statusFilter === "all" ? "No orders have been placed yet." : `No ${statusFilter} orders found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order: Order) => {
              const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || AlertCircle;
              
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-base-black">
                            Order #{order.id}
                          </h3>
                          <Badge className={statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
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
                        {/* Quick Invoice Actions */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(order)}
                          className="flex items-center gap-1"
                          title="View Invoice"
                        >
                          <FileText className="w-3 h-3" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(order)}
                          className="flex items-center gap-1"
                          title="Download Invoice"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintInvoice(order)}
                          className="flex items-center gap-1"
                          title="Print Invoice"
                        >
                          <Printer className="w-3 h-3" />
                          Print
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Manage
                            </Button>
                          </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Manage Order #{selectedOrder?.id}</DialogTitle>
                          </DialogHeader>
                          
                          {selectedOrder && (
                            <div className="space-y-6">
                              {/* Customer Information */}
                              <div>
                                <h4 className="font-semibold mb-2">Customer Information</h4>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                                    <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                                  </div>
                                  <div>
                                    <p><strong>Order Date:</strong> {format(new Date(selectedOrder.createdAt), "PPP")}</p>
                                    <p><strong>Total:</strong> ${parseFloat(selectedOrder.total).toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              {/* Invoice Actions */}
                              <div>
                                <h4 className="font-semibold mb-3">Invoice Actions</h4>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewInvoice(selectedOrder)}
                                    className="flex items-center gap-2"
                                  >
                                    <FileText className="w-4 h-4" />
                                    View Invoice
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadInvoice(selectedOrder)}
                                    className="flex items-center gap-2"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download Invoice
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePrintInvoice(selectedOrder)}
                                    className="flex items-center gap-2"
                                  >
                                    <Printer className="w-4 h-4" />
                                    Print Invoice
                                  </Button>
                                </div>
                              </div>

                              <Separator />

                              {/* Order Items */}
                              {selectedOrder.items && selectedOrder.items.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {selectedOrder.items.map((item) => (
                                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <div>
                                          <p className="font-medium">{item.title}</p>
                                          <p className="text-sm text-gray-600">by {item.author}</p>
                                        </div>
                                        <div className="text-right">
                                          <p>Qty: {item.quantity}</p>
                                          <p>${parseFloat(item.price).toFixed(2)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <Separator />

                              {/* Update Order Status */}
                              <div className="space-y-4">
                                <h4 className="font-semibold">Update Order Status</h4>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
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
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="FedEx">FedEx</SelectItem>
                                        <SelectItem value="UPS">UPS</SelectItem>
                                        <SelectItem value="DHL">DHL</SelectItem>
                                        <SelectItem value="USPS">USPS</SelectItem>
                                        <SelectItem value="India Post">India Post</SelectItem>
                                        <SelectItem value="Blue Dart">Blue Dart</SelectItem>
                                        <SelectItem value="Delhivery">Delhivery</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* Custom carrier field - shows when "other" is selected */}
                                {shippingCarrier === "other" && (
                                  <div className="space-y-2">
                                    <Label htmlFor="customCarrier">Custom Carrier Name</Label>
                                    <Input
                                      id="customCarrier"
                                      value={customCarrier}
                                      onChange={(e) => setCustomCarrier(e.target.value)}
                                      placeholder="Enter carrier name"
                                    />
                                  </div>
                                )}

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

                                <Button 
                                  onClick={handleUpdateOrder}
                                  disabled={updateOrderMutation.isPending}
                                  className="w-full"
                                >
                                  {updateOrderMutation.isPending ? "Updating..." : "Update Order"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}