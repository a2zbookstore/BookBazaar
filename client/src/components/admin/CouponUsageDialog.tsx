import { useQuery } from "@tanstack/react-query";
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
import { formatCurrency } from "@/lib/utils";
import type { Coupon, CouponUsage } from "@shared/schema";

interface CouponUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon;
}

export function CouponUsageDialog({
  open,
  onOpenChange,
  coupon,
}: CouponUsageDialogProps) {
  const { data: usages = [], isLoading } = useQuery({
    queryKey: [`/api/admin/coupons/${coupon.id}/usage`],
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Coupon Usage Details</DialogTitle>
          <DialogDescription>
            Usage history for coupon code: <strong>{coupon.code}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{coupon.usedCount}</div>
            <div className="text-sm text-blue-600">Total Uses</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {coupon.usageLimit ? coupon.usageLimit - coupon.usedCount : "∞"}
            </div>
            <div className="text-sm text-green-600">Remaining Uses</div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {coupon.discountType === 'percentage' 
                ? `${coupon.discountValue}%`
                : formatCurrency(parseFloat(coupon.discountValue))
              }
            </div>
            <div className="text-sm text-purple-600">Discount Value</div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(
                usages.reduce((sum: number, usage: CouponUsage) => 
                  sum + parseFloat(usage.discountAmount), 0
                )
              )}
            </div>
            <div className="text-sm text-orange-600">Total Savings</div>
          </div>
        </div>

        <div className="border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2">Loading usage data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Used</TableHead>
                  <TableHead>Customer Email</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Discount Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="text-gray-500">
                        <div className="text-lg mb-2">No usage yet</div>
                        <div className="text-sm">This coupon hasn't been used by any customers</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  usages.map((usage: CouponUsage) => (
                    <TableRow key={usage.id}>
                      <TableCell>
                        {new Date(usage.usedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {usage.customerEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">#{usage.orderId}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-green-600">
                          -{formatCurrency(parseFloat(usage.discountAmount))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}