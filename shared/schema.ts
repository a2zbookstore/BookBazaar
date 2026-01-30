import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth and email registration
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  phone: varchar("phone").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("customer"), // customer, admin
  passwordHash: varchar("password_hash"), // For email-based authentication
  isEmailVerified: boolean("is_email_verified").default(false),
  authProvider: varchar("auth_provider").default("email"), // email, phone, replit
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin table for separate admin authentication
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  name: varchar("name").notNull(),
  email: varchar("email").unique(),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Books table
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  author: varchar("author", { length: 300 }).notNull(),
  isbn: varchar("isbn", { length: 20 }),
  categoryId: integer("category_id").references(() => categories.id),
  description: text("description"),
  condition: varchar("condition", { length: 50 }).notNull(), // New, Like New, Very Good, Good, Fair
  binding: varchar("binding", { length: 50 }).default("No Binding"), // Softcover, Hardcover, No Binding
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  imageUrl: varchar("image_url", { length: 500 }),
  imageUrl2: varchar("image_url_2", { length: 500 }),
  imageUrl3: varchar("image_url_3", { length: 500 }),
  publishedYear: integer("published_year"),
  publisher: varchar("publisher", { length: 200 }),
  pages: integer("pages"),
  language: varchar("language", { length: 50 }).default("English"),
  edition: varchar("edition", { length: 100 }), // e.g., "1st Edition", "2nd Edition"
  weight: decimal("weight", { precision: 5, scale: 2 }), // in lbs
  dimensions: varchar("dimensions", { length: 100 }), // e.g., "8x5x1 inches"
  featured: boolean("featured").default(false),
  bestseller: boolean("bestseller").default(false),
  trending: boolean("trending").default(false),
  newArrival: boolean("new_arrival").default(false),
  boxSet: boolean("box_set").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  customerEmail: varchar("customer_email").notNull(),
  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone"),
  shippingAddress: jsonb("shipping_address").notNull(), // {street, city, state, zip, country}
  billingAddress: jsonb("billing_address").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, paid, failed, refunded
  paymentId: varchar("payment_id", { length: 200 }), // Payment gateway transaction ID
  paymentMethod: varchar("payment_method", { length: 50 }), // paypal, razorpay, stripe, etc.
  trackingNumber: varchar("tracking_number", { length: 100 }),
  shippingCarrier: varchar("shipping_carrier", { length: 100 }), // FedEx, UPS, DHL, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order Items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // price at time of order
  title: varchar("title", { length: 500 }).notNull(), // snapshot of book title
  author: varchar("author", { length: 300 }).notNull(), // snapshot of book author
});

// Cart Items table (for persistent cart)
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wishlist Items table
export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  bookId: integer("book_id").references(() => books.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contact Messages table
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).default("unread"), // unread, read, replied
  createdAt: timestamp("created_at").defaultNow(),
});

