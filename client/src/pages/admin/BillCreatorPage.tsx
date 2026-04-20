import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Plus,
  FileDown,
  User,
  Package,
  Receipt,
  X,
  BookOpen,
  Tag,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface BookResult {
  id: number;
  title: string;
  author: string;
  price: string;
  stock: number;
  imageUrl?: string;
  isbn?: string;
  publisher?: string;
}

interface BillItem {
  bookId: number;
  title: string;
  author: string;
  unitPrice: number;
  quantity: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function BillCreatorPage() {

  // ── Category filter ──────────────────────
  const { data: categories = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/categories"],
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // ── Book search ──────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 350);

  const { data: bookData, isFetching: booksFetching } = useQuery<{ books: BookResult[] }>({
    queryKey: ["/api/books", debouncedSearch, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: "24",
        sortBy: "title",
        sortOrder: "asc",
      });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (selectedCategory !== "all") params.set("categoryId", selectedCategory);
      return fetch(`/api/books?${params}`).then((r) => r.json());
    },
  });

  const browseBooks = bookData?.books ?? [];

  // ── Bill items ───────────────────────────
  const [items, setItems] = useState<BillItem[]>([]);

  const addBook = (book: BookResult) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.bookId === book.id);
      if (existing) {
        return prev.map((i) =>
          i.bookId === book.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          bookId: book.id,
          title: book.title,
          author: book.author,
          unitPrice: parseFloat(book.price),
          quantity: 1,
        },
      ];
    });
    toast({ title: "Added", description: book.title });
  };

  const updateQty = (bookId: number, qty: number) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.bookId === bookId ? { ...i, quantity: qty } : i))
    );
  };

  const updatePrice = (bookId: number, price: number) => {
    if (price < 0) return;
    setItems((prev) =>
      prev.map((i) => (i.bookId === bookId ? { ...i, unitPrice: price } : i))
    );
  };

  const removeItem = (bookId: number) => {
    setItems((prev) => prev.filter((i) => i.bookId !== bookId));
  };

  // ── Customer info ─────────────────────────
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  const setField = (field: keyof CustomerInfo, value: string) =>
    setCustomer((prev) => ({ ...prev, [field]: value }));

  // ── Financials ───────────────────────────
  const [shipping, setShipping] = useState(0);
  const [taxRate, setTaxRate] = useState(0); // percentage
  const [discount, setDiscount] = useState(0); // fixed amount
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [billNote, setBillNote] = useState("");

  const subtotal = items.reduce(
    (acc, i) => acc + i.unitPrice * i.quantity,
    0
  );
  const taxAmount = (subtotal * taxRate) / 100;
  const total = Math.max(0, subtotal + taxAmount + shipping - discount);

  // ── Generate bill ─────────────────────────
  const [generating, setGenerating] = useState(false);

  const generateBill = async () => {
    if (items.length === 0) {
      toast({
        title: "No items",
        description: "Add at least one book to generate a bill.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        customer,
        items,
        shipping,
        taxRate,
        taxAmount,
        discount,
        subtotal,
        total,
        paymentMethod,
        note: billNote,
      };

      const res = await fetch("/api/admin/generate-bill", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to generate bill");
      }

      const html = await res.text();
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not generate bill.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Receipt className="h-7 w-7" />
              Bill Creator
            </h1>
            <p className="mt-1 text-sm text-blue-200">Create a custom invoice for any combination of books</p>
          </div>
          <Button
            onClick={generateBill}
            disabled={generating || items.length === 0}
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-full px-6 gap-2 self-start sm:self-auto"
          >
            <FileDown className="h-4 w-4" />
            {generating ? "Generating…" : "Generate Bill"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Book Search & Browse */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Browse & Add Books
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">

                {/* Search + Category row */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      className="pl-9 pr-4"
                      placeholder="Search by title or author…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="w-44 flex-shrink-0">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active filters */}
                {(searchQuery || selectedCategory !== "all") && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">Filters:</span>
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        "{searchQuery}"
                        <button onClick={() => setSearchQuery("")}><X className="h-3 w-3" /></button>
                      </Badge>
                    )}
                    {selectedCategory !== "all" && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        {categories.find((c) => String(c.id) === selectedCategory)?.name}
                        <button onClick={() => setSelectedCategory("all")}><X className="h-3 w-3" /></button>
                      </Badge>
                    )}
                  </div>
                )}

                {/* Results count */}
                <p className="text-xs text-gray-400">
                  {booksFetching
                    ? "Loading…"
                    : `${browseBooks.length} book${browseBooks.length !== 1 ? "s" : ""} found`}
                </p>

                {/* Book grid */}
                <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
                  {booksFetching ? (
                    <div className="py-10 text-center text-sm text-gray-400 animate-pulse">
                      Loading books…
                    </div>
                  ) : browseBooks.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-400">
                      No books match your search
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {browseBooks.map((book) => {
                        const inBill = items.some((i) => i.bookId === book.id);
                        return (
                          <div
                            key={book.id}
                            className={`flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors ${inBill ? "bg-green-50" : ""}`}
                          >
                            {book.imageUrl ? (
                              <img
                                src={book.imageUrl}
                                alt={book.title}
                                className="w-9 h-12 object-cover rounded flex-shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 line-clamp-1">
                                {book.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{book.author}</p>
                              <p className="text-xs text-blue-600 font-semibold mt-0.5">
                                ${parseFloat(book.price).toFixed(2)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addBook(book)}
                              className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors ${
                                inBill
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              }`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {inBill ? "Again" : "Add"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>

            {/* Bill Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Bill Items
                  {items.length > 0 && (
                    <Badge className="ml-1 bg-blue-600 text-white text-xs">{items.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-1 text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                      <span>Book</span>
                      <span className="text-right">Unit Price</span>
                      <span className="text-center">Qty</span>
                      <span className="text-right">Total</span>
                      <span></span>
                    </div>
                    {items.map((item) => (
                      <div
                        key={item.bookId}
                        className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{item.title}</p>
                          <p className="text-xs text-gray-500 truncate">{item.author}</p>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice}
                            onChange={(e) =>
                              updatePrice(item.bookId, parseFloat(e.target.value) || 0)
                            }
                            className="h-8 text-right text-sm"
                          />
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQty(item.bookId, parseInt(e.target.value) || 1)
                            }
                            className="h-8 text-center text-sm"
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.bookId)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                    Add books from the panel above
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Details
                  <Badge variant="outline" className="ml-1 text-xs font-normal normal-case tracking-normal">
                    Optional
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cust-name">Full Name</Label>
                    <Input
                      id="cust-name"
                      placeholder="Jane Smith"
                      value={customer.name}
                      onChange={(e) => setField("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cust-email">Email</Label>
                    <Input
                      id="cust-email"
                      type="email"
                      placeholder="jane@example.com"
                      value={customer.email}
                      onChange={(e) => setField("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cust-phone">Phone</Label>
                    <Input
                      id="cust-phone"
                      placeholder="+1 555 000 0000"
                      value={customer.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cust-country">Country</Label>
                    <Input
                      id="cust-country"
                      placeholder="United States"
                      value={customer.country}
                      onChange={(e) => setField("country", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="cust-address">Street Address</Label>
                    <Input
                      id="cust-address"
                      placeholder="123 Main St"
                      value={customer.address}
                      onChange={(e) => setField("address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cust-city">City</Label>
                    <Input
                      id="cust-city"
                      placeholder="New York"
                      value={customer.city}
                      onChange={(e) => setField("city", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cust-state">State / Region</Label>
                      <Input
                        id="cust-state"
                        placeholder="NY"
                        value={customer.state}
                        onChange={(e) => setField("state", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cust-zip">ZIP / Postal</Label>
                      <Input
                        id="cust-zip"
                        placeholder="10001"
                        value={customer.zip}
                        onChange={(e) => setField("zip", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6">

            {/* Pricing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="shipping-cost">Shipping ($)</Label>
                  <Input
                    id="shipping-cost"
                    type="number"
                    min={0}
                    step={0.01}
                    value={shipping}
                    onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discount">Discount ($)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min={0}
                    step={0.01}
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Stripe">Stripe</SelectItem>
                      <SelectItem value="Razorpay">Razorpay</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bill-note">Note (optional)</Label>
                  <Input
                    id="bill-note"
                    placeholder="e.g. Thank you for your purchase!"
                    value={billNote}
                    onChange={(e) => setBillNote(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-semibold">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({taxRate}%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>−${discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
                  <span>Total</span>
                  <span className="text-blue-700 text-lg">${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={generateBill}
              disabled={generating || items.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full gap-2"
            >
              <FileDown className="h-4 w-4" />
              {generating ? "Generating…" : "Generate & Open Bill"}
            </Button>
          </div>
        </div>
      </div>
  );
}
