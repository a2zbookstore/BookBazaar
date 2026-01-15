import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useShipping } from "@/hooks/useShipping";
import { useToast } from "@/hooks/use-toast";
import { calculateDeliveryDate } from "@/lib/deliveryUtils";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, Globe, CheckCircle, ChevronDown } from "lucide-react";
import { PaymentSpinner } from "@/components/PaymentSpinner";
// import PayPalCheckoutButton from "@/components/PayPalCheckoutButton";
import StripeCheckoutForm from "@/components/StripeCheckoutForm";


declare global {
  interface Window {
    Razorpay: any;
  }
}

// Country codes and phone validation data
const countryCodes = [
  { code: "+1", country: "US", name: "United States" },
  { code: "+1", country: "CA", name: "Canada" },
  { code: "+44", country: "GB", name: "United Kingdom" },
  { code: "+91", country: "IN", name: "India" },
  { code: "+86", country: "CN", name: "China" },
  { code: "+81", country: "JP", name: "Japan" },
  { code: "+49", country: "DE", name: "Germany" },
  { code: "+33", country: "FR", name: "France" },
  { code: "+39", country: "IT", name: "Italy" },
  { code: "+34", country: "ES", name: "Spain" },
  { code: "+61", country: "AU", name: "Australia" },
  { code: "+55", country: "BR", name: "Brazil" },
  { code: "+52", country: "MX", name: "Mexico" },
  { code: "+7", country: "RU", name: "Russia" },
  { code: "+82", country: "KR", name: "South Korea" },
  { code: "+31", country: "NL", name: "Netherlands" },
  { code: "+46", country: "SE", name: "Sweden" },
  { code: "+47", country: "NO", name: "Norway" },
  { code: "+45", country: "DK", name: "Denmark" },
  { code: "+41", country: "CH", name: "Switzerland" },
  { code: "+43", country: "AT", name: "Austria" },
  { code: "+32", country: "BE", name: "Belgium" },
  { code: "+351", country: "PT", name: "Portugal" },
  { code: "+353", country: "IE", name: "Ireland" },
  { code: "+358", country: "FI", name: "Finland" },
  { code: "+48", country: "PL", name: "Poland" },
  { code: "+420", country: "CZ", name: "Czech Republic" },
  { code: "+36", country: "HU", name: "Hungary" },
  { code: "+30", country: "GR", name: "Greece" },
  { code: "+90", country: "TR", name: "Turkey" },
  { code: "+972", country: "IL", name: "Israel" },
  { code: "+971", country: "AE", name: "UAE" },
  { code: "+966", country: "SA", name: "Saudi Arabia" },
  { code: "+20", country: "EG", name: "Egypt" },
  { code: "+27", country: "ZA", name: "South Africa" },
  { code: "+234", country: "NG", name: "Nigeria" },
  { code: "+254", country: "KE", name: "Kenya" },
  { code: "+65", country: "SG", name: "Singapore" },
  { code: "+60", country: "MY", name: "Malaysia" },
  { code: "+66", country: "TH", name: "Thailand" },
  { code: "+84", country: "VN", name: "Vietnam" },
  { code: "+63", country: "PH", name: "Philippines" },
  { code: "+62", country: "ID", name: "Indonesia" },
  { code: "+92", country: "PK", name: "Pakistan" },
  { code: "+880", country: "BD", name: "Bangladesh" },
  { code: "+94", country: "LK", name: "Sri Lanka" },
  { code: "+977", country: "NP", name: "Nepal" },
  { code: "+98", country: "IR", name: "Iran" },
  { code: "+964", country: "IQ", name: "Iraq" },
  { code: "+213", country: "DZ", name: "Algeria" },
  { code: "+212", country: "MA", name: "Morocco" },
  { code: "+216", country: "TN", name: "Tunisia" },
  { code: "+93", country: "AF", name: "Afghanistan" },
  { code: "+355", country: "AL", name: "Albania" },
  { code: "+376", country: "AD", name: "Andorra" },
  { code: "+244", country: "AO", name: "Angola" },
  { code: "+54", country: "AR", name: "Argentina" },
  { code: "+374", country: "AM", name: "Armenia" },
  { code: "+994", country: "AZ", name: "Azerbaijan" },
  { code: "+973", country: "BH", name: "Bahrain" },
  { code: "+375", country: "BY", name: "Belarus" },
  { code: "+501", country: "BZ", name: "Belize" },
  { code: "+229", country: "BJ", name: "Benin" },
  { code: "+975", country: "BT", name: "Bhutan" },
  { code: "+591", country: "BO", name: "Bolivia" },
  { code: "+387", country: "BA", name: "Bosnia and Herzegovina" },
  { code: "+267", country: "BW", name: "Botswana" },
  { code: "+673", country: "BN", name: "Brunei" },
  { code: "+359", country: "BG", name: "Bulgaria" },
  { code: "+226", country: "BF", name: "Burkina Faso" },
  { code: "+257", country: "BI", name: "Burundi" },
  { code: "+855", country: "KH", name: "Cambodia" },
  { code: "+237", country: "CM", name: "Cameroon" },
  { code: "+238", country: "CV", name: "Cape Verde" },
  { code: "+235", country: "TD", name: "Chad" },
  { code: "+56", country: "CL", name: "Chile" },
  { code: "+57", country: "CO", name: "Colombia" },
  { code: "+269", country: "KM", name: "Comoros" },
  { code: "+242", country: "CG", name: "Congo" },
  { code: "+506", country: "CR", name: "Costa Rica" },
  { code: "+385", country: "HR", name: "Croatia" },
  { code: "+53", country: "CU", name: "Cuba" },
  { code: "+357", country: "CY", name: "Cyprus" },
  { code: "+253", country: "DJ", name: "Djibouti" },
  { code: "+1809", country: "DO", name: "Dominican Republic" },
  { code: "+593", country: "EC", name: "Ecuador" },
  { code: "+503", country: "SV", name: "El Salvador" },
  { code: "+240", country: "GQ", name: "Equatorial Guinea" },
  { code: "+291", country: "ER", name: "Eritrea" },
  { code: "+372", country: "EE", name: "Estonia" },
  { code: "+251", country: "ET", name: "Ethiopia" },
  { code: "+679", country: "FJ", name: "Fiji" },
  { code: "+241", country: "GA", name: "Gabon" },
  { code: "+220", country: "GM", name: "Gambia" },
  { code: "+995", country: "GE", name: "Georgia" },
  { code: "+233", country: "GH", name: "Ghana" },
  { code: "+502", country: "GT", name: "Guatemala" },
  { code: "+224", country: "GN", name: "Guinea" },
  { code: "+245", country: "GW", name: "Guinea-Bissau" },
  { code: "+592", country: "GY", name: "Guyana" },
  { code: "+509", country: "HT", name: "Haiti" },
  { code: "+504", country: "HN", name: "Honduras" },
  { code: "+852", country: "HK", name: "Hong Kong" },
  { code: "+354", country: "IS", name: "Iceland" },
  { code: "+1876", country: "JM", name: "Jamaica" },
  { code: "+962", country: "JO", name: "Jordan" },
  { code: "+7", country: "KZ", name: "Kazakhstan" },
  { code: "+965", country: "KW", name: "Kuwait" },
  { code: "+996", country: "KG", name: "Kyrgyzstan" },
  { code: "+856", country: "LA", name: "Laos" },
  { code: "+371", country: "LV", name: "Latvia" },
  { code: "+961", country: "LB", name: "Lebanon" },
  { code: "+266", country: "LS", name: "Lesotho" },
  { code: "+231", country: "LR", name: "Liberia" },
  { code: "+218", country: "LY", name: "Libya" },
  { code: "+370", country: "LT", name: "Lithuania" },
  { code: "+352", country: "LU", name: "Luxembourg" },
  { code: "+261", country: "MG", name: "Madagascar" },
  { code: "+265", country: "MW", name: "Malawi" },
  { code: "+960", country: "MV", name: "Maldives" },
  { code: "+223", country: "ML", name: "Mali" },
  { code: "+356", country: "MT", name: "Malta" },
  { code: "+222", country: "MR", name: "Mauritania" },
  { code: "+230", country: "MU", name: "Mauritius" },
  { code: "+373", country: "MD", name: "Moldova" },
  { code: "+377", country: "MC", name: "Monaco" },
  { code: "+976", country: "MN", name: "Mongolia" },
  { code: "+382", country: "ME", name: "Montenegro" },
  { code: "+258", country: "MZ", name: "Mozambique" },
  { code: "+95", country: "MM", name: "Myanmar" },
  { code: "+264", country: "NA", name: "Namibia" },
  { code: "+64", country: "NZ", name: "New Zealand" },
  { code: "+505", country: "NI", name: "Nicaragua" },
  { code: "+227", country: "NE", name: "Niger" },
  { code: "+850", country: "KP", name: "North Korea" },
  { code: "+968", country: "OM", name: "Oman" },
  { code: "+970", country: "PS", name: "Palestine" },
  { code: "+507", country: "PA", name: "Panama" },
  { code: "+675", country: "PG", name: "Papua New Guinea" },
  { code: "+595", country: "PY", name: "Paraguay" },
  { code: "+51", country: "PE", name: "Peru" },
  { code: "+974", country: "QA", name: "Qatar" },
  { code: "+40", country: "RO", name: "Romania" },
  { code: "+250", country: "RW", name: "Rwanda" },
  { code: "+221", country: "SN", name: "Senegal" },
  { code: "+381", country: "RS", name: "Serbia" },
  { code: "+248", country: "SC", name: "Seychelles" },
  { code: "+232", country: "SL", name: "Sierra Leone" },
  { code: "+421", country: "SK", name: "Slovakia" },
  { code: "+386", country: "SI", name: "Slovenia" },
  { code: "+252", country: "SO", name: "Somalia" },
  { code: "+211", country: "SS", name: "South Sudan" },
  { code: "+249", country: "SD", name: "Sudan" },
  { code: "+597", country: "SR", name: "Suriname" },
  { code: "+963", country: "SY", name: "Syria" },
  { code: "+886", country: "TW", name: "Taiwan" },
  { code: "+992", country: "TJ", name: "Tajikistan" },
  { code: "+255", country: "TZ", name: "Tanzania" },
  { code: "+228", country: "TG", name: "Togo" },
  { code: "+993", country: "TM", name: "Turkmenistan" },
  { code: "+256", country: "UG", name: "Uganda" },
  { code: "+380", country: "UA", name: "Ukraine" },
  { code: "+598", country: "UY", name: "Uruguay" },
  { code: "+998", country: "UZ", name: "Uzbekistan" },
  { code: "+58", country: "VE", name: "Venezuela" },
  { code: "+967", country: "YE", name: "Yemen" },
  { code: "+260", country: "ZM", name: "Zambia" },
  { code: "+263", country: "ZW", name: "Zimbabwe" }
];

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria",
  "Cambodia", "Canada", "Chile", "China", "Colombia", "Croatia", "Czech Republic", "Denmark",
  "Ecuador", "Egypt", "Estonia", "Finland", "France", "Georgia", "Germany", "Ghana", "Greece",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon", "Lithuania", "Luxembourg",
  "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia",
  "Singapore", "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden",
  "Switzerland", "Thailand", "Tunisia", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Venezuela", "Vietnam"
];

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
};

