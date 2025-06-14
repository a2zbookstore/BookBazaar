import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Euro, Clock, Star, TrendingUp, AlertTriangle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStats, Book, Order } from "@/types";

export default function AdminDashboard() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: lowStockBooks = [] } = useQuery<Book[]>({
    queryKey: ["/api/admin/low-stock?threshold=5"],
  });

  const { data: recentOrdersData } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/orders?limit=5"],
  });

  const recentOrders = recentOrdersData?.orders || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockAlertColor = (stock: number) => {
    if (stock === 0) return "bg-red-100 text-red-800";
    if (stock <= 2) return "bg-red-100 text-red-800";
    if (stock <= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bookerly font-bold text-base-black mb-2">Dashboard Overview</h1>
          <p className="text-secondary-black">Welcome back! Here's what's happening with your bookshop.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-black text-sm font-medium">Total Books</p>
                  <p className="text-2xl font-bold text-base-black">
                    {stats?.totalBooks || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-aqua/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary-aqua" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-black text-sm font-medium">Monthly Sales</p>
                  <p className="text-2xl font-bold text-base-black">
                    €{stats?.monthlySales ? parseFloat(stats.monthlySales).toFixed(0) : '0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Euro className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">This month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-black text-sm font-medium">Pending Orders</p>
                  <p className="text-2xl font-bold text-base-black">
                    {stats?.pendingOrders || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-black text-sm font-medium">Customer Rating</p>
                  <p className="text-2xl font-bold text-base-black">4.8/5</p>
                  <div className="flex text-yellow-400 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="font-semibold text-base-black">#{order.id}</p>
                        <p className="text-sm text-secondary-black">{order.customerName}</p>
                        <p className="text-xs text-tertiary-black">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary-aqua">€{parseFloat(order.total).toFixed(2)}</p>
                        <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-secondary-black">No recent orders</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockBooks.length > 0 ? (
                <div className="space-y-4">
                  {lowStockBooks.slice(0, 5).map((book) => (
                    <div key={book.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base-black truncate">{book.title}</p>
                        <p className="text-sm text-secondary-black">{book.author}</p>
                      </div>
                      <Badge className={`${getStockAlertColor(book.stock)} ml-2`}>
                        {book.stock === 0 ? "Out of Stock" : `${book.stock} left`}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-secondary-black">All books are well stocked!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <a href="/admin/inventory" className="block">
                <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-aqua hover:bg-primary-aqua/5 transition-colors cursor-pointer">
                  <BookOpen className="h-8 w-8 text-primary-aqua mb-2" />
                  <h3 className="font-semibold text-base-black">Add New Book</h3>
                  <p className="text-sm text-secondary-black">Add books to inventory</p>
                </div>
              </a>
              
              <a href="/admin/orders" className="block">
                <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-aqua hover:bg-primary-aqua/5 transition-colors cursor-pointer">
                  <Clock className="h-8 w-8 text-primary-aqua mb-2" />
                  <h3 className="font-semibold text-base-black">Process Orders</h3>
                  <p className="text-sm text-secondary-black">Manage pending orders</p>
                </div>
              </a>
              
              <a href="/admin/sales" className="block">
                <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-aqua hover:bg-primary-aqua/5 transition-colors cursor-pointer">
                  <TrendingUp className="h-8 w-8 text-primary-aqua mb-2" />
                  <h3 className="font-semibold text-base-black">View Reports</h3>
                  <p className="text-sm text-secondary-black">Sales analytics</p>
                </div>
              </a>
              
              <a href="/admin/settings" className="block">
                <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-aqua hover:bg-primary-aqua/5 transition-colors cursor-pointer">
                  <Star className="h-8 w-8 text-primary-aqua mb-2" />
                  <h3 className="font-semibold text-base-black">Settings</h3>
                  <p className="text-sm text-secondary-black">Store configuration</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
