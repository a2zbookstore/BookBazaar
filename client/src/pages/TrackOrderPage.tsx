import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package, Truck, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp, Calendar, MapPin, FileDown,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "@/hooks/use-toast";

/* ─── types ─── */
interface OrderItem { title: string; author: string; quantity: number; price: string; book?: { imageUrl?: string; title?: string; author?: string }; }
interface Order {
  id: number; status: string; total: string; subtotal?: string; shipping?: string; tax?: string;
  trackingNumber?: string; shippingCarrier?: string; notes?: string;
  createdAt: string; updatedAt: string;
  customerName: string; customerEmail: string; customerPhone?: string;
  paymentMethod?: string; paymentId?: string; paymentStatus?: string;
  shippingAddress?: any;
  items: OrderItem[];
}

/* ─── look-up tables ─── */
const statusColors: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800",
  confirmed:  "bg-blue-100   text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped:    "bg-green-100  text-green-800",
  delivered:  "bg-emerald-100 text-emerald-800",
  cancelled:  "bg-red-100    text-red-800",
};
const statusLabels: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};
const statusDescriptions: Record<string, string> = {
  pending:    "Your order has been received and is awaiting confirmation.",
  confirmed:  "Your order has been confirmed and is being prepared.",
  processing: "Your order is being processed and packaged.",
  shipped:    "Your order has been shipped and is on its way to you.",
  delivered:  "Your order has been delivered successfully.",
  cancelled:  "Your order has been cancelled.",
};

const TIMELINE_STEPS = [
  { key: "pending",    label: "Order Placed",     desc: "We received your order" },
  { key: "confirmed",  label: "Confirmed",         desc: "Your order is confirmed" },
  { key: "processing", label: "Processing",        desc: "Being packaged for dispatch" },
  { key: "shipped",    label: "Shipped",           desc: "On its way to you" },
  { key: "delivered",  label: "Delivered",         desc: "Order delivered successfully" },
];
const STATUS_ORDER = ["pending","confirmed","processing","shipped","delivered"];

