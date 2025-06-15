import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { 
  Package, 
  Calendar, 
  DollarSign, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Filter,
  Download
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ReturnRequest {
  id: number;
  orderId: number;
  userId?: string;
  customerEmail: string;
  customerName: string;
  returnReason: string;
  returnDescription: string;
  itemsToReturn: ReturnItem[];
  totalRefundAmount: string;
  status: string;
  adminNotes?: string;
  refundMethod?: string;
  refundTransactionId?: string;
  refundProcessedAt?: string;
  returnDeadline: string;
  createdAt: string;
  updatedAt: string;
  order: {
    id: number;
    customerEmail: string;
    customerName: string;
    totalAmount: string;
    status: string;
    createdAt: string;
    items: OrderItem[];
  };
}

interface ReturnItem {
  bookId: number;
  quantity: number;
  reason: string;
}

interface OrderItem {
  id: number;
  bookId: number;
  quantity: number;
  price: string;
  title: string;
  author: string;
}

export default function ReturnsPage() {
  const { admin, isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Fetch return requests
  const { data: returnsData, isLoading } = useQuery({
    queryKey: ["/api/admin/returns", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const url = `/api/admin/returns${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch return requests");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const returnRequests = returnsData?.returnRequests || [];
  const total = returnsData?.total || 0;

  // Update return status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; adminNotes?: string }) => {
      return await apiRequest("PUT", `/api/admin/returns/${data.id}/status`, {
        status: data.status,
        adminNotes: data.adminNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/returns"] });
      toast({
        title: "Success",
        description: "Return request status updated successfully",
      });
      setSelectedReturn(null);
      setNewStatus("");
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update return request status",
        variant: "destructive",
      });
    },
  });

  // Process refund mutation
  const processRefundMutation = useMutation({
    mutationFn: async (data: { id: number; refundMethod: string; refundReason: string }) => {
      return await apiRequest("POST", `/api/admin/returns/${data.id}/refund`, {
        refundMethod: data.refundMethod,
        refundReason: data.refundReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/returns"] });
      toast({
        title: "Success",
        description: "Refund processed successfully",
      });
      setSelectedReturn(null);
      setRefundMethod("");
      setRefundReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "refund_processed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "refund_processed":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleUpdateStatus = () => {
    if (!selectedReturn || !newStatus) return;

    updateStatusMutation.mutate({
      id: selectedReturn.id,
      status: newStatus,
      adminNotes: adminNotes.trim() || undefined,
    });
  };

  const handleProcessRefund = () => {
    if (!selectedReturn || !refundMethod || !refundReason) return;

    processRefundMutation.mutate({
      id: selectedReturn.id,
      refundMethod,
      refundReason: refundReason.trim(),
    });
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Please log in to access return management.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-base-black">Return & Refund Management</h1>
            <p className="text-secondary-black">Manage customer return requests and process refunds</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="refund_processed">Refund Processed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">
                    {returnRequests.filter((r: ReturnRequest) => r.status === "pending").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold">
                    {returnRequests.filter((r: ReturnRequest) => r.status === "approved").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Refunds Processed</p>
                  <p className="text-2xl font-bold">
                    {returnRequests.filter((r: ReturnRequest) => r.status === "refund_processed").length}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Return Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Return Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2">Loading return requests...</p>
              </div>
            ) : returnRequests.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">No Return Requests</h3>
                <p className="text-gray-600">No return requests found for the selected filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {returnRequests.map((returnRequest: ReturnRequest) => (
                  <div key={returnRequest.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold">Return #{returnRequest.id}</h3>
                          <p className="text-sm text-gray-600">
                            Order #{returnRequest.orderId} • {returnRequest.customerName}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(returnRequest.status)} border-0`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(returnRequest.status)}
                            {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1).replace('_', ' ')}
                          </div>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            ${parseFloat(returnRequest.totalRefundAmount).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(returnRequest.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReturn(returnRequest);
                                setNewStatus(returnRequest.status);
                                setAdminNotes(returnRequest.adminNotes || "");
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Return Request #{returnRequest.id}</DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* Customer Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="font-semibold">Customer</Label>
                                  <p>{returnRequest.customerName}</p>
                                  <p className="text-sm text-gray-600">{returnRequest.customerEmail}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Order Details</Label>
                                  <p>Order #{returnRequest.orderId}</p>
                                  <p className="text-sm text-gray-600">
                                    Original Amount: ${parseFloat(returnRequest.order.totalAmount).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {/* Return Details */}
                              <div>
                                <Label className="font-semibold">Return Reason</Label>
                                <p className="mt-1">{returnRequest.returnReason.replace('_', ' ')}</p>
                              </div>

                              <div>
                                <Label className="font-semibold">Customer Description</Label>
                                <p className="mt-1 p-3 bg-gray-50 rounded border">{returnRequest.returnDescription}</p>
                              </div>

                              {/* Items to Return */}
                              <div>
                                <Label className="font-semibold">Items to Return</Label>
                                <div className="space-y-2 mt-2">
                                  {returnRequest.itemsToReturn.map((item, index) => {
                                    const orderItem = returnRequest.order.items.find(oi => oi.bookId === item.bookId);
                                    if (!orderItem) return null;
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div>
                                          <p className="font-medium">{orderItem.title}</p>
                                          <p className="text-sm text-gray-600">by {orderItem.author}</p>
                                          <p className="text-sm text-red-600">Reason: {item.reason.replace('_', ' ')}</p>
                                        </div>
                                        <div className="text-right">
                                          <p>Qty: {item.quantity} of {orderItem.quantity}</p>
                                          <p className="font-semibold">
                                            ${(parseFloat(orderItem.price) * item.quantity).toFixed(2)}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="mt-4 p-3 bg-green-50 rounded">
                                  <p className="font-semibold text-green-800">
                                    Total Refund Amount: ${parseFloat(returnRequest.totalRefundAmount).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {/* Status Update */}
                              <div className="border-t pt-6">
                                <h3 className="font-semibold mb-4">Update Return Status</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div></div>
                                </div>

                                <div className="mt-4">
                                  <Label htmlFor="adminNotes">Admin Notes</Label>
                                  <Textarea
                                    id="adminNotes"
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add notes for customer..."
                                    rows={3}
                                  />
                                </div>

                                <div className="flex gap-4 mt-4">
                                  <Button
                                    onClick={handleUpdateStatus}
                                    disabled={updateStatusMutation.isPending}
                                    className="bg-primary-aqua hover:bg-secondary-aqua"
                                  >
                                    {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
                                  </Button>

                                  {returnRequest.status === "approved" && (
                                    <div className="flex gap-2">
                                      <Select value={refundMethod} onValueChange={setRefundMethod}>
                                        <SelectTrigger className="w-40">
                                          <SelectValue placeholder="Refund Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="paypal">PayPal</SelectItem>
                                          <SelectItem value="razorpay">Razorpay</SelectItem>
                                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        placeholder="Refund reason"
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        className="w-48"
                                      />
                                      <Button
                                        onClick={handleProcessRefund}
                                        disabled={processRefundMutation.isPending || !refundMethod || !refundReason}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        {processRefundMutation.isPending ? "Processing..." : "Process Refund"}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {returnRequest.adminNotes && (
                                <div className="border-t pt-4">
                                  <Label className="font-semibold">Previous Admin Notes</Label>
                                  <p className="mt-1 p-3 bg-blue-50 rounded border">{returnRequest.adminNotes}</p>
                                </div>
                              )}

                              {returnRequest.refundProcessedAt && (
                                <div className="border-t pt-4">
                                  <Label className="font-semibold">Refund Information</Label>
                                  <div className="mt-2 p-3 bg-green-50 rounded">
                                    <p><strong>Method:</strong> {returnRequest.refundMethod}</p>
                                    <p><strong>Transaction ID:</strong> {returnRequest.refundTransactionId}</p>
                                    <p><strong>Processed:</strong> {new Date(returnRequest.refundProcessedAt).toLocaleString()}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Reason:</span> {returnRequest.returnReason.replace('_', ' ')}
                      </div>
                      <div>
                        <span className="font-medium">Items:</span> {returnRequest.itemsToReturn.length}
                      </div>
                      <div>
                        <span className="font-medium">Deadline:</span> {new Date(returnRequest.returnDeadline).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}