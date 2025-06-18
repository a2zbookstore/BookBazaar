import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Edit, FileText, Download, Printer } from "lucide-react";

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

interface OrderStatusDialogProps {
  order: Order;
  onViewInvoice: (order: Order) => void;
  onDownloadInvoice: (order: Order) => void;
  onPrintInvoice: (order: Order) => void;
}

export function OrderStatusDialog({ 
  order, 
  onViewInvoice, 
  onDownloadInvoice, 
  onPrintInvoice 
}: OrderStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [shippingCarrier, setShippingCarrier] = useState(order.shippingCarrier || "none");
  const [customCarrier, setCustomCarrier] = useState("");
  const [notes, setNotes] = useState(order.notes || "");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateOrderMutation = useMutation({
    mutationFn: async (data: { 
      orderId: number; 
      status: string; 
      trackingNumber?: string; 
      shippingCarrier?: string; 
      notes?: string; 
    }) => {
      try {
        console.log('Updating order with data:', data);
        const response = await apiRequest("PUT", `/api/orders/${data.orderId}/status`, {
          status: data.status,
          trackingNumber: data.trackingNumber || "",
          shippingCarrier: data.shippingCarrier || "",
          notes: data.notes || "",
        });
        console.log('Order update response:', response);
        return response;
      } catch (error) {
        console.error('Order update failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Order update successful:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully. Email notification sent.",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      console.error('Order update error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    try {
      console.log('HandleSubmit called');
      console.log('Order:', order);
      console.log('New status:', newStatus);
      
      if (!newStatus) {
        toast({
          title: "Error",
          description: "Please select a status",
          variant: "destructive",
        });
        return;
      }

      if (!order?.id) {
        console.error('No order ID available');
        toast({
          title: "Error",
          description: "Invalid order data",
          variant: "destructive",
        });
        return;
      }

      const carrierValue = shippingCarrier === "other" ? customCarrier : 
                          shippingCarrier === "none" ? "" : shippingCarrier;

      const updateData = {
        orderId: order.id,
        status: newStatus,
        trackingNumber: trackingNumber || "",
        shippingCarrier: carrierValue || "",
        notes: notes || "",
      };

      console.log('Submitting order update:', updateData);
      updateOrderMutation.mutate(updateData);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || "");
    setShippingCarrier(order.shippingCarrier || "none");
    setCustomCarrier("");
    setNotes(order.notes || "");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      try {
        console.log('Dialog state changing:', isOpen);
        setOpen(isOpen);
        if (isOpen) {
          resetForm();
        }
      } catch (error) {
        console.error('Error in dialog state change:', error);
      }
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => {
            try {
              console.log('Dialog trigger clicked for order:', order?.id);
              setOpen(true);
            } catch (error) {
              console.error('Error opening dialog:', error);
            }
          }}
        >
          <Edit className="w-4 h-4" />
          Edit Order Status
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Order #{order.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Information */}
          <div>
            <h4 className="font-semibold mb-2">Customer Information</h4>
            <div className="space-y-2">
              <p><strong>Name:</strong> {order.customerName}</p>
              <p><strong>Email:</strong> {order.customerEmail}</p>
              <p><strong>Phone:</strong> {order.customerPhone || 'N/A'}</p>
            </div>
            <div className="space-y-2 mt-4">
              <p><strong>Order ID:</strong> #{order.id}</p>
              <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}</p>
            </div>
          </div>

          {/* Invoice Actions */}
          <div>
            <h4 className="font-semibold mb-2">Invoice Actions</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewInvoice(order)}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadInvoice(order)}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrintInvoice(order)}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </Button>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Order Items</h4>
              <div className="space-y-2">
                {order.items.map((item: any) => (
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
                  <SelectItem value="other">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {shippingCarrier === "other" && (
              <div className="space-y-2">
                <Label htmlFor="customCarrier">Custom Carrier Name</Label>
                <Input
                  id="customCarrier"
                  value={customCarrier}
                  onChange={(e) => setCustomCarrier(e.target.value)}
                  placeholder="Enter custom carrier name"
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
              onClick={handleSubmit}
              disabled={updateOrderMutation.isPending || !newStatus}
              className="w-full"
            >
              {updateOrderMutation.isPending ? "Updating..." : "Update Order Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}