/* ─── step progress bar ─── */
function TrackingTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 px-1 py-3 text-sm text-red-600">
        <XCircle className="h-4 w-4 flex-shrink-0" />
        This order was cancelled.
      </div>
    );
  }
  const currentIdx = STATUS_ORDER.indexOf(status);
  return (
    <div className="py-4 px-1">
      <div className="flex items-start gap-0">
        {TIMELINE_STEPS.map((step, i) => {
          const done    = i <= currentIdx;
          const active  = i === currentIdx;
          const isLast  = i === TIMELINE_STEPS.length - 1;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {/* connector line */}
              {!isLast && (
                <div className={`absolute top-3.5 left-1/2 w-full h-0.5 ${done && i < currentIdx ? "bg-green-400" : "bg-gray-200"}`} />
              )}
              {/* dot */}
              <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                done
                  ? active
                    ? "bg-green-500 border-green-500 text-white ring-4 ring-green-100"
                    : "bg-green-500 border-green-500 text-white"
                  : "bg-white border-gray-300 text-gray-400"
              }`}>
                {done && !active ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {/* label */}
              <p className={`mt-2 text-center text-xs leading-tight font-semibold ${active ? "text-green-600" : done ? "text-gray-700" : "text-gray-400"}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── single order card ─── */
function OrderCard({ order, expanded, onToggle }: { order: Order; expanded: boolean; onToggle: () => void }) {
  const statusKey = order.status.toLowerCase();
  const addr = order.shippingAddress ?? {};
  const shippingLines = [
    addr.street || addr.address,
    [addr.city, addr.state || addr.region].filter(Boolean).join(", "),
    [addr.postalCode || addr.zip, addr.country].filter(Boolean).join(" "),
  ].filter(Boolean);

  const downloadInvoice = async () => {
    try {
      const response = await fetch(`/api/orders/${order.id}/invoice`, { credentials: "include" });
      if (!response.ok) { toast({ title: "Failed to load invoice", variant: "destructive" }); return; }
      const html = await response.text();
      const win = window.open("", "_blank");
      if (win) { win.document.write(html); win.document.close(); }
    } catch { toast({ title: "Error", description: "Could not open invoice.", variant: "destructive" }); }
  };

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* ── card header — always visible, clickable ── */}
      <button
        onClick={onToggle}
        className="w-full text-left bg-gradient-to-r from-slate-50 to-gray-100 hover:from-gray-100 hover:to-slate-100 transition-colors duration-150 px-5 py-4 border-b border-gray-200 focus:outline-none"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Order</p>
            <p className="text-lg font-bold mt-0.5 text-gray-900">#{order.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${statusColors[statusKey] ?? "bg-gray-100 text-gray-800"} px-3 py-1 text-xs font-semibold rounded-full`}>
              {statusLabels[statusKey] ?? order.status}
            </Badge>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-widest">Total</p>
              <p className="text-xl font-bold text-gray-900">${parseFloat(order.total).toFixed(2)}</p>
            </div>
            <div className={`ml-1 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(order.createdAt), "dd MMM yyyy")}
          </span>
          <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
          {order.trackingNumber && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <Truck className="h-3 w-3" /> Tracking available
            </span>
          )}
        </div>
      </button>

      {/* ── expanded content ── */}
      {expanded && (
        <div className="bg-white">
          {/* status description banner */}
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 text-sm text-blue-800">
            {statusDescriptions[statusKey] ?? "Your order status has been updated."}
          </div>

          {/* tracking timeline */}
          <div className="px-5 border-b border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 pt-4 pb-1">Shipment Progress</p>
            <TrackingTimeline status={statusKey} />
          </div>

          {/* tracking details + payment + shipping address — all in one row */}
          <div className="mx-5 my-4 grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* tracking details */}
            {order.trackingNumber && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-blue-100">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Tracking Details</p>
                </div>
                <div className="px-4 py-3 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 flex-shrink-0">Tracking #</span>
                    <span className="font-mono font-semibold text-blue-800 truncate">{order.trackingNumber}</span>
                  </div>
                  {order.shippingCarrier && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Carrier</span>
                      <span className="font-semibold text-blue-800">{order.shippingCarrier}</span>
                    </div>
                  )}
                  {order.notes && <p className="text-gray-400 text-xs italic mt-1">{order.notes}</p>}
                </div>
              </div>
            )}

            {/* payment details */}
            {(order.paymentStatus || order.paymentMethod || order.paymentId) && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Payment Details</p>
                </div>
                <div className="px-4 py-3 space-y-1.5 text-sm">
                  {order.paymentStatus && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-semibold capitalize ${
                        order.paymentStatus === "paid" ? "text-green-600" :
                        order.paymentStatus === "pending" ? "text-yellow-600" : "text-red-600"
                      }`}>{order.paymentStatus}</span>
                    </div>
                  )}
                  {order.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Method</span>
                      <span className="font-medium text-gray-800 capitalize">{order.paymentMethod.replace(/-/g, " ")}</span>
                    </div>
                  )}
                  {order.paymentId && (
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">Payment ID</span>
                      <span className="font-mono text-xs text-gray-700 truncate">{order.paymentId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* shipping address */}
            {shippingLines.length > 0 && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Ship To</p>
                </div>
                <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed space-y-0.5">
                  <p className="font-medium text-gray-900">{shippingLines[0]}</p>
                  {shippingLines.slice(1).map((l, i) => <p key={i}>{l}</p>)}
                </div>
              </div>
            )}
          </div>

          {/* items */}
          <div className="mx-5 mb-4 rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Items Ordered</p>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {item.book?.imageUrl ? (
                    <img src={item.book.imageUrl} alt={item.title} className="w-10 h-14 object-cover rounded-lg shadow-sm flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.book?.title || item.title}</p>
                    <p className="text-xs text-gray-500">{item.book?.author || item.author}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* footer row: order summary */}
          <div className="mx-5 mb-5">
            <div className="rounded-xl border border-gray-200">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Order Summary</p>
              </div>
              <div className="px-4 py-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>${parseFloat(order.subtotal || "0").toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span>{parseFloat(order.shipping || "0") === 0 ? <span className="text-green-600 font-semibold">FREE</span> : `$${parseFloat(order.shipping!).toFixed(2)}`}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>${parseFloat(order.total).toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          {/* action buttons */}
          <div className="px-5 pb-5 flex flex-wrap gap-2">
            <Link href={`/orders/${order.id}`}>
              <Button variant="outline" size="sm" className="rounded-full border-gray-300 hover:border-primary-aqua hover:text-primary-aqua transition-colors">
                View Full Details
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={downloadInvoice} className="rounded-full border-gray-300 hover:border-primary-aqua hover:text-primary-aqua transition-colors flex items-center gap-1.5">
              <FileDown className="h-4 w-4" /> Invoice
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ PAGE ═══════════════════════════════════════════ */
export default function TrackOrderPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/my-orders"],
  });

  const toggle = (id: number) => setExpandedId(prev => prev === id ? null : id);

  /* ── SKELETON ── */
  if (isLoading) {
    return (
      <div className="container-custom animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-40 mb-6"></div>
        <div className="h-8 bg-gray-200 rounded w-56 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-72 mb-8"></div>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 px-5 py-4 flex justify-between">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                  <div className="h-6 bg-gray-300 rounded w-24"></div>
                  <div className="h-3 bg-gray-300 rounded w-32 mt-1"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-5 bg-gray-300 rounded w-20"></div>
                  <div className="h-6 bg-gray-300 rounded w-28"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Track Your Orders"
        description="Track your book orders from A2Z BOOKSHOP. Check shipping status, delivery updates, and tracking information."
        keywords="track order, order status, shipping tracking, delivery status"
        url="https://a2zbookshop.com/track-order"
        type="website"
      />
      <div className="container-custom">
        <Breadcrumb items={[{ label: "Track Orders" }]} className="mb-6" />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-black">Track Your Orders</h1>
          <p className="text-secondary-black mt-1.5">
            Click on any order below to see its live shipment progress.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6 text-sm">Once you place an order, you can track it here.</p>
            <Link href="/books">
              <Button className="rounded-full bg-primary-aqua hover:bg-secondary-aqua text-white">Browse Books</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders
              .slice()
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedId === order.id}
                  onToggle={() => toggle(order.id)}
                />
              ))}
          </div>
        )}
      </div>
    </>
  );
}