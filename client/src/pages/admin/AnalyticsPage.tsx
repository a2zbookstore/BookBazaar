import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { Users, Eye, TrendingUp, Globe, Monitor, Smartphone, Tablet, Clock, MousePointer, Database, Trash2, RefreshCw, UserCheck, UserX } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
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
    <div className="space-y-4 sm:space-y-6">
      {/* Visitor Detail Modal */}
      <Dialog open={!!selectedVisitor} onOpenChange={() => setSelectedVisitor(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visitor Details</DialogTitle>
            <DialogDescription>
              Detailed information about this visitor's session
            </DialogDescription>
          </DialogHeader>
          
          {visitorDetail && (
            <div className="space-y-6">
              {/* User Identity (if logged in) */}
              {visitorDetail.session.userId && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">
                      {getUserDisplayName(
                        (visitorDetail.session as any).userFirstName,
                        (visitorDetail.session as any).userLastName,
                        (visitorDetail.session as any).userEmail
                      )}
                    </p>
                    {(visitorDetail.session as any).userEmail && (
                      <p className="text-xs text-muted-foreground">{(visitorDetail.session as any).userEmail}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-auto">Logged-in User</Badge>
                </div>
              )}

              {/* Session Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">First Visit</p>
                  <p className="font-medium">{format(new Date(visitorDetail.session.firstVisit), 'PPpp')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Activity</p>
                  <p className="font-medium">{format(new Date(visitorDetail.session.lastActivity), 'PPpp')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Session Duration</p>
                  <p className="font-medium">{formatDuration(visitorDetail.sessionDuration)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Page Views</p>
                  <p className="font-medium">{visitorDetail.session.pageViewCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Device</p>
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(visitorDetail.session.deviceType || '')}
                    <span className="font-medium">{visitorDetail.session.deviceType || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Browser</p>
                  <p className="font-medium">{visitorDetail.session.browser || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">OS</p>
                  <p className="font-medium">{visitorDetail.session.os || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {visitorDetail.session.city && visitorDetail.session.country
                      ? `${visitorDetail.session.city}, ${visitorDetail.session.country}`
                      : visitorDetail.session.country || 'Unknown'}
                  </p>
                </div>
                {visitorDetail.session.landingPage && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Landing Page</p>
                    <p className="font-medium text-sm">{visitorDetail.session.landingPage}</p>
                  </div>
                )}
                {visitorDetail.session.referrer && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Referrer</p>
                    <p className="font-medium text-sm truncate">{visitorDetail.session.referrer}</p>
                  </div>
                )}
                {(visitorDetail.session.utmSource || visitorDetail.session.utmMedium || visitorDetail.session.utmCampaign) && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Campaign</p>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {visitorDetail.session.utmSource && (
                        <Badge variant="secondary">Source: {visitorDetail.session.utmSource}</Badge>
                      )}
                      {visitorDetail.session.utmMedium && (
                        <Badge variant="secondary">Medium: {visitorDetail.session.utmMedium}</Badge>
                      )}
                      {visitorDetail.session.utmCampaign && (
                        <Badge variant="secondary">Campaign: {visitorDetail.session.utmCampaign}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Page Views Journey */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Page Journey ({visitorDetail.pageViews.length} pages)
                </h3>
                <div className="space-y-2">
                  {visitorDetail.pageViews.map((view, index) => (
                    <div key={view.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{view.pagePath}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(view.createdAt), 'p')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events */}
              {visitorDetail.events.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Events ({visitorDetail.events.length})</h3>
                  <div className="space-y-2">
                    {visitorDetail.events.map((event) => (
                      <div key={event.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge>{event.eventType}</Badge>
                            {event.eventCategory && (
                              <Badge variant="outline" className="ml-2">{event.eventCategory}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.createdAt), 'p')}
                          </p>
                        </div>
                        {event.pagePath && (
                          <p className="text-sm text-muted-foreground mt-1">{event.pagePath}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track visitor behavior and site performance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant={dateRange === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(7)}
          >
            Last 7 Days
          </Button>
          <Button
            variant={dateRange === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(30)}
          >
            Last 30 Days
          </Button>
          <Button
            variant={dateRange === 90 ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(90)}
          >
            Last 90 Days
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Real-time Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {realtimeLoading && !realtime ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-4xl font-bold">
                  {realtime?.activeVisitors || 0}
                </div>
                <p className="text-muted-foreground mt-1">Active visitors right now</p>
                {realtime && realtime.activePages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Currently viewing:</p>
                    <div className="space-y-1">
                      {realtime.activePages.slice(0, 3).map((page, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate">{page.path}</span>
                          <span className="font-medium">{page.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Active Logged-in Users ({activeUsers?.length || 0})</span>
                </div>
                {activeUsers && activeUsers.length > 0 ? (
                  <div className="space-y-2">
                    {activeUsers.slice(0, 5).map((user, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 animate-pulse" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{getUserDisplayName(user.userFirstName, user.userLastName, user.userEmail)}</p>
                            {user.userEmail && (
                              <p className="text-xs text-muted-foreground truncate">{user.userEmail}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground truncate ml-2 max-w-[120px]" title={user.currentPage || ''}>
                          {user.currentPage || '/'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No logged-in users active right now</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !overview ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(overview?.totalVisitors || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last {dateRange} days
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !overview ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(overview?.totalPageViews || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last {dateRange} days
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Visitors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !overview ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(overview?.newVisitors || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview && overview.totalVisitors > 0
                    ? `${Math.round((overview.newVisitors / overview.totalVisitors) * 100)}% of total`
                    : "Last " + dateRange + " days"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !overview ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(overview?.returningVisitors || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview && overview.totalVisitors > 0
                    ? `${Math.round((overview.returningVisitors / overview.totalVisitors) * 100)}% of total`
                    : "Last " + dateRange + " days"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Traffic Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    stroke="#8884d8"
                    name="Visitors"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    stroke="#82ca9d"
                    name="Page Views"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browser Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {browserData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={browserData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {browserData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {overview && overview.topPages.length > 0 ? (
              <div className="space-y-2">
                {overview.topPages.map((page, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm truncate flex-1">{page.path}</span>
                    <span className="text-sm font-bold ml-4">{Number(page.views).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No page views yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overview && overview.topCountries.length > 0 ? (
              <div className="space-y-2">
                {overview.topCountries.map((country, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm truncate flex-1">{country.country || 'Unknown'}</span>
                    <span className="text-sm font-bold ml-4">{Number(country.count).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No location data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database Stats & Management */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isCleaningUp}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isCleaningUp ? "Cleaning..." : "Cleanup Old Data"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clean Up Old Analytics Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Aggregate old data into daily summaries</li>
                      <li>Delete detailed records older than the retention period</li>
                      <li>Free up database space</li>
                    </ul>
                    <p className="mt-3 font-medium">This action cannot be undone.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCleanup}>
                    Run Cleanup
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dbStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Page Views</p>
                  <p className="text-2xl font-bold">{dbStats.records.pageViews.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">records</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sessions</p>
                  <p className="text-2xl font-bold">{dbStats.records.sessions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">records</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Events</p>
                  <p className="text-2xl font-bold">{dbStats.records.events.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">records</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Stats</p>
                  <p className="text-2xl font-bold">{dbStats.records.dailyStats.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">records</p>
                </div>
              </div>

              {dbStats.dateRange.oldest && dbStats.dateRange.newest && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Data Range</p>
                  <p className="text-sm">
                    <strong>Oldest:</strong> {format(new Date(dbStats.dateRange.oldest), 'PPpp')}
                  </p>
                  <p className="text-sm">
                    <strong>Newest:</strong> {format(new Date(dbStats.dateRange.newest), 'PPpp')}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Retention Policy</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <Badge variant="outline">Page Views: {dbStats.retentionPolicy.pageViews} days</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">Sessions: {dbStats.retentionPolicy.sessions} days</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">Events: {dbStats.retentionPolicy.events} days</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">Daily Stats: {dbStats.retentionPolicy.dailyStats} days</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                   Automatic cleanup runs daily at 3:00 AM
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              Loading database stats...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Visitors — Grouped by Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Visitors
            <Badge variant="secondary" className="ml-auto">
              {groupedVisitors?.length || 0} identities
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupedLoading && !groupedVisitors ? (
            <div className="flex items-center gap-2 py-4">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading visitors...</span>
            </div>
          ) : groupedVisitors && groupedVisitors.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Identity</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Page Views</TableHead>
                    <TableHead>First Seen</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Browser</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedVisitors.map((group) => (
                    <>
                      {/* Identity row */}
                      <TableRow
                        key={group.identityKey}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleGroup(group.identityKey)}
                      >
                        <TableCell className="pr-0">
                          {expandedGroups.has(group.identityKey)
                            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell>
                          {group.isLoggedIn ? (
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[160px]">
                                  {getUserDisplayName(group.userFirstName, group.userLastName, group.userEmail)}
                                </p>
                                {group.userEmail && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[160px]">{group.userEmail}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <UserX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium">Guest</p>
                                {group.ipAddress && (
                                  <p className="text-xs text-muted-foreground font-mono">{group.ipAddress}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={group.totalSessions > 1 ? 'default' : 'secondary'}>
                            {group.totalSessions}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{group.totalPageViews}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{format(new Date(group.firstSeen), 'MMM dd, HH:mm')}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{format(new Date(group.lastSeen), 'MMM dd, HH:mm')}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {group.city && group.country
                                ? `${group.city}, ${group.country}`
                                : group.country || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getDeviceIcon(group.deviceType || '')}
                            <span className="text-sm capitalize">{group.deviceType || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{group.browser || 'Unknown'}</span>
                        </TableCell>
                      </TableRow>

                      {/* Expanded sessions sub-rows */}
                      {expandedGroups.has(group.identityKey) && group.sessions.map((session, si) => (
                        <TableRow key={session.sessionId} className="bg-muted/30 hover:bg-muted/50">
                          <TableCell />
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {si + 1}
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                                  {session.sessionId.slice(0, 12)}…
                                </p>
                                {session.landingPage && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">{session.landingPage}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell />
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{session.pageViewCount} views</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">{format(new Date(session.firstVisit), 'MMM dd, HH:mm')}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">{format(new Date(session.lastActivity), 'HH:mm')}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">
                              {session.city && session.country
                                ? `${session.city}, ${session.country}`
                                : session.country || '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getDeviceIcon(session.deviceType || '')}
                              <span className="text-xs capitalize">{session.deviceType || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{session.browser || '—'}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs ml-auto"
                                onClick={(e) => { e.stopPropagation(); setSelectedVisitor(session.sessionId); }}
                              >
                                Detail
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {groupedLoading ? 'Loading visitors...' : 'No visitors yet'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logged-in User Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-500" />
            Logged-in User Activity
            <Badge variant="secondary" className="ml-auto">
              {userAnalytics?.length || 0} users
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userAnalyticsLoading && !userAnalytics ? (
            <div className="flex items-center gap-2 py-4">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading user data...</span>
            </div>
          ) : userAnalytics && userAnalytics.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Page Views</TableHead>
                    <TableHead>First Seen</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Device</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAnalytics.map((user, index) => (
                    <TableRow key={user.userId || index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary uppercase">
                            {user.userFirstName?.[0] || user.userEmail?.[0] || '?'}
                          </div>
                          <span className="font-medium text-sm">
                            {getUserDisplayName(user.userFirstName, user.userLastName, user.userEmail)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{user.userEmail || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{Number(user.totalSessions)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{Number(user.totalPageViews) || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{format(new Date(user.firstSeen), 'MMM dd, HH:mm')}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{format(new Date(user.lastSeen), 'MMM dd, HH:mm')}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{user.country || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getDeviceIcon(user.deviceType || '')}
                          <span className="text-sm capitalize">{user.deviceType || 'Unknown'}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No logged-in user activity in this date range
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
