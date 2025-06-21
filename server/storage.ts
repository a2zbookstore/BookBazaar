import {
  users,
  admins,
  books,
  categories,
  orders,
  orderItems,
  cartItems,
  wishlistItems,
  contactMessages,
  storeSettings,
  shippingRates,
  returnRequests,
  refundTransactions,
  giftCategories,
  giftItems,
  homepageContent,
  type User,
  type UpsertUser,
  type Admin,
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
  type WishlistItem,
  type InsertWishlistItem,
  type ContactMessage,
  type InsertContactMessage,
  type StoreSettings,
  type InsertStoreSettings,
  type ShippingRate,
  type InsertShippingRate,
  type ReturnRequest,
  type InsertReturnRequest,
  type RefundTransaction,
  type InsertRefundTransaction,
  type GiftCategory,
  type InsertGiftCategory,
  type GiftItem,
  type InsertGiftItem,
  type HomepageContent,
  type InsertHomepageContent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, and, or, sql, count, gte, lt } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createEmailUser(user: { email?: string; phone?: string; firstName: string; lastName: string; passwordHash: string }): Promise<User>;

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
    bestseller?: boolean;
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
  getSearchSuggestions(query: string): Promise<string[]>;

  // Order operations
  getOrders(options?: {
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }>;
  getOrderById(id: number): Promise<(Order & { items: OrderItem[] }) | undefined>;
  getOrderByIdAndEmail(id: number, email: string): Promise<(Order & { items: OrderItem[] }) | undefined>;
  createOrder(order: InsertOrder, items: Omit<InsertOrderItem, 'orderId'>[]): Promise<Order>;
  updateOrderStatus(id: number, status: string, trackingInfo?: { trackingNumber?: string; shippingCarrier?: string; notes?: string }): Promise<Order>;

  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { book: Book })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Wishlist operations
  getWishlistItems(userId: string): Promise<(WishlistItem & { book: Book })[]>;
  addToWishlist(item: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(userId: string, bookId: number): Promise<void>;
  isInWishlist(userId: string, bookId: number): Promise<boolean>;

  // Contact operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  updateContactMessageStatus(id: number, status: string): Promise<ContactMessage>;

  // Store settings operations
  getStoreSettings(): Promise<StoreSettings | undefined>;
  upsertStoreSettings(settings: InsertStoreSettings): Promise<StoreSettings>;

  // Shipping rates operations
  getShippingRates(): Promise<ShippingRate[]>;
  getShippingRateByCountry(countryCode: string): Promise<ShippingRate | undefined>;
  getDefaultShippingRate(): Promise<ShippingRate | undefined>;
  createShippingRate(rate: InsertShippingRate): Promise<ShippingRate>;
  updateShippingRate(id: number, rate: Partial<InsertShippingRate>): Promise<ShippingRate>;
  deleteShippingRate(id: number): Promise<void>;
  setDefaultShippingRate(id: number): Promise<void>;

  // Analytics
  getDashboardStats(): Promise<{
    totalBooks: number;
    monthlySales: string;
    pendingOrders: number;
    totalOrders: number;
  }>;
  getSalesData(days: number): Promise<{ date: string; sales: string }[]>;
  getLowStockBooks(threshold?: number): Promise<Book[]>;

  // Admin operations
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdminById(id: number): Promise<Admin | undefined>;
  updateAdminLastLogin(id: number): Promise<void>;
  updateAdminPassword(id: number, passwordHash: string): Promise<void>;
  getAllCustomers(): Promise<any[]>;

  // Return and refund operations
  getReturnRequests(options?: {
    status?: string;
    userId?: string;
    orderId?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ returnRequests: (ReturnRequest & { order: Order & { items: OrderItem[] } })[], total: number }>;
  getReturnRequestById(id: number): Promise<(ReturnRequest & { order: Order & { items: OrderItem[] } }) | undefined>;
  createReturnRequest(returnRequest: InsertReturnRequest): Promise<ReturnRequest>;
  updateReturnRequestStatus(id: number, status: string, adminNotes?: string): Promise<ReturnRequest>;
  getEligibleOrdersForReturn(userId?: string, email?: string): Promise<Order[]>;
  
  // Refund operations
  createRefundTransaction(refund: InsertRefundTransaction): Promise<RefundTransaction>;
  updateRefundTransaction(id: number, updates: Partial<RefundTransaction>): Promise<RefundTransaction>;
  getRefundTransactionsByReturnId(returnRequestId: number): Promise<RefundTransaction[]>;

  // Gift Items operations
  getGiftItems(): Promise<GiftItem[]>;
  getGiftItemById(id: number): Promise<GiftItem | undefined>;
  createGiftItem(giftItem: InsertGiftItem): Promise<GiftItem>;
  updateGiftItem(id: number, giftItem: Partial<InsertGiftItem>): Promise<GiftItem>;
  deleteGiftItem(id: number): Promise<void>;
  updateGiftItemOrder(items: { id: number; sortOrder: number }[]): Promise<void>;

  // Homepage Content operations
  getHomepageContent(): Promise<HomepageContent[]>;
  getHomepageContentBySection(section: string): Promise<HomepageContent | undefined>;
  createHomepageContent(content: InsertHomepageContent): Promise<HomepageContent>;
  updateHomepageContent(id: number, content: Partial<InsertHomepageContent>): Promise<HomepageContent>;
  deleteHomepageContent(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
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

  async createEmailUser(userData: { email?: string; phone?: string; firstName: string; lastName: string; passwordHash: string }): Promise<User> {
    const userId = `${userData.phone ? 'phone' : 'email'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: userData.email || null,
        phone: userData.phone || null,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: userData.passwordHash,
        authProvider: userData.phone ? "phone" : "email",
        isEmailVerified: true,
        role: "customer",
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
    bestseller?: boolean;
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
      bestseller,
      search,
      minPrice,
      maxPrice,
      limit = 12,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const conditions = [];

    // Always exclude out of stock books (stock = 0)
    conditions.push(sql`${books.stock} > 0`);

    if (categoryId) conditions.push(eq(books.categoryId, categoryId));
    if (condition) conditions.push(eq(books.condition, condition));
    if (featured !== undefined) conditions.push(eq(books.featured, featured));
    if (bestseller !== undefined) conditions.push(eq(books.bestseller, bestseller));
    if (search) {
      const searchTerm = search.toLowerCase();
      conditions.push(
        or(
          sql`LOWER(${books.title}) LIKE ${`%${searchTerm}%`}`,
          sql`LOWER(${books.author}) LIKE ${`%${searchTerm}%`}`,
          sql`LOWER(${books.isbn}) LIKE ${`%${searchTerm}%`}`,
          sql`LOWER(${books.description}) LIKE ${`%${searchTerm}%`}`
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

    // Get books with simplified ordering
    const booksList = await db
      .select()
      .from(books)
      .where(whereClause)
      .orderBy(desc(books.createdAt))
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
    try {
      // Allow deletion of books even if they have been ordered
      // Order history will remain intact in the order_items table
      
      // First, delete all cart items related to this book
      await db.delete(cartItems).where(eq(cartItems.bookId, id));
      
      // Then delete the book
      const result = await db.delete(books).where(eq(books.id, id));
      
      if (result.rowCount === 0) {
        throw new Error("Book not found");
      }
    } catch (error) {
      console.error("Error in deleteBook:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to delete book");
    }
  }

  async updateBookStock(id: number, quantity: number): Promise<void> {
    await db
      .update(books)
      .set({ stock: quantity, updatedAt: new Date() })
      .where(eq(books.id, id));
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    const searchTerm = query.toLowerCase();
    
    // Get unique suggestions from titles and authors
    const titleSuggestions = await db
      .selectDistinct({ value: books.title })
      .from(books)
      .where(sql`LOWER(${books.title}) LIKE ${`%${searchTerm}%`}`)
      .limit(5);
    
    const authorSuggestions = await db
      .selectDistinct({ value: books.author })
      .from(books)
      .where(sql`LOWER(${books.author}) LIKE ${`%${searchTerm}%`}`)
      .limit(5);
    
    // Combine and deduplicate suggestions
    const allSuggestions = [
      ...titleSuggestions.map(s => s.value),
      ...authorSuggestions.map(s => s.value)
    ];
    
    // Remove duplicates and return top 8 suggestions
    const uniqueSuggestions: string[] = [];
    for (const suggestion of allSuggestions) {
      if (!uniqueSuggestions.includes(suggestion)) {
        uniqueSuggestions.push(suggestion);
      }
    }
    return uniqueSuggestions.slice(0, 8);
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

  async getOrderByIdAndEmail(id: number, email: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const [order] = await db.select().from(orders).where(
      and(eq(orders.id, id), eq(orders.customerEmail, email))
    );
    if (!order) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

    return { ...order, items };
  }

  async createOrder(order: InsertOrder, items: Omit<InsertOrderItem, 'orderId'>[]): Promise<Order> {
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

  async updateOrderStatus(id: number, status: string, trackingInfo?: { trackingNumber?: string; shippingCarrier?: string; notes?: string }): Promise<Order> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (trackingInfo?.trackingNumber) {
      updateData.trackingNumber = trackingInfo.trackingNumber;
    }
    if (trackingInfo?.shippingCarrier) {
      updateData.shippingCarrier = trackingInfo.shippingCarrier;
    }
    if (trackingInfo?.notes) {
      updateData.notes = trackingInfo.notes;
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
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

  // Wishlist operations
  async getWishlistItems(userId: string): Promise<(WishlistItem & { book: Book })[]> {
    const items = await db
      .select()
      .from(wishlistItems)
      .leftJoin(books, eq(wishlistItems.bookId, books.id))
      .where(eq(wishlistItems.userId, userId))
      .orderBy(desc(wishlistItems.createdAt));

    return items.map(item => ({
      ...item.wishlist_items,
      book: item.books!
    }));
  }

  async addToWishlist(item: InsertWishlistItem): Promise<WishlistItem> {
    // Check if item already exists in wishlist
    const existing = await db
      .select()
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.userId, item.userId),
        eq(wishlistItems.bookId, item.bookId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [wishlistItem] = await db.insert(wishlistItems).values(item).returning();
    return wishlistItem;
  }

  async removeFromWishlist(userId: string, bookId: number): Promise<void> {
    await db
      .delete(wishlistItems)
      .where(and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.bookId, bookId)
      ));
  }

  async isInWishlist(userId: string, bookId: number): Promise<boolean> {
    const result = await db
      .select({ id: wishlistItems.id })
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.bookId, bookId)
      ))
      .limit(1);

    return result.length > 0;
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

  // Store settings operations
  async getStoreSettings(): Promise<StoreSettings | undefined> {
    const [settings] = await db.select().from(storeSettings).limit(1);
    return settings;
  }

  async upsertStoreSettings(settingsData: InsertStoreSettings): Promise<StoreSettings> {
    // Check if settings exist
    const existingSettings = await this.getStoreSettings();
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(storeSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(storeSettings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db
        .insert(storeSettings)
        .values(settingsData)
        .returning();
      return newSettings;
    }
  }

  // Shipping rates operations
  async getShippingRates(): Promise<ShippingRate[]> {
    return await db.select().from(shippingRates).orderBy(asc(shippingRates.countryName));
  }

  async getShippingRateByCountry(countryCode: string): Promise<ShippingRate | undefined> {
    const [rate] = await db
      .select()
      .from(shippingRates)
      .where(and(
        eq(shippingRates.countryCode, countryCode.toUpperCase()),
        eq(shippingRates.isActive, true)
      ))
      .limit(1);
    return rate;
  }

  async getDefaultShippingRate(): Promise<ShippingRate | undefined> {
    const [rate] = await db
      .select()
      .from(shippingRates)
      .where(and(
        eq(shippingRates.isDefault, true),
        eq(shippingRates.isActive, true)
      ))
      .limit(1);
    return rate;
  }

  async createShippingRate(rateData: InsertShippingRate): Promise<ShippingRate> {
    const [newRate] = await db
      .insert(shippingRates)
      .values(rateData)
      .returning();
    return newRate;
  }

  async updateShippingRate(id: number, rateData: Partial<InsertShippingRate>): Promise<ShippingRate> {
    const [updatedRate] = await db
      .update(shippingRates)
      .set({
        ...rateData,
        updatedAt: new Date(),
      })
      .where(eq(shippingRates.id, id))
      .returning();
    return updatedRate;
  }

  async deleteShippingRate(id: number): Promise<void> {
    await db.delete(shippingRates).where(eq(shippingRates.id, id));
  }

  async setDefaultShippingRate(id: number): Promise<void> {
    // First, unset all existing defaults
    await db
      .update(shippingRates)
      .set({ isDefault: false })
      .where(eq(shippingRates.isDefault, true));
    
    // Then set the new default
    await db
      .update(shippingRates)
      .set({ isDefault: true })
      .where(eq(shippingRates.id, id));
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
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const result = await db
        .select({
          date: sql<string>`DATE(${orders.createdAt})`,
          sales: sql<string>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, "paid"),
            gte(orders.createdAt, cutoffDate)
          )
        )
        .groupBy(sql`DATE(${orders.createdAt})`)
        .orderBy(sql`DATE(${orders.createdAt})`);

      return result;
    } catch (error) {
      console.error("Error fetching sales data:", error);
      return [];
    }
  }

  async getLowStockBooks(threshold: number = 5): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(lt(books.stock, threshold))
      .orderBy(asc(books.stock));
  }

  // Admin operations
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin;
  }

  async getAdminById(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async updateAdminLastLogin(id: number): Promise<void> {
    await db.update(admins)
      .set({ lastLogin: new Date() })
      .where(eq(admins.id, id));
  }

  async updateAdminPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(admins)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(admins.id, id));
  }

  // Return and refund operations
  async getReturnRequests(options: {
    status?: string;
    userId?: string;
    orderId?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ returnRequests: (ReturnRequest & { order: Order & { items: OrderItem[] } })[], total: number }> {
    const { status, userId, orderId, limit = 50, offset = 0 } = options;
    
    const conditions = [];
    if (status) conditions.push(eq(returnRequests.status, status));
    if (userId) conditions.push(eq(returnRequests.userId, userId));
    if (orderId) conditions.push(eq(returnRequests.orderId, orderId));

    const baseQuery = db
      .select({
        returnRequest: returnRequests,
        order: orders,
      })
      .from(returnRequests)
      .innerJoin(orders, eq(returnRequests.orderId, orders.id))
      .orderBy(desc(returnRequests.createdAt))
      .$dynamic();

    const finalQuery = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    const [results, [{ count: total }]] = await Promise.all([
      finalQuery.limit(limit).offset(offset),
      db.select({ count: count() }).from(returnRequests).where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    // Get order items for each order
    const returnRequestsWithItems = await Promise.all(
      results.map(async ({ returnRequest, order }) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            bookId: orderItems.bookId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            title: books.title,
            author: books.author,
          })
          .from(orderItems)
          .innerJoin(books, eq(orderItems.bookId, books.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...returnRequest,
          order: {
            ...order,
            items,
          },
        };
      })
    );

    return {
      returnRequests: returnRequestsWithItems,
      total: parseInt(total.toString()),
    };
  }

  async getReturnRequestById(id: number): Promise<(ReturnRequest & { order: Order & { items: OrderItem[] } }) | undefined> {
    const [result] = await db
      .select({
        returnRequest: returnRequests,
        order: orders,
      })
      .from(returnRequests)
      .innerJoin(orders, eq(returnRequests.orderId, orders.id))
      .where(eq(returnRequests.id, id));

    if (!result) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        bookId: orderItems.bookId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        title: books.title,
        author: books.author,
      })
      .from(orderItems)
      .innerJoin(books, eq(orderItems.bookId, books.id))
      .where(eq(orderItems.orderId, result.order.id));

    return {
      ...result.returnRequest,
      order: {
        ...result.order,
        items,
      },
    };
  }

  async createReturnRequest(returnRequestData: InsertReturnRequest): Promise<ReturnRequest> {
    const [returnRequest] = await db
      .insert(returnRequests)
      .values(returnRequestData)
      .returning();
    return returnRequest;
  }

  async updateReturnRequestStatus(id: number, status: string, adminNotes?: string): Promise<ReturnRequest> {
    const updateData: any = { status, updatedAt: new Date() };
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (status === 'refund_processed') updateData.refundProcessedAt = new Date();

    const [returnRequest] = await db
      .update(returnRequests)
      .set(updateData)
      .where(eq(returnRequests.id, id))
      .returning();
    return returnRequest;
  }

  async getEligibleOrdersForReturn(userId?: string, email?: string): Promise<Order[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const conditions = [
      eq(orders.status, "delivered"),
      gte(orders.createdAt, thirtyDaysAgo)
    ];

    if (userId) {
      conditions.push(eq(orders.userId, userId));
    } else if (email) {
      conditions.push(eq(orders.customerEmail, email));
    }

    const eligibleOrders = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt));

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      eligibleOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            bookId: orderItems.bookId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            title: books.title,
            author: books.author,
          })
          .from(orderItems)
          .innerJoin(books, eq(orderItems.bookId, books.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items,
        };
      })
    );

    return ordersWithItems;
  }

  async createRefundTransaction(refundData: InsertRefundTransaction): Promise<RefundTransaction> {
    const [refund] = await db
      .insert(refundTransactions)
      .values(refundData)
      .returning();
    return refund;
  }

  async updateRefundTransaction(id: number, updates: Partial<RefundTransaction>): Promise<RefundTransaction> {
    const [refund] = await db
      .update(refundTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(refundTransactions.id, id))
      .returning();
    return refund;
  }

  async getRefundTransactionsByReturnId(returnRequestId: number): Promise<RefundTransaction[]> {
    return await db
      .select()
      .from(refundTransactions)
      .where(eq(refundTransactions.returnRequestId, returnRequestId))
      .orderBy(desc(refundTransactions.createdAt));
  }

  async getAllCustomers(): Promise<any[]> {
    console.log("getAllCustomers called");
    try {
      // Simple approach - just get customers without complex aggregation
      const customers = await db
        .select()
        .from(users)
        .where(eq(users.role, "customer"))
        .orderBy(desc(users.createdAt));

      console.log(`Retrieved ${customers.length} customers for admin panel`);
      
      // Add basic stats as 0 for now
      const customersWithStats = customers.map(customer => ({
        id: customer.id,
        email: customer.email,
        phone: customer.phone,
        firstName: customer.firstName,
        lastName: customer.lastName,
        authProvider: customer.authProvider,
        createdAt: customer.createdAt,
        isEmailVerified: customer.isEmailVerified,
        totalOrders: 0,
        totalSpent: "0",
        lastOrderDate: null
      }));

      return customersWithStats;
    } catch (error) {
      console.error("Error in getAllCustomers:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
