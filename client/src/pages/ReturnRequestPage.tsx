import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Package, Calendar, AlertCircle, ArrowLeft, FileText, History, Clock, XCircle, DollarSign, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Order {
  id: number;
  customerEmail: string;
  customerName: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  bookId: number;
  quantity: number;
  price: string;
  title: string;
  author: string;
}

interface ReturnItem {
  bookId: number;
  quantity: number;
  reason: string;
}

interface ReturnRequest {
  id: number;
  orderId: number;
  customerName: string;
  customerEmail: string;
  returnReason: string;
  returnDescription: string;
  totalRefundAmount: string;
  status: string;
  createdAt: string;
  returnRequestNumber: string;
  order: {
    id: number;
    customerName: string;
    totalAmount: string;
    createdAt: string;
    items: OrderItem[];
  };
}

export default function ReturnRequestPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(1); // 1: Select Order, 2: Return Details, 3: Confirmation
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [guestEmail, setGuestEmail] = useState(""); // Guest must enter their own email
  const [customerName, setCustomerName] = useState("");
  const [returnRequestNumber, setReturnRequestNumber] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [returnReason, setReturnReason] = useState("none");
  const [returnDescription, setReturnDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState<ReturnItem[]>([]);

  // Fetch eligible orders
  const { data: eligibleOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/returns/eligible-orders", guestEmail],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!isAuthenticated && guestEmail) {
        params.append("email", guestEmail);
      }
      const url = `/api/returns/eligible-orders${params.toString() ? '?' + params.toString() : ''}`;
      console.log("Fetching eligible orders from:", url);
      const response = await fetch(url);
      console.log("Eligible orders response status:", response.status);
      if (!response.ok) throw new Error("Failed to fetch eligible orders");
      const data = await response.json();
      console.log("Eligible orders data:", data);
      return data;
    },
    enabled: isAuthenticated || (!isAuthenticated && guestEmail.length > 0 && guestEmail.includes('@')),
  });

  // Fetch customer's return request history
  const { data: returnHistory = [], isLoading: historyLoading } = useQuery<ReturnRequest[]>({
    queryKey: ["/api/returns/my-returns", guestEmail],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!isAuthenticated && guestEmail) {
        params.append("email", guestEmail);
      }
      const url = `/api/returns/my-returns${params.toString() ? '?' + params.toString() : ''}`;
      console.log("Fetching return history from:", url);
      const response = await fetch(url);
      console.log("Return history response status:", response.status);
      if (!response.ok) throw new Error("Failed to fetch return history");
      const data = await response.json();
      console.log("Return history data:", data);
      return data;
    },
    enabled: isAuthenticated || (!isAuthenticated && guestEmail.length > 0 && guestEmail.includes('@')),
  });

  // Get selected order details
  const selectedOrder = eligibleOrders.find(order => order.id === selectedOrderId);

  // Create return request mutation
  const createReturnMutation = useMutation({
    mutationFn: async (data: {
      orderId: number;
      returnReason: string;
      returnDescription: string;
      itemsToReturn: ReturnItem[];
      customerName: string;
      customerEmail: string;
    }) => {
      const response = await apiRequest("POST", "/api/returns/request", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      // Store the return request number from the response
      setReturnRequestNumber(data.returnRequestNumber);
      toast({
        title: "Return Request Submitted",
        description: "Your return request has been submitted successfully. We'll review it within 24 hours.",
      });
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ["/api/returns/my-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit return request",
        variant: "destructive",
      });
    },
  });

  // Pre-fill user details if authenticated
  useEffect(() => {
    if (user) {
      setCustomerName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setCustomerEmail(user.email || '');
    }
  }, [user]);

  const returnReasons = [
    { value: "damaged", label: "Item arrived damaged" },
    { value: "defective", label: "Item is defective/not working" },
    { value: "wrong_item", label: "Wrong item sent" },
    { value: "not_as_described", label: "Item not as described" },
    { value: "other", label: "Other reason" },
  ];

  const handleItemSelection = (bookId: number, quantity: number, reason: string) => {
    const existingIndex = selectedItems.findIndex(item => item.bookId === bookId);
    
    if (quantity === 0 || !reason || reason === "none") {
      // Remove item if quantity is 0 or no reason selected
      if (existingIndex !== -1) {
        setSelectedItems(prev => prev.filter((_, index) => index !== existingIndex));
      }
    } else {
      // Add or update item
      const newItem: ReturnItem = { bookId, quantity, reason };
      if (existingIndex !== -1) {
        setSelectedItems(prev => prev.map((item, index) => 
          index === existingIndex ? newItem : item
        ));
      } else {
        setSelectedItems(prev => [...prev, newItem]);
      }
    }
  };

  const calculateRefundAmount = () => {
    if (!selectedOrder) return 0;
    
    return selectedItems.reduce((total, item) => {
      const orderItem = selectedOrder.items.find(oi => oi.bookId === item.bookId);
      if (orderItem) {
        return total + (parseFloat(orderItem.price) * item.quantity);
      }
      return total;
    }, 0);
  };

  const handleSubmitReturn = () => {
    if (!selectedOrderId || !returnReason || returnReason === "none" || !returnDescription || selectedItems.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select items to return.",
        variant: "destructive",
      });
      return;
    }

    createReturnMutation.mutate({
      orderId: selectedOrderId,
      returnReason,
      returnDescription,
      itemsToReturn: selectedItems,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
    });
  };

  const canProceedToStep2 = selectedOrderId && (user || (guestEmail && customerName && customerEmail));

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 mt-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-black mb-2">Request Return & Refund</h1>
          <p className="text-secondary-black">
            Return your order within 30 days of delivery for a full refund
          </p>
        </div> 

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary-aqua text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <div className={`h-0.5 w-16 ${step >= 2 ? 'bg-primary-aqua' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary-aqua text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <div className={`h-0.5 w-16 ${step >= 3 ? 'bg-primary-aqua' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-primary-aqua text-white' : 'bg-gray-200'}`}>
              3
            </div>
          </div>
        </div>

        {/* Return Request History */}
        {returnHistory.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Your Return Request History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {historyLoading ? (
                  <div className="text-center py-4">Loading return history...</div>
                ) : (
                  returnHistory.map((returnRequest) => (
                    <div key={returnRequest.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {returnRequest.returnRequestNumber || `REQ-${returnRequest.id}`}
                            </Badge>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              returnRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              returnRequest.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              returnRequest.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                              returnRequest.status === 'refund_processed' ? 'bg-green-100 text-green-800' :
                              returnRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              returnRequest.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {returnRequest.status === 'pending' && <Clock className="h-3 w-3" />}
                              {returnRequest.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                              {returnRequest.status === 'processing' && <Package className="h-3 w-3" />}
                              {returnRequest.status === 'refund_processed' && <DollarSign className="h-3 w-3" />}
                              {returnRequest.status === 'rejected' && <XCircle className="h-3 w-3" />}
                              {returnRequest.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                              {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1).replace('_', ' ')}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Order #{returnRequest.order.id} • {new Date(returnRequest.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${returnRequest.totalRefundAmount}</p>
                          <p className="text-xs text-gray-500">Refund Amount</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {returnRequest.order.items.map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.title}
                          </Badge>
                        ))}
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Reason:</span> {returnRequest.returnReason}
                        </p>
                        {returnRequest.returnDescription && (
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Details:</span> {returnRequest.returnDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Select Order to Return
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!user && (
                <div className="space-y-4">
                  <div >
                    <Label htmlFor="guestEmail">Email Address</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      placeholder="Enter your email to find orders"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerName">Full Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Enter your full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Contact Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="Email for return updates"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}

              {ordersLoading ? (
                <div className="text-center py-8">Loading your orders...</div>
              ) : eligibleOrders.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">No Eligible Orders</h3>
                  <p className="text-gray-600 mb-4">
                    No orders are currently eligible for returns. This could be because:
                  </p>
                  <div className="text-left bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• No delivered orders within the 30-day return window</li>
                      <li>• Orders already have approved/processed return requests</li>
                      <li>• Orders are still being processed or shipped</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    If you believe this is an error, please contact our support team.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eligibleOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedOrderId === order.id
                          ? 'border-primary-aqua bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedOrderId === order.id}
                            onChange={() => {}}
                          />
                          <span className="font-semibold">Order #{order.id}</span>
                          <Badge variant="secondary">
                            ${parseFloat(order.totalAmount).toFixed(2)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.items.length} item(s) • Delivered
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="bg-primary-aqua hover:bg-secondary-aqua"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && selectedOrder && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Return Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Order #{selectedOrder.id}</h3>
                <p className="text-sm text-gray-600">
                  Ordered on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <Label htmlFor="returnReason">Reason for Return *</Label>
                <select 
                  id="returnReason"
                  value={returnReason} 
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-aqua focus:border-transparent"
                >
                  <option value="none">Select a reason</option>
                  {returnReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="returnDescription">Detailed Description *</Label>
                <Textarea
                  id="returnDescription"
                  placeholder="Please provide detailed information about the issue..."
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label>Select Items to Return *</Label>
                <div className="space-y-4 mt-2">
                  {selectedOrder.items.map((item) => {
                    const selectedItem = selectedItems.find(si => si.bookId === item.bookId);
                    return (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-gray-600">by {item.author}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${parseFloat(item.price).toFixed(2)}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Return Quantity</Label>
                            <select
                              value={selectedItem?.quantity?.toString() || "0"}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value);
                                handleItemSelection(
                                  item.bookId,
                                  qty,
                                  selectedItem?.reason || returnReason || "none"
                                );
                              }}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-aqua focus:border-transparent"
                            >
                              <option value="0">Don't return</option>
                              {Array.from({ length: item.quantity }, (_, i) => (
                                <option key={i + 1} value={(i + 1).toString()}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label>Item-specific Reason</Label>
                            <select
                              value={selectedItem?.reason || "none"}
                              onChange={(e) => {
                                const reason = e.target.value;
                                if (reason === "none") return;
                                handleItemSelection(
                                  item.bookId,
                                  selectedItem?.quantity || 0,
                                  reason
                                );
                              }}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-aqua focus:border-transparent"
                            >
                              <option value="none">Select reason</option>
                              {returnReasons.map((reason) => (
                                <option key={reason.value} value={reason.value}>
                                  {reason.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Refund Summary</h3>
                  <p className="text-lg font-bold text-green-700">
                    Estimated Refund: ${calculateRefundAmount().toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Refund will be processed to your original payment method once approved
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmitReturn}
                  disabled={createReturnMutation.isPending || selectedItems.length === 0}
                  className="bg-primary-aqua hover:bg-secondary-aqua"
                >
                  {createReturnMutation.isPending ? "Submitting..." : "Submit Return Request"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-base-black mb-4">Return Request Submitted!</h2>
              <p className="text-gray-600 mb-4">
                Your return request has been submitted successfully. We'll review it within 24 hours
                and send you further instructions via email.
              </p>
              {returnRequestNumber && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-800 mb-2">Return Request Number</h3>
                  <p className="text-lg font-mono text-green-700">{returnRequestNumber}</p>
                  <p className="text-sm text-green-600 mt-1">
                    Please save this number for your records. You'll need it to track your return request.
                  </p>
                </div>
              )}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-semibold mb-2">Next Steps:</h3>
                <ul className="space-y-2 text-sm">
                  <li>• We'll review your request within 24 hours</li>
                  <li>• If approved, you'll receive return shipping instructions</li>
                  <li>• Pack items securely and ship back within 30 days</li>
                  <li>• Refund will be processed once items are received</li>
                </ul>
              </div>
              <div className="space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/my-orders'}
                >
                  View My Orders
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="bg-primary-aqua hover:bg-secondary-aqua"
                >
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}