// Store Settings table
export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeName: varchar("store_name", { length: 255 }).notNull(),
  storeEmail: varchar("store_email", { length: 255 }).notNull(),
  storeDescription: text("store_description"),
  storePhone: varchar("store_phone", { length: 50 }),
  currency: varchar("currency", { length: 10 }).default("EUR").notNull(),
  storeAddress: text("store_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shipping Rates table
export const shippingRates = pgTable("shipping_rates", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 20 }).notNull(), // ISO 3166-1 alpha-2 code or special codes like REST_OF_WORLD
  countryName: varchar("country_name", { length: 100 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull(),
  minDeliveryDays: integer("min_delivery_days").notNull(),
  maxDeliveryDays: integer("max_delivery_days").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Return requests table
export const returnRequests = pgTable("return_requests", {
  id: serial("id").primaryKey(),
  returnRequestNumber: varchar("return_request_number").unique().notNull(), // Unique return request number
  orderId: integer("order_id").notNull().references(() => orders.id),
  userId: varchar("user_id").references(() => users.id),
  customerEmail: varchar("customer_email").notNull(),
  customerName: varchar("customer_name").notNull(),
  returnReason: varchar("return_reason").notNull(), // damaged, defective, wrong_item, not_as_described, other
  returnDescription: text("return_description").notNull(),
  itemsToReturn: jsonb("items_to_return").notNull(), // Array of {bookId, quantity, reason}
  totalRefundAmount: decimal("total_refund_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default("pending"), // pending, approved, rejected, refund_processed
  adminNotes: text("admin_notes"),
  refundMethod: varchar("refund_method"), // paypal, razorpay, bank_transfer
  refundTransactionId: varchar("refund_transaction_id"),
  refundProcessedAt: timestamp("refund_processed_at"),
  returnDeadline: timestamp("return_deadline").notNull(), // 30 days from order delivery
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueOrderReturn: unique().on(table.orderId, table.userId), // Ensure one return request per order per user
  };
});

// Refund transactions table
export const refundTransactions = pgTable("refund_transactions", {
  id: serial("id").primaryKey(),
  returnRequestId: integer("return_request_id").notNull().references(() => returnRequests.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).notNull(),
  refundMethod: varchar("refund_method").notNull(), // paypal, razorpay, bank_transfer
  originalPaymentMethod: varchar("original_payment_method"), // paypal, razorpay
  originalTransactionId: varchar("original_transaction_id"),
  refundTransactionId: varchar("refund_transaction_id"),
  refundStatus: varchar("refund_status").default("pending"), // pending, completed, failed
  refundReason: text("refund_reason"),
  processedBy: integer("processed_by").references(() => admins.id),
  processedAt: timestamp("processed_at"),
  gatewayResponse: jsonb("gateway_response"), // Store gateway API response
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coupon system tables
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  description: text("description"),
  discountType: varchar("discount_type").notNull(), // percentage, fixed_amount
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumOrderAmount: decimal("minimum_order_amount", { precision: 10, scale: 2 }).default("0"),
  maximumDiscountAmount: decimal("maximum_discount_amount", { precision: 10, scale: 2 }), // For percentage discounts
  usageLimit: integer("usage_limit"), // null = unlimited
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: integer("created_by").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Book Requests table - For customers to request books that are not in inventory
export const bookRequests = pgTable("book_requests", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 200 }).notNull(),
  customerEmail: varchar("customer_email", { length: 200 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  bookTitle: varchar("book_title", { length: 500 }).notNull(),
  author: varchar("author", { length: 300 }),
  isbn: varchar("isbn", { length: 20 }).notNull(), // Made required
  binding: varchar("binding", { length: 50 }).notNull(), // New field: softcover, hardcover, spiral, no binding
  expectedPrice: decimal("expected_price", { precision: 10, scale: 2 }),
  quantity: integer("quantity").default(1),
  notes: text("notes"), // Additional details from customer
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, fulfilled, rejected, cancelled
  adminNotes: text("admin_notes"), // Internal notes from admin
  processedBy: integer("processed_by").references(() => admins.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coupon usage tracking table to ensure one-time use per customer
export const couponUsages = pgTable("coupon_usages", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").notNull().references(() => coupons.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  userId: varchar("user_id").references(() => users.id),
  customerEmail: varchar("customer_email").notNull(), // For guest users
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp("used_at").defaultNow(),
}, (table) => {
  return {
    uniqueCouponUser: unique().on(table.couponId, table.customerEmail), // Ensure one use per customer email
  };
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  cartItems: many(cartItems),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  category: one(categories, {
    fields: [books.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  book: one(books, {
    fields: [orderItems.bookId],
    references: [books.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [cartItems.bookId],
    references: [books.id],
  }),
}));

export const returnRequestsRelations = relations(returnRequests, ({ one, many }) => ({
  order: one(orders, {
    fields: [returnRequests.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [returnRequests.userId],
    references: [users.id],
  }),
  refundTransactions: many(refundTransactions),
}));

export const refundTransactionsRelations = relations(refundTransactions, ({ one }) => ({
  returnRequest: one(returnRequests, {
    fields: [refundTransactions.returnRequestId],
    references: [returnRequests.id],
  }),
  order: one(orders, {
    fields: [refundTransactions.orderId],
    references: [orders.id],
  }),
  processedByAdmin: one(admins, {
    fields: [refundTransactions.processedBy],
    references: [admins.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ one, many }) => ({
  createdByAdmin: one(admins, {
    fields: [coupons.createdBy],
    references: [admins.id],
  }),
  usages: many(couponUsages),
}));

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsages.couponId],
    references: [coupons.id],
  }),
  order: one(orders, {
    fields: [couponUsages.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [couponUsages.userId],
    references: [users.id],
  }),
}));

// Types and schemas
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Category = typeof categories.$inferSelect;
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Book = typeof books.$inferSelect;
export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBook = z.infer<typeof insertBookSchema>;

export type Order = typeof orders.$inferSelect;
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type WishlistItem = typeof wishlistItems.$inferSelect;
export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true,
  createdAt: true,
});
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  status: true,
  createdAt: true,
});
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

export type StoreSettings = typeof storeSettings.$inferSelect;
export const insertStoreSettingsSchema = createInsertSchema(storeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStoreSettings = z.infer<typeof insertStoreSettingsSchema>;

export type ShippingRate = typeof shippingRates.$inferSelect;
export const insertShippingRateSchema = createInsertSchema(shippingRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertShippingRate = z.infer<typeof insertShippingRateSchema>;

// Return and refund types
export type ReturnRequest = typeof returnRequests.$inferSelect;
export const insertReturnRequestSchema = createInsertSchema(returnRequests).omit({
  id: true,
  status: true,
  refundTransactionId: true,
  refundProcessedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertReturnRequest = z.infer<typeof insertReturnRequestSchema>;

export type RefundTransaction = typeof refundTransactions.$inferSelect;

// Book Request types
export type BookRequest = typeof bookRequests.$inferSelect;
export const insertBookRequestSchema = createInsertSchema(bookRequests, {
  customerName: z.string().min(1, "Full name is required"),
  customerEmail: z.string().email("Valid email address is required"),
  bookTitle: z.string().min(1, "Book title is required"),
  isbn: z.string().min(1, "ISBN is required"),
  binding: z.string().min(1, "Please select a binding type"),
  quantity: z.number().min(1, "Quantity must be at least 1").default(1),
}).omit({
  id: true,
  status: true,
  adminNotes: true,
  processedBy: true,
  processedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBookRequest = z.infer<typeof insertBookRequestSchema>;

// Gift Categories Management
export const giftCategories = pgTable("gift_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'novel' | 'notebook'
  description: text("description"),
  imageUrl: text("image_url"),
  imageUrl2: text("image_url_2"),
  imageUrl3: text("image_url_3"),
  price: decimal("price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Gift Items Management
export const giftItems = pgTable("gift_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => giftCategories.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'novel' | 'notebook'
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
  imageUrl2: varchar("image_url_2", { length: 500 }),
  imageUrl3: varchar("image_url_3", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  isbn: varchar("isbn", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Gift Cart table: tracks gifts added by users, links to user and gift category
export const giftCart = pgTable("gift_cart", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  giftCategoryId: integer("gift_category_id").notNull().references(() => giftCategories.id),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  note: text("note"), // optional note from user
  engrave: boolean("engrave").notNull().default(false), // user wants engraving
  engravingMessage: text("engraving_message"), // message to engrave
},);

export const insertGiftCartSchema = createInsertSchema(giftCart);
export type InsertGiftCart = z.infer<typeof insertGiftCartSchema>;
export type GiftCart = typeof giftCart.$inferSelect;

// Homepage Content Management
export const homepageContent = pgTable("homepage_content", {
  id: serial("id").primaryKey(),
  section: varchar("section", { length: 100 }).notNull(), // 'gift_offer', 'hero', 'about'
  title: varchar("title", { length: 255 }),
  subtitle: text("subtitle"),
  content: text("content"),
  isActive: boolean("is_active").notNull().default(true),
  settings: text("settings"), // JSON string for additional settings
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Gift Categories schemas
export const insertGiftCategorySchema = createInsertSchema(giftCategories).extend({
  price: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === null) return undefined;
    return typeof val === 'string' ? val : val.toString();
  })
});
export type InsertGiftCategory = z.infer<typeof insertGiftCategorySchema>;
export type GiftCategory = typeof giftCategories.$inferSelect;

// Gift Items schemas
export const insertGiftItemSchema = createInsertSchema(giftItems);
export type InsertGiftItem = z.infer<typeof insertGiftItemSchema>;
export type GiftItem = typeof giftItems.$inferSelect;

// Homepage Content schemas
export const insertHomepageContentSchema = createInsertSchema(homepageContent);
export type InsertHomepageContent = z.infer<typeof insertHomepageContentSchema>;
export type HomepageContent = typeof homepageContent.$inferSelect;
export const insertRefundTransactionSchema = createInsertSchema(refundTransactions).omit({
  id: true,
  refundStatus: true,
  processedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRefundTransaction = z.infer<typeof insertRefundTransactionSchema>;

// Admin types
export type Admin = typeof admins.$inferSelect;
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

// Coupon types and schemas
export type Coupon = typeof coupons.$inferSelect;
export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usedCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  discountValue: z.union([z.string(), z.number()]).transform((val) => {
    return typeof val === 'string' ? val : val.toString();
  }),
  minimumOrderAmount: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === null) return "0";
    return typeof val === 'string' ? val : val.toString();
  }),
  maximumDiscountAmount: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === null) return undefined;
    return typeof val === 'string' ? val : val.toString();
  }),
});
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export type CouponUsage = typeof couponUsages.$inferSelect;
export const insertCouponUsageSchema = createInsertSchema(couponUsages).omit({
  id: true,
  usedAt: true,
});
export type InsertCouponUsage = z.infer<typeof insertCouponUsageSchema>;

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  image_urls: text("image_urls").array().notNull(),
  page_type: varchar("page_type", { length: 50 }).notNull(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertBannerSchemaDrizzle = createInsertSchema(banners).omit({
  id: true,
  created_at: true,
});
export type InsertBanner = typeof banners.$inferInsert;
export type Banner = typeof banners.$inferSelect;