import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTitle
} from "@/components/ui/dialog";
import {
  Edit, Download, Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  MapPin,
  CreditCard,
  User,
  Mail,
  Phone,
  FileText,
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
  const [newStatus, setNewStatus] = useState<string | undefined>(undefined);
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

  const { data: selectedOrderDetails, isLoading: isLoadingOrderDetails } = useQuery<Order>({
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
      setNewStatus(undefined);
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
    if (!selectedOrderId || !newStatus || newStatus === "") {
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

  const statusColors: Record<string, string> = {
    pending:    "bg-yellow-100 text-yellow-800",
    confirmed:  "bg-blue-100   text-blue-800",
    processing: "bg-orange-100 text-orange-800",
    shipped:    "bg-purple-100 text-purple-800",
    delivered:  "bg-green-100  text-green-800",
    cancelled:  "bg-red-100    text-red-800",
    refunded:   "bg-orange-100   text-orange-800",
  };
  const getStatusColor = (status: string) => statusColors[status] ?? "bg-gray-100 text-gray-800";

  const paymentStatusColors: Record<string, string> = {
    paid:       "bg-green-100  text-green-800",
    pending:    "bg-yellow-100 text-yellow-800",
    failed:     "bg-red-100    text-red-800",
    refunded:   "bg-teal-100   text-teal-800",
    partially_refunded: "bg-cyan-100 text-cyan-800",
  };
  const getPaymentColor = (ps: string) => paymentStatusColors[ps?.toLowerCase()] ?? "bg-gray-100 text-gray-800";

  if (authLoading || isLoading || (isAuthenticated && ordersData === undefined)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
          <ShoppingCart className="absolute inset-0 m-auto h-6 w-6 text-teal-500" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading orders…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <XCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-red-600 font-semibold text-lg">Access Denied</p>
          <p className="text-gray-500 text-sm">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const orders = (ordersData as any)?.orders || [];
  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter((order: Order) => order.status === statusFilter);

  // Quick stats
  const totalRevenue = orders.reduce((s: number, o: Order) => s + parseFloat(o.total || "0"), 0);
  const pendingCount = orders.filter((o: Order) => o.status === "pending").length;
  const deliveredCount = orders.filter((o: Order) => o.status === "delivered").length;

  const STATUS_TABS = [
    { value: "all",        label: "All",        color: "bg-gray-600" },
    { value: "pending",    label: "Pending",    color: "bg-amber-500" },
    { value: "confirmed",  label: "Confirmed",  color: "bg-blue-500" },
    { value: "processing", label: "Processing", color: "bg-orange-500" },
    { value: "shipped",    label: "Shipped",    color: "bg-violet-500" },
    { value: "delivered",  label: "Delivered",  color: "bg-emerald-500" },
    { value: "cancelled",  label: "Cancelled",  color: "bg-red-500" },
    { value: "refunded",   label: "Refunded",   color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Order Management</h1>
            <p className="mt-1 text-sm text-violet-200">Track, update and manage all customer orders</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-violet-200 uppercase tracking-wide">Total</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-300">{pendingCount}</p>
              <p className="text-xs text-violet-200 uppercase tracking-wide">Pending</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-300">${totalRevenue.toFixed(0)}</p>
              <p className="text-xs text-violet-200 uppercase tracking-wide">Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status filter pills ── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === "all"
            ? orders.length
            : orders.filter((o: Order) => o.status === tab.value).length;
          const active = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                active
                  ? `${tab.color} text-white border-transparent shadow-sm`
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Orders list ── */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <ShoppingCart className="h-12 w-12 opacity-30" />
          <p className="text-sm">No orders found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order: Order) => (
            <Card
              key={order.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <CardContent className="p-0">
                {/* Top accent strip per status */}
                <div className={`h-1 w-full ${
                  order.status === "delivered" ? "bg-emerald-400" :
                  order.status === "shipped"   ? "bg-violet-400" :
                  order.status === "processing"? "bg-orange-400" :
                  order.status === "confirmed" ? "bg-blue-400" :
                  order.status === "cancelled" ? "bg-red-400" :
                  order.status === "refunded"  ? "bg-rose-400" :
                                                 "bg-amber-400"
                }`} />

                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                    {/* Left: order identity */}
                    <div className="flex-1 min-w-0 space-y-3">

                      {/* Row 1: order # + badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleOrderNumberClick(order.id)}
                          className="flex items-center gap-1.5 font-bold text-violet-700 hover:text-violet-900 text-sm sm:text-base group"
                        >
                          <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          Order #{order.id}
                        </button>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Unknown"}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${getPaymentColor(order.paymentStatus)}`}>
                          <CreditCard className="h-3 w-3" />
                          {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : "Unknown"}
                        </span>
                      </div>

                      {/* Row 2: customer + date + total */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 p-1.5 bg-violet-50 rounded-lg shrink-0">
                            <User className="h-3.5 w-3.5 text-violet-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{order.customerName}</p>
                            <p className="text-xs text-gray-500 truncate">{order.customerEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 p-1.5 bg-amber-50 rounded-lg shrink-0">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{format(new Date(order.createdAt), "MMM d, yyyy")}</p>
                            <p className="text-xs text-gray-500">{format(new Date(order.createdAt), "h:mm a")}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 p-1.5 bg-emerald-50 rounded-lg shrink-0">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold text-emerald-700 text-base">${parseFloat(order.total).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Order total</p>
                          </div>
                        </div>
                      </div>

                      {/* Row 3: tracking if present */}
                      {order.trackingNumber && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 w-fit">
                          <Truck className="h-3.5 w-3.5 text-violet-500" />
                          <span className="font-medium">{order.shippingCarrier || "Carrier"}:</span>
                          <span className="font-mono">{order.trackingNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: action button */}
                    <div className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(order)}
                        className="h-9 px-4 text-violet-700 border-violet-200 hover:bg-violet-50 hover:border-violet-300 rounded-xl font-medium"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Update Status Dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Update Order</DialogTitle>
          </DialogHeader>
          {/* hero */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Edit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Update Order #{selectedOrderId}</h3>
                <p className="text-sm text-violet-200">Change status, carrier & tracking</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order Status</Label>
              <Select value={newStatus || undefined} onValueChange={setNewStatus}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {["pending","confirmed","processing","shipped","delivered","cancelled","refunded"].map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shipping Carrier</Label>
              <select
                value={shippingCarrier === "" ? "no-carrier" : shippingCarrier}
                onChange={(e) => setShippingCarrier(e.target.value)}
                className="w-full px-3 py-2. rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none py-2"
              >
                <option value="no-carrier">No Carrier</option>
                {["FedEx","UPS","DHL","USPS","India Post","Blue Dart","Delhivery","Other"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tracking Number</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. 1Z999AA10123456784"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes…"
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleUpdateOrder}
                disabled={updateOrderMutation.isPending || !newStatus}
                className="flex-1 bg-violet-600 hover:bg-violet-700 rounded-xl"
              >
                {updateOrderMutation.isPending ? (
                  <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Updating…</span>
                ) : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Bill / Order Detail Dialog ── */}
      <Dialog open={isBillDialogOpen} onOpenChange={setIsBillDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {/* hero */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-5 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Order #{selectedBillOrderId}</h3>
                  {selectedOrderDetails && (
                    <p className="text-sm text-violet-200">
                      {format(new Date(selectedOrderDetails.createdAt), "MMMM d, yyyy · h:mm a")}
                    </p>
                  )}
                </div>
              </div>
              {selectedOrderDetails && (
                <div className="text-right">
                  <p className="text-2xl font-bold">${parseFloat(selectedOrderDetails.total || "0").toFixed(2)}</p>
                  <p className="text-xs text-violet-200">Total</p>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoadingOrderDetails ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-violet-100 border-t-violet-500 animate-spin" />
                  <p className="text-sm text-gray-500">Loading order details…</p>
                </div>
              </div>
            ) : selectedOrderDetails ? (
              <div className="p-5 space-y-5">

                {/* Status badges row */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(selectedOrderDetails.status || "pending")}`}>
                    {getStatusIcon(selectedOrderDetails.status || "pending")}
                    {(selectedOrderDetails.status || "pending").charAt(0).toUpperCase() + (selectedOrderDetails.status || "pending").slice(1)}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${getPaymentColor(selectedOrderDetails.paymentStatus || "")}`}>
                    <CreditCard className="h-3 w-3" />
                    {(selectedOrderDetails.paymentStatus || "N/A").charAt(0).toUpperCase() + (selectedOrderDetails.paymentStatus || "N/A").slice(1)}
                  </span>
                  {selectedOrderDetails.trackingNumber && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      <Truck className="h-3 w-3" />
                      {selectedOrderDetails.shippingCarrier} · {selectedOrderDetails.trackingNumber}
                    </span>
                  )}
                </div>

                {/* Customer + Address */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Customer info */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-gray-500"
                        onClick={() => {
                          const info = [
                            `Name: ${selectedOrderDetails.customerName || "N/A"}`,
                            `Email: ${selectedOrderDetails.customerEmail || "N/A"}`,
                            selectedOrderDetails.customerPhone ? `Phone: ${selectedOrderDetails.customerPhone}` : "",
                          ].filter(Boolean).join("\n");
                          copyToClipboard(info, "Customer info");
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1 bg-white rounded border border-gray-100 shadow-sm">
                          <User className="h-3 w-3 text-violet-600" />
                        </div>
                        <span className="font-medium text-gray-800">{selectedOrderDetails.customerName || "N/A"}</span>
                      </div>
                      {selectedOrderDetails.customerEmail && (
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="p-1 bg-white rounded border border-gray-100 shadow-sm">
                              <Mail className="h-3 w-3 text-teal-600" />
                            </div>
                            <span className="truncate max-w-[180px]">{selectedOrderDetails.customerEmail}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 px-1 opacity-0 group-hover:opacity-100"
                            onClick={() => copyToClipboard(selectedOrderDetails.customerEmail, "Email")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {selectedOrderDetails.customerPhone && (
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="p-1 bg-white rounded border border-gray-100 shadow-sm">
                              <Phone className="h-3 w-3 text-blue-600" />
                            </div>
                            {selectedOrderDetails.customerPhone}
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 px-1 opacity-0 group-hover:opacity-100"
                            onClick={() => copyToClipboard(selectedOrderDetails.customerPhone, "Phone")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping address */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ship To</p>
                      {selectedOrderDetails.shippingAddress && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-gray-500"
                          onClick={() => {
                            const addr = [
                              selectedOrderDetails.shippingAddress?.street || selectedOrderDetails.shippingAddress?.address,
                              `${selectedOrderDetails.shippingAddress?.city || ""}, ${selectedOrderDetails.shippingAddress?.state || ""} ${selectedOrderDetails.shippingAddress?.zip || selectedOrderDetails.shippingAddress?.postalCode || ""}`,
                              selectedOrderDetails.shippingAddress?.country,
                            ].filter(Boolean).join("\n");
                            copyToClipboard(addr, "Shipping address");
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="p-1 bg-white rounded border border-gray-100 shadow-sm mt-0.5">
                        <MapPin className="h-3 w-3 text-rose-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p>{selectedOrderDetails.shippingAddress?.street || selectedOrderDetails.shippingAddress?.address || "N/A"}</p>
                        <p className="text-gray-500">
                          {selectedOrderDetails.shippingAddress?.city}, {selectedOrderDetails.shippingAddress?.state}{" "}
                          {selectedOrderDetails.shippingAddress?.zip || selectedOrderDetails.shippingAddress?.postalCode}
                        </p>
                        <p className="font-medium">{selectedOrderDetails.shippingAddress?.country}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order items */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Items Ordered</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {(selectedOrderDetails.items || []).length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">No items found</div>
                    ) : (
                      selectedOrderDetails.items?.map((item: any, i: number) => {
                        const price = parseFloat(item.price || item.book?.price || "0");
                        const qty = item.quantity || 0;
                        return (
                          <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                            <div className="w-8 h-8 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                              {qty}×
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">{item.title || item.book?.title || "N/A"}</p>
                              <p className="text-xs text-gray-500">{item.author || item.book?.author || ""}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-sm text-gray-800">${(price * qty).toFixed(2)}</p>
                              <p className="text-xs text-gray-400">${price.toFixed(2)} ea</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Order summary */}
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
                  {[
                    { label: "Subtotal", value: selectedOrderDetails.subtotal },
                    { label: "Shipping", value: selectedOrderDetails.shipping },
                    { label: "Tax",      value: selectedOrderDetails.tax },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm text-gray-600">
                      <span>{label}</span>
                      <span>${parseFloat(value || "0").toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-200 pt-2 mt-2">
                    <span>Total</span>
                    <span className="text-violet-700">${parseFloat(selectedOrderDetails.total || "0").toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleDownloadBill}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 rounded-xl"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download Invoice
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsBillDialogOpen(false)}
                    className="flex-1 rounded-xl"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                Order details not found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}