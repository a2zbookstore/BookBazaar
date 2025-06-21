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
  publishedYear: integer("published_year"),
  publisher: varchar("publisher", { length: 200 }),
  pages: integer("pages"),
  language: varchar("language", { length: 50 }).default("English"),
  edition: varchar("edition", { length: 100 }), // e.g., "1st Edition", "2nd Edition"
  weight: decimal("weight", { precision: 5, scale: 2 }), // in lbs
  dimensions: varchar("dimensions", { length: 100 }), // e.g., "8x5x1 inches"
  featured: boolean("featured").default(false),
  bestseller: boolean("bestseller").default(false),
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

// Gift Categories Management
export const giftCategories = pgTable("gift_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'novel' | 'notebook'
  description: text("description"),
  imageUrl: varchar("image_url", { length: 500 }),
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
  price: decimal("price", { precision: 10, scale: 2 }),
  isbn: varchar("isbn", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
export const insertGiftCategorySchema = createInsertSchema(giftCategories);
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
