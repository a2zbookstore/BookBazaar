export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  categoryId?: number;
  description?: string;
  condition: string;
  binding?: string;
  price: string;
  stock: number;
  imageUrl?: string;
  publishedYear?: number;
  publisher?: string;
  pages?: number;
  language?: string;
  edition?: string;
  weight?: string;
  dimensions?: string;
  featured: boolean;
  bestseller: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

export interface CartItem {
  id: number;
  userId: string;
  bookId: number;
  quantity: number;
  createdAt: string;
  book: Book;
}

export interface Order {
  id: number;
  userId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  status: string;
  paymentStatus: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  bookId: number;
  quantity: number;
  price: string;
  title: string;
  author: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalBooks: number;
  monthlySales: string;
  pendingOrders: number;
  totalOrders: number;
}

export interface SalesData {
  date: string;
  sales: string;
}

export interface ContactMessage {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface ShippingRate {
  id: number;
  countryCode: string;
  countryName: string;
  shippingCost: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
