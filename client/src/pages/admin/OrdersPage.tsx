import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusDialog } from "@/components/OrderStatusDialog";
import { 
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

export default function OrdersPage() {
  const [location] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

  // Set initial filter from URL
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
        
        <div class="footer">
          <p><strong>A2Z BOOKSHOP</strong> - Your trusted online bookstore</p>
          <p>Thank you for your business!</p>
          ${order.notes ? `
          <div style="margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <strong>Order Notes:</strong><br>
            ${order.notes}
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadInvoice = (order: Order) => {
    const invoiceHTML = generateInvoiceHTML(order);
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `A2Z-Invoice-${order.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintInvoice = (order: Order) => {
    const invoiceHTML = generateInvoiceHTML(order);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleViewInvoice = (order: Order) => {
    const invoiceHTML = generateInvoiceHTML(order);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(invoiceHTML);
      newWindow.document.close();
    }
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
                        
                        <OrderStatusDialog
                          order={order}
                          onViewInvoice={handleViewInvoice}
                          onDownloadInvoice={handleDownloadInvoice}
                          onPrintInvoice={handlePrintInvoice}
                        />
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