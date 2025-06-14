import {
  users,
  books,
  categories,
  orders,
  orderItems,
  cartItems,
  contactMessages,
  type User,
  type UpsertUser,
  type Book,
  type InsertBook,
  type Category,
  type InsertCategory,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type CartItem,
  type InsertCartItem,
  type ContactMessage,
  type InsertContactMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, and, or, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Book operations
  getBooks(options?: {
    categoryId?: number;
    condition?: string;
    featured?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ books: Book[]; total: number }>;
  getBookById(id: number): Promise<(Book & { category?: Category }) | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book>;
  deleteBook(id: number): Promise<void>;
  updateBookStock(id: number, quantity: number): Promise<void>;

  // Order operations
  getOrders(options?: {
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }>;
  getOrderById(id: number): Promise<(Order & { items: OrderItem[] }) | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;

  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { book: Book })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Contact operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  updateContactMessageStatus(id: number, status: string): Promise<ContactMessage>;

  // Analytics
  getDashboardStats(): Promise<{
    totalBooks: number;
    monthlySales: string;
    pendingOrders: number;
    totalOrders: number;
  }>;
  getSalesData(days: number): Promise<{ date: string; sales: string }[]>;
  getLowStockBooks(threshold?: number): Promise<Book[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Book operations
  async getBooks(options: {
    categoryId?: number;
    condition?: string;
    featured?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}): Promise<{ books: Book[]; total: number }> {
    const {
      categoryId,
      condition,
      featured,
      search,
      minPrice,
      maxPrice,
      limit = 12,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const conditions = [];

    if (categoryId) conditions.push(eq(books.categoryId, categoryId));
    if (condition) conditions.push(eq(books.condition, condition));
    if (featured !== undefined) conditions.push(eq(books.featured, featured));
    if (search) {
      conditions.push(
        or(
          like(books.title, `%${search}%`),
          like(books.author, `%${search}%`),
          like(books.isbn, `%${search}%`)
        )
      );
    }
    if (minPrice) conditions.push(sql`${books.price} >= ${minPrice}`);
    if (maxPrice) conditions.push(sql`${books.price} <= ${maxPrice}`);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(books)
      .where(whereClause);

    // Get books
    const orderColumn = books[sortBy as keyof typeof books] || books.createdAt;
    const orderBy = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

    const booksList = await db
      .select()
      .from(books)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return { books: booksList, total };
  }

  async getBookById(id: number): Promise<(Book & { category?: Category }) | undefined> {
    const [result] = await db
      .select()
      .from(books)
      .leftJoin(categories, eq(books.categoryId, categories.id))
      .where(eq(books.id, id));

    if (!result) return undefined;

    return {
      ...result.books,
      category: result.categories || undefined,
    };
  }

  async createBook(book: InsertBook): Promise<Book> {
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }

  async updateBook(id: number, book: Partial<InsertBook>): Promise<Book> {
    const [updatedBook] = await db
      .update(books)
      .set({ ...book, updatedAt: new Date() })
      .where(eq(books.id, id))
      .returning();
    return updatedBook;
  }

  async deleteBook(id: number): Promise<void> {
    await db.delete(books).where(eq(books.id, id));
  }

  async updateBookStock(id: number, quantity: number): Promise<void> {
    await db
      .update(books)
      .set({ stock: quantity, updatedAt: new Date() })
      .where(eq(books.id, id));
  }

  // Order operations
  async getOrders(options: {
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ orders: Order[]; total: number }> {
    const { userId, status, limit = 20, offset = 0 } = options;

    const conditions = [];
    if (userId) conditions.push(eq(orders.userId, userId));
    if (status) conditions.push(eq(orders.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(orders)
      .where(whereClause);

    const ordersList = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return { orders: ordersList, total };
  }

  async getOrderById(id: number): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

    return { ...order, items };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values(order).returning();

      await tx.insert(orderItems).values(
        items.map((item) => ({ ...item, orderId: newOrder.id }))
      );

      // Update book stock
      for (const item of items) {
        await tx
          .update(books)
          .set({
            stock: sql`${books.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(books.id, item.bookId));
      }

      return newOrder;
    });
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { book: Book })[]> {
    const items = await db
      .select()
      .from(cartItems)
      .innerJoin(books, eq(cartItems.bookId, books.id))
      .where(eq(cartItems.userId, userId));

    return items.map((item) => ({
      ...item.cart_items,
      book: item.books,
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, item.userId), eq(cartItems.bookId, item.bookId)));

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + item.quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(item).returning();
      return newItem;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Contact operations
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db.insert(contactMessages).values(message).returning();
    return newMessage;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  async updateContactMessageStatus(id: number, status: string): Promise<ContactMessage> {
    const [updatedMessage] = await db
      .update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, id))
      .returning();
    return updatedMessage;
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalBooks: number;
    monthlySales: string;
    pendingOrders: number;
    totalOrders: number;
  }> {
    const [booksCount] = await db.select({ count: count() }).from(books);

    const [pendingOrdersCount] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "pending"));

    const [totalOrdersCount] = await db.select({ count: count() }).from(orders);

    const [monthlySales] = await db
      .select({ total: sql<string>`COALESCE(SUM(${orders.total}), 0)` })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, "paid"),
          sql`${orders.createdAt} >= DATE_TRUNC('month', CURRENT_DATE)`
        )
      );

    return {
      totalBooks: booksCount.count,
      monthlySales: monthlySales.total || "0",
      pendingOrders: pendingOrdersCount.count,
      totalOrders: totalOrdersCount.count,
    };
  }

  async getSalesData(days: number): Promise<{ date: string; sales: string }[]> {
    const result = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        sales: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, "paid"),
          sql`${orders.createdAt} >= CURRENT_DATE - INTERVAL '${days} days'`
        )
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    return result;
  }

  async getLowStockBooks(threshold: number = 5): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(sql`${books.stock} <= ${threshold}`)
      .orderBy(asc(books.stock));
  }
}

export const storage = new DatabaseStorage();
