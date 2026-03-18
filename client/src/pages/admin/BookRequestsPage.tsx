import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  BookMarked,
  ClipboardList,
  SlidersHorizontal,
} from "lucide-react";
import type { BookRequest } from "@shared/schema";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  pending:     { label: "Pending",     color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200", icon: Clock },
  in_progress: { label: "In Progress", color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",  icon: Loader2 },
  fulfilled:   { label: "Fulfilled",   color: "text-emerald-700",bg: "bg-emerald-50", border: "border-emerald-200",icon: CheckCircle2 },
  rejected:    { label: "Rejected",    color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200",   icon: XCircle },
  cancelled:   { label: "Cancelled",   color: "text-gray-600",   bg: "bg-gray-100",   border: "border-gray-200",  icon: AlertCircle },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
};

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
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      const response = await apiRequest("GET", `/api/book-requests?${params.toString()}`);
      return response.json();
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) =>
      apiRequest("PUT", `/api/book-requests/${id}`, updates),
    onSuccess: () => {
      toast({ title: "Request Updated", description: "Book request has been updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/book-requests"] });
      setIsEditDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
      setNewStatus("");
    },
    onError: (error: any) => {
      toast({ title: "Update Failed", description: error.message || "Failed to update book request.", variant: "destructive" });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/book-requests/${id}`),
    onSuccess: () => {
      toast({ title: "Request Deleted", description: "Book request has been deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/book-requests"] });
    },
    onError: (error: any) => {
      toast({ title: "Delete Failed", description: error.message || "Failed to delete book request.", variant: "destructive" });
    },
  });

  const handleViewRequest = (request: BookRequest) => { setSelectedRequest(request); setIsViewDialogOpen(true); };
  const handleEditRequest = (request: BookRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || "");
    setNewStatus(request.status || "pending");
    setIsEditDialogOpen(true);
  };
  const handleUpdateRequest = () => {
    if (!selectedRequest) return;
    updateRequestMutation.mutate({ id: selectedRequest.id, updates: { status: newStatus, adminNotes } });
  };
  const handleDeleteRequest = (id: number) => {
    if (confirm("Are you sure you want to delete this book request?")) deleteRequestMutation.mutate(id);
  };

  const allRequests: BookRequest[] = bookRequestsData?.bookRequests || [];
  const totalRequests: number = bookRequestsData?.total || 0;

  // Derived counts for stat chips
  const counts = allRequests.reduce((acc: Record<string, number>, r) => {
    const s = r.status || "pending";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-primary-aqua/20 border-t-primary-aqua" />
          <p className="text-sm text-gray-400 font-medium">Loading book requests…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-aqua/10 via-blue-50 to-white border border-primary-aqua/20 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
  
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Book Requests</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage & respond to customer book requests</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["pending","in_progress","fulfilled","rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s === selectedStatus ? "all" : s)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                selectedStatus === s
                  ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].border} shadow-sm`
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {React.createElement(STATUS_CONFIG[s].icon, { className: "h-3.5 w-3.5" })}
              {STATUS_CONFIG[s].label}
              {counts[s] ? (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedStatus === s ? "bg-white/60" : "bg-gray-100"}`}>
                  {counts[s]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",       value: totalRequests,          color: "from-slate-600 to-slate-800",     icon: ClipboardList },
          { label: "Pending",     value: counts.pending || 0,    color: "from-amber-400 to-orange-500",    icon: Clock },
          { label: "In Progress", value: counts.in_progress || 0,color: "from-blue-400 to-blue-600",      icon: Loader2 },
          { label: "Fulfilled",   value: counts.fulfilled || 0,  color: "from-emerald-400 to-green-600",  icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <Card className="border shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <SlidersHorizontal className="h-4 w-4" />
              Filter by status
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[200px] border-gray-200 focus:ring-primary-aqua">
                <SelectValue placeholder="All Requests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>
                    <span className="flex items-center gap-2">
                      {React.createElement(cfg.icon, { className: `h-3.5 w-3.5 ${cfg.color}` })}
                      {cfg.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStatus !== "all" && (
              <button
                onClick={() => setSelectedStatus("all")}
                className="text-xs text-primary-aqua hover:underline font-medium"
              >
                Clear filter
              </button>
            )}
            <span className="sm:ml-auto text-xs text-gray-400 font-medium">
              Showing {allRequests.length} of {totalRequests} requests
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Request List ── */}
      {allRequests.length === 0 ? (
        <Card className="border-dashed border-2 shadow-none">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookMarked className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Requests Found</h3>
            <p className="text-sm text-gray-400">No book requests match the selected filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {allRequests.map((request: BookRequest) => {
            const cfg = STATUS_CONFIG[request.status || "pending"] ?? STATUS_CONFIG.pending;
            return (
              <Card
                key={request.id}
                className={`border-l-4 shadow-sm hover:shadow-md transition-all duration-200 ${cfg.border}`}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                    {/* Left: main info */}
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">#{request.id}</span>
                        <h3 className="text-base font-bold text-gray-900 truncate">{request.bookTitle}</h3>
                        <StatusBadge status={request.status || "pending"} />
                      </div>

                      {/* Three-column info grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
                        {/* Customer col */}
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Customer</p>
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{request.customerName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate text-xs">{request.customerEmail}</span>
                          </div>
                          {request.customerPhone && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs">{request.customerPhone}</span>
                            </div>
                          )}
                        </div>

                        {/* Book col */}
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Book Details</p>
                          {request.author && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <BookOpen className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs">{request.author}</span>
                            </div>
                          )}
                          {request.isbn && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs font-mono">{request.isbn}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Package className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs">Qty: <strong>{request.quantity}</strong></span>
                          </div>
                          {request.expectedPrice && (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <DollarSign className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs">Exp: <strong>{formatCurrency(parseFloat(request.expectedPrice))}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Timeline col */}
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Timeline</p>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs">Requested: {new Date(request.createdAt!).toLocaleDateString()}</span>
                          </div>
                          {request.processedAt && (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="text-xs">Processed: {new Date(request.processedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {(request.notes || request.adminNotes) && (
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                          {request.notes && (
                            <div className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-xs font-semibold text-gray-500">Customer Note</span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">{request.notes}</p>
                            </div>
                          )}
                          {request.adminNotes && (
                            <div className="flex-1 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-1.5 mb-1">
                                <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                                <span className="text-xs font-semibold text-blue-600">Admin Note</span>
                              </div>
                              <p className="text-xs text-blue-700 leading-relaxed">{request.adminNotes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex lg:flex-col gap-2 lg:items-end flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRequest(request)}
                        className="flex items-center gap-1.5 text-xs border-gray-200 hover:border-primary-aqua hover:text-primary-aqua"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRequest(request)}
                        className="flex items-center gap-1.5 text-xs border-gray-200 hover:border-blue-400 hover:text-blue-600"
                      >
                        <Edit className="h-3.5 w-3.5" /> Update
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRequest(request.id)}
                        className="flex items-center gap-1.5 text-xs border-gray-200 text-red-500 hover:border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── View Dialog ── */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-aqua to-blue-500 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">Book Request Details</DialogTitle>
                <DialogDescription className="text-xs">
                  Request #{selectedRequest?.id} · {selectedRequest?.bookTitle}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Customer Information
                  </h4>
                  <p className="text-sm"><span className="text-gray-500">Name:</span> <strong>{selectedRequest.customerName}</strong></p>
                  <p className="text-sm break-all"><span className="text-gray-500">Email:</span> {selectedRequest.customerEmail}</p>
                  {selectedRequest.customerPhone && (
                    <p className="text-sm"><span className="text-gray-500">Phone:</span> {selectedRequest.customerPhone}</p>
                  )}
                </div>
                {/* Status */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Status & Timeline
                  </h4>
                  <StatusBadge status={selectedRequest.status || "pending"} />
                  <p className="text-sm"><span className="text-gray-500">Requested:</span> {new Date(selectedRequest.createdAt!).toLocaleString()}</p>
                  {selectedRequest.processedAt && (
                    <p className="text-sm"><span className="text-gray-500">Processed:</span> {new Date(selectedRequest.processedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {/* Book info */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Book Information
                </h4>
                <p className="text-sm"><span className="text-gray-500">Title:</span> <strong>{selectedRequest.bookTitle}</strong></p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedRequest.author && <p><span className="text-gray-500">Author:</span> {selectedRequest.author}</p>}
                  {selectedRequest.isbn && <p><span className="text-gray-500">ISBN:</span> <span className="font-mono">{selectedRequest.isbn}</span></p>}
                  {selectedRequest.binding && <p><span className="text-gray-500">Binding:</span> <span className="capitalize">{selectedRequest.binding.replace("_", " ")}</span></p>}
                  <p><span className="text-gray-500">Quantity:</span> {selectedRequest.quantity}</p>
                  {selectedRequest.expectedPrice && (
                    <p><span className="text-gray-500">Exp. Price:</span> {formatCurrency(parseFloat(selectedRequest.expectedPrice))}</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Customer Notes
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedRequest.notes}</p>
                </div>
              )}
              {selectedRequest.adminNotes && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Admin Notes
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed">{selectedRequest.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">Update Request</DialogTitle>
                <DialogDescription className="text-xs">
                  #{selectedRequest?.id} · {selectedRequest?.bookTitle}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="border-gray-200 focus:ring-primary-aqua">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                    <SelectItem key={val} value={val}>
                      <span className="flex items-center gap-2">
                        {React.createElement(cfg.icon, { className: `h-3.5 w-3.5 ${cfg.color}` })}
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Admin Notes</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this request…"
                className="min-h-[100px] border-gray-200 focus:ring-primary-aqua resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-gray-200">
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRequest}
                disabled={updateRequestMutation.isPending}
                className="bg-gradient-to-r from-primary-aqua to-blue-500 hover:from-primary-aqua/90 hover:to-blue-600 text-white shadow-sm"
              >
                {updateRequestMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…</>
                ) : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookRequestsPage;