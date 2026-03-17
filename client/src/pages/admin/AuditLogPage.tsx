import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, Filter, User, Clock, Database, AlertTriangle, Eye,
  RotateCcw, RefreshCw, Trash2, PenLine, PlusCircle, BookOpen,
  FolderOpen, Ticket, Package, Gift, FileText, CalendarDays, Fingerprint,
  Globe, StickyNote, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: number;
  tableName: string;
  recordId: string;
  action: string;
  adminId: number | null;
  userId: string | null;
  oldData: any;
  newData: any;
  ipAddress: string | null;
  userAgent: string | null;
  notes: string | null;
  createdAt: string;
  adminName?: string | null;
  adminEmail?: string | null;
  adminUsername?: string | null;
}

export default function AuditLogPage() {
  const [days, setDays] = useState(30);
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent deletions
  const { data: auditLogsData, isLoading, refetch } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit/deletions", days],
    queryFn: async () => {
      const res = await fetch(`/api/admin/audit/deletions?days=${days}`);
      if (!res.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Ensure auditLogs is always an array
  const auditLogs = Array.isArray(auditLogsData) ? auditLogsData : [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'RESTORE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTableIcon = (tableName: string) => {
    const icons: Record<string, string> = {
      books: '📚',
      categories: '📁',
      coupons: '🎟️',
      orders: '📦',
      users: '👤',
      gift_items: '🎁',
      gift_categories: '🎁',
    };
    return icons[tableName] || '📄';
  };

  const filteredLogs = auditLogs.filter(log => {
    if (tableFilter !== 'all' && log.tableName !== tableFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    return true;
  });

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (auditLogId: number) => {
      const res = await fetch(`/api/admin/audit/restore/${auditLogId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to restore');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message || "Record restored successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/audit/deletions"] });
      setDetailsOpen(false);
      setRestoringId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Restore Failed",
        description: error.message,
        variant: "destructive",
      });
      setRestoringId(null);
    },
  });

  const handleRestore = (log: AuditLog) => {
    if (window.confirm(`Are you sure you want to restore this ${log.tableName} record?\n\nThis will create a new record with the deleted data.`)) {
      setRestoringId(log.id);
      restoreMutation.mutate(log.id);
    }
  };

  const stats = {
    total: auditLogs.length,
    books: auditLogs.filter(l => l.tableName === 'books').length,
    categories: auditLogs.filter(l => l.tableName === 'categories').length,
    coupons: auditLogs.filter(l => l.tableName === 'coupons').length,
  };

  // ── helpers ──────────────────────────────────────────
  const actionMeta: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; dot: string }> = {
    DELETE: { label: "Delete", icon: <Trash2 className="w-3 h-3" />, bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    UPDATE: { label: "Update", icon: <PenLine className="w-3 h-3" />, bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
    CREATE: { label: "Create", icon: <PlusCircle className="w-3 h-3" />, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    RESTORE: { label: "Restore", icon: <RotateCcw className="w-3 h-3" />, bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  };

  const tableMeta: Record<string, {  label: string; Icon: React.ElementType }> = {
    books: {  label: "Books", Icon: BookOpen },
    categories: {  label: "Categories", Icon: FolderOpen },
    coupons: {  label: "Coupons", Icon: Ticket },
    orders: {  label: "Orders", Icon: Package },
    users: {  label: "Users", Icon: User },
    gift_items: {  label: "Gift Items", Icon: Gift },
    gift_categories: {  label: "Gift Categories", Icon: Gift },
  };

  const getActionMeta = (action: string) => actionMeta[action.toUpperCase()] ?? {
    label: action, icon: <FileText className="w-3 h-3" />, bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400",
  };

  const getTableMeta = (t: string) => tableMeta[t] ?? { emoji: "📄", label: t, Icon: Database };

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-zinc-50 border border-slate-200 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-slate-100/60 to-transparent rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Audit Trail</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track all deletions and changes made in your system</p>
            </div>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="w-full sm:w-auto rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 h-10"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats strip */}
        <div className="relative mt-5 flex flex-wrap gap-3">
          {[
            { label: "Total Events", value: stats.total, color: "bg-slate-100 text-slate-700" },
            { label: "Books", value: stats.books, color: "bg-violet-100 text-violet-700" },
            { label: "Categories", value: stats.categories, color: "bg-sky-100 text-sky-700" },
            { label: "Coupons", value: stats.coupons, color: "bg-amber-100 text-amber-700" },
          ].map(({ label, value, color }) => (
            <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
              {label} <span className="font-bold">{value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Time period */}
        <div className="flex items-center gap-2 flex-1">
          <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="flex-1 h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Table filter */}
        <div className="flex items-center gap-2 flex-1">
          <Database className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="flex-1 h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="all">All Tables</option>
            <option value="books">Books</option>
            <option value="categories">Categories</option>
            <option value="coupons">Coupons</option>
            <option value="gift_items">Gift Items</option>
            <option value="gift_categories">Gift Categories</option>
          </select>
        </div>

        {/* Action filter pills */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-gray-100/80 flex-shrink-0">
          {(["all", "DELETE", "UPDATE", "CREATE", "RESTORE"]).map(f => {
            const meta = f !== "all" ? getActionMeta(f) : null;
            return (
              <button
                key={f}
                onClick={() => setActionFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                  ${actionFilter === f ? "bg-white shadow-sm text-slate-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Log list ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-1/3 rounded bg-gray-100" />
                <div className="h-3 w-2/3 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">No audit events found</h3>
          <p className="text-xs text-gray-400 max-w-xs">Try adjusting the time period or filters above.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs text-gray-400 font-medium px-1">{filteredLogs.length} event{filteredLogs.length !== 1 ? "s" : ""}</p>
          {filteredLogs.map((log) => {
            const am = getActionMeta(log.action);
            const tm = getTableMeta(log.tableName);
            const canRestore = log.action === "DELETE" && log.oldData;

            return (
              <div
                key={log.id}
                className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm hover:shadow-md transition-all duration-200"
              >

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${am.bg} ${am.text}`}>
                      {am.icon}{am.label}
                    </span>
                    {/* Table badge */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      <Database className="w-3 h-3" />{tm.label}
                    </span>
                    {/* Record ID */}
                    <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                      #{log.recordId}
                    </code>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {/* Who */}
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-300" />
                      {log.adminName
                        ? <span className="font-medium text-gray-700">{log.adminName}</span>
                        : log.adminId
                          ? `Admin #${log.adminId}`
                          : log.userId
                            ? `User ${log.userId}`
                            : <span className="italic text-gray-400">System</span>
                      }
                    </span>
                    {/* When */}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-300" />
                      {formatDate(log.createdAt)}
                    </span>
                    {/* Notes */}
                    {log.notes && (
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <StickyNote className="w-3 h-3 text-gray-300 flex-shrink-0" />
                        {log.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(log)}
                    className="rounded-xl border-gray-200 text-gray-600 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 h-8 text-xs px-3"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  {canRestore && (
                    <Button
                      size="sm"
                      onClick={() => handleRestore(log)}
                      disabled={restoringId === log.id}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs px-3 shadow-sm"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 mr-1 ${restoringId === log.id ? "animate-spin" : ""}`} />
                      {restoringId === log.id ? "Restoring…" : "Restore"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Details Dialog ── */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
              </span>
              Audit Event Details
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="px-6 py-5 space-y-5">
              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Table", value: getTableMeta(selectedLog.tableName).label, icon: <Database className="w-3.5 h-3.5" /> },
                  { label: "Record ID", value: `#${selectedLog.recordId}`, icon: <Fingerprint className="w-3.5 h-3.5" /> },
                  { label: "Date", value: formatDate(selectedLog.createdAt), icon: <CalendarDays className="w-3.5 h-3.5" /> },
                  { label: "IP", value: selectedLog.ipAddress || "N/A", icon: <Globe className="w-3.5 h-3.5" /> },
                  { label: "Action", value: null, icon: null },
                  { label: "Admin", value: null, icon: null },
                ].filter(f => f.label !== "Action" && f.label !== "Admin").map(({ label, value, icon }) => (
                  <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-3">
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mb-1">{icon}{label}</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
                  </div>
                ))}
                {/* Action */}
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-3">
                  <p className="text-xs text-gray-400 font-medium mb-1.5">Action</p>
                  {(() => {
                    const am = getActionMeta(selectedLog.action); return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${am.bg} ${am.text}`}>
                        {am.icon}{am.label}
                      </span>
                    );
                  })()}
                </div>
                {/* Admin */}
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-3">
                  <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mb-1"><User className="w-3.5 h-3.5" />Admin</p>
                  {selectedLog.adminName ? (
                    <>
                      <p className="text-sm font-semibold text-gray-800">{selectedLog.adminName}</p>
                      <p className="text-xs text-gray-400">{selectedLog.adminEmail || selectedLog.adminUsername}</p>
                    </>
                  ) : selectedLog.adminId ? (
                    <p className="text-sm font-semibold text-gray-800">Admin #{selectedLog.adminId}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">System</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedLog.notes && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <p className="text-xs font-medium text-amber-600 flex items-center gap-1 mb-1">
                    <StickyNote className="w-3.5 h-3.5" />Notes
                  </p>
                  <p className="text-sm text-amber-800">{selectedLog.notes}</p>
                </div>
              )}

              {/* Human-readable summary */}
              {selectedLog.oldData && selectedLog.tableName === "books" && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">📚 Book Details</p>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    {[
                      ["Title", selectedLog.oldData.title],
                      ["Author", selectedLog.oldData.author],
                      ["ISBN", selectedLog.oldData.isbn || "N/A"],
                      ["Price", `$${selectedLog.oldData.price}`],
                      ["Stock", selectedLog.oldData.stockQuantity ?? 0],
                      ["Condition", selectedLog.oldData.condition || "N/A"],
                    ].map(([k, v]) => (
                      <div key={k as string}>
                        <span className="text-gray-400">{k}: </span>
                        <span className="font-medium text-gray-800">{v as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.oldData && selectedLog.tableName === "categories" && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">📁 Category Details</p>
                  </div>
                  <div className="px-4 py-3 space-y-1 text-sm">
                    <div><span className="text-gray-400">Name: </span><span className="font-medium text-gray-800">{selectedLog.oldData.name}</span></div>
                    <div><span className="text-gray-400">Description: </span><span className="font-medium text-gray-800">{selectedLog.oldData.description || "N/A"}</span></div>
                  </div>
                </div>
              )}

              {selectedLog.oldData && selectedLog.tableName === "coupons" && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">🎟️ Coupon Details</p>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    {[
                      ["Code", selectedLog.oldData.code],
                      ["Discount", `${selectedLog.oldData.discountValue}${selectedLog.oldData.discountType === "percentage" ? "%" : " fixed"}`],
                      ["Valid From", selectedLog.oldData.validFrom ? new Date(selectedLog.oldData.validFrom).toLocaleDateString() : "N/A"],
                      ["Valid Until", selectedLog.oldData.validUntil ? new Date(selectedLog.oldData.validUntil).toLocaleDateString() : "N/A"],
                    ].map(([k, v]) => (
                      <div key={k as string}>
                        <span className="text-gray-400">{k}: </span>
                        <span className="font-medium text-gray-800">{v as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw data */}
              {selectedLog.oldData && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1.5 select-none">
                    <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
                    Raw data (before deletion)
                  </summary>
                  <div className="mt-2 rounded-xl bg-red-50 border border-red-100 p-4 overflow-x-auto">
                    <pre className="text-xs text-red-800 leading-relaxed">
                      {JSON.stringify(selectedLog.oldData, null, 2)}
                    </pre>
                  </div>
                </details>
              )}

              {/* Dialog actions */}
              <div className="flex gap-3 pt-1 border-t border-gray-100">
                {selectedLog.action === "DELETE" && selectedLog.oldData && (
                  <Button
                    onClick={() => handleRestore(selectedLog)}
                    disabled={restoringId === selectedLog.id}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-medium shadow-sm"
                  >
                    <RotateCcw className={`w-4 h-4 mr-2 ${restoringId === selectedLog.id ? "animate-spin" : ""}`} />
                    {restoringId === selectedLog.id ? "Restoring…" : "Restore Record"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setDetailsOpen(false)}
                  className="rounded-xl h-10 border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
