import { useCurrency } from "@/hooks/useCurrency";

export interface Coupon {
  code: string;
  minSubtotal: number;
  description: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
}

export const staticCoupons: Coupon[] = [
  {
    code: "FIVEOFF-$99",
    minSubtotal: 99,
    description: "5% off shopping above $99",
    discountType: "percentage",
    discountValue: 5,
  },
  {
    code: "TENOFF-$499",
    minSubtotal: 499,
    description: "10% off shopping above $499",
    discountType: "percentage",
    discountValue: 10,
  },
  {
    code: "FIFTEENOF-$999",
    minSubtotal: 999,
    description: "15% off shopping above $999",
    discountType: "percentage",
    discountValue: 15,
  },
  {
    code: "TWENTYOF-$1499",
    minSubtotal: 1499,
    description: "20% off shopping above $1499",
    discountType: "percentage",
    discountValue: 20,
  },
];

export function getLocalizedCoupon(coupon: Coupon, userCurrency: string, convertPrice: (amount: number, fromCurrency?: string) => Promise<{ convertedAmount: number } | null>): Promise<Coupon> {
  if (userCurrency === "USD") {
    return Promise.resolve(coupon);
  }

  return convertPrice(coupon.minSubtotal, "USD").then((converted) => {
    if (!converted) {
      return coupon; // Fallback to original coupon if conversion fails
    }

    return {
      ...coupon,
      minSubtotal: converted.convertedAmount,
      description: `${coupon.discountValue}% off shopping above ${converted.convertedAmount} ${userCurrency}`,
    };
  });
}
