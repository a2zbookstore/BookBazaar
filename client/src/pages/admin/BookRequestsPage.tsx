import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { 
  BookOpen, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  User,
  Hash,
  DollarSign,
  Package,
  MessageSquare,
  Filter
} from "lucide-react";
import type { BookRequest } from "@shared/schema";

const BookRequestsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<BookRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: bookRequestsData, isLoading } = useQuery({
    queryKey: ["/api/book-requests", selectedStatus],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }
      return apiRequest(`/api/book-requests?${params.toString()}`);
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest(`/api/book-requests/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Updated",
        description: "Book request has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/book-requests"] });
      setIsEditDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
      setNewStatus("");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update book request.",
        variant: "destructive",
      });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/book-requests/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Deleted",
        description: "Book request has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/book-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete book request.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      fulfilled: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800";
  };

  const handleViewRequest = (request: BookRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleEditRequest = (request: BookRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || "");
    setNewStatus(request.status || "pending");
    setIsEditDialogOpen(true);
  };

  const handleUpdateRequest = () => {
    if (!selectedRequest) return;

    updateRequestMutation.mutate({
      id: selectedRequest.id,
      updates: {
        status: newStatus,
        adminNotes: adminNotes,
      },
    });
  };

  const handleDeleteRequest = (id: number) => {
    if (confirm("Are you sure you want to delete this book request?")) {
      deleteRequestMutation.mutate(id);
    }
  };

  const bookRequests = bookRequestsData?.bookRequests || [];
  const totalRequests = bookRequestsData?.total || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-aqua mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading book requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Requests</h1>
          <p className="text-gray-600">Manage customer book requests</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {totalRequests} requests
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Book Requests List */}
      {bookRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Book Requests</h3>
            <p className="text-gray-600">No book requests found for the selected filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookRequests.map((request: BookRequest) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.bookTitle}
                      </h3>
                      <Badge className={getStatusBadge(request.status || "pending")}>
                        {request.status || "pending"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>Customer: {request.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{request.customerEmail}</span>
                        </div>
                        {request.customerPhone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{request.customerPhone}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {request.author && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Author:</span> {request.author}
                          </div>
                        )}
                        {request.isbn && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Hash className="h-4 w-4" />
                            <span>ISBN: {request.isbn}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Package className="h-4 w-4" />
                          <span>Qty: {request.quantity}</span>
                        </div>
                        {request.expectedPrice && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="h-4 w-4" />
                            <span>Expected: {formatCurrency(parseFloat(request.expectedPrice))}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Requested: {new Date(request.createdAt!).toLocaleDateString()}</span>
                        </div>
                        {request.processedAt && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Processed:</span> {new Date(request.processedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {request.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Customer Notes:</span>
                        </div>
                        <p className="text-sm text-gray-600">{request.notes}</p>
                      </div>
                    )}

                    {request.adminNotes && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700">Admin Notes:</span>
                        </div>
                        <p className="text-sm text-blue-600">{request.adminNotes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRequest(request)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRequest(request)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRequest(request.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book Request Details</DialogTitle>
            <DialogDescription>
              Request #{selectedRequest?.id} - {selectedRequest?.bookTitle}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer Information</h4>
                  <p><strong>Name:</strong> {selectedRequest.customerName}</p>
                  <p><strong>Email:</strong> {selectedRequest.customerEmail}</p>
                  {selectedRequest.customerPhone && (
                    <p><strong>Phone:</strong> {selectedRequest.customerPhone}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Request Status</h4>
                  <Badge className={getStatusBadge(selectedRequest.status || "pending")}>
                    {selectedRequest.status || "pending"}
                  </Badge>
                  <p className="mt-2"><strong>Requested:</strong> {new Date(selectedRequest.createdAt!).toLocaleString()}</p>
                  {selectedRequest.processedAt && (
                    <p><strong>Processed:</strong> {new Date(selectedRequest.processedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Book Information</h4>
                <p><strong>Title:</strong> {selectedRequest.bookTitle}</p>
                {selectedRequest.author && <p><strong>Author:</strong> {selectedRequest.author}</p>}
                {selectedRequest.isbn && <p><strong>ISBN:</strong> {selectedRequest.isbn}</p>}
                <p><strong>Quantity:</strong> {selectedRequest.quantity}</p>
                {selectedRequest.expectedPrice && (
                  <p><strong>Expected Price:</strong> {formatCurrency(parseFloat(selectedRequest.expectedPrice))}</p>
                )}
              </div>

              {selectedRequest.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Customer Notes</h4>
                  <p className="text-gray-600">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div>
                  <h4 className="font-semibold mb-2">Admin Notes</h4>
                  <p className="text-gray-600">{selectedRequest.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Request Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Book Request</DialogTitle>
            <DialogDescription>
              Update the status and add admin notes for this request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Admin Notes</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this request..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRequest}
                disabled={updateRequestMutation.isPending}
                className="bg-primary-aqua hover:bg-primary-aqua/90"
              >
                {updateRequestMutation.isPending ? "Updating..." : "Update Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookRequestsPage;