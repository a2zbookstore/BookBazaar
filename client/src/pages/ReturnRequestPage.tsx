import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Package, Calendar, AlertCircle, ArrowLeft, FileText,
  History, Clock, XCircle, DollarSign, CheckCircle, ChevronRight,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import SEO from "@/components/SEO";
import Breadcrumb from "@/components/Breadcrumb";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";

/* ─── types ─── */
interface Order {
  id: number; customerEmail: string; customerName: string;
  totalAmount: string; status: string; createdAt: string; items: OrderItem[];
}
interface OrderItem { id: number; bookId: number; quantity: number; price: string; title: string; author: string; imageUrl?: string | null; }
interface ReturnItem { bookId: number; quantity: number; reason: string; }
interface ReturnRequest {
  id: number; orderId: number; customerName: string; customerEmail: string;
  returnReason: string; returnDescription: string; totalRefundAmount: string;
  status: string; createdAt: string; returnRequestNumber: string;
  order: { id: number; customerName: string; totalAmount: string; createdAt: string; items: OrderItem[]; };
}

/* ─── helpers ─── */
const returnReasons = [
  { value: "damaged", label: "Item arrived damaged" },
  { value: "defective", label: "Item is defective / not working" },
  { value: "wrong_item", label: "Wrong item sent" },
  { value: "not_as_described", label: "Item not as described" },
  { value: "other", label: "Other reason" },
];

const returnStatusStyle: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100   text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  refund_processed: "bg-green-100  text-green-800",
  rejected: "bg-red-100    text-red-800",
  cancelled: "bg-gray-100   text-gray-800",
};
const ReturnStatusIcon: Record<string, JSX.Element> = {
  pending: <Clock className="h-3 w-3" />,
  approved: <CheckCircle className="h-3 w-3" />,
  processing: <Package className="h-3 w-3" />,
  refund_processed: <DollarSign className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
};

/* ─── step indicator ─── */
function StepIndicator({ step }: { step: number }) {
  const steps = ["Select Order", "Return Details", "Confirmation"];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${done ? "bg-green-500 border-green-500 text-white" :
                active ? "bg-gradient-to-br from-slate-800 to-slate-700 border-slate-700 text-white ring-4 ring-slate-200" :
                  "bg-white border-gray-300 text-gray-400"
                }`}>
                {done ? <CheckCircle className="w-4 h-4" /> : idx}
              </div>
              <span className={`mt-1.5 text-xs font-semibold hidden sm:block ${active ? "text-slate-700" : done ? "text-green-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-12 sm:w-20 mx-2 mb-4 sm:mb-5 ${step > idx ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── section card wrapper ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</p>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════ PAGE ═══════════════════════════════════════════ */
export default function ReturnRequestPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [returnRequestNumber, setReturnRequestNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [returnReason, setReturnReason] = useState("none");
  const [returnDescription, setReturnDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState<ReturnItem[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to request a return.", variant: "destructive" });
      setLocation("/login?redirect=/");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setCustomerName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
      setCustomerEmail(user.email || "");
    }
  }, [user]);

  const { data: eligibleOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/returns/eligible-orders", guestEmail],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!isAuthenticated && guestEmail) params.append("email", guestEmail);
      const url = `/api/returns/eligible-orders${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch eligible orders");
      return res.json();
    },
    enabled: isAuthenticated || (!isAuthenticated && guestEmail.length > 0 && guestEmail.includes("@")),
  });

  const { data: returnHistory = [], isLoading: historyLoading } = useQuery<ReturnRequest[]>({
    queryKey: ["/api/returns/my-returns", guestEmail],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!isAuthenticated && guestEmail) params.append("email", guestEmail);
      const url = `/api/returns/my-returns${params.toString() ? "?" + params.toString() : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch return history");
      return res.json();
    },
    enabled: isAuthenticated || (!isAuthenticated && guestEmail.length > 0 && guestEmail.includes("@")),
  });

  const selectedOrder = eligibleOrders.find(o => o.id === selectedOrderId);

  const createReturnMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/returns/request", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      setReturnRequestNumber(data.returnRequestNumber);
      toast({ title: "Return Request Submitted", description: "We'll review it within 24 hours." });
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ["/api/returns/my-requests"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit return request", variant: "destructive" });
    },
  });

  const handleItemSelection = (bookId: number, quantity: number, reason: string) => {
    const idx = selectedItems.findIndex(i => i.bookId === bookId);
    if (quantity === 0 || !reason || reason === "none") {
      if (idx !== -1) setSelectedItems(prev => prev.filter((_, i) => i !== idx));
    } else {
      const newItem = { bookId, quantity, reason };
      if (idx !== -1) setSelectedItems(prev => prev.map((item, i) => i === idx ? newItem : item));
      else setSelectedItems(prev => [...prev, newItem]);
    }
  };

  const calculateRefund = () =>
    selectedItems.reduce((total, si) => {
      const oi = selectedOrder?.items.find(i => i.bookId === si.bookId);
      return total + (oi ? parseFloat(oi.price) * si.quantity : 0);
    }, 0);

  const handleSubmit = () => {
    if (!selectedOrderId || returnReason === "none" || !returnDescription || selectedItems.length === 0) {
      toast({ title: "Missing Information", description: "Please fill in all required fields and select items to return.", variant: "destructive" });
      return;
    }
    createReturnMutation.mutate({ orderId: selectedOrderId, returnReason, returnDescription, itemsToReturn: selectedItems, customerName: customerName.trim(), customerEmail: customerEmail.trim() });
  };

  const canProceed = selectedOrderId && (user || (guestEmail && customerName && customerEmail));

  return (
    <>
      <SEO
        title="Return & Refund Request - A2Z BOOKSHOP"
        description="Easily request a return and refund for your orders within 30 days of delivery at A2Z BOOKSHOP."
        url="https://a2zbookshop.com/return-request"
        type="website"
        noindex
      />
      <div className="container-custom">
        <Breadcrumb items={[{ label: "Return & Refund" }]} className="mb-6" />

        {/* ── HERO HEADER ── */}
        {/* <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-8">
          <div className="bg-gradient-to-r from-slate-50 via-white to-gray-50 px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">Request Return & Refund</h1>
              <p className="text-sm text-gray-500 mt-1">Return your order within <span className="font-semibold text-gray-700">30 days</span> of delivery for a full refund.</p>
            </div>
        
          </div>
          <div className="h-1 bg-gradient-to-r from-slate-800 via-slate-600 to-slate-400" />
        </div> */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-black">Request Return & Refund</h1>
          <p className="text-sm text-gray-500 mt-1">Return your order within <span className="font-semibold text-gray-700">30 days</span> of delivery for a full refund.</p>

        </div>
        <StepIndicator step={step} />

        {/* ── RETURN HISTORY ── */}
        {returnHistory.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-gray-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Previous Return Requests</p>
            </div>
            <div className="space-y-4">
              {historyLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2].map(i => (
                    <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="h-16 bg-gray-100" />
                      <div className="px-5 py-4 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-4 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : returnHistory.map(req => (
                <div key={req.id} className="overflow-hidden border border-gray-200 shadow-sm rounded-2xl">
                  {/* ── card header — same pattern as order cards ── */}
                  <div className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Left: request number + status + date */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Return</p>
                          <p className="text-base font-bold text-gray-900 font-mono">
                            {req.returnRequestNumber || `REQ-${req.id}`}
                          </p>
                          <Badge className={`${returnStatusStyle[req.status] ?? "bg-gray-100 text-gray-800"} px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ml-1`}>
                            {ReturnStatusIcon[req.status]}
                            {req.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Order #{req.order.id} · {format(new Date(req.createdAt), "dd MMM yyyy")}
                        </p>
                      </div>
                      {/* Right: refund amount */}
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Refund</p>
                        <p className="text-xl font-bold text-gray-900">${parseFloat(req.totalRefundAmount).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* ── card body ── */}
                  <div className="px-5 py-4 space-y-3 bg-white">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Items in Return</p>
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                      {req.order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.imageUrl
                              ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                              : <FileText className="w-4 h-4 text-gray-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.author}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                    {req.returnDescription && (
                      <p className="text-xs text-gray-400 italic">"{req.returnDescription}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════ STEP 1 ════════════ */}
        {step === 1 && (
          <div className="space-y-4">
            {!user && (
              <Section title="Your Details">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="guestEmail" className="text-xs text-gray-500 uppercase tracking-wide">Email to find your orders</Label>
                    <Input id="guestEmail" type="email" placeholder="your@email.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="customerName" className="text-xs text-gray-500 uppercase tracking-wide">Full Name</Label>
                      <Input id="customerName" placeholder="John Doe" value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail" className="text-xs text-gray-500 uppercase tracking-wide">Contact Email</Label>
                      <Input id="customerEmail" type="email" placeholder="For return updates" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </div>
              </Section>
            )}

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <p className=" font-semibold uppercase tracking-widest text-gray-500">Select Order to Return</p>
              </div>
              <div className="p-4">
                {ordersLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
                  </div>
                ) : eligibleOrders.length === 0 ? (
                  <div className="text-center py-10">
                    <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="font-semibold text-gray-700 mb-1">No Eligible Orders</h3>
                    <p className="text-sm text-gray-500 mb-3">No delivered orders are within the 30-day return window.</p>
                    <Link href="/my-orders">
                      <Button variant="outline" size="sm" className="rounded-full">View My Orders</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">

                    {eligibleOrders.map(order => {
                      const previewItems = order.items.slice(0, 2);
                      const extraCount = order.items.length - previewItems.length;
                      const isSelected = selectedOrderId === order.id;
                      return (
                        <button
                          key={order.id}
                          onClick={() => setSelectedOrderId(order.id)}
                          className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all shadow-sm ${isSelected
                            ? "border-primary-aqua"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          {/* card header */}
                          <div className={`px-5 py-3 border-b ${isSelected ? "bg-cyan-50 border-cyan-100" : "bg-gradient-to-r from-slate-50 to-gray-100 border-gray-200"}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex-shrink-0">Order</p>
                                <p className="text-base font-bold text-gray-900 flex-shrink-0">#{order.id}</p>
                                <Badge className="bg-green-100 text-green-800 px-2 py-0.5 text-xs rounded-full flex-shrink-0">Delivered</Badge>
                                <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(order.createdAt), "dd MMM yyyy")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-base font-bold text-gray-900">${parseFloat(order.total).toFixed(2)}</span>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "bg-primary-aqua border-primary-aqua" : "border-gray-300"}`}>
                                  {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* books list */}
                          <div className="bg-white px-5 py-3 space-y-2">
                            {previewItems.map(item => (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="w-8 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden border border-gray-200">
                                  {item.imageUrl
                                    ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                    : <FileText className="w-4 h-4 text-gray-400 m-auto mt-2.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                                  <p className="text-xs text-gray-400 line-clamp-1">{item.author} · Qty: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-semibold text-gray-700 flex-shrink-0">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                              </div>
                            ))}
                            {extraCount > 0 && (
                              <p className="text-xs text-gray-400 pl-11">+{extraCount} more item{extraCount !== 1 ? "s" : ""}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceed}
                className="rounded-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white flex items-center gap-1.5 px-6"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ════════════ STEP 2 ════════════ */}
        {step === 2 && selectedOrder && (
          <div className="space-y-4">
            {/* selected order banner */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Returning From</p>
              </div>
              <div className="px-4 py-3 flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-900">Order #{selectedOrder.id}</span>
                <span className="text-gray-500">{format(new Date(selectedOrder.createdAt), "dd MMM yyyy")}</span>
              </div>
            </div>

            <Section title="Reason for Return">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Overall Reason *</Label>
                  <select
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                    className="rounded-[4px] mt-1 w-full p-2.5 border border-gray-200 text-sm focus:ring-2 focus:ring-primary-aqua focus:border-transparent bg-white"
                  >
                    <option value="none">Select a reason…</option>
                    {returnReasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 uppercase tracking-wide">Detailed Description *</Label>
                  <Textarea
                    className="rounded-[4px] mt-1 text-sm"
                    placeholder="Please describe the issue in detail…"
                    value={returnDescription}
                    onChange={e => setReturnDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </Section>

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Select Items to Return *</p>
              </div>
              <div className="divide-y divide-gray-100">
                {selectedOrder.items.map(item => {
                  const si = selectedItems.find(s => s.bookId === item.bookId);
                  return (
                    <div key={item.id} className="px-4 py-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                            {item.imageUrl
                              ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                              : <FileText className="w-4 h-4 text-gray-400" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-500">by {item.author}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-gray-900">${parseFloat(item.price).toFixed(2)}</p>
                          <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-400 uppercase tracking-wide">Return Qty</Label>
                          <select
                            value={si?.quantity?.toString() || "0"}
                            onChange={e => handleItemSelection(item.bookId, parseInt(e.target.value), si?.reason || returnReason || "none")}
                            className="rounded-[4px] mt-1 w-full p-2 border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-primary-aqua focus:border-transparent"
                          >
                            <option value="0">Don't return</option>
                            {Array.from({ length: item.quantity }, (_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400 uppercase tracking-wide">Item Reason</Label>
                          <select
                            value={si?.reason || "none"}
                            onChange={e => { if (e.target.value !== "none") handleItemSelection(item.bookId, si?.quantity || 0, e.target.value); }}
                            className="rounded-[4px] mt-1 w-full p-2 border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-primary-aqua focus:border-transparent"
                          >
                            <option value="none">Select reason</option>
                            {returnReasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* refund summary */}
            {selectedItems.length > 0 && (
              <div className="rounded-xl border border-green-200 overflow-hidden">
                <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-green-600">Estimated Refund Breakdown</p>
                  <span className="text-xs text-green-500">{selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected</span>
                </div>
                <div className="bg-white divide-y divide-gray-100">
                  {selectedItems.map(si => {
                    const oi = selectedOrder?.items.find(i => i.bookId === si.bookId);
                    if (!oi) return null;
                    const lineTotal = parseFloat(oi.price) * si.quantity;
                    return (
                      <div key={si.bookId} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden border border-gray-200">
                          {oi.imageUrl
                            ? <img src={oi.imageUrl} alt={oi.title} className="w-full h-full object-cover" />
                            : <FileText className="w-4 h-4 text-gray-400 m-auto mt-2.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{oi.title}</p>
                          <p className="text-xs text-gray-400">${parseFloat(oi.price).toFixed(2)} × {si.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 flex-shrink-0">${lineTotal.toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-green-50 border-t border-green-200 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-green-600">Total Refund</p>
                    <p className="text-xs text-gray-400 mt-0.5">Returned to your original payment method once approved</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">${calculateRefund().toFixed(2)}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-full flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createReturnMutation.isPending || selectedItems.length === 0}
                className="rounded-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white px-6"
              >
                {createReturnMutation.isPending ? "Submitting…" : "Submit Return Request"}
              </Button>
            </div>
          </div>
        )}

        {/* ════════════ STEP 3 ════════════ */}
        {step === 3 && (
          <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200">
            <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-6 text-white text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Request Submitted!</h2>
              <p className="text-green-100 text-sm mt-1">We'll review it within 24 hours and email you next steps.</p>
            </div>

            <div className="bg-white px-6 py-6 space-y-4">
              {returnRequestNumber && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-green-500 mb-1">Your Request Number</p>
                  <p className="text-xl font-mono font-bold text-green-800">{returnRequestNumber}</p>
                  <p className="text-xs text-gray-400 mt-1">Save this for your records</p>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Next Steps</p>
                </div>
                <div className="px-4 py-4 space-y-3">
                  {[
                    "We'll review your request within 24 hours",
                    "If approved, you'll receive return shipping instructions via email",
                    "Pack items securely and ship back within 30 days",
                    "Refund will be processed once items are received and inspected",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                      <span className="text-gray-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/my-orders">
                  <Button variant="outline" className="rounded-full flex-1 sm:flex-none">View My Orders</Button>
                </Link>
                <Link href="/">
                  <Button className="rounded-full flex-1 sm:flex-none bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
