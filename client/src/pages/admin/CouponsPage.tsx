import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, Calendar, Percent, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { CouponForm } from "@/components/admin/CouponForm";
import { CouponUsageDialog } from "@/components/admin/CouponUsageDialog";
import type { Coupon } from "@shared/schema";

export default function CouponsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch coupons
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["/api/admin/coupons"],
  });

  // Create coupon mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Coupon created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create coupon",
        variant: "destructive",
      });
    },
  });

  // Update coupon mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/admin/coupons/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setIsEditDialogOpen(false);
      setSelectedCoupon(null);
      toast({
        title: "Success",
        description: "Coupon updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update coupon",
        variant: "destructive",
      });
    },
  });

  // Delete coupon mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/coupons/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setIsDeleteDialogOpen(false);
      setSelectedCoupon(null);
      toast({
        title: "Success",
        description: "Coupon deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete coupon",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleEdit = (data: any) => {
    if (selectedCoupon) {
      updateMutation.mutate({ id: selectedCoupon.id, data });
    }
  };

  const handleDelete = () => {
    if (selectedCoupon) {
      deleteMutation.mutate(selectedCoupon.id);
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsDeleteDialogOpen(true);
  };

  const openUsageDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsUsageDialogOpen(true);
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (!coupon.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (now < startDate) {
      return <Badge variant="outline">Scheduled</Badge>;
    }
    
    if (now > endDate) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupon Management</h1>
          <p className="text-gray-600 mt-1">Create and manage discount coupons for your store</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Valid Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-gray-500">
                    <Percent className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No coupons created yet</p>
                    <p className="text-sm">Create your first coupon to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon: Coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="font-mono font-semibold text-primary">
                      {coupon.code}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {coupon.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {coupon.discountType === 'percentage' ? (
                        <>
                          <Percent className="h-4 w-4" />
                          <span>Percentage</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4" />
                          <span>Fixed Amount</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.discountType === 'percentage' 
                      ? `${coupon.discountValue}%`
                      : formatCurrency(parseFloat(coupon.discountValue))
                    }
                    {coupon.maximumDiscountAmount && (
                      <div className="text-sm text-gray-500">
                        Max: {formatCurrency(parseFloat(coupon.maximumDiscountAmount))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{coupon.usedCount} used</div>
                      {coupon.usageLimit && (
                        <div className="text-gray-500">of {coupon.usageLimit}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(coupon.startDate).toLocaleDateString()}</div>
                      <div className="text-gray-500">
                        to {new Date(coupon.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(coupon)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUsageDialog(coupon)}
                        title="View Usage"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(coupon)}
                        title="Edit Coupon"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(coupon)}
                        title="Delete Coupon"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>
              Create a new discount coupon for your customers
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
            <CouponForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
              generateRandomCode={generateRandomCode}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update the coupon details
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
            {selectedCoupon && (
              <CouponForm
                coupon={selectedCoupon}
                onSubmit={handleEdit}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCoupon(null);
                }}
                isLoading={updateMutation.isPending}
                generateRandomCode={generateRandomCode}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone
              and will also delete all usage records.
            </DialogDescription>
          </DialogHeader>
          {selectedCoupon && (
            <div className="bg-gray-50 p-3 rounded-md my-4">
              <div className="font-semibold">{selectedCoupon.code}</div>
              <div className="text-sm text-gray-600">{selectedCoupon.description}</div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedCoupon(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usage Dialog */}
      {selectedCoupon && (
        <CouponUsageDialog
          open={isUsageDialogOpen}
          onOpenChange={setIsUsageDialogOpen}
          coupon={selectedCoupon}
        />
      )}
    </div>
  );
}