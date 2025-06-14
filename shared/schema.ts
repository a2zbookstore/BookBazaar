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

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("customer"), // customer, admin
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
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  imageUrl: varchar("image_url", { length: 500 }),
  publishedYear: integer("published_year"),
  publisher: varchar("publisher", { length: 200 }),
  pages: integer("pages"),
  language: varchar("language", { length: 50 }).default("English"),
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  dimensions: varchar("dimensions", { length: 100 }), // e.g., "20x15x3 cm"
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone"),
  shippingAddress: jsonb("shipping_address").notNull(), // {street, city, state, zip, country}
  billingAddress: jsonb("billing_address").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, processing, shipped, delivered, cancelled
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, paid, failed, refunded
  trackingNumber: varchar("tracking_number", { length: 100 }),
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

export type ContactMessage = typeof contactMessages.$inferSelect;
export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  status: true,
  createdAt: true,
});
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
