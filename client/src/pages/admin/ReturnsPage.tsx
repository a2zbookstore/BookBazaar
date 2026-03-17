import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  RotateCcw,
  User,
  Mail,
  ShoppingBag,
  AlertTriangle,
  CreditCard,
  FileText,
  ChevronDown,
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
    paymentMethod?: string;
    paymentId?: string;
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

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: React.ReactNode; pill: string }> = {
  pending:          { label: "Pending",          style: "bg-amber-50 text-amber-700 border border-amber-200",   icon: <Clock className="h-3.5 w-3.5" />,        pill: "bg-amber-500" },
  approved:         { label: "Approved",         style: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: <CheckCircle className="h-3.5 w-3.5" />,  pill: "bg-emerald-500" },
  rejected:         { label: "Rejected",         style: "bg-red-50 text-red-700 border border-red-200",         icon: <XCircle className="h-3.5 w-3.5" />,      pill: "bg-red-500" },
  refund_processed: { label: "Refund Processed", style: "bg-blue-50 text-blue-700 border border-blue-200",      icon: <DollarSign className="h-3.5 w-3.5" />,   pill: "bg-blue-500" },
};

const getStatusCfg = (s: string) =>
  STATUS_CONFIG[s] ?? { label: s, style: "bg-gray-100 text-gray-600", icon: <Clock className="h-3.5 w-3.5" />, pill: "bg-gray-400" };

const fmt = (d: string) => { try { return format(new Date(d), "MMM d, yyyy"); } catch { return d; } };

