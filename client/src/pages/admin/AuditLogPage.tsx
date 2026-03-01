import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Filter, Search, User, Clock, Database, AlertCircle, Eye, Undo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [restoring, setRestoring] = useState<number | null>(null);
  const { toast } = useToast();

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

  const stats = {
    total: auditLogs.length,
    books: auditLogs.filter(l => l.tableName === 'books').length,
    categories: auditLogs.filter(l => l.tableName === 'categories').length,
    coupons: auditLogs.filter(l => l.tableName === 'coupons').length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Trail</h1>
        <p className="text-gray-600">Track all deletions and changes made in your system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deletions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Books Deleted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.books}</p>
              </div>
              <span className="text-3xl">📚</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories Deleted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
              </div>
              <span className="text-3xl">📁</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coupons Deleted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.coupons}</p>
              </div>
              <span className="text-3xl">🎟️</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Table</label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="categories">Categories</SelectItem>
                  <SelectItem value="coupons">Coupons</SelectItem>
                  <SelectItem value="gift_items">Gift Items</SelectItem>
                  <SelectItem value="gift_categories">Gift Categories</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={() => refetch()} className="mt-4">
            <Search className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Deletion History ({filteredLogs.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No audit logs found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date & Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Table</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Record</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Admin</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Details</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getTableIcon(log.tableName)}</span>
                          <span className="font-medium">{log.tableName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          #{log.recordId}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            {log.adminName ? (
                              <div>
                                <div className="font-medium">{log.adminName}</div>
                                <div className="text-xs text-gray-500">{log.adminEmail || log.adminUsername}</div>
                              </div>
                            ) : log.adminId ? (
                              <span>Admin #{log.adminId}</span>
                            ) : log.userId ? (
                              <span>User: {log.userId}</span>
                            ) : (
                              <span className="text-gray-400">System</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {log.notes || 'No notes'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Table</label>
                  <p className="mt-1">{selectedLog.tableName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Record ID</label>
                  <p className="mt-1">#{selectedLog.recordId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Action</label>
                  <p className="mt-1">
                    <Badge className={getActionColor(selectedLog.action)}>
                      {selectedLog.action}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date & Time</label>
                  <p className="mt-1">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Admin</label>
                  <div className="mt-1">
                    {selectedLog.adminName ? (
                      <div>
                        <p className="font-medium">{selectedLog.adminName}</p>
                        {selectedLog.adminEmail && (
                          <p className="text-sm text-gray-600">{selectedLog.adminEmail}</p>
                        )}
                        {selectedLog.adminUsername && (
                          <p className="text-xs text-gray-500">@{selectedLog.adminUsername}</p>
                        )}
                      </div>
                    ) : selectedLog.adminId ? (
                      <p>Admin #{selectedLog.adminId}</p>
                    ) : (
                      <p className="text-gray-400">N/A</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">IP Address</label>
                  <p className="mt-1">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedLog.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded border">{selectedLog.notes}</p>
                </div>
              )}

              {/* Old Data */}
              {selectedLog.oldData && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Data Before Deletion
                  </label>
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(selectedLog.oldData, null, 2)}
                    </pre>
                  </div>
                  
                  {/* Human-readable summary for books */}
                  {selectedLog.tableName === 'books' && selectedLog.oldData && (
                    <div className="mt-3 p-4 bg-white border rounded">
                      <h4 className="font-semibold mb-2">Book Details:</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Title:</strong> {selectedLog.oldData.title}</p>
                        <p><strong>Author:</strong> {selectedLog.oldData.author}</p>
                        <p><strong>ISBN:</strong> {selectedLog.oldData.isbn || 'N/A'}</p>
                        <p><strong>Price:</strong> ${selectedLog.oldData.price}</p>
                        <p><strong>Stock:</strong> {selectedLog.oldData.stockQuantity || 0}</p>
                        {selectedLog.oldData.condition && (
                          <p><strong>Condition:</strong> {selectedLog.oldData.condition}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Human-readable summary for categories */}
                  {selectedLog.tableName === 'categories' && selectedLog.oldData && (
                    <div className="mt-3 p-4 bg-white border rounded">
                      <h4 className="font-semibold mb-2">Category Details:</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Name:</strong> {selectedLog.oldData.name}</p>
                        <p><strong>Description:</strong> {selectedLog.oldData.description || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {/* Human-readable summary for coupons */}
                  {selectedLog.tableName === 'coupons' && selectedLog.oldData && (
                    <div className="mt-3 p-4 bg-white border rounded">
                      <h4 className="font-semibold mb-2">Coupon Details:</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Code:</strong> {selectedLog.oldData.code}</p>
                        <p><strong>Discount:</strong> {selectedLog.oldData.discountValue}{selectedLog.oldData.discountType === 'percentage' ? '%' : ' fixed'}</p>
                        <p><strong>Valid From:</strong> {selectedLog.oldData.validFrom ? new Date(selectedLog.oldData.validFrom).toLocaleDateString() : 'N/A'}</p>
                        <p><strong>Valid Until:</strong> {selectedLog.oldData.validUntil ? new Date(selectedLog.oldData.validUntil).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
