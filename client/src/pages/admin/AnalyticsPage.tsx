import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  Users, Eye, TrendingUp, Globe, Monitor, Smartphone, Tablet, Clock,
  MousePointer, Database, Trash2, RefreshCw, UserCheck, UserX,
  BarChart3, ChevronDown, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie,
  Cell,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface AnalyticsOverview {
  totalPageViews: number;
  totalVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  topPages: Array<{ path: string; views: number }>;
  topCountries: Array<{ country: string; count: number }>;
  deviceBreakdown: Array<{ deviceType: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
}

interface RealtimeData {
  activeVisitors: number;
  activePages: Array<{ path: string; count: number }>;
}

interface DailyStats {
  date: string;
  visitors: number;
  pageViews: number;
}

interface Visitor {
  sessionId: string;
  userId: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  firstVisit: string;
  lastActivity: string;
  pageViewCount: number;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  landingPage: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

interface VisitorDetail {
  session: Visitor;
  pageViews: Array<{
    id: number;
    pagePath: string;
    pageTitle: string | null;
    referrer: string | null;
    createdAt: string;
  }>;
  events: Array<{
    id: number;
    eventType: string;
    eventCategory: string | null;
    eventData: any;
    pagePath: string | null;
    createdAt: string;
  }>;
  sessionDuration: number;
}

interface DbStats {
  records: {
    pageViews: number;
    sessions: number;
    events: number;
    dailyStats: number;
  };
  dateRange: {
    oldest: string | null;
    newest: string | null;
  };
  retentionPolicy: {
    pageViews: number;
    sessions: number;
    events: number;
    dailyStats: number;
  };
}

interface GroupedVisitorSession {
  sessionId: string;
  firstVisit: string;
  lastActivity: string;
  pageViewCount: number;
  landingPage: string | null;
  referrer: string | null;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

interface GroupedVisitor {
  identityKey: string;
  isLoggedIn: boolean;
  userId: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  ipAddress: string | null;
  totalSessions: number;
  totalPageViews: number;
  firstSeen: string;
  lastSeen: string;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  sessions: GroupedVisitorSession[];
}

interface UserAnalytics {
  userId: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  totalSessions: number;
  totalPageViews: number;
  firstSeen: string;
  lastSeen: string;
  country: string | null;
  deviceType: string | null;
  browser: string | null;
}

interface ActiveUser {
  userId: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  lastActivity: string;
  currentPage: string | null;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(30); // days
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const startDate = useMemo(() => subDays(new Date(), dateRange), [dateRange]);
  const endDate = useMemo(() => new Date(), []);

  // Fetch analytics overview
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery<AnalyticsOverview>({
    queryKey: [`/api/analytics/overview?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch realtime data
  const { data: realtime, isLoading: realtimeLoading, refetch: refetchRealtime } = useQuery<RealtimeData>({
    queryKey: ['/api/analytics/realtime'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch daily stats
  const { data: dailyStats, isLoading: dailyStatsLoading, refetch: refetchDailyStats } = useQuery<DailyStats[]>({
    queryKey: [`/api/analytics/daily?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`],
    refetchInterval: 60000,
  });

  // Fetch visitors list
  const { data: visitors, isLoading: visitorsLoading, refetch: refetchVisitors } = useQuery<Visitor[]>({
    queryKey: [`/api/analytics/visitors?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=50`],
    refetchInterval: 60000,
  });

  // Fetch grouped visitors (one row per identity)
  const { data: groupedVisitors, isLoading: groupedLoading, refetch: refetchGrouped } = useQuery<GroupedVisitor[]>({
    queryKey: [`/api/analytics/grouped-visitors?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`],
    refetchInterval: 60000,
  });

  // Fetch visitor detail when selected
  const { data: visitorDetail } = useQuery<VisitorDetail>({
    queryKey: [`/api/analytics/visitors/${selectedVisitor}`],
    enabled: !!selectedVisitor,
  });

  // Fetch user analytics (grouped by logged-in user)
  const { data: userAnalytics, isLoading: userAnalyticsLoading, refetch: refetchUserAnalytics } = useQuery<UserAnalytics[]>({
    queryKey: [`/api/analytics/users?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`],
    refetchInterval: 60000,
  });

  // Fetch currently active logged-in users
  const { data: activeUsers, refetch: refetchActiveUsers } = useQuery<ActiveUser[]>({
    queryKey: ['/api/analytics/active-users'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch database stats
  const { data: dbStats, refetch: refetchDbStats } = useQuery<DbStats>({
    queryKey: ['/api/analytics/db-stats'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const isLoading = overviewLoading || realtimeLoading || dailyStatsLoading;

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchOverview(),
        refetchRealtime(),
        refetchDailyStats(),
        refetchVisitors(),
        refetchDbStats(),
        refetchUserAnalytics(),
        refetchActiveUsers(),
        refetchGrouped(),
      ]);
      toast({
        title: "Data Refreshed",
        description: "All analytics data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh analytics data.",
        variant: "destructive" as const,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle manual cleanup
  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const response = await fetch('/api/analytics/cleanup', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        toast({
          title: "Cleanup Successful",
          description: "Old analytics data has been cleaned up and aggregated.",
        });
        refetchDbStats();
      } else {
        toast({
          title: "Cleanup Failed",
          description: "Failed to clean up analytics data.",
          variant: "destructive" as const,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during cleanup.",
        variant: "destructive" as const,
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Format daily stats for charts
  const chartData = useMemo(() => {
    if (!dailyStats) return [];
    return dailyStats.map((stat) => ({
      date: format(new Date(stat.date), 'MMM dd'),
      visitors: Number(stat.visitors),
      pageViews: Number(stat.pageViews),
    }));
  }, [dailyStats]);

  // Format device breakdown for pie chart
  const deviceData = useMemo(() => {
    if (!overview?.deviceBreakdown) return [];
    return overview.deviceBreakdown.map((device) => ({
      name: device.deviceType || 'Unknown',
      value: Number(device.count),
    }));
  }, [overview]);

  // Format browser breakdown for pie chart
  const browserData = useMemo(() => {
    if (!overview?.browserBreakdown) return [];
    return overview.browserBreakdown
      .map((browser) => ({
        name: browser.browser || 'Unknown',
        value: Number(browser.count),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 browsers
  }, [overview]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getUserDisplayName = (firstName: string | null, lastName: string | null, email: string | null) => {
    if (firstName || lastName) {
      return [firstName, lastName].filter(Boolean).join(' ');
    }
    return email || 'Anonymous';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* ── Visitor Detail Modal ── */}
      <Dialog open={!!selectedVisitor} onOpenChange={() => setSelectedVisitor(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              Visitor Session Details
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-1">
              Detailed information about this visitor's session
            </DialogDescription>
          </DialogHeader>
          
          {visitorDetail && (
            <div className="px-6 py-5 space-y-5">
              {/* User Identity */}
              {visitorDetail.session.userId && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                    {((visitorDetail.session as any).userFirstName?.[0] || (visitorDetail.session as any).userEmail?.[0] || 'U').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">
                      {getUserDisplayName(
                        (visitorDetail.session as any).userFirstName,
                        (visitorDetail.session as any).userLastName,
                        (visitorDetail.session as any).userEmail
                      )}
                    </p>
                    {(visitorDetail.session as any).userEmail && (
                      <p className="text-xs text-gray-500">{(visitorDetail.session as any).userEmail}</p>
                    )}
                  </div>
                  <span className="ml-auto text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Logged-in</span>
                </div>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "First Visit", value: format(new Date(visitorDetail.session.firstVisit), 'PPpp') },
                  { label: "Last Activity", value: format(new Date(visitorDetail.session.lastActivity), 'PPpp') },
                  { label: "Session Duration", value: formatDuration(visitorDetail.sessionDuration) },
                  { label: "Page Views", value: String(visitorDetail.session.pageViewCount) },
                  { label: "Device", value: visitorDetail.session.deviceType || 'Unknown' },
                  { label: "Browser", value: visitorDetail.session.browser || 'Unknown' },
                  { label: "OS", value: visitorDetail.session.os || 'Unknown' },
                  { label: "Location", value: [visitorDetail.session.city, visitorDetail.session.country].filter(Boolean).join(', ') || 'Unknown' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-gray-50 px-3 py-2.5">
                    <p className="text-[10px] font-medium text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-700">{value}</p>
                  </div>
                ))}
                {visitorDetail.session.landingPage && (
                  <div className="col-span-2 rounded-xl bg-gray-50 px-3 py-2.5">
                    <p className="text-[10px] font-medium text-gray-400 mb-0.5">Landing Page</p>
                    <p className="text-sm font-semibold text-gray-700">{visitorDetail.session.landingPage}</p>
                  </div>
                )}
                {visitorDetail.session.referrer && (
                  <div className="col-span-2 rounded-xl bg-gray-50 px-3 py-2.5">
                    <p className="text-[10px] font-medium text-gray-400 mb-0.5">Referrer</p>
                    <p className="text-sm font-semibold text-gray-700 truncate">{visitorDetail.session.referrer}</p>
                  </div>
                )}
              </div>

              {/* UTM Campaign */}
              {(visitorDetail.session.utmSource || visitorDetail.session.utmMedium || visitorDetail.session.utmCampaign) && (
                <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3">
                  <p className="text-xs font-semibold text-violet-700 mb-2">Campaign Parameters</p>
                  <div className="flex gap-2 flex-wrap">
                    {visitorDetail.session.utmSource && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Source: {visitorDetail.session.utmSource}</span>
                    )}
                    {visitorDetail.session.utmMedium && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Medium: {visitorDetail.session.utmMedium}</span>
                    )}
                    {visitorDetail.session.utmCampaign && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Campaign: {visitorDetail.session.utmCampaign}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Page Journey */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5 text-violet-500" />
                  Page Journey ({visitorDetail.pageViews.length} pages)
                </h3>
                <div className="space-y-1.5">
                  {visitorDetail.pageViews.map((view, index) => (
                    <div key={view.id} className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold shrink-0">{index + 1}</div>
                      <p className="text-sm text-gray-700 truncate flex-1">{view.pagePath}</p>
                      <p className="text-[10px] text-gray-400 shrink-0">{format(new Date(view.createdAt), 'p')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events */}
              {visitorDetail.events.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Events ({visitorDetail.events.length})</h3>
                  <div className="space-y-1.5">
                    {visitorDetail.events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{event.eventType}</span>
                          {event.eventCategory && <span className="text-[10px] text-gray-400">{event.eventCategory}</span>}
                          {event.pagePath && <span className="text-[10px] text-gray-400 hidden sm:inline">{event.pagePath}</span>}
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{format(new Date(event.createdAt), 'p')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Gradient Header ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
        <div className="pointer-events-none absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/[0.05]" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 w-44 h-44 rounded-full bg-white/[0.05]" />
        <div className="pointer-events-none absolute top-6 right-48 w-28 h-28 rounded-full bg-white/[0.04]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
          
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-white/70 text-sm mt-0.5">Track visitor behavior and site performance</p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDateRange(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  dateRange === d
                    ? "bg-white text-violet-700 shadow-sm"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {d === 7 ? "Last 7 days" : d === 30 ? "Last 30 days" : "Last 90 days"}
              </button>
            ))}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold hover:bg-white/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 mt-5 pt-4 border-t border-white/20 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/25 text-emerald-100 text-xs font-semibold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            {realtime?.activeVisitors ?? 0} live now
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
            <Users className="w-3 h-3" />
            {(overview?.totalVisitors ?? 0).toLocaleString()} visitors
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
            <Eye className="w-3 h-3" />
            {(overview?.totalPageViews ?? 0).toLocaleString()} page views
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
            <TrendingUp className="w-3 h-3" />
            {(overview?.newVisitors ?? 0).toLocaleString()} new
          </span>
        </div>
      </div>

      {/* ── Realtime Panel ── */}
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white border border-emerald-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Real-time Activity
            </h2>
            <p className="text-xs text-gray-500">Updates every 10 seconds</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-bold text-emerald-700 tabular-nums">{realtime?.activeVisitors ?? 0}</div>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">Active visitors right now</p>
            {realtime && realtime.activePages.length > 0 && (
              <div className="space-y-1">
                {realtime.activePages.slice(0, 4).map((page, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border border-emerald-100">
                    <span className="text-gray-600 truncate">{page.path}</span>
                    <span className="font-semibold text-emerald-700 shrink-0 ml-2">{page.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-700">Logged-in users ({activeUsers?.length ?? 0})</span>
            </div>
            {activeUsers && activeUsers.length > 0 ? (
              <div className="space-y-1">
                {activeUsers.slice(0, 5).map((user, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-emerald-100">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                      {getUserDisplayName(user.userFirstName, user.userLastName, user.userEmail)}
                    </span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{user.currentPage || '/'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No logged-in users active right now</p>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {([
          { label: "Total Visitors",   value: overview?.totalVisitors ?? 0,     icon: Users,      sub: `Last ${dateRange} days`,  gradient: "from-violet-400 to-purple-500",  bg: "bg-violet-50",  iconCls: "text-violet-600"  },
          { label: "Total Page Views", value: overview?.totalPageViews ?? 0,    icon: Eye,        sub: `Last ${dateRange} days`,  gradient: "from-blue-400 to-indigo-500",    bg: "bg-blue-50",    iconCls: "text-blue-600"    },
          { label: "New Visitors",     value: overview?.newVisitors ?? 0,       icon: TrendingUp, sub: overview && overview.totalVisitors > 0 ? `${Math.round((overview.newVisitors / overview.totalVisitors) * 100)}% of total` : `Last ${dateRange} days`, gradient: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", iconCls: "text-emerald-600" },
          { label: "Returning",        value: overview?.returningVisitors ?? 0, icon: UserCheck,  sub: overview && overview.totalVisitors > 0 ? `${Math.round((overview.returningVisitors / overview.totalVisitors) * 100)}% of total` : `Last ${dateRange} days`, gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50", iconCls: "text-amber-600" },
        ] as const).map(({ label, value, icon: Icon, sub, gradient, bg, iconCls }) => (
          <div key={label} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-5">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} rounded-t-2xl`} />
            <div className="flex items-start justify-between mt-1">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                {isLoading && !overview ? (
                  <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</p>
                )}
              </div>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`h-5 w-5 ${iconCls}`} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Traffic Chart ── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-violet-600" />
          </div>
          <h2 className="font-semibold text-gray-800">Traffic Over Time</h2>
          <span className="ml-auto text-xs text-gray-400">Last {dateRange} days</span>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPageViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,.07)', fontSize: '12px' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="visitors" stroke="#7c3aed" strokeWidth={2} fill="url(#gVisitors)" name="Visitors" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="pageViews" stroke="#3b82f6" strokeWidth={2} fill="url(#gPageViews)" name="Page Views" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex flex-col items-center justify-center text-gray-300">
            <TrendingUp className="w-12 h-12 mb-2" />
            <p className="text-sm text-gray-400">No traffic data yet</p>
          </div>
        )}
      </div>

      {/* ── Device + Browser Charts ── */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Device Breakdown</h2>
          </div>
          {deviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%" cy="50%"
                  innerRadius={48} outerRadius={76}
                  dataKey="value" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-300">
              <Monitor className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Globe className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Browser Breakdown</h2>
          </div>
          {browserData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={browserData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={64} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
                  {browserData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-300">
              <Globe className="w-8 h-8" />
            </div>
          )}
        </div>
      </div>

      {/* ── Top Pages + Top Countries ── */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <MousePointer className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Top Pages</h2>
          </div>
          {overview && overview.topPages.length > 0 ? (
            <div className="space-y-3">
              {overview.topPages.map((page, i) => {
                const maxViews = Number(overview.topPages[0].views);
                const pct = maxViews ? Math.round((Number(page.views) / maxViews) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-gray-600 truncate flex-1 pr-2">{page.path}</span>
                      <span className="font-semibold text-gray-800 shrink-0">{Number(page.views).toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-400 to-violet-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <MousePointer className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No page views yet</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <Globe className="w-4 h-4 text-teal-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Top Countries</h2>
          </div>
          {overview && overview.topCountries.length > 0 ? (
            <div className="space-y-3">
              {overview.topCountries.map((country, i) => {
                const maxCount = Number(overview.topCountries[0].count);
                const pct = maxCount ? Math.round((Number(country.count) / maxCount) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-gray-600 truncate flex-1 pr-2">{country.country || 'Unknown'}</span>
                      <span className="font-semibold text-gray-800 shrink-0">{Number(country.count).toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No location data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Visitors (grouped, expandable cards) ── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <h2 className="font-semibold text-gray-800">Recent Visitors</h2>
          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold">
            {groupedVisitors?.length ?? 0} identities
          </span>
        </div>
        <div className="p-4 sm:p-5">
          {groupedLoading && !groupedVisitors ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : groupedVisitors && groupedVisitors.length > 0 ? (
            <div className="space-y-2">
              {groupedVisitors.map((group) => (
                <div key={group.identityKey} className="rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => toggleGroup(group.identityKey)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      group.isLoggedIn ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {group.isLoggedIn
                        ? (group.userFirstName?.[0] || group.userEmail?.[0] || 'U').toUpperCase()
                        : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">
                          {group.isLoggedIn
                            ? getUserDisplayName(group.userFirstName, group.userLastName, group.userEmail)
                            : 'Guest Visitor'}
                        </span>
                        {group.isLoggedIn && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                            <UserCheck className="w-3 h-3" /> Logged in
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[10px] text-gray-400">
                        <span>{group.country || 'Unknown location'}</span>
                        <span className="text-gray-300">·</span>
                        <span className="capitalize">{group.deviceType || 'Unknown'}</span>
                        <span className="text-gray-300">·</span>
                        <span>{group.browser || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-semibold text-gray-700">{group.totalPageViews} views</p>
                        <p className="text-[10px] text-gray-400">{group.totalSessions} session{group.totalSessions !== 1 ? 's' : ''}</p>
                      </div>
                      {expandedGroups.has(group.identityKey)
                        ? <ChevronDown className="w-4 h-4 text-gray-400" />
                        : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>
                  {expandedGroups.has(group.identityKey) && (
                    <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-3 space-y-2">
                      {group.sessions.map((session, si) => (
                        <div key={session.sessionId} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {si + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-mono truncate">{session.sessionId.slice(0, 14)}…</p>
                            {session.landingPage && (
                              <p className="text-[10px] text-gray-400 truncate">{session.landingPage}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">{session.pageViewCount} views</span>
                          <span className="text-[10px] text-gray-400 shrink-0 hidden sm:inline">
                            {format(new Date(session.firstVisit), 'MMM dd, HH:mm')}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedVisitor(session.sessionId); }}
                            className="text-[10px] text-violet-600 font-semibold hover:underline shrink-0 px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors"
                          >
                            Detail
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">{groupedLoading ? 'Loading visitors…' : 'No visitors yet'}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Logged-in User Activity ── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="font-semibold text-gray-800">Logged-in User Activity</h2>
          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
            {userAnalytics?.length ?? 0} users
          </span>
        </div>
        <div className="p-4 sm:p-5">
          {userAnalyticsLoading && !userAnalytics ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : userAnalytics && userAnalytics.length > 0 ? (
            <div className="space-y-2">
              {userAnalytics.map((user, i) => (
                <div key={user.userId ?? i} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0 uppercase">
                    {user.userFirstName?.[0] || user.userEmail?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {getUserDisplayName(user.userFirstName, user.userLastName, user.userEmail)}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.userEmail || '—'}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-700">{Number(user.totalPageViews) || 0}</p>
                      <p className="text-[10px] text-gray-400">views</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-700">{Number(user.totalSessions)}</p>
                      <p className="text-[10px] text-gray-400">sessions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{format(new Date(user.lastSeen), 'MMM dd, HH:mm')}</p>
                      <p className="text-[10px] text-gray-400">last seen</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {getDeviceIcon(user.deviceType || '')}
                    <span className="text-xs text-gray-400 capitalize hidden sm:inline">{user.deviceType || '?'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <UserCheck className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No logged-in user activity in this date range</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Database Management ── */}
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-sky-100 flex items-center justify-center">
              <Database className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Database Management</h2>
              <p className="text-[10px] text-gray-500">Auto cleanup runs daily at 3:00 AM</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isCleaningUp}
                className="flex items-center gap-1.5 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isCleaningUp ? "Cleaning…" : "Cleanup Old Data"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Clean Up Old Analytics Data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will aggregate old data into daily summaries, delete detailed records older than the retention period, and free up database space.
                  <span className="block mt-2 font-semibold text-orange-600">This action cannot be undone.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanup} className="rounded-xl bg-red-600 hover:bg-red-700">
                  Run Cleanup
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {dbStats ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                { label: "Page Views",  value: dbStats.records.pageViews,  retention: dbStats.retentionPolicy.pageViews  },
                { label: "Sessions",    value: dbStats.records.sessions,    retention: dbStats.retentionPolicy.sessions    },
                { label: "Events",      value: dbStats.records.events,      retention: dbStats.retentionPolicy.events      },
                { label: "Daily Stats", value: dbStats.records.dailyStats,  retention: dbStats.retentionPolicy.dailyStats  },
              ] as const).map(({ label, value, retention }) => (
                <div key={label} className="bg-white rounded-xl border border-sky-100 px-4 py-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xl font-bold text-gray-800 mt-0.5 tabular-nums">{value.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{retention}d retention</p>
                </div>
              ))}
            </div>
            {dbStats.dateRange.oldest && dbStats.dateRange.newest && (
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-sky-100">
                  <Clock className="w-3 h-3 text-sky-500" />
                  Oldest: {format(new Date(dbStats.dateRange.oldest), 'PPp')}
                </span>
                <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-sky-100">
                  <Clock className="w-3 h-3 text-sky-500" />
                  Newest: {format(new Date(dbStats.dateRange.newest), 'PPp')}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm">Loading database stats…</div>
        )}
      </div>

    </div>
  );
}
