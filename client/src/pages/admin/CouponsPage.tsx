import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Edit, Trash2, Eye, Calendar, Users,
  Ticket, TrendingUp, Search, X, Copy, Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { CouponForm } from "@/components/admin/CouponForm";
import { CouponUsageDialog } from "@/components/admin/CouponUsageDialog";
import type { Coupon } from "@shared/schema";

type CouponStatus = "active" | "scheduled" | "expired" | "inactive" | "limit_reached";

function getCouponStatus(coupon: Coupon): CouponStatus {
  const now = new Date();
  const start = new Date(coupon.startDate);
  const end = new Date(coupon.endDate);
  if (!coupon.isActive) return "inactive";
  if (now < start) return "scheduled";
  if (now > end) return "expired";
  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) return "limit_reached";
  return "active";
}

const STATUS_CONFIG: Record<CouponStatus, { label: string; pill: string; border: string; strip: string; dot: string }> = {
  active:        { label: "Active",        pill: "bg-emerald-100 text-emerald-700 border-emerald-200", border: "border-l-emerald-500", strip: "bg-emerald-500", dot: "bg-emerald-500" },
  scheduled:     { label: "Scheduled",     pill: "bg-blue-100 text-blue-700 border-blue-200",         border: "border-l-blue-500",    strip: "bg-blue-500",    dot: "bg-blue-400"    },
  expired:       { label: "Expired",       pill: "bg-rose-100 text-rose-700 border-rose-200",         border: "border-l-rose-400",    strip: "bg-rose-400",    dot: "bg-rose-400"    },
  inactive:      { label: "Inactive",      pill: "bg-gray-100 text-gray-600 border-gray-200",         border: "border-l-gray-400",    strip: "bg-gray-400",    dot: "bg-gray-400"    },
  limit_reached: { label: "Limit Reached", pill: "bg-orange-100 text-orange-700 border-orange-200",   border: "border-l-orange-400",  strip: "bg-orange-400",  dot: "bg-orange-400"  },
};

const FILTER_TABS: { key: "all" | CouponStatus; label: string }[] = [
  { key: "all",          label: "All"          },
  { key: "active",       label: "Active"       },
  { key: "scheduled",    label: "Scheduled"    },
  { key: "expired",      label: "Expired"      },
  { key: "inactive",     label: "Inactive"     },
  { key: "limit_reached",label: "Limit Reached"},
];

