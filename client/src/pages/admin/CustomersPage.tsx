import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Phone, Calendar, ShoppingBag, User, Search, Eye, Filter } from "lucide-react";
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

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/admin/customers", currentPage, itemsPerPage],
    queryFn: async () => {
      const response = await fetch(`/api/admin/customers?limit=${itemsPerPage}&offset=${(currentPage - 1) * itemsPerPage}`);
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
    retry: 3,
    refetchOnWindowFocus: false,
  });

  const customers = data?.customers || [];
  const totalCustomers = data?.total || 0;
  const totalPages = Math.ceil(totalCustomers / itemsPerPage);



  useEffect(() => {
    console.log(isLoading, data);
  }, [isLoading]);


  if (isLoading || isFetching) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-aqua"></div>
        </div>
      </div>
    );
  }

  const filteredCustomers = customers.filter((customer: Customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.firstName?.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchQuery)
    );
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading customers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error loading customers: {(error as any)?.message || 'Unknown error'}</div>
        </div>
      </div>
    );
  }

  // Don't show "no customers" if data is still loading or we have customers
  if (!isLoading && (!customers || customers.length === 0)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Customer Management</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-gray-500 mb-2">No customers found</div>
            <div className="text-sm text-gray-400">Customer registrations will appear here</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-gray-600">View and manage registered customers</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-3 py-1">
            Total: {customers.length} customers
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Customers</p>
                <p className="text-2xl font-bold">
                  {customers.filter((c: Customer) => c.authProvider === "email").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Phone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone Customers</p>
                <p className="text-2xl font-bold">
                  {customers.filter((c: Customer) => c.authProvider === "phone").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold">
                  {customers.filter((c: Customer) => c.totalOrders > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Customers</CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Registration Type</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        {searchQuery ? "No customers found matching your search" : "No customers found"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer: Customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-aqua text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                            <div className="text-sm text-gray-500">ID: {customer.id.substring(0, 12)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.authProvider === "email" ? "default" : "secondary"}>
                          {customer.authProvider === "email" ? "Email" : "Phone"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {format(new Date(customer.createdAt), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <Badge variant="outline">
                            {customer.totalOrders} orders
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${customer.totalSpent}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Customer Details</DialogTitle>
                            </DialogHeader>
                            {selectedCustomer && (
                              <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 bg-primary-aqua text-white rounded-full flex items-center justify-center text-xl font-bold">
                                    {selectedCustomer.firstName.charAt(0)}{selectedCustomer.lastName.charAt(0)}
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-semibold">
                                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                                    </h3>
                                    <p className="text-gray-600">Customer ID: {selectedCustomer.id}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="space-y-2">
                                        <h4 className="font-medium">Contact Information</h4>
                                        {selectedCustomer.email && (
                                          <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            {selectedCustomer.email}
                                          </div>
                                        )}
                                        {selectedCustomer.phone && (
                                          <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            {selectedCustomer.phone}
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="space-y-2">
                                        <h4 className="font-medium">Account Details</h4>
                                        <div className="text-sm space-y-1">
                                          <div>Registration: {selectedCustomer.authProvider}</div>
                                          <div>Joined: {format(new Date(selectedCustomer.createdAt), "MMM dd, yyyy")}</div>
                                          <div>Email Verified: {selectedCustomer.isEmailVerified ? "Yes" : "No"}</div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-blue-600">{selectedCustomer.totalOrders}</div>
                                      <div className="text-sm text-gray-600">Total Orders</div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-green-600">${selectedCustomer.totalSpent}</div>
                                      <div className="text-sm text-gray-600">Total Spent</div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardContent className="p-4 text-center">
                                      <div className="text-2xl font-bold text-purple-600">
                                        {selectedCustomer.lastOrderDate ? format(new Date(selectedCustomer.lastOrderDate), "MMM dd") : "None"}
                                      </div>
                                      <div className="text-sm text-gray-600">Last Order</div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>
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
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </nav>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}