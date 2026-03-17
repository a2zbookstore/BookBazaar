import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  BookOpen, DollarSign, Clock, Star, TrendingUp, AlertTriangle,
  Truck, Package, Gift, ChevronRight, ArrowUpRight, Zap,
  ShoppingBag, BarChart3, Settings, RefreshCw
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStats, Book, Order } from "@/types";
import { useAuth } from "@/hooks/useAuth";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useAuth();


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats, refetch: refetchStats, isFetching: statsFetching } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: lowStockBooks = [] } = useQuery<Book[]>({
    queryKey: ["/api/admin/low-stock?threshold=5"],
  });

  const { data: recentOrdersData } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/orders?limit=5"],
  });

  const { data: pendingOrdersData } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/orders", "pending"],
    queryFn: () => fetch("/api/orders?status=pending").then(res => res.json()),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const recentOrders = recentOrdersData?.orders || [];
  const pendingOrders = pendingOrdersData?.orders || [];
  const pendingOrdersCount = pendingOrders.length;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "processing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "delivered": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-amber-500";
      case "processing": return "bg-blue-500";
      case "shipped": return "bg-indigo-500";
      case "delivered": return "bg-emerald-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getStockLevel = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", bar: "w-0", color: "bg-red-500", text: "text-red-700" };
    if (stock <= 2) return { label: `${stock} left`, bar: "w-1/6", color: "bg-red-400", text: "text-red-600" };
    if (stock <= 5) return { label: `${stock} left`, bar: "w-2/6", color: "bg-amber-400", text: "text-amber-700" };
    return { label: `${stock} left`, bar: "w-4/6", color: "bg-emerald-400", text: "text-emerald-700" };
  };

  const quickActions = [
    { label: "Inventory", desc: "Add & manage books", icon: BookOpen, href: "/admin/inventory", accent: "from-cyan-500 to-teal-600" },
    { label: "Orders", desc: "Process & track orders", icon: ShoppingBag, href: "/admin/orders", accent: "from-violet-500 to-purple-600" },
    { label: "Sales Reports", desc: "Analytics & insights", icon: BarChart3, href: "/admin/sales", accent: "from-blue-500 to-indigo-600" },
    { label: "Shipping", desc: "Rates & delivery zones", icon: Truck, href: "/admin/shipping", accent: "from-orange-500 to-amber-600" },
    { label: "Gift Items", desc: "Manage gifts & bundles", icon: Gift, href: "/admin/gift-management", accent: "from-pink-500 to-rose-600" },
    { label: "Book Requests", desc: "Customer wishlist items", icon: BookOpen, href: "/admin/book-requests", accent: "from-lime-500 to-green-600" },
    { label: "Settings", desc: "Store configuration", icon: Settings, href: "/admin/settings", accent: "from-slate-500 to-gray-700" },
    { label: "Audit Trail", desc: "Track & restore changes", icon: AlertTriangle, href: "/admin/audit-trail", accent: "from-red-500 to-rose-700" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, hsl(188,100%,22%) 0%, hsl(188,79%,35%) 60%, hsl(188,100%,29%) 100%)" }}>
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute top-4 right-40 w-24 h-24 rounded-full bg-white/[0.04]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1 tracking-wide uppercase">
              {getGreeting()} ,{" "}
              <span className="text-xl font-extrabold text-green-400">
                {user ? `${user.firstName.charAt(0).toUpperCase()}${user.firstName.slice(1)} ${user.lastName.charAt(0).toUpperCase()}${user.lastName.slice(1)}` : "Admin"}
              </span>
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Dashboard Overview</h1>
            <p className="text-white/75 mt-1 text-sm sm:text-base">
              Here's what's happening with your bookshop today.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className="text-white/60 text-xs tracking-wide">
              {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
            <span className="text-white text-2xl font-semibold tabular-nums">
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {pendingOrdersCount > 0 ? (
              <button
                onClick={() => setLocation("/admin/orders")}
                className="flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-semibold px-3 py-1.5 hover:bg-amber-400/30 transition-colors"
              >
                <Zap className="h-3 w-3" />
                {pendingOrdersCount} order{pendingOrdersCount !== 1 ? "s" : ""} need attention
              </button>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs font-semibold px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All orders processed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-secondary-black tracking-wide uppercase">Store Overview</h2>
          <button
            onClick={() => refetchStats()}
            className="flex items-center gap-1.5 text-xs text-secondary-black hover:text-primary-aqua transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${statsFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Total Books */}
          <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-default">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-t-lg" />
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-secondary-black mb-1">Total Books</p>
                  <p className="text-2xl sm:text-3xl font-bold text-base-black tabular-nums">
                    {stats?.totalBooks ?? <span className="text-gray-300">—</span>}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="h-5 w-5 text-cyan-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-secondary-black">
                <span>In catalogue</span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Sales */}
          <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-default">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-t-lg" />
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-secondary-black mb-1">Monthly Sales</p>
                  <p className="text-2xl sm:text-3xl font-bold text-base-black tabular-nums">
                    ${stats?.monthlySales ? parseFloat(stats.monthlySales).toFixed(0) : "0"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                <span>This month</span>
              </div>
            </CardContent>
          </Card>

          {/* Pending Orders */}
          <Card
            className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => setLocation("/admin/orders")}
          >
            <div className={`absolute inset-x-0 top-0 h-1 rounded-t-lg ${pendingOrdersCount > 0 ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-gray-200 to-gray-300"}`} />
            {pendingOrdersCount > 0 && (
              <div className="absolute top-3 right-3">
                <span className="flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              </div>
            )}
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-secondary-black mb-1">Pending Orders</p>
                  <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${pendingOrdersCount > 0 ? "text-amber-600" : "text-base-black"}`}>
                    {pendingOrdersCount}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-amber-600 group-hover:gap-2 transition-all">
                <span>View &amp; process</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>

          {/* Customer Rating */}
          <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-default">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-t-lg" />
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-secondary-black mb-1">Customer Rating</p>
                  <p className="text-2xl sm:text-3xl font-bold text-base-black">4.8<span className="text-sm font-normal text-secondary-black">/5</span></p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
              <div className="mt-3 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-3 w-3 ${s <= 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-xs font-semibold text-secondary-black tracking-wide uppercase mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {quickActions.map(({ label, desc, icon: Icon, href, accent }) => (
            <button
              key={href}
              onClick={() => setLocation(href)}
              className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border border-gray-100 bg-white hover:border-transparent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-center"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-base-black leading-tight">{label}</p>
                <p className="text-[10px] text-secondary-black mt-0.5 leading-tight hidden sm:block">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Orders + Low Stock ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent Orders */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-violet-600" />
              </div>
              Recent Orders
            </CardTitle>
            <button
              onClick={() => setLocation("/admin/orders")}
              className="flex items-center gap-1 text-xs text-primary-aqua hover:underline"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="pt-0">
            {recentOrders.length > 0 ? (
              <div className="space-y-1">
                {recentOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setLocation("/admin/orders")}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(order.status)}`} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-base-black leading-tight">#{order.id} · {order.customerName}</p>
                        <p className="text-xs text-secondary-black mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-semibold text-sm text-primary-aqua">${parseFloat(order.total).toFixed(2)}</span>
                      <Badge className={`text-[10px] border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-sm text-secondary-black">No recent orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              Low Stock Alert
            </CardTitle>
            <button
              onClick={() => setLocation("/admin/inventory")}
              className="flex items-center gap-1 text-xs text-primary-aqua hover:underline"
            >
              Manage <ArrowUpRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="pt-0">
            {lowStockBooks.length > 0 ? (
              <div className="space-y-1">
                {lowStockBooks.slice(0, 6).map((book) => {
                  const level = getStockLevel(book.stock);
                  return (
                    <div key={book.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-base-black truncate leading-tight">{book.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${level.bar} ${level.color} transition-all`} />
                          </div>
                          <span className={`text-[10px] font-semibold shrink-0 ${level.text}`}>{level.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-7 w-7 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-emerald-700">All books are well stocked!</p>
                <p className="text-xs text-secondary-black mt-1">No action needed right now.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