export default function ReturnsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState("");
  const [refundReason, setRefundReason] = useState("");

  /* ── Queries ── */
  const { data: returnsData, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/returns", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const url = `/api/admin/returns${params.toString() ? "?" + params.toString() : ""}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch return requests");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const returnRequests: ReturnRequest[] = returnsData?.returnRequests || [];
  const total = returnsData?.total || 0;

  /* ── Mutations ── */
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; adminNotes?: string }) =>
      apiRequest("PUT", `/api/admin/returns/${data.id}/status`, {
        status: data.status,
        adminNotes: data.adminNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/returns"] });
      toast({ title: "✓ Status updated successfully" });
      setSelectedReturn(null);
      setNewStatus("");
      setAdminNotes("");
    },
    onError: (error: any) =>
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" }),
  });

  const processRefundMutation = useMutation({
    mutationFn: async (data: { id: number; refundMethod: string; refundReason: string }) =>
      apiRequest("POST", `/api/admin/returns/${data.id}/refund`, {
        refundMethod: data.refundMethod,
        refundReason: data.refundReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/returns"] });
      toast({ title: "✓ Refund processed successfully" });
      setSelectedReturn(null);
      setRefundMethod("");
      setRefundReason("");
    },
    onError: (error: any) =>
      toast({ title: "Error", description: error.message || "Failed to process refund", variant: "destructive" }),
  });

  const openDetail = (r: ReturnRequest) => {
    setSelectedReturn(r);
    setNewStatus(r.status);
    setAdminNotes(r.adminNotes || "");
    const pm = r.order.paymentMethod;
    setRefundMethod(pm === "razorpay" || pm === "stripe" || pm === "paypal" ? pm : "");
    setRefundReason("");
  };

  const handleUpdateStatus = () => {
    if (!selectedReturn || !newStatus) return;
    updateStatusMutation.mutate({ id: selectedReturn.id, status: newStatus, adminNotes: adminNotes.trim() || undefined });
  };

  const handleProcessRefund = () => {
    if (!selectedReturn || !refundMethod || !refundReason) return;
    processRefundMutation.mutate({ id: selectedReturn.id, refundMethod, refundReason: refundReason.trim() });
  };

  /* ── Auth guards ── */
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-rose-100 border-t-rose-500 animate-spin" />
          <RotateCcw className="absolute inset-0 m-auto h-6 w-6 text-rose-500" />
        </div>
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <XCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-red-600 font-semibold">Access Denied</p>
        </div>
      </div>
    );
  }

  /* ── Status tabs data ── */
  const STATUS_TABS = [
    { value: "all",              label: "All",             color: "bg-gray-600" },
    { value: "pending",          label: "Pending",         color: "bg-amber-500" },
    { value: "approved",         label: "Approved",        color: "bg-emerald-500" },
    { value: "rejected",         label: "Rejected",        color: "bg-red-500" },
    { value: "refund_processed", label: "Refund Processed",color: "bg-blue-500" },
  ];

  const pendingCount   = returnRequests.filter((r) => r.status === "pending").length;
  const approvedCount  = returnRequests.filter((r) => r.status === "approved").length;
  const processedCount = returnRequests.filter((r) => r.status === "refund_processed").length;
  const totalRefunds   = returnRequests.reduce((s, r) => s + parseFloat(r.totalRefundAmount || "0"), 0);

  /* ══════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* ── Header banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Return & Refund Management</h1>
            <p className="mt-1 text-sm text-rose-200">Review return requests and process refunds</p>
          </div>
          <div className="flex items-center gap-4 shrink-0 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-rose-200 uppercase tracking-wide">Total</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-300">{pendingCount}</p>
              <p className="text-xs text-rose-200 uppercase tracking-wide">Pending</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-300">${totalRefunds.toFixed(0)}</p>
              <p className="text-xs text-rose-200 uppercase tracking-wide">Refunded</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-white hover:bg-white/20 border border-white/30"
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Package className="h-5 w-5 text-rose-600" />, bg: "bg-rose-50", label: "Total Requests", value: total, sub: "all time" },
          { icon: <Clock className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50", label: "Awaiting Review", value: pendingCount, sub: "need action" },
          { icon: <CheckCircle className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50", label: "Approved", value: approvedCount, sub: "ready to refund" },
          { icon: <DollarSign className="h-5 w-5 text-blue-600" />, bg: "bg-blue-50", label: "Refunds Done", value: processedCount, sub: "completed" },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${s.bg} shrink-0`}>{s.icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{s.label}</p>
                <p className="text-xl font-bold text-gray-800 leading-tight">{s.value}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Status filter pills ── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === "all"
            ? returnRequests.length
            : returnRequests.filter((r) => r.status === tab.value).length;
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

      {/* ── Request list ── */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b px-5 py-3.5">
          <CardTitle className="text-sm font-semibold text-gray-600">
            {returnRequests.length} return request{returnRequests.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-rose-100 border-t-rose-500 animate-spin" />
              </div>
              <p className="text-sm text-gray-500">Loading return requests…</p>
            </div>
          ) : returnRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <RotateCcw className="h-12 w-12 opacity-30" />
              <p className="text-sm">No return requests found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {returnRequests.map((r) => {
                const cfg = getStatusCfg(r.status);
                const isOverdue = new Date(r.returnDeadline) < new Date() && r.status === "pending";
                return (
                  <div
                    key={r.id}
                    className="flex gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-rose-50/20 transition-colors group"
                  >
                    {/* Icon column */}
                    <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 h-fit ${
                      r.status === "refund_processed" ? "bg-blue-50" :
                      r.status === "approved"         ? "bg-emerald-50" :
                      r.status === "rejected"         ? "bg-red-50" : "bg-amber-50"
                    }`}>
                      <RotateCcw className={`h-4 w-4 ${
                        r.status === "refund_processed" ? "text-blue-500" :
                        r.status === "approved"         ? "text-emerald-500" :
                        r.status === "rejected"         ? "text-red-500" : "text-amber-500"
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Row 1: ID + badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm">Return #{r.id}</span>
                        <span className="text-gray-400 text-xs">→ Order #{r.orderId}</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.style}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </span>
                        )}
                      </div>

                      {/* Row 2: customer + refund + deadline */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">{r.customerName}</p>
                            <p className="text-xs text-gray-400 truncate">{r.customerEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <div>
                            <p className="font-bold text-emerald-700">${parseFloat(r.totalRefundAmount).toFixed(2)}</p>
                            <p className="text-xs text-gray-400">{r.itemsToReturn.length} item{r.itemsToReturn.length !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-700">Submitted {fmt(r.createdAt)}</p>
                            <p className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                              Deadline {fmt(r.returnDeadline)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Reason pill */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                          {r.returnReason.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* View button */}
                    <div className="shrink-0 flex items-start pt-0.5">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(r)}
                            className="h-9 px-3 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl opacity-70 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Review
                          </Button>
                        </DialogTrigger>

                        {/* ── Detail Dialog ── */}
                        <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                          <DialogHeader className="sr-only">
                            <DialogTitle>Return #{r.id}</DialogTitle>
                          </DialogHeader>

                          {/* Hero */}
                          <div className="bg-gradient-to-br from-rose-600 to-pink-700 p-5 text-white shrink-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                  <RotateCcw className="h-5 w-5" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg">Return #{r.id}</h3>
                                  <p className="text-sm text-rose-200">Order #{r.orderId} · {fmt(r.createdAt)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold">${parseFloat(r.totalRefundAmount).toFixed(2)}</p>
                                <p className="text-xs text-rose-200">Refund Amount</p>
                              </div>
                            </div>
                          </div>

                          <div className="overflow-y-auto flex-1 p-5 space-y-5">

                            {/* Status pill */}
                            <div className="flex flex-wrap gap-2">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${getStatusCfg(r.status).style}`}>
                                {getStatusCfg(r.status).icon} {getStatusCfg(r.status).label}
                              </span>
                              {r.order.paymentMethod && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                                  <CreditCard className="h-3 w-3" /> {r.order.paymentMethod}
                                </span>
                              )}
                            </div>

                            {/* Customer + reason */}
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</p>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <div className="p-1 bg-white rounded border border-gray-100">
                                    <User className="h-3 w-3 text-rose-500" />
                                  </div>
                                  <span className="font-medium">{r.customerName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <div className="p-1 bg-white rounded border border-gray-100">
                                    <Mail className="h-3 w-3 text-gray-400" />
                                  </div>
                                  <span className="truncate">{r.customerEmail}</span>
                                </div>
                              </div>
                              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Return Reason</p>
                                <p className="text-sm font-medium text-gray-800 capitalize">{r.returnReason.replace(/_/g, " ")}</p>
                                <p className="text-xs text-gray-500 line-clamp-3">{r.returnDescription}</p>
                              </div>
                            </div>

                            {/* Items */}
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Items to Return</p>
                              </div>
                              <div className="divide-y divide-gray-50">
                                {r.itemsToReturn.map((item, idx) => {
                                  const oi = r.order.items.find((o) => o.bookId === item.bookId);
                                  if (!oi) return null;
                                  return (
                                    <div key={idx} className="flex items-center gap-3 px-4 py-3">
                                      <div className="w-8 h-8 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                                        {item.quantity}×
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-800 truncate">{oi.title}</p>
                                        <p className="text-xs text-gray-500">by {oi.author}</p>
                                        <p className="text-xs text-rose-600 capitalize">{item.reason.replace(/_/g, " ")}</p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <p className="font-semibold text-sm text-gray-800">${(parseFloat(oi.price) * item.quantity).toFixed(2)}</p>
                                        <p className="text-xs text-gray-400">${parseFloat(oi.price).toFixed(2)} ea</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 border-t border-emerald-100">
                                <span className="text-sm font-semibold text-emerald-800">Total Refund</span>
                                <span className="text-lg font-bold text-emerald-700">${parseFloat(r.totalRefundAmount).toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Previous admin notes */}
                            {r.adminNotes && (
                              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Admin Notes</p>
                                <p className="text-sm text-blue-800">{r.adminNotes}</p>
                              </div>
                            )}

                            {/* Refund info if processed */}
                            {r.refundProcessedAt && (
                              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Refund Processed</p>
                                <div className="grid grid-cols-2 gap-1 text-sm text-emerald-800">
                                  <span className="text-emerald-500 text-xs">Method</span>
                                  <span className="font-medium capitalize">{r.refundMethod}</span>
                                  <span className="text-emerald-500 text-xs">Transaction ID</span>
                                  <span className="font-mono text-xs">{r.refundTransactionId}</span>
                                  <span className="text-emerald-500 text-xs">Processed</span>
                                  <span>{fmt(r.refundProcessedAt)}</span>
                                </div>
                              </div>
                            )}

                            {/* ── Status Update ── */}
                            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Update Status</p>

                              <div className="grid sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-500">New Status</Label>
                                  <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    onClick={handleUpdateStatus}
                                    disabled={updateStatusMutation.isPending || !newStatus}
                                    className="w-full bg-rose-600 hover:bg-rose-700 rounded-xl"
                                  >
                                    {updateStatusMutation.isPending ? (
                                      <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</span>
                                    ) : "Save Status"}
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Admin Notes (shown to customer)</Label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add a note for the customer…"
                                  rows={2}
                                  className="rounded-xl resize-none"
                                />
                              </div>

                              {/* Process Refund section — only when approved */}
                              {r.status === "approved" && (
                                <div className="space-y-3 pt-2 border-t border-dashed border-gray-200">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Process Refund</p>

                                  {r.order.paymentMethod && (
                                    <div className="flex items-start gap-2 text-xs bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-700">
                                      <CreditCard className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                      <span>
                                        Original payment via <strong className="capitalize">{r.order.paymentMethod}</strong>
                                        {r.order.paymentId && <span className="font-mono text-blue-400 ml-1">({r.order.paymentId})</span>}.
                                        Matching method triggers an automatic gateway refund.
                                      </span>
                                    </div>
                                  )}

                                  <div className="grid sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs text-gray-500">Refund Method</Label>
                                      <select
                                        value={refundMethod}
                                        onChange={(e) => setRefundMethod(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none"
                                      >
                                        <option value="">Select Method</option>
                                        <option value="paypal">PayPal</option>
                                        <option value="razorpay">Razorpay (auto)</option>
                                        <option value="stripe">Stripe (auto)</option>
                                        <option value="bank_transfer">Bank Transfer (manual)</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-gray-500">Refund Reason</Label>
                                      <Input
                                        placeholder="e.g. Damaged item"
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        className="rounded-xl"
                                      />
                                    </div>
                                  </div>

                                  <Button
                                    onClick={handleProcessRefund}
                                    disabled={processRefundMutation.isPending || !refundMethod || !refundReason}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                                  >
                                    {processRefundMutation.isPending ? (
                                      <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Processing…</span>
                                    ) : <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Process Refund ${parseFloat(r.totalRefundAmount).toFixed(2)}</span>}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
