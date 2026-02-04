export interface Coupon {
  code: string;
  minSubtotal: number;
  description: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
}

export const staticCoupons: Coupon[] = [
  {
    code: "FIVEOFF99",
    minSubtotal: 99,
    description: "5% off shopping above $99",
    discountType: "percentage",
    discountValue: 5,
  },
  {
    code: "TENOFF499",
    minSubtotal: 499,
    description: "10% off shopping above $499",
    discountType: "percentage",
    discountValue: 10,
  },
  {
    code: "FIFTEENOFF999",
    minSubtotal: 999,
    description: "15% off shopping above $999",
    discountType: "percentage",
    discountValue: 15,
  },
  {
    code: "TWENTYOFF1499",
    minSubtotal: 1499,
    description: "20% off shopping above $1499",
    discountType: "percentage",
    discountValue: 20,
  },
];
