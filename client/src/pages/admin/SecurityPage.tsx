import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, AlertTriangle, Ban, CheckCircle, Clock, Globe, 
  Filter, RefreshCw, XCircle, Lock, Unlock, Eye, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface SecurityEvent {
  id: number;
  ip: string;
  path: string;
  userAgent: string | null;
  eventType: string;
  createdAt: string;
}

interface SecurityStats {
  eventTypeCounts: Array<{ eventType: string; count: number }>;
  topIPs: Array<{ ip: string; count: number }>;
  last24Hours: number;
  uniqueBlockedIPs: number;
}

export default function SecurityPage() {
  const [limit, setLimit] = useState(100);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [ipFilter, setIpFilter] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [blockIPDialog, setBlockIPDialog] = useState(false);
  const [ipToBlock, setIpToBlock] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch security events
  const { data: eventsData, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/security-events", limit, eventTypeFilter, ipFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (eventTypeFilter !== 'all') params.append('eventType', eventTypeFilter);
      if (ipFilter) params.append('ip', ipFilter);
      
      const res = await fetch(`/api/admin/security-events?${params}`);
      if (!res.ok) throw new Error('Failed to fetch security events');
      return res.json();
    },
  });

  // Fetch security stats
  const { data: stats } = useQuery<SecurityStats>({
    queryKey: ["/api/admin/security-stats"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/security-stats`);
      if (!res.ok) throw new Error('Failed to fetch security stats');
      return res.json();
    },
  });

  const events: SecurityEvent[] = eventsData?.events || [];
  const total: number = eventsData?.total || 0;

  // Block IP mutation
  const blockIPMutation = useMutation({
    mutationFn: async (ip: string) => {
      const res = await fetch(`/api/admin/security/block-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ip }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to block IP');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "IP Blocked",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security-events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security-stats"] });
      setBlockIPDialog(false);
      setIpToBlock("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Block IP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unblock IP mutation
  const unblockIPMutation = useMutation({
    mutationFn: async (ip: string) => {
      const res = await fetch(`/api/admin/security/unblock-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ip }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to unblock IP');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "IP Unblocked",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security-events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Unblock IP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'BLOCKED_IP':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SENSITIVE_FILE_ACCESS':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'RATE_LIMIT_EXCEEDED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'AUTO_BLOCKED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'BLOCKED_IP':
        return <Ban className="h-4 w-4" />;
      case 'SENSITIVE_FILE_ACCESS':
        return <AlertTriangle className="h-4 w-4" />;
      case 'RATE_LIMIT_EXCEEDED':
        return <Clock className="h-4 w-4" />;
      case 'AUTO_BLOCKED':
        return <Lock className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const handleBlockIP = (ip: string) => {
    setIpToBlock(ip);
    setBlockIPDialog(true);
  };

  const confirmBlockIP = () => {
    if (ipToBlock) {
      blockIPMutation.mutate(ipToBlock);
    }
  };

  const handleUnblockIP = (ip: string) => {
    if (window.confirm(`Are you sure you want to unblock IP: ${ip}?`)) {
      unblockIPMutation.mutate(ip);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-lg">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Security Monitor</h1>
            <p className="text-sm text-gray-600">Track and manage security events</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setBlockIPDialog(true)} variant="default" size="sm">
            <Ban className="h-4 w-4 mr-2" />
            Block IP
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <Activity className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last 24 Hours</p>
              <p className="text-2xl font-bold">{stats?.last24Hours || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Blocked IPs</p>
              <p className="text-2xl font-bold">
                {stats?.uniqueBlockedIPs || 0}
              </p>
            </div>
            <Ban className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sensitive Access</p>
              <p className="text-2xl font-bold">
                {stats?.eventTypeCounts?.find(e => e.eventType === 'SENSITIVE_FILE_ACCESS')?.count || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Top Attacking IPs */}
      {stats?.topIPs && stats.topIPs.length > 0 && (
        <Card className="p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Top Suspicious IPs
          </h3>
          <div className="space-y-2">
            {stats.topIPs.slice(0, 5).map((ip) => (
              <div key={ip.ip} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                    {ip.ip}
                  </code>
                  <span className="text-sm text-gray-600">{ip.count} attempts</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIpFilter(ip.ip)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBlockIP(ip.ip)}
                  >
                    <Ban className="h-3 w-3 mr-1" />
                    Block
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Event Type</label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Types</option>
                <option value="BLOCKED_IP">Blocked IP</option>
                <option value="SENSITIVE_FILE_ACCESS">Sensitive File Access</option>
                <option value="RATE_LIMIT_EXCEEDED">Rate Limit Exceeded</option>
                <option value="AUTO_BLOCKED">Auto-Blocked</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">IP Address</label>
              <Input
                type="text"
                placeholder="Filter by IP..."
                value={ipFilter}
                onChange={(e) => setIpFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Limit</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
              >
                <option value="50">50 events</option>
                <option value="100">100 events</option>
                <option value="500">500 events</option>
                <option value="1000">1000 events</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Events Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Path
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading security events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No security events found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(event.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.eventType)}`}>
                        {getEventTypeIcon(event.eventType)}
                        {event.eventType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {event.ip}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {event.path || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEvent(event);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {event.eventType !== 'BLOCKED_IP' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBlockIP(event.ip)}
                          >
                            <Ban className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Security Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Event Type</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColor(selectedEvent.eventType)}`}>
                      {getEventTypeIcon(selectedEvent.eventType)}
                      {selectedEvent.eventType.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Time</label>
                  <p className="mt-1 text-sm">{formatDate(selectedEvent.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">IP Address</label>
                  <code className="block mt-1 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {selectedEvent.ip}
                  </code>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Path</label>
                  <p className="mt-1 text-sm font-mono break-all">{selectedEvent.path || '-'}</p>
                </div>
              </div>
              
              {selectedEvent.userAgent && (
                <div>
                  <label className="text-sm font-medium text-gray-700">User Agent</label>
                  <p className="mt-1 text-xs text-gray-600 break-all bg-gray-50 p-2 rounded">
                    {selectedEvent.userAgent}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleBlockIP(selectedEvent.ip);
                    setDetailsOpen(false);
                  }}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Block This IP
                </Button>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block IP Dialog */}
      <Dialog open={blockIPDialog} onOpenChange={setBlockIPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block IP Address</DialogTitle>
            <DialogDescription>
              Enter the IP address you want to block from accessing your site.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">IP Address</label>
              <Input
                type="text"
                placeholder="e.g., 172.245.214.59"
                value={ipToBlock}
                onChange={(e) => setIpToBlock(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={confirmBlockIP}
                disabled={!ipToBlock || blockIPMutation.isPending}
              >
                <Ban className="h-4 w-4 mr-2" />
                Block IP
              </Button>
              <Button variant="outline" onClick={() => {
                setBlockIPDialog(false);
                setIpToBlock("");
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
