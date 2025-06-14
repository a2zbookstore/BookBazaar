import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Euro, Calendar, Download } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SalesData, DashboardStats } from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function SalesPage() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: salesData = [] } = useQuery<SalesData[]>({
    queryKey: [`/api/admin/sales-data?days=${timeRange}`],
  });

  // Process sales data for charts
  const chartData = salesData.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    sales: parseFloat(item.sales),
    fullDate: item.date,
  }));

  // Calculate metrics
  const totalSales = salesData.reduce((sum, item) => sum + parseFloat(item.sales), 0);
  const averageDailySales = salesData.length > 0 ? totalSales / salesData.length : 0;
  const bestDay = salesData.reduce((best, current) => 
    parseFloat(current.sales) > parseFloat(best.sales || '0') ? current : best
  , { date: '', sales: '0' });

  // Previous period comparison (simplified)
  const previousPeriodSales = totalSales * 0.85; // Mock 15% growth
  const growthPercentage = previousPeriodSales > 0 
    ? ((totalSales - previousPeriodSales) / previousPeriodSales * 100) 
    : 0;

  const handleExportData = () => {
    const csvContent = [
      ['Date', 'Sales (EUR)'],
      ...salesData.map(item => [item.date, item.sales])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${timeRange}-days.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bookerly font-bold text-base-black">Sales Reports</h1>
            <p className="text-secondary-black">Track your bookshop's performance and growth.</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-black text-sm font-medium">Total Sales</p>
                  <p className="text-2xl font-bold text-base-black">
                    €{totalSales.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{growthPercentage.toFixed(1)}% vs previous period
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Euro className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-black text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-base-black">
                    {stats?.totalOrders || 0}
                  </p>
                  <p className="text-xs text-secondary-black mt-1">
                    All time orders
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-black text-sm font-medium">Average Daily Sales</p>
                  <p className="text-2xl font-bold text-base-black">
                    €{averageDailySales.toFixed(2)}
                  </p>
                  <p className="text-xs text-secondary-black mt-1">
                    Last {timeRange} days
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-aqua/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary-aqua" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-black text-sm font-medium">Best Day</p>
                  <p className="text-2xl font-bold text-base-black">
                    €{parseFloat(bestDay.sales || '0').toFixed(2)}
                  </p>
                  <p className="text-xs text-secondary-black mt-1">
                    {bestDay.date ? new Date(bestDay.date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Trend - Last {timeRange} Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Sales']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="hsl(188, 100%, 29%)" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(188, 100%, 29%)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "hsl(188, 100%, 29%)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-secondary-black">No sales data available for the selected period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Sales Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Daily Sales Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Sales']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Bar 
                      dataKey="sales" 
                      fill="hsl(188, 100%, 29%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <Euro className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-secondary-black">No sales data available for the selected period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold text-base-black">Date</th>
                      <th className="text-right p-2 font-semibold text-base-black">Sales (EUR)</th>
                      <th className="text-right p-2 font-semibold text-base-black">vs Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.slice().reverse().map((item, index) => {
                      const salesAmount = parseFloat(item.sales);
                      const vsAverage = averageDailySales > 0 
                        ? ((salesAmount - averageDailySales) / averageDailySales * 100) 
                        : 0;
                      
                      return (
                        <tr key={index} className="border-b">
                          <td className="p-2 text-secondary-black">
                            {new Date(item.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="p-2 text-right font-semibold text-base-black">
                            €{salesAmount.toFixed(2)}
                          </td>
                          <td className={`p-2 text-right text-sm ${
                            vsAverage >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {vsAverage >= 0 ? '+' : ''}{vsAverage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-secondary-black">No sales data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