const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  return nameRegex.test(name) && name.trim().length >= 2;
};

// Component to handle individual item price conversion in checkout
function CheckoutItemPrice({ bookPrice, quantity }: { bookPrice: number; quantity: number }) {
  const { formatAmount, convertPrice } = useCurrency();
  const [convertedPrice, setConvertedPrice] = useState<number>(bookPrice * quantity);

  const convertItemPrice = React.useCallback(async () => {
    try {
      const converted = await convertPrice(bookPrice * quantity);
      setConvertedPrice(converted?.convertedAmount || (bookPrice * quantity));
    } catch (error) {
      console.error('Error converting checkout item price:', error);
      setConvertedPrice(bookPrice * quantity);
    }
  }, [bookPrice, quantity, convertPrice]);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      convertItemPrice();
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, [convertItemPrice]);

  useEffect(() => {
    convertItemPrice();
  }, [convertItemPrice]);

  return (
    <p className="font-medium text-sm">
      {formatAmount(convertedPrice)}
    </p>
  );
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { cartItems, cartCount, clearCart } = useCart();
  const { userCurrency, convertPrice, formatAmount, exchangeRates } = useCurrency();
  const { shippingCost, shippingRate } = useShipping();
  const { toast } = useToast();

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phoneCountryQuery, setPhoneCountryQuery] = useState("");
  const [showPhoneCountryDropdown, setShowPhoneCountryDropdown] = useState(false);
  const [selectedCountryIndex, setSelectedCountryIndex] = useState(-1);
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: ""
  });
  const [billingAddress, setBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: ""
  });
  const [sameBillingAddress, setSameBillingAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutType, setCheckoutType] = useState<"guest" | "register" | "login">("guest");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [giftItem, setGiftItem] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Check if cart has any non-gift books
  const hasNonGiftBooks = cartItems.some(item => !(item as any).isGift);

  // Apply coupon function
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError("");

    try {
      const response = await apiRequest("POST", "/api/coupons/validate", {
        code: couponCode.trim(),
        orderAmount: convertedAmounts.subtotal
      });

      const data = await response.json();
      setAppliedCoupon(data);
      setCouponCode("");
      toast({
        title: "Coupon Applied!",
        description: `You saved ${data.discountType === 'percentage' ? data.discountValue + '%' : formatAmount(data.discountValue)}`,
      });
    } catch (error: any) {
      setCouponError("Invalid coupon code");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Remove coupon function
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order",
    });
  };

  // Calculate discount amount
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    if (appliedCoupon.discountType === 'percentage') {
      const discountAmount = (convertedAmounts.subtotal * appliedCoupon.discountValue) / 100;
      // Apply maximum discount limit if exists
      if (appliedCoupon.maximumDiscountAmount) {
        return Math.min(discountAmount, appliedCoupon.maximumDiscountAmount);
      }
      return discountAmount;
    } else {
      // Fixed amount discount
      return Math.min(appliedCoupon.discountValue, convertedAmounts.subtotal);
    }
  };

  // Calculate final total with discount
  const calculateFinalTotal = () => {
    const discount = calculateDiscount();
    return Math.max(0, convertedAmounts.total - discount);
  };

  // Load gift item from localStorage and auto-remove if no books
  useEffect(() => {
    const savedGift = localStorage.getItem('giftDetails');
    if (savedGift && cartItems.length > 0 && hasNonGiftBooks) {
      try {
        setGiftItem(JSON.parse(savedGift));
      } catch (error) {
        console.error('Error parsing gift details:', error);
      }
    } else {
      setGiftItem(null);
      // Clear localStorage if no books remain and show notification
      if (!hasNonGiftBooks && localStorage.getItem('selectedGift')) {
        localStorage.removeItem('giftDetails');
        localStorage.removeItem('selectedGift');
        if (cartItems.length > 0) {
          toast({
            title: "Gift Removed",
            description: "Your free gift has been removed because no books remain in your cart. Add a book to select a gift again.",
            variant: "default",
          });
        }
      }
    }
  }, [cartItems, hasNonGiftBooks, toast]);

  // Calculate totals - Use detected location's shipping rate as primary source
  const subtotal = cartItems.reduce((total, item) => {
    // Skip gift items in subtotal calculation
    if ((item as any).isGift) return total;
    return total + (parseFloat(item.book.price) * item.quantity);
  }, 0);

  // Priority order for shipping cost:
  // 1. User's detected location shipping rate (from useShipping hook)
  // 2. Selected country in form (if different from detected)
  // 3. Default shipping rate

  const getShippingCountryCode = (countryName: string): string => {
    const countryCodeMap: { [key: string]: string } = {
      "United States": "US", "India": "IN", "United Kingdom": "GB", "Canada": "CA",
      "Australia": "AU", "Germany": "DE", "France": "FR", "Italy": "IT", "Spain": "ES",
      "Netherlands": "NL", "Japan": "JP", "China": "CN", "Brazil": "BR", "Mexico": "MX",
      "Russia": "RU", "South Korea": "KR", "Turkey": "TR", "Saudi Arabia": "SA",
      "South Africa": "ZA", "Nigeria": "NG", "Egypt": "EG", "Thailand": "TH",
      "Malaysia": "MY", "Singapore": "SG", "Philippines": "PH", "Indonesia": "ID",
      "Vietnam": "VN", "Pakistan": "PK", "Bangladesh": "BD", "Sri Lanka": "LK",
      "Nepal": "NP", "Afghanistan": "AF", "Iran": "IR", "Iraq": "IQ", "Israel": "IL",
      "UAE": "AE", "Switzerland": "CH", "Austria": "AT", "Belgium": "BE",
      "Sweden": "SE", "Norway": "NO", "Denmark": "DK", "Finland": "FI",
      "Poland": "PL", "Czech Republic": "CZ", "Hungary": "HU", "Greece": "GR",
      "Portugal": "PT", "Ireland": "IE", "Ukraine": "UA", "Argentina": "AR",
      "Chile": "CL", "Colombia": "CO", "Peru": "PE", "Venezuela": "VE"
    };
    return countryCodeMap[countryName] || "XX";
  };

  // Use dynamic shipping cost based on user location
  const checkoutShippingCost = shippingCost || 0;

  const tax = subtotal * 0.01; // 1% tax
  const total = subtotal + checkoutShippingCost + tax;

  // Convert all amounts to user's currency for display
  const [convertedAmounts, setConvertedAmounts] = useState({
    subtotal: subtotal,
    shipping: shippingCost,
    tax: tax,
    total: total
  });

  // Convert amounts function
  const convertAmounts = React.useCallback(async () => {
    try {
      console.log('Checkout conversion attempt:', { subtotal, userCurrency, exchangeRates });

      const convertedSubtotal = await convertPrice(subtotal);
      const convertedShipping = await convertPrice(checkoutShippingCost);
      const convertedTax = await convertPrice(tax);
      const convertedTotal = await convertPrice(total);

      console.log('Checkout conversion results:', {
        original: { subtotal, checkoutShippingCost, tax, total },
        converted: { convertedSubtotal, convertedShipping, convertedTax, convertedTotal }
      });

      setConvertedAmounts({
        subtotal: convertedSubtotal?.convertedAmount || subtotal,
        shipping: convertedShipping?.convertedAmount || checkoutShippingCost,
        tax: convertedTax?.convertedAmount || tax,
        total: convertedTotal?.convertedAmount || total
      });
    } catch (error) {
      console.error('Error converting currencies:', error);
      // Fallback to original amounts
      setConvertedAmounts({
        subtotal: subtotal,
        shipping: checkoutShippingCost,
        tax: tax,
        total: total
      });
    }
  }, [subtotal, checkoutShippingCost, tax, total, userCurrency, convertPrice, exchangeRates]);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      convertAmounts();
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, [convertAmounts]);

  // Convert prices when currency or amounts change
  useEffect(() => {
    // Only convert if we have exchange rates and the currency is not USD
    if (exchangeRates && userCurrency !== 'USD') {
      convertAmounts();
    } else {
      // For USD or when no exchange rates, use original amounts
      setConvertedAmounts({
        subtotal: subtotal,
        shipping: checkoutShippingCost,
        tax: tax,
        total: total
      });
    }
  }, [convertAmounts, exchangeRates, userCurrency]);

  // Razorpay config
  const { data: razorpayConfig } = useQuery({
    queryKey: ["/api/razorpay/config"],
  });

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setCustomerName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
      setCustomerEmail(user.email || "");
    }
  }, [user]);

  // Validation handlers
  const handleNameChange = (value: string) => {
    setCustomerName(value);
    if (value && !validateName(value)) {
      setNameError("Name should only contain letters, spaces, hyphens, and apostrophes");
    } else {
      setNameError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setCustomerEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (value: string) => {
    // Allow only numbers, spaces, hyphens, and parentheses
    const cleanedValue = value.replace(/[^0-9\s\-\(\)]/g, '');
    setCustomerPhone(cleanedValue);
    if (cleanedValue && !validatePhone(cleanedValue)) {
      setPhoneError("Please enter a valid phone number (minimum 7 digits)");
    } else {
      setPhoneError("");
    }
  };

  const handleCountrySearch = (value: string) => {
    setCountryQuery(value);
    setShippingAddress({ ...shippingAddress, country: value });
    setShowCountryDropdown(value.length > 0);
  };

  const selectCountry = (country: string) => {
    setShippingAddress({ ...shippingAddress, country: country });
    setCountryQuery(country);
    setShowCountryDropdown(false);
  };

  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(countryQuery.toLowerCase())
  ).slice(0, 10);

  const filteredCountryCodes = countryCodes.filter(country =>
    country.name.toLowerCase().includes(phoneCountryQuery.toLowerCase()) ||
    country.code.includes(phoneCountryQuery)
  ).slice(0, 10);

  const handlePhoneCountrySearch = (value: string) => {
    setPhoneCountryQuery(value);
    setShowPhoneCountryDropdown(true);
    setSelectedCountryIndex(-1);
  };

  const selectPhoneCountry = (countryCode: string) => {
    setPhoneCountryCode(countryCode);
    setPhoneCountryQuery("");
    setShowPhoneCountryDropdown(false);
    setSelectedCountryIndex(-1);
  };

  const handlePhoneCountryKeyDown = (e: React.KeyboardEvent) => {
    const filtered = phoneCountryQuery ? filteredCountryCodes : countryCodes;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!showPhoneCountryDropdown) {
          setShowPhoneCountryDropdown(true);
        }
        setSelectedCountryIndex(prev =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!showPhoneCountryDropdown) {
          setShowPhoneCountryDropdown(true);
        }
        setSelectedCountryIndex(prev =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedCountryIndex >= 0 && filtered[selectedCountryIndex]) {
          selectPhoneCountry(filtered[selectedCountryIndex].code);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowPhoneCountryDropdown(false);
        setPhoneCountryQuery("");
        setSelectedCountryIndex(-1);
        break;
    }
  };

  // Copy billing address
  useEffect(() => {
    if (sameBillingAddress) {
      setBillingAddress(shippingAddress);
    }
  }, [shippingAddress, sameBillingAddress]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartCount === 0) {
      setLocation("/cart");
      return;
    }
  }, [cartCount, setLocation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
      }
      if (!target.closest('.phone-country-dropdown-container')) {
        setShowPhoneCountryDropdown(false);
      }
    };

    if (showCountryDropdown || showPhoneCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCountryDropdown, showPhoneCountryDropdown]);

  const completeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders/complete", orderData);
      return await response.json();
    },
    onSuccess: (data: any) => {
      clearCart();
      // Invalidate pending orders cache for admin dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${data.orderId} has been confirmed.`,
      });
      // Navigate to order detail page with email for guest access
      setLocation(`/orders/${data.orderId}?email=${encodeURIComponent(customerEmail)}`);
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });



  const handlePayPalSuccess = (details: any) => {
    const orderItems = cartItems.map(item => ({
      bookId: item.book.id,
      quantity: item.quantity,
      price: item.book.price,
      title: item.book.title,
      author: item.book.author
    }));

    completeOrderMutation.mutate({
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      billingAddress: sameBillingAddress ? shippingAddress : billingAddress,
      subtotal: subtotal.toFixed(2),
      shipping: shippingCost.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      paymentMethod: "PayPal",
      paymentId: details.id,
      items: orderItems
    });
  };



  const handleRazorpayInternationalPayment = async () => {
    await processRazorpayPayment(true); // International payment
  };

  const processRazorpayPayment = async (isInternational: boolean = true) => {
    if (!(razorpayConfig as any)?.key_id) {
      toast({
        title: "Payment Error",
        description: "Razorpay configuration not available",
        variant: "destructive",
      });
      return;
    }

    if (!window.Razorpay) {
      toast({
        title: "Payment Error",
        description: "Razorpay payment system not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentMethod("razorpay");

    try {
      let finalAmount;
      let currency;
      let paymentDescription;

      // International payment in USD only
      finalAmount = total;
      currency = "USD";
      paymentDescription = "International Book Order Payment";

      // Check minimum amount for USD (usually $0.50)
      if (finalAmount < 0.50) {
        toast({
          title: "Minimum Amount Required",
          description: "International payments require a minimum of $0.50. Please add more items to your cart.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const orderResponse = await apiRequest("POST", "/api/razorpay/order", {
        amount: finalAmount,
        currency: currency,
        receipt: `order_${Date.now()}`,
        international: isInternational
      });

      const orderData = await orderResponse.json();
      console.log("Razorpay order created:", orderData);

      const options = {
        key: (razorpayConfig as any).key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "A2Z BOOKSHOP",
        description: paymentDescription,
        order_id: orderData.id,
        handler: async (response: any) => {
          console.log("Razorpay payment response:", response);

          try {
            const verifyResult = await apiRequest("POST", "/api/razorpay/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderData: {
                customerName,
                customerEmail,
                customerPhone,
                shippingAddress,
                billingAddress: sameBillingAddress ? shippingAddress : billingAddress,
                subtotal: subtotal.toFixed(2),
                shipping: shippingCost.toFixed(2),
                tax: tax.toFixed(2),
                total: total.toFixed(2),
                paymentMethod: "razorpay-international",
                items: cartItems.map(item => ({
                  bookId: item.book.id,
                  quantity: item.quantity,
                  price: item.book.price,
                  title: item.book.title,
                  author: item.book.author
                }))
              }
            });

            const verifyData = await verifyResult.json();
            console.log("Payment verification result:", verifyData);

            if (verifyData.status === "success") {
              setIsProcessing(false);
              clearCart();
              // Invalidate pending orders cache for admin dashboard
              queryClient.invalidateQueries({ queryKey: ["/api/orders", "pending"] });
              queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
              toast({
                title: "Payment Successful!",
                description: `Your order #${verifyData.orderId} has been placed successfully.`,
              });

              // Navigate to order detail page with email for guest access
              setLocation(`/orders/${verifyData.orderId}?email=${encodeURIComponent(customerEmail)}`);
            } else {
              console.error("Payment verification failed:", verifyData);
              throw new Error(verifyData.message || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);

            // Check if it's a network error or parsing error
            if (error instanceof TypeError && error.message.includes('fetch')) {
              toast({
                title: "Connection Error",
                description: "Unable to connect to payment server. Please check your internet connection and try again.",
                variant: "destructive",
              });
            } else if (error instanceof SyntaxError) {
              toast({
                title: "Server Error",
                description: "Server responded with invalid data. Please try again or contact support.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Payment Verification Failed",
                description: error instanceof Error ? error.message : "Payment verification failed. Please contact support with your payment ID.",
                variant: "destructive",
              });
            }
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone
        },
        theme: {
          color: isInternational ? "#2563EB" : "#7C3AED"
        },
        modal: {
          ondismiss: () => {
            console.log("Payment modal dismissed by user");
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "Payment was cancelled. Please try again.",
              variant: "destructive",
            });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error("Payment failed:", response.error);
        setIsProcessing(false);

        let errorMessage = "Payment failed. Please try again.";
        let errorTitle = "Payment Failed";

        if (response.error?.description) {
          errorMessage = response.error.description;

          // Handle business verification errors
          if (response.error.description.includes("business is not allowed") ||
            response.error.description.includes("not allowed to accept payments")) {
            errorTitle = "Payment Service Issue";
            errorMessage = "Our international payment service is temporarily unavailable. Please use PayPal payment instead.";
          }
        } else if (response.error?.reason) {
          errorMessage = response.error.reason;
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      });

      razorpay.open();
    } catch (error) {
      console.error("Razorpay payment error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = customerName && customerEmail && customerPhone &&
    shippingAddress.street && shippingAddress.city && shippingAddress.country && shippingAddress.zip &&
    validateName(customerName) && validateEmail(customerEmail) && validatePhone(customerPhone) &&
    !nameError && !emailError && !phoneError;

  if (cartCount === 0) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <SEO
        title="Checkout"
        description="Complete your book purchase securely at A2Z BOOKSHOP. Multiple payment options including PayPal, credit cards, and Razorpay."
        keywords="checkout, secure payment, buy books, online payment, book purchase"
        url="https://a2zbookshop.com/checkout"
        type="website"
      />
      <div className="container-custom py-8 mt-6">
        <h1 className="text-3xl font-bold text-base-black mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className={nameError ? "border-red-500" : ""}
                    />
                    {nameError && <p className="text-sm text-red-600">{nameError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className={emailError ? "border-red-500" : ""}
                    />
                    {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative phone-country-dropdown-container w-full sm:w-auto">
                      <div className="flex">
                        <Input
                          value={phoneCountryQuery || phoneCountryCode}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.startsWith('+') || /^\+?\d*$/.test(value)) {
                              // Manual country code entry
                              const formattedValue = value.startsWith('+') ? value : (value ? `+${value}` : '');
                              setPhoneCountryCode(formattedValue);
                              setPhoneCountryQuery("");
                              if (value.length > 1) {
                                setShowPhoneCountryDropdown(false);
                              }
                            } else {
                              // Search functionality
                              handlePhoneCountrySearch(value);
                            }
                          }}
                          onFocus={() => setShowPhoneCountryDropdown(true)}
                          onKeyDown={handlePhoneCountryKeyDown}
                          placeholder="Country code or type to search"
                          className="w-full sm:w-36 rounded-r-none min-h-[44px] touch-target"
                        />
                        <button
                          type="button"
                          className="px-3 border border-l-0 border-gray-300 rounded-r bg-gray-50 hover:bg-gray-100 touch-target min-h-[44px]"
                          onClick={() => setShowPhoneCountryDropdown(!showPhoneCountryDropdown)}
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      {showPhoneCountryDropdown && (
                        <div
                          className="absolute z-50 w-80 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto"
                          onMouseLeave={() => {
                            if (!phoneCountryQuery) {
                              setShowPhoneCountryDropdown(false);
                            }
                          }}
                        >
                          {phoneCountryQuery && (
                            <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                              Search: "{phoneCountryQuery}" - {filteredCountryCodes.length} results
                            </div>
                          )}
                          {(phoneCountryQuery ? filteredCountryCodes : countryCodes).map((country, index) => (
                            <div
                              key={index}
                              className={`px-3 py-2 cursor-pointer text-sm flex items-center gap-2 ${selectedCountryIndex === index
                                ? 'bg-blue-100 text-blue-900'
                                : 'hover:bg-gray-100'
                                }`}
                              onClick={() => selectPhoneCountry(country.code)}
                              onMouseEnter={() => setSelectedCountryIndex(index)}
                            >
                              <span className="font-medium text-blue-600 min-w-[3rem]">{country.code}</span>
                              <span className="text-gray-700">{country.name}</span>
                            </div>
                          ))}
                          {phoneCountryQuery && filteredCountryCodes.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No countries found for "{phoneCountryQuery}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="Enter phone number"
                      required
                      className={phoneError ? "border-red-500 flex-1 min-h-[44px] touch-target" : "flex-1 min-h-[44px] touch-target"}
                    />
                  </div>
                  {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
                  <p className="text-xs text-gray-500">Type +1, +91 etc. for manual entry or country letters to search. Phone format: Numbers, spaces, hyphens, and parentheses only</p>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    placeholder="Enter street address"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      placeholder="Enter state/province"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP/Postal Code *</Label>
                    <Input
                      id="zip"
                      value={shippingAddress.zip}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                      placeholder="Enter ZIP/postal code"
                      required
                    />
                  </div>
                  <div className="space-y-2 relative country-dropdown-container">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={countryQuery || shippingAddress.country}
                      onChange={(e) => handleCountrySearch(e.target.value)}
                      onFocus={() => setShowCountryDropdown(true)}
                      placeholder="Type to search countries..."
                      required
                    />
                    {showCountryDropdown && filteredCountries.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredCountries.map((country, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                            onClick={() => selectCountry(country)}
                          >
                            {country}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-4">

                    <div className="flex items-center space-x-3 p-4 border rounded-xl border-[#635BFF]/30 bg-[#635BFF]/5">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <div className="flex items-center space-x-2 flex-1">
                        <CreditCard className="w-5 h-5 text-[#635BFF]" />
                        <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                          <span className="font-semibold text-[#635BFF]">Stripe</span> - Credit/Debit Card
                          <Badge variant="secondary" className="ml-2 bg-[#635BFF]/10 text-[#635BFF]">Recommended</Badge>
                          <p className="text-xs text-gray-500 mt-1">Visa, Mastercard, Amex, and more</p>
                        </Label>
                      </div>
                    </div>

                    {/* <div className="flex items-center space-x-3 p-4 border rounded-xl">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <div className="flex items-center space-x-2 flex-1">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                          PayPal
                          <Badge variant="secondary" className="ml-2">International</Badge>
                        </Label>
                      </div>
                    </div> */}

                    <div className="flex items-center space-x-3 p-4 border rounded-xl">
                      <RadioGroupItem value="razorpay-international" id="razorpay-international" />
                      <div className="flex items-center space-x-2 flex-1">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <Label htmlFor="razorpay-international" className="flex-1 cursor-pointer">
                          International Cards
                          <Badge variant="secondary" className="ml-2">Global</Badge>
                          <p className="text-xs text-gray-500 mt-1">Visa, Mastercard, Amex worldwide</p>
                        </Label>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                <div className="mt-6">
                  {paymentMethod === "stripe" && isFormValid && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Enter your card details below to complete the payment
                        securely.
                      </p>
                      <StripeCheckoutForm
                        amount={total}
                        customerEmail={customerEmail}
                        customerName={customerName}
                        customerPhone={customerPhone}
                        shippingAddress={shippingAddress}
                        billingAddress={sameBillingAddress ? shippingAddress : billingAddress}
                        subtotal={subtotal.toFixed(2)}
                        shipping={shippingCost.toFixed(2)}
                        tax={tax.toFixed(2)}
                        total={total.toFixed(2)}
                        items={cartItems.map((item) => ({
                          bookId: item.book?.id,
                          quantity: item.quantity,
                          price: item.book?.price,
                          title: item.book?.title,
                          author: item.book?.author,
                        }))}
                        onSuccess={(orderId) => {
                          clearCart();
                          queryClient.invalidateQueries({
                            queryKey: ["/api/orders"],
                          });
                          setLocation(
                            `/orders/${orderId}?email=${encodeURIComponent(
                              customerEmail
                            )}`
                          );
                        }}
                        onCancel={() => setPaymentMethod("stripe")}
                        disabled={isProcessing}
                      />
                    </div>
                  )}


                  {/* {paymentMethod === "paypal" && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        You will be redirected to PayPal to complete your payment securely.
                      </p>
                      <PayPalCheckoutButton
                        amount={total}
                        currency={userCurrency}
                        customerData={{
                          name: customerName,
                          email: customerEmail,
                          phone: customerPhone,
                          shippingAddress: shippingAddress
                        }}
                        cartItems={cartItems}
                        disabled={!isFormValid}
                        onSuccess={(orderId) => {
                          console.log('PayPal payment success:', orderId);
                        }}
                        onError={(error) => {
                          console.error('PayPal payment error:', error);
                        }}
                      />
                    </div>
                  )} */}

                  {paymentMethod === "razorpay-international" && isFormValid && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Pay with international credit/debit cards. Supports Visa, Mastercard, and Amex worldwide.
                      </p>
                      <Button
                        onClick={handleRazorpayInternationalPayment}
                        disabled={isProcessing}
                        className="w-full bg-primary-aqua hover:brightness-110 hover:shadow-md active:scale-[0.98] text-white rounded-xl touch-target mobile-button transition-all duration-200"
                      >
                        {isProcessing ? "Processing..." : "Pay with International Card"}
                      </Button>
                    </div>
                  )}

                  {!isFormValid && (
                    <p className="text-sm text-red-600 mt-4">
                      Please fill in all required fields to proceed with payment.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        {(item as any).isGift ? (
                          <>
                            <h4 className="font-medium text-sm text-green-700">🎁 Free Gift</h4>
                            <p className="text-xs text-green-600">Complimentary item</p>
                            <p className="text-xs text-green-500">Qty: {item.quantity}</p>
                          </>
                        ) : item.book ? (
                          <>
                            <h4 className="font-medium text-sm">{item.book.title}</h4>
                            <p className="text-xs text-gray-600">by {item.book.author}</p>
                            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          </>
                        ) : (
                          <>
                            <h4 className="font-medium text-sm text-gray-600">Unknown Item</h4>
                            <p className="text-xs text-gray-500">Details unavailable</p>
                            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          </>
                        )}
                      </div>
                      {(item as any).isGift ? (
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">FREE</p>
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Gift</span>
                        </div>
                      ) : item.book ? (
                        <CheckoutItemPrice bookPrice={parseFloat(item.book.price)} quantity={item.quantity} />
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Coupon Code Section */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Have a Coupon?</h4>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-green-800">{appliedCoupon.code}</span>
                        <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={removeCoupon}
                        className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError("");
                        }}
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                      />
                      <Button
                        size="sm"
                        onClick={applyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className="bg-primary-aqua hover:brightness-110 hover:shadow-md active:scale-[0.98] text-white rounded-xl transition-all duration-200"
                      >
                        {isApplyingCoupon ? "Applying..." : "Apply"}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-xs text-red-600">{couponError}</p>
                  )}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatAmount(convertedAmounts.subtotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon.code}):</span>
                      <span>-{formatAmount(calculateDiscount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>
                      {convertedAmounts.shipping === 0 ? <span className="text-green-600 font-semibold"> FREE Shipping!</span> : formatAmount(convertedAmounts.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (1%):</span>
                    <span>{formatAmount(convertedAmounts.tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary-aqua">{formatAmount(calculateFinalTotal())}</span>
                  </div>
                </div>

                <Separator />

                {/* Delivery Date */}
                {shippingRate && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-blue-800">
                          Expected Delivery
                        </p>
                        <p className="text-xs text-blue-600">
                          {(() => {
                            const deliveryEstimate = calculateDeliveryDate(
                              shippingRate.minDeliveryDays,
                              shippingRate.maxDeliveryDays
                            );
                            return deliveryEstimate.deliveryText;
                          })()}
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          To {shippingRate.countryName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Secure Checkout</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Your payment information is encrypted and secure. We never store your payment details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Load Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

      {/* Payment Loading Spinner */}
      {isProcessing && (
        <PaymentSpinner
          message={paymentMethod === 'paypal' ? 'Redirecting to PayPal...' : 'Processing payment...'}
          paymentMethod={paymentMethod === 'paypal' ? 'paypal' : 'razorpay'}
        />
      )}
    </Layout>
  );
}