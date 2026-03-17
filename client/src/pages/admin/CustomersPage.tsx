import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Mail, Phone, Calendar, ShoppingBag, User, Search, Eye,
  Users, TrendingUp, Star, RefreshCw, CheckCircle, Clock
} from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  authProvider: string;
  createdAt: string;
  isEmailVerified: boolean;
  totalOrders: number;
  totalSpent: string;
  lastOrderDate?: string;
}

const AVATAR_COLORS = [
  "from-teal-500 to-cyan-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-green-600",
  "from-sky-500 to-blue-600",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["/api/admin/customers", currentPage, itemsPerPage],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/customers?limit=${itemsPerPage}&offset=${(currentPage - 1) * itemsPerPage}`
      );
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const customers = data?.customers || [];
  const totalCustomers = data?.total || 0;
  const totalPages = Math.ceil(totalCustomers / itemsPerPage);

  const filteredCustomers = customers.filter((customer: Customer) => {
    const s = searchQuery.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(s) ||
      customer.lastName?.toLowerCase().includes(s) ||
      customer.email?.toLowerCase().includes(s) ||
      customer.phone?.includes(searchQuery)
    );
  });

  const activeCustomers = customers.filter((c: Customer) => c.totalOrders > 0).length;
  const totalRevenue = customers
    .reduce((sum: number, c: Customer) => sum + parseFloat(c.totalSpent || "0"), 0)
    .toFixed(2);

  if (isLoading || isFetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
          <Users className="absolute inset-0 m-auto h-6 w-6 text-teal-500" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading your customers…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl">⚠️</div>
          <p className="text-red-500 font-medium">Error loading customers</p>
          <p className="text-sm text-gray-400">{(error as any)?.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" /> Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
            <Users className="h-10 w-10 text-teal-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700">No customers yet</p>
          <p className="text-sm text-gray-400">Customer registrations will appear here once people sign up.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700 p-6 text-white shadow-lg">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Customer Management</h1>
            <p className="mt-1 text-sm text-teal-100">View, search and understand your registered customers</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-3xl font-bold">{totalCustomers}</p>
              <p className="text-xs text-teal-100 uppercase tracking-wide">Total Customers</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-white hover:bg-white/20 border border-white/30"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <Users className="h-5 w-5 text-teal-600" />,
            bg: "bg-teal-50",
            label: "Total Registered",
            value: totalCustomers,
            sub: "all time",
          },
          {
            icon: <Star className="h-5 w-5 text-amber-500" />,
            bg: "bg-amber-50",
            label: "Active Buyers",
            value: activeCustomers,
            sub: "placed ≥1 order",
          },
          {
            icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
            bg: "bg-emerald-50",
            label: "Total Revenue",
            value: `$${totalRevenue}`,
            sub: "from registered",
          },
          {
            icon: <Mail className="h-5 w-5 text-violet-600" />,
            bg: "bg-violet-50",
            label: "Email Sign-ups",
            value: customers.filter((c: Customer) => c.authProvider === "email").length,
            sub: "via email",
          },
        ].map((stat, idx) => (
          <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${stat.bg} shrink-0`}>{stat.icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                <p className="text-xl font-bold text-gray-800 leading-tight">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name, email or phone…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 rounded-xl border-gray-200 bg-white shadow-sm focus-visible:ring-teal-500"
        />
        {searchQuery && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearchQuery("")}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Table Card ── */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">
              {searchQuery
                ? `${filteredCustomers.length} result${filteredCustomers.length !== 1 ? "s" : ""} for "${searchQuery}"`
                : `All Customers (${customers.length} shown)`}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                  <TableHead className="pl-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</TableHead>
                  <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Contact</TableHead>
                  <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Type</TableHead>
                  <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Joined</TableHead>
                  <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Orders</TableHead>
                  <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Spent</TableHead>
                  <TableHead className="pr-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Search className="h-8 w-8 opacity-40" />
                        <p className="text-sm">No customers match your search</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer: Customer) => (
                    <TableRow
                      key={customer.id}
                      className="hover:bg-teal-50/30 transition-colors border-b border-gray-100 last:border-0"
                    >
                      {/* Avatar + Name */}
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 bg-gradient-to-br ${getAvatarColor(customer.id)} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm shrink-0`}
                          >
                            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 text-sm">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {customer.id.substring(0, 14)}…
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell className="py-3.5">
                        <div className="space-y-0.5">
                          {customer.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Auth type */}
                      <TableCell className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            customer.authProvider === "email"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : "bg-violet-50 text-violet-700 border border-violet-200"
                          }`}
                        >
                          {customer.authProvider === "email" ? (
                            <Mail className="h-3 w-3" />
                          ) : (
                            <Phone className="h-3 w-3" />
                          )}
                          {customer.authProvider === "email" ? "Email" : "Phone"}
                        </span>
                      </TableCell>

                      {/* Joined */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {format(new Date(customer.createdAt), "MMM d, yyyy")}
                        </div>
                      </TableCell>

                      {/* Orders */}
                      <TableCell className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            customer.totalOrders > 0
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <ShoppingBag className="h-3 w-3" />
                          {customer.totalOrders}
                        </span>
                      </TableCell>

                      {/* Spent */}
                      <TableCell className="py-3.5">
                        <span className="text-sm font-semibold text-emerald-700">
                          ${customer.totalSpent}
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="pr-5 py-3.5 text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                              className="h-8 px-3 text-teal-700 hover:bg-teal-50 hover:text-teal-800 border border-teal-200 rounded-lg"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
                            <DialogHeader className="sr-only">
                              <DialogTitle>Customer Details</DialogTitle>
                            </DialogHeader>
                            {selectedCustomer && (
                              <>
                                {/* Modal hero */}
                                <div className={`bg-gradient-to-br ${getAvatarColor(selectedCustomer.id)} p-6 text-white`}>
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                                      {selectedCustomer.firstName.charAt(0)}{selectedCustomer.lastName.charAt(0)}
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold">
                                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                                      </h3>
                                      <p className="text-sm opacity-80 mt-0.5">
                                        Member since {format(new Date(selectedCustomer.createdAt), "MMMM yyyy")}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        {selectedCustomer.isEmailVerified ? (
                                          <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                            <CheckCircle className="h-3 w-3" /> Verified
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                            <Clock className="h-3 w-3" /> Unverified
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-5 space-y-5">
                                  {/* Stats row */}
                                  <div className="grid grid-cols-3 gap-3">
                                    {[
                                      { label: "Orders", value: selectedCustomer.totalOrders, color: "text-amber-600", bg: "bg-amber-50" },
                                      { label: "Total Spent", value: `$${selectedCustomer.totalSpent}`, color: "text-emerald-600", bg: "bg-emerald-50" },
                                      {
                                        label: "Last Order",
                                        value: selectedCustomer.lastOrderDate
                                          ? format(new Date(selectedCustomer.lastOrderDate), "MMM d")
                                          : "—",
                                        color: "text-violet-600",
                                        bg: "bg-violet-50",
                                      },
                                    ].map((s) => (
                                      <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Contact info */}
                                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2.5">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contact</p>
                                    {selectedCustomer.email && (
                                      <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
                                          <Mail className="h-3.5 w-3.5 text-teal-600" />
                                        </div>
                                        {selectedCustomer.email}
                                      </div>
                                    )}
                                    {selectedCustomer.phone && (
                                      <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
                                          <Phone className="h-3.5 w-3.5 text-violet-600" />
                                        </div>
                                        {selectedCustomer.phone}
                                      </div>
                                    )}
                                  </div>

                                  {/* Account meta */}
                                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Account</p>
                                    <div className="grid grid-cols-2 gap-y-1.5 text-sm text-gray-600">
                                      <span className="text-gray-400 text-xs">Registration</span>
                                      <span className="font-medium capitalize">{selectedCustomer.authProvider}</span>
                                      <span className="text-gray-400 text-xs">Joined</span>
                                      <span className="font-medium">{format(new Date(selectedCustomer.createdAt), "MMM d, yyyy")}</span>
                                      <span className="text-gray-400 text-xs">Customer ID</span>
                                      <span className="font-mono text-xs text-gray-500 truncate">{selectedCustomer.id}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-lg"
                >
                  ← Prev
                </Button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 p-0 rounded-lg ${currentPage === pageNum ? "bg-teal-600 hover:bg-teal-700 border-0" : ""}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 rounded-lg"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}