export default function CouponsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CouponStatus>("all");
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/coupons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Coupon created!", description: "Your new coupon is ready to use." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create coupon", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PUT", `/api/admin/coupons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setIsEditDialogOpen(false);
      setSelectedCoupon(null);
      toast({ title: "Coupon updated!", description: "Changes saved successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update coupon", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setIsDeleteDialogOpen(false);
      setSelectedCoupon(null);
      toast({ title: "Coupon deleted", description: "The coupon has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete coupon", variant: "destructive" });
    },
  });

  const handleCreate = (data: any) => createMutation.mutate(data);
  const handleEdit = (data: any) => {
    if (selectedCoupon) updateMutation.mutate({ id: selectedCoupon.id, data });
  };
  const handleDelete = () => {
    if (selectedCoupon) deleteMutation.mutate(selectedCoupon.id);
  };

  const openEditDialog   = (c: Coupon) => { setSelectedCoupon(c); setIsEditDialogOpen(true);   };
  const openDeleteDialog = (c: Coupon) => { setSelectedCoupon(c); setIsDeleteDialogOpen(true); };
  const openUsageDialog  = (c: Coupon) => { setSelectedCoupon(c); setIsUsageDialogOpen(true);  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const handleCopyCode = (coupon: Coupon) => {
    navigator.clipboard.writeText(coupon.code);
    setCopiedCode(coupon.id);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const totalActive      = coupons.filter(c => getCouponStatus(c) === "active").length;
  const totalScheduled   = coupons.filter(c => getCouponStatus(c) === "scheduled").length;
  const totalRedemptions = coupons.reduce((s, c) => s + (c.usedCount || 0), 0);

  const countFor = (status: CouponStatus) => coupons.filter(c => getCouponStatus(c) === status).length;

  const filtered = coupons.filter(c => {
    const matchSearch = !search ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || getCouponStatus(c) === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500 font-medium">Loading coupons…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-400 p-6 text-white shadow-lg">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
      
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Coupon Management</h1>
              <p className="text-amber-100 text-sm mt-0.5">Create and manage discount coupons for your store</p>
            </div>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-white text-amber-600 hover:bg-amber-50 font-semibold shadow-md border-0 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </div>
        {/* Stats row */}
        <div className="relative z-10 mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Ticket,      label: "Total Coupons",  value: coupons.length  },
            { icon: ShieldCheck, label: "Active",          value: totalActive     },
            { icon: Calendar,    label: "Scheduled",       value: totalScheduled  },
            { icon: TrendingUp,  label: "Redemptions",     value: totalRedemptions},
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3 text-center">
              <Icon className="h-4 w-4 mx-auto mb-1 text-white/80" />
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-amber-100">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search + Filter Row ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by code or description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-9 border-gray-200 focus:border-amber-400 focus:ring-amber-400/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(({ key, label }) => {
            const count = key === "all" ? coupons.length : countFor(key as CouponStatus);
            const active = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200"
                    : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600"
                }`}
              >
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/25" : "bg-gray-100"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Coupon Cards ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <Ticket className="h-8 w-8 text-amber-300" />
          </div>
          <p className="text-gray-500 font-medium">No coupons found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search || statusFilter !== "all" ? "Try clearing your filters" : "Create your first coupon to get started"}
          </p>
          {(search || statusFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(coupon => {
            const status = getCouponStatus(coupon);
            const cfg = STATUS_CONFIG[status];
            const usagePct = coupon.usageLimit
              ? Math.min(100, ((coupon.usedCount || 0) / coupon.usageLimit) * 100)
              : null;
            return (
              <Card
                key={coupon.id}
                className={`relative overflow-hidden border border-l-4 ${cfg.border} bg-white shadow-sm hover:shadow-md transition-shadow duration-200`}
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg.strip}`} />
                <CardContent className="p-5 space-y-4">
                  {/* Code + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-lg font-bold text-gray-800 tracking-wider truncate">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(coupon)}
                        className="shrink-0 text-gray-400 hover:text-amber-500 transition-colors"
                        title="Copy code"
                      >
                        {copiedCode === coupon.id
                          ? <Check className="h-4 w-4 text-emerald-500" />
                          : <Copy className="h-4 w-4" />
                        }
                      </button>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {coupon.description && (
                    <p className="text-sm text-gray-500 leading-snug line-clamp-2">{coupon.description}</p>
                  )}

                  {/* Discount value */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-amber-500">
                          {coupon.discountType === "percentage"
                            ? coupon.discountValue
                            : formatCurrency(parseFloat(coupon.discountValue))}
                        </span>
                        {coupon.discountType === "percentage" && (
                          <span className="text-xl font-bold text-amber-400">%</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {coupon.discountType === "percentage" ? "Percentage off" : "Fixed discount"}
                        {coupon.maximumDiscountAmount
                          ? ` · Max ${formatCurrency(parseFloat(coupon.maximumDiscountAmount))}`
                          : ""}
                      </span>
                    </div>
                    {coupon.minimumOrderAmount && parseFloat(coupon.minimumOrderAmount) > 0 && (
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Min order</div>
                        <div className="text-sm font-semibold text-gray-600">
                          {formatCurrency(parseFloat(coupon.minimumOrderAmount))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Usage progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {coupon.usedCount || 0} used
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " · Unlimited"}
                      </span>
                      {usagePct !== null && (
                        <span className="text-xs text-gray-400">{Math.round(usagePct)}%</span>
                      )}
                    </div>
                    {usagePct !== null && (
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${usagePct >= 90 ? "bg-rose-400" : usagePct >= 60 ? "bg-amber-400" : "bg-emerald-400"}`}
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Date range */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{fmtDate(coupon.startDate)} – {fmtDate(coupon.endDate)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openUsageDialog(coupon)}
                      className="flex-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 text-xs h-8"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Usage
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(coupon)}
                      className="flex-1 text-gray-600 hover:text-amber-600 hover:bg-amber-50 text-xs h-8"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(coupon)}
                      className="flex-1 text-gray-600 hover:text-rose-600 hover:bg-rose-50 text-xs h-8"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Dialog ── */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold">Create New Coupon</DialogTitle>
                <DialogDescription className="text-amber-100 text-sm">
                  Set up a discount coupon for your customers
                </DialogDescription>
              </div>
            </div>
          </div>
          <div className="p-6">
            <CouponForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
              generateRandomCode={generateRandomCode}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Edit className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold">Edit Coupon</DialogTitle>
                <DialogDescription className="text-amber-100 text-sm font-mono font-bold">
                  {selectedCoupon?.code}
                </DialogDescription>
              </div>
            </div>
          </div>
          <div className="p-6">
            {selectedCoupon && (
              <CouponForm
                coupon={selectedCoupon}
                onSubmit={handleEdit}
                onCancel={() => { setIsEditDialogOpen(false); setSelectedCoupon(null); }}
                isLoading={updateMutation.isPending}
                generateRandomCode={generateRandomCode}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm p-0">
          <div className="bg-gradient-to-br from-rose-500 to-red-500 p-5 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold">Delete Coupon</DialogTitle>
                <DialogDescription className="text-rose-100 text-sm">This cannot be undone</DialogDescription>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {selectedCoupon && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <Ticket className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <div className="font-mono font-bold text-gray-800">{selectedCoupon.code}</div>
                  <div className="text-sm text-gray-500">{selectedCoupon.description || "No description"}</div>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Deleting this coupon will also remove all associated usage records.
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setIsDeleteDialogOpen(false); setSelectedCoupon(null); }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete Coupon"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Usage Dialog ── */}
      {selectedCoupon && (
        <CouponUsageDialog
          open={isUsageDialogOpen}
          onOpenChange={setIsUsageDialogOpen}
          coupon={selectedCoupon}
        />
      )}
    </div>
  );
}