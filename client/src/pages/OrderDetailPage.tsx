import { useState } from "react";
import { useParams, useSearch, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, Clock, Package, Truck, FileDown, ArrowLeft, CreditCard, Calendar, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100   text-blue-800",
  processing:"bg-blue-100   text-blue-800",
  shipped:   "bg-purple-100 text-purple-800",
  delivered: "bg-green-100  text-green-800",
  cancelled: "bg-red-100    text-red-800",
};

const statusLabels: Record<string, string> = {
  pending:    "Pending",
  confirmed:  "Confirmed",
  processing: "Processing",
  shipped:    "Shipped",
  delivered:  "Delivered",
  cancelled:  "Cancelled",
};

const statusIcons: Record<string, JSX.Element> = {
  pending:    <Clock    className="w-4 h-4" />,
  confirmed:  <CheckCircle className="w-4 h-4" />,
  processing: <Package  className="w-4 h-4" />,
  shipped:    <Truck    className="w-4 h-4" />,
  delivered:  <CheckCircle className="w-4 h-4" />,
  cancelled:  <Clock    className="w-4 h-4" />,
};

const CANCELABLE_STATUSES = ["pending", "confirmed"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const search = useSearch();
  const urlParams = new URLSearchParams(search);
  const email = urlParams.get("email");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: [`/api/orders/${id}${email ? `?email=${encodeURIComponent(email)}` : ""}`],
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = {};
      if (email) body.email = email;
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to cancel order");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Order Cancelled", description: "Your order has been successfully cancelled." });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}${email ? `?email=${encodeURIComponent(email)}` : ""}`] });
      setShowCancelDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Cancellation Failed", description: error.message, variant: "destructive" });
      setShowCancelDialog(false);
    },
  });

  const downloadInvoice = async () => {
    try {
      const emailParam = email ? `?email=${encodeURIComponent(email)}` : "";
      const response = await fetch(`/api/orders/${id}/invoice${emailParam}`, { credentials: "include" });
      if (!response.ok) {
        toast({ title: "Failed to load invoice", description: "Please try again.", variant: "destructive" });
        return;
      }
      const html = await response.text();
      const win = window.open("", "_blank");
      if (win) { win.document.write(html); win.document.close(); }
    } catch {
      toast({ title: "Error", description: "Could not open invoice.", variant: "destructive" });
    }
  };

  /* ── SKELETON ── */
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-48 mb-6"></div>
        {/* Hero header skeleton */}
        <div className="rounded-2xl overflow-hidden mb-6 shadow-md">
          <div className="bg-slate-700 px-6 py-5 flex justify-between">
            <div className="space-y-2">
              <div className="h-3 bg-slate-500 rounded w-24"></div>
              <div className="h-7 bg-slate-500 rounded w-32"></div>
              <div className="h-3 bg-slate-500 rounded w-40 mt-2"></div>
            </div>
            <div className="text-right space-y-2">
              <div className="h-5 bg-slate-500 rounded w-20"></div>
              <div className="h-8 bg-slate-500 rounded w-28"></div>
            </div>
          </div>
          <div className="bg-white px-6 py-4 flex gap-3 border-t border-gray-100">
            <div className="h-9 bg-gray-200 rounded-full w-32"></div>
            <div className="h-9 bg-gray-200 rounded-full w-32"></div>
          </div>
        </div>
        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1,2].map(i => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                </div>
                <div className="px-4 py-4 space-y-4">
                  {[1,2,3].map(j => (
                    <div key={j} className="flex gap-4">
                      <div className="w-12 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16 flex-shrink-0"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="px-4 py-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── NOT FOUND ── */
  if (!order) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
        <p className="text-gray-600 mb-6">This order doesn't exist or you don't have permission to view it.</p>
        <Link href="/my-orders">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Orders
          </Button>
        </Link>
      </div>
    );
  }

  const statusKey = (order as any).status?.toLowerCase() ?? "";
  const addr      = (order as any).shippingAddress ?? {};
  const shippingLines = [
    addr.street || addr.address,
    [addr.city, addr.state || addr.region].filter(Boolean).join(", "),
    [addr.postalCode || addr.zip, addr.country].filter(Boolean).join(" "),
  ].filter(Boolean);

  return (
    <>
      <SEO
        title={`Order #${(order as any).id} - Order Details`}
        description="View your order details, track shipment, and download invoice from A2Z BOOKSHOP."
        url={`https://a2zbookshop.com/orders/${(order as any).id}`}
        type="website"
        noindex
      />
      <div className="max-w-6xl mx-auto py-8 px-4">

        {/* ── HERO CARD ── */}
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 mb-6">
          {/* Dark header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">Order Details</p>
                <p className="text-2xl font-bold mt-0.5">#{(order as any).id}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={`${statusColors[statusKey] ?? "bg-gray-100 text-gray-800"} px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1`}>
                  {statusIcons[statusKey]}
                  {statusLabels[statusKey] ?? (order as any).status}
                </Badge>
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Total</p>
                  <p className="text-2xl font-bold">${parseFloat((order as any).total).toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Placed {formatDistanceToNow(new Date((order as any).createdAt), { addSuffix: true })}
              </span>
              {(order as any).paymentMethod && (
                <span className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                  {(order as any).paymentMethod}
                </span>
              )}
            </div>
          </div>

          {/* Action bar */}
          <div className="bg-white px-6 py-3 border-t border-gray-100 flex flex-wrap gap-2">
            <Link href="/my-orders">
              <Button variant="outline" size="sm" className="rounded-full border-gray-300 hover:border-primary-aqua hover:text-primary-aqua transition-colors flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                My Orders
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadInvoice}
              className="rounded-full border-gray-300 hover:border-primary-aqua hover:text-primary-aqua transition-colors flex items-center gap-1.5"
            >
              <FileDown className="h-4 w-4" />
              Download Invoice
            </Button>
            {CANCELABLE_STATUSES.includes(statusKey) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="rounded-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500 transition-colors flex items-center gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT — main content */}
          <div className="lg:col-span-2 space-y-4">

            {/* ── ITEMS ORDERED ── */}
            <div className="rounded-xl border border-gray-200">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Items Ordered</p>
              </div>
              <div className="divide-y divide-gray-100">
                {(order as any).items?.length > 0 ? (order as any).items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                    {item.book?.imageUrl ? (
                      <img
                        src={item.book.imageUrl}
                        alt={item.book?.title || item.title}
                        className="w-12 h-16 object-cover rounded-lg shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug">
                        {item.book?.title || item.title || "Unknown Book"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">{item.book?.author || item.author || "Unknown Author"}</p>
                      <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-400 py-8 text-sm italic">No items found for this order</div>
                )}
              </div>
            </div>

            {/* ── ORDER SUMMARY ── */}
            <div className="rounded-xl border border-gray-200">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Order Summary</p>
              </div>
              <div className="px-4 py-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${parseFloat((order as any).subtotal || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {parseFloat((order as any).shipping || "0") === 0
                      ? <span className="text-green-600 font-semibold">FREE</span>
                      : `$${parseFloat((order as any).shipping).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${parseFloat((order as any).tax || "0").toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
                  <span>Total</span>
                  <span className="text-lg">${parseFloat((order as any).total).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT — sidebar */}
          <div className="space-y-4">

            {/* ── CUSTOMER ── */}
            <div className="rounded-xl border border-gray-200">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Customer</p>
              </div>
              <div className="px-4 py-3 space-y-2.5 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 w-14 flex-shrink-0">Name</span>
                  <span className="font-medium text-gray-900">{(order as any).customerName}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 w-14 flex-shrink-0">Email</span>
                  <span className="font-medium text-gray-900 break-all">{(order as any).customerEmail}</span>
                </div>
                {(order as any).customerPhone && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 w-14 flex-shrink-0">Phone</span>
                    <span className="font-medium text-gray-900">{(order as any).customerPhone}</span>
                  </div>
                )}
                {(order as any).paymentId && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 w-14 flex-shrink-0">Ref</span>
                    <span className="font-medium text-gray-900 font-mono text-xs break-all">{(order as any).paymentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── SHIP TO ── */}
            <div className="rounded-xl border border-gray-200">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Ship To</p>
              </div>
              <div className="px-4 py-3 text-sm text-gray-700 leading-relaxed">
                {shippingLines.length > 0 ? (
                  <div className="space-y-0.5">
                    <p className="font-medium text-gray-900">{shippingLines[0]}</p>
                    {shippingLines.slice(1).map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No shipping address available</p>
                )}
              </div>
            </div>

            {/* ── TRACKING ── */}
            {(order as any).trackingNumber && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">Tracking</p>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-500">Number: </span>
                    <span className="font-mono font-semibold text-blue-800">{(order as any).trackingNumber}</span>
                  </div>
                  {(order as any).shippingCarrier && (
                    <div>
                      <span className="text-gray-500">Carrier: </span>
                      <span className="font-semibold text-blue-800">{(order as any).shippingCarrier}</span>
                    </div>
                  )}
                </div>
                {(order as any).notes && (
                  <p className="text-gray-500 text-xs italic mt-2">{(order as any).notes}</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order #{(order as any).id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
              Once cancelled, you will need to place a new order if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
