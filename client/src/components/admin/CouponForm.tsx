import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertCouponSchema, type Coupon } from "@shared/schema";
import { Shuffle } from "lucide-react";

const formSchema = insertCouponSchema.extend({
  startDate: z.string(),
  endDate: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface CouponFormProps {
  coupon?: Coupon;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  generateRandomCode: () => string;
}

export function CouponForm({
  coupon,
  onSubmit,
  onCancel,
  isLoading,
  generateRandomCode,
}: CouponFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: coupon?.code || "",
      description: coupon?.description || "",
      discountType: coupon?.discountType || "percentage",
      discountValue: coupon?.discountValue || "",
      minimumOrderAmount: coupon?.minimumOrderAmount || "0",
      maximumDiscountAmount: coupon?.maximumDiscountAmount || "",
      usageLimit: coupon?.usageLimit || undefined,
      isActive: coupon?.isActive ?? true,
      startDate: coupon?.startDate 
        ? new Date(coupon.startDate).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      endDate: coupon?.endDate
        ? new Date(coupon.endDate).toISOString().slice(0, 16)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 30 days from now
    },
  });

  const discountType = form.watch("discountType");

  const handleSubmit = (data: FormData) => {
    const submitData = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      usageLimit: data.usageLimit || undefined,
      maximumDiscountAmount: data.maximumDiscountAmount || undefined,
      description: data.description || undefined,
      isActive: data.isActive ?? true,
    };
    onSubmit(submitData);
  };

  const handleGenerateCode = () => {
    const newCode = generateRandomCode();
    form.setValue("code", newCode);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Coupon Code */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coupon Code</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="SAVE20"
                      className="uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateCode}
                    title="Generate Random Code"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
                <FormDescription>
                  Unique code customers will use to apply the discount
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Discount Type */}
          <FormField
            control={form.control}
            name="discountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    console.log("Discount type changed to:", value);
                    field.onChange(value);
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  placeholder="20% off on all books"
                  rows={2}
                />
              </FormControl>
              <FormDescription>
                Brief description of the coupon offer
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Discount Value */}
          <FormField
            control={form.control}
            name="discountValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Discount Value {discountType === 'percentage' ? '(%)' : '($)'}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step={discountType === 'percentage' ? "1" : "0.01"}
                    min="0"
                    max={discountType === 'percentage' ? "100" : undefined}
                    placeholder={discountType === 'percentage' ? "20" : "10.00"}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Minimum Order Amount */}
          <FormField
            control={form.control}
            name="minimumOrderAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Order ($)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </FormControl>
                <FormDescription>
                  Minimum order amount required
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Maximum Discount (only for percentage) */}
          {discountType === 'percentage' && (
            <FormField
              control={form.control}
              name="maximumDiscountAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Discount ($)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="50.00"
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum discount amount (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Usage Limit */}
          <FormField
            control={form.control}
            name="usageLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usage Limit</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="1"
                    placeholder="100"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Total number of uses (leave empty for unlimited)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="datetime-local"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="datetime-local"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Is Active */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Enable or disable this coupon
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : coupon ? "Update Coupon" : "Create Coupon"}
          </Button>
        </div>
      </form>
    </Form>
  );
}