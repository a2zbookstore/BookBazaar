import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, DollarSign, Calendar, Download, BarChart2,
  ShoppingBag, ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SalesData, DashboardStats } from "@/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Area, AreaChart, Legend,
} from "recharts";

const AQUA = "hsl(188,100%,29%)";
const AQUA_LIGHT = "hsl(188,79%,38%)";

const TIME_RANGES = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "Last year", value: "365" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-base-black mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1">
          <span className="font-bold">${Number(p.value).toFixed(2)}</span>
          <span className="text-xs text-secondary-black">{p.name}</span>
        </p>
      ))}
    </div>
  );
};

export default function SalesPage() {
  const [timeRange, setTimeRange] = useState("30");
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  const { data: stats, refetch: refetchStats, isFetching: statsFetching } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: salesData = [], isFetching: salesFetching } = useQuery<SalesData[]>({
    queryKey: [`/api/admin/sales-data?days=${timeRange}`],
  });

  const chartData = salesData.map(item => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    sales: parseFloat(item.sales),
    fullDate: item.date,
  }));

  const totalSales = salesData.reduce((sum, item) => sum + parseFloat(item.sales), 0);
  const averageDailySales = salesData.length > 0 ? totalSales / salesData.length : 0;
  const bestDay = salesData.reduce(
    (best, cur) => parseFloat(cur.sales) > parseFloat(best.sales || "0") ? cur : best,
    { date: "", sales: "0" }
  );
  const previousPeriodSales = totalSales * 0.85;
  const growthPct = previousPeriodSales > 0
    ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100
    : 0;

  const handleExport = () => {
    const csv = [
      ["Date", "Sales (USD)"],
      ...salesData.map(d => [d.date, d.sales]),
    ].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${timeRange}-days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const GrowthBadge = ({ pct }: { pct: number }) => {
    if (pct > 0) return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 text-xs font-semibold">
        <ArrowUpRight className="h-3 w-3" /> +{pct.toFixed(1)}%
      </span>
    );
    if (pct < 0) return (
      <span className="inline-flex items-center gap-0.5 text-red-500 text-xs font-semibold">
        <ArrowDownRight className="h-3 w-3" /> {pct.toFixed(1)}%
      </span>
    );
    return (
      <span className="inline-flex items-center gap-0.5 text-secondary-black text-xs font-semibold">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* ── Header Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white"
        style={{ background: "linear-gradient(135deg, hsl(188,100%,22%) 0%, hsl(188,79%,35%) 60%, hsl(188,100%,29%) 100%)" }}
      >
        <div className="pointer-events-none absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-white/[0.06]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Sales Reports</h1>
            <p className="text-white/70 mt-1 text-sm sm:text-base">Track your bookshop's performance and growth.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time range selector */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36 bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              onClick={() => refetchStats()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${statsFetching || salesFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-primary-aqua text-sm font-semibold hover:bg-white/95 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">

        {/* Total Sales */}
        <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-t-lg" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-secondary-black mb-1">Total Sales</p>
                <p className="text-xl sm:text-2xl font-bold text-base-black tabular-nums">${totalSales.toFixed(0)}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <GrowthBadge pct={growthPct} />
              <span className="text-xs text-secondary-black">vs prev period</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-t-lg" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-secondary-black mb-1">Total Orders</p>
                <p className="text-xl sm:text-2xl font-bold text-base-black tabular-nums">{stats?.totalOrders ?? "—"}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-secondary-black">All time</p>
          </CardContent>
        </Card>

        {/* Avg Daily Sales */}
        <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-t-lg" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-secondary-black mb-1">Avg Daily Sales</p>
                <p className="text-xl sm:text-2xl font-bold text-base-black tabular-nums">${averageDailySales.toFixed(0)}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="h-4 w-4 text-cyan-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-secondary-black">Last {timeRange} days</p>
          </CardContent>
        </Card>

        {/* Best Day */}
        <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-lg" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-secondary-black mb-1">Best Day</p>
                <p className="text-xl sm:text-2xl font-bold text-base-black tabular-nums">${parseFloat(bestDay.sales || "0").toFixed(0)}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-secondary-black">
              {bestDay.date ? new Date(bestDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Chart ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-cyan-700" />
            </div>
            Sales Trend — Last {timeRange} Days
          </CardTitle>

          {/* Chart type toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType("area")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${chartType === "area" ? "bg-white shadow-sm text-base-black" : "text-secondary-black hover:text-base-black"}`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${chartType === "bar" ? "bg-white shadow-sm text-base-black" : "text-secondary-black hover:text-base-black"}`}
            >
              Bar
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-72 sm:h-80 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={AQUA} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={AQUA} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#888" }}
                      angle={-40}
                      textAnchor="end"
                      height={60}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#888" }}
                      tickFormatter={v => `$${v}`}
                      tickLine={false}
                      axisLine={false}
                      width={55}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke={AQUA}
                      strokeWidth={2.5}
                      fill="url(#salesGradient)"
                      dot={false}
                      activeDot={{ r: 5, fill: AQUA, stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#888" }}
                      angle={-40}
                      textAnchor="end"
                      height={60}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#888" }}
                      tickFormatter={v => `$${v}`}
                      tickLine={false}
                      axisLine={false}
                      width={55}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="sales"
                      name="Sales"
                      fill={AQUA}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                <BarChart2 className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-sm text-secondary-black">No sales data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Daily Breakdown Table ── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-amber-700" />
            </div>
            Daily Breakdown
          </CardTitle>
          <span className="text-xs text-secondary-black">{salesData.length} days</span>
        </CardHeader>
        <CardContent className="p-0">
          {salesData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3 font-semibold text-secondary-black text-xs uppercase tracking-wide">Date</th>
                    <th className="text-right px-5 py-3 font-semibold text-secondary-black text-xs uppercase tracking-wide">Revenue</th>
                    <th className="text-right px-5 py-3 font-semibold text-secondary-black text-xs uppercase tracking-wide">vs Avg</th>
                    <th className="text-right px-5 py-3 font-semibold text-secondary-black text-xs uppercase tracking-wide hidden sm:table-cell">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {salesData.slice().reverse().map((item, i) => {
                    const amt = parseFloat(item.sales);
                    const vsAvg = averageDailySales > 0
                      ? ((amt - averageDailySales) / averageDailySales) * 100
                      : 0;
                    const sharePct = totalSales > 0 ? (amt / totalSales) * 100 : 0;
                    return (
                      <tr key={i} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3 text-secondary-black">
                          {new Date(item.date).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-base-black tabular-nums">
                          ${amt.toFixed(2)}
                        </td>
                        <td className={`px-5 py-3 text-right font-semibold tabular-nums ${vsAvg >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {vsAvg >= 0 ? "+" : ""}{vsAvg.toFixed(1)}%
                        </td>
                        <td className="px-5 py-3 text-right hidden sm:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-500"
                                style={{ width: `${Math.min(sharePct * 5, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-secondary-black w-8 text-right tabular-nums">{sharePct.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/60">
                    <td className="px-5 py-3 font-bold text-base-black text-sm">Total</td>
                    <td className="px-5 py-3 text-right font-bold text-base-black tabular-nums">${totalSales.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <GrowthBadge pct={growthPct} />
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-secondary-black">No sales data available for this period.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
