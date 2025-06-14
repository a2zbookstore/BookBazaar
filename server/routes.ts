import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { 
  insertBookSchema, 
  insertCategorySchema, 
  insertContactMessageSchema,
  insertCartItemSchema 
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
    }
  }
});

// Configure multer for image uploads
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `book-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files (JPEG, PNG, GIF, WebP) are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, email } = req.body;
      
      // Get current user data to preserve existing fields
      const currentUser = await storage.getUser(userId);
      
      const updatedUser = await storage.upsertUser({
        id: userId,
        firstName,
        lastName,
        email,
        profileImageUrl: currentUser?.profileImageUrl, // Preserve existing profile image
        role: currentUser?.role, // Preserve existing role
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Order management routes
  app.put('/api/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { status, trackingNumber, shippingCarrier, notes } = req.body;
      
      const updatedOrder = await storage.updateOrderStatus(parseInt(id), status, {
        trackingNumber,
        shippingCarrier,
        notes
      });
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Get individual order (protected route)
  app.get('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const order = await storage.getOrderById(parseInt(id));
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user owns this order or is admin
      const user = await storage.getUser(userId);
      if (order.userId !== userId && user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Public order tracking route (no auth required)
  app.post('/api/track-order', async (req, res) => {
    try {
      const { orderId, email } = req.body;
      
      if (!orderId || !email) {
        return res.status(400).json({ message: "Order ID and email are required" });
      }
      
      const order = await storage.getOrderByIdAndEmail(parseInt(orderId), email);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found or email doesn't match" });
      }
      
      // Return limited order info for tracking
      const trackingInfo = {
        id: order.id,
        status: order.status,
        trackingNumber: order.trackingNumber,
        shippingCarrier: order.shippingCarrier,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items?.map(item => ({
          title: item.title,
          author: item.author,
          quantity: item.quantity,
          price: item.price
        }))
      };
      
      res.json(trackingInfo);
    } catch (error) {
      console.error("Error tracking order:", error);
      res.status(500).json({ message: "Failed to track order" });
    }
  });

  // Payment routes
  const { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } = await import("./paypal.js");
  const { createRazorpayOrder, verifyRazorpayPayment, getRazorpayConfig } = await import("./razorpay.js");

  // PayPal routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Razorpay routes
  app.get("/api/razorpay/config", async (req, res) => {
    await getRazorpayConfig(req, res);
  });

  app.post("/api/razorpay/order", async (req, res) => {
    await createRazorpayOrder(req, res);
  });

  app.post("/api/razorpay/verify", async (req, res) => {
    await verifyRazorpayPayment(req, res);
  });

  // Order completion route
  app.post("/api/orders/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        billingAddress,
        subtotal,
        shipping,
        tax,
        total,
        paymentMethod,
        paymentId,
        items
      } = req.body;

      // Create order in database
      const order = await storage.createOrder({
        userId,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        billingAddress,
        subtotal,
        shipping,
        tax,
        total,
        status: "confirmed",
        paymentStatus: "paid",
        notes: `Payment via ${paymentMethod}. Payment ID: ${paymentId}`
      }, items);

      // Clear cart after successful order
      await storage.clearCart(userId);

      res.json({ success: true, orderId: order.id });
    } catch (error) {
      console.error("Error completing order:", error);
      res.status(500).json({ message: "Failed to complete order" });
    }
  });

  // Store settings routes
  app.get('/api/settings/store', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const settings = await storage.getStoreSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching store settings:", error);
      res.status(500).json({ message: "Failed to fetch store settings" });
    }
  });

  app.put('/api/settings/store', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { storeName, storeEmail, storeDescription, storePhone, currency, storeAddress } = req.body;
      
      const updatedSettings = await storage.upsertStoreSettings({
        storeName,
        storeEmail,
        storeDescription,
        storePhone,
        currency,
        storeAddress,
      });
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating store settings:", error);
      res.status(500).json({ message: "Failed to update store settings" });
    }
  });

  // Shipping rates routes
  app.get('/api/shipping-rates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const rates = await storage.getShippingRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching shipping rates:", error);
      res.status(500).json({ message: "Failed to fetch shipping rates" });
    }
  });

  app.get('/api/shipping-rates/country/:countryCode', async (req, res) => {
    try {
      const { countryCode } = req.params;
      const rate = await storage.getShippingRateByCountry(countryCode);
      
      if (!rate) {
        // Return default rate if specific country rate not found
        const defaultRate = await storage.getDefaultShippingRate();
        return res.json(defaultRate);
      }
      
      res.json(rate);
    } catch (error) {
      console.error("Error fetching shipping rate for country:", error);
      res.status(500).json({ message: "Failed to fetch shipping rate" });
    }
  });

  app.post('/api/shipping-rates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { countryCode, countryName, shippingCost, minDeliveryDays, maxDeliveryDays, isDefault, isActive } = req.body;
      
      const newRate = await storage.createShippingRate({
        countryCode: countryCode.toUpperCase(),
        countryName,
        shippingCost,
        minDeliveryDays,
        maxDeliveryDays,
        isDefault: isDefault || false,
        isActive: isActive !== false,
      });
      
      res.json(newRate);
    } catch (error) {
      console.error("Error creating shipping rate:", error);
      res.status(500).json({ message: "Failed to create shipping rate" });
    }
  });

  app.put('/api/shipping-rates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { countryCode, countryName, shippingCost, minDeliveryDays, maxDeliveryDays, isDefault, isActive } = req.body;
      
      const updatedRate = await storage.updateShippingRate(parseInt(id), {
        countryCode: countryCode?.toUpperCase(),
        countryName,
        shippingCost,
        minDeliveryDays,
        maxDeliveryDays,
        isDefault,
        isActive,
      });
      
      res.json(updatedRate);
    } catch (error) {
      console.error("Error updating shipping rate:", error);
      res.status(500).json({ message: "Failed to update shipping rate" });
    }
  });

  app.delete('/api/shipping-rates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      await storage.deleteShippingRate(parseInt(id));
      res.json({ message: "Shipping rate deleted successfully" });
    } catch (error) {
      console.error("Error deleting shipping rate:", error);
      res.status(500).json({ message: "Failed to delete shipping rate" });
    }
  });

  app.post('/api/shipping-rates/:id/set-default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      await storage.setDefaultShippingRate(parseInt(id));
      res.json({ message: "Default shipping rate updated successfully" });
    } catch (error) {
      console.error("Error setting default shipping rate:", error);
      res.status(500).json({ message: "Failed to set default shipping rate" });
    }
  });

  // Shipping rate lookup by country
  app.get('/api/shipping-rates/country/:countryCode', async (req, res) => {
    try {
      const { countryCode } = req.params;
      
      // First try to find specific country rate
      let shippingRate = await storage.getShippingRateByCountry(countryCode.toUpperCase());
      
      // If no specific rate found, try to get REST_OF_WORLD default rate
      if (!shippingRate) {
        shippingRate = await storage.getShippingRateByCountry('REST_OF_WORLD');
      }
      
      // If still no rate found, get any default rate
      if (!shippingRate) {
        shippingRate = await storage.getDefaultShippingRate();
      }
      
      if (!shippingRate) {
        return res.status(404).json({ message: "No shipping rate found" });
      }
      
      res.json(shippingRate);
    } catch (error) {
      console.error("Error fetching shipping rate for country:", error);
      res.status(500).json({ message: "Failed to fetch shipping rate" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const categoryData = insertCategorySchema.parse(req.body);
      
      // Generate unique slug
      let baseSlug = categoryData.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      let slug = baseSlug;
      let counter = 1;
      
      // Check for existing slug and create unique one if needed
      while (true) {
        const existingCategories = await storage.getCategories();
        const slugExists = existingCategories.some(cat => cat.slug === slug);
        
        if (!slugExists) {
          break;
        }
        
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      const categoryWithSlug = { ...categoryData, slug };
      const category = await storage.createCategory(categoryWithSlug);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Books routes
  app.get("/api/books", async (req, res) => {
    try {
      const {
        categoryId,
        condition,
        featured,
        search,
        minPrice,
        maxPrice,
        limit,
        offset,
        sortBy,
        sortOrder,
      } = req.query;

      const options = {
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        condition: condition as string,
        featured: featured === "true" ? true : featured === "false" ? false : undefined,
        search: search as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as "asc" | "desc") || "desc",
      };

      const result = await storage.getBooks(options);
      res.json(result);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.getBookById(id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  app.post("/api/books", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const bookData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(bookData);
      res.json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating book:", error);
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  app.put("/api/books/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const bookData = insertBookSchema.partial().parse(req.body);
      const book = await storage.updateBook(id, bookData);
      res.json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating book:", error);
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.delete("/api/books/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteBook(id);
      res.json({ message: "Book deleted successfully" });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  // Image upload route for book covers
  app.post("/api/books/upload-image", isAuthenticated, imageUpload.single('image'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Generate the URL for the uploaded image
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;

      res.json({ 
        message: "Image uploaded successfully",
        imageUrl: imageUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Cart routes
  app.get("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartData = insertCartItemSchema.parse({ ...req.body, userId });
      const cartItem = await storage.addToCart(cartData);
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(id, quantity);
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFromCart(id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Orders routes
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const options: any = {};
      if (user?.role !== "admin") {
        options.userId = userId; // Regular users can only see their own orders
      }
      
      // Add query parameters
      if (req.query.status) options.status = req.query.status as string;
      if (req.query.limit) options.limit = parseInt(req.query.limit as string);
      if (req.query.offset) options.offset = parseInt(req.query.offset as string);

      const result = await storage.getOrders(options);
      res.json(result);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user can access this order
      if (user?.role !== "admin" && order.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.put("/api/orders/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Contact routes
  app.post("/api/contact", async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating contact message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/contact", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Admin dashboard routes
  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/sales-data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const days = parseInt(req.query.days as string) || 30;
      const salesData = await storage.getSalesData(days);
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      res.status(500).json({ message: "Failed to fetch sales data" });
    }
  });

  app.get("/api/admin/low-stock", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const threshold = parseInt(req.query.threshold as string) || 5;
      const lowStockBooks = await storage.getLowStockBooks(threshold);
      res.json(lowStockBooks);
    } catch (error) {
      console.error("Error fetching low stock books:", error);
      res.status(500).json({ message: "Failed to fetch low stock books" });
    }
  });

  // Bulk Import/Export Routes
  app.post('/api/books/import', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      let data: any[] = [];
      const buffer = req.file.buffer;

      // Parse file based on type
      if (req.file.mimetype.includes('sheet') || req.file.mimetype.includes('excel')) {
        // Excel file
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else if (req.file.mimetype === 'text/csv') {
        // CSV file
        data = parse(buffer.toString(), {
          columns: true,
          skip_empty_lines: true,
        });
      }

      if (data.length === 0) {
        return res.status(400).json({ message: "No data found in file" });
      }

      const results = {
        success: 0,
        errors: [] as string[],
        total: data.length
      };

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          // Map and validate book data
          const priceValue = row.price || row.Price || '0';
          const bookData = {
            title: row.title || row.Title || '',
            author: row.author || row.Author || '',
            isbn: row.isbn || row.ISBN || '',
            categoryId: row.categoryId || row.CategoryId ? parseInt(row.categoryId || row.CategoryId) : null,
            description: row.description || row.Description || '',
            condition: row.condition || row.Condition || 'New',
            binding: row.binding || row.Binding || 'No Binding',
            price: typeof priceValue === 'number' ? priceValue.toString() : priceValue.toString(),
            stock: parseInt(row.stock || row.Stock || '1'),
            imageUrl: row.imageUrl || row.ImageUrl || '',
            publishedYear: row.publishedYear ? parseInt(row.publishedYear) : null,
            publisher: row.publisher || row.Publisher || '',
            pages: row.pages ? parseInt(row.pages) : null,
            language: row.language || row.Language || 'English',
            weight: row.weight || row.Weight || '',
            dimensions: row.dimensions || row.Dimensions || '',
            featured: Boolean(row.featured || row.Featured || false)
          };

          // Validate required fields
          if (!bookData.title || !bookData.author) {
            results.errors.push(`Row ${i + 1}: Title and Author are required`);
            continue;
          }

          // Create book
          await storage.createBook(bookData);
          results.success++;
        } catch (error) {
          results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to import books" });
    }
  });

  app.get('/api/books/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const format = req.query.format || 'xlsx';
      const { books } = await storage.getBooks({ limit: 10000, offset: 0 });

      // Prepare data for export
      const exportData = books.map(book => ({
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        categoryId: book.categoryId || '',
        description: book.description || '',
        condition: book.condition,
        binding: book.binding || 'No Binding',
        price: book.price,
        stock: book.stock,
        imageUrl: book.imageUrl || '',
        publishedYear: book.publishedYear || '',
        publisher: book.publisher || '',
        pages: book.pages || '',
        language: book.language || 'English',
        weight: book.weight || '',
        dimensions: book.dimensions || '',
        featured: book.featured
      }));

      if (format === 'csv') {
        const csv = stringify(exportData, { header: true });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"');
        res.send(csv);
      } else {
        // Excel format
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory.xlsx"');
        res.send(buffer);
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export books" });
    }
  });

  app.get('/api/books/template', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const format = req.query.format || 'xlsx';
      
      // Template data with example and empty rows
      const templateData = [
        {
          title: 'Example Book Title',
          author: 'Example Author',
          isbn: '9781234567890',
          categoryId: '1',
          description: 'Example book description',
          condition: 'New',
          binding: 'Softcover',
          price: '19.99',
          stock: '10',
          imageUrl: 'https://example.com/image.jpg',
          publishedYear: '2023',
          publisher: 'Example Publisher',
          pages: '300',
          language: 'English',
          weight: '0.5kg',
          dimensions: '15x23cm',
          featured: 'false'
        },
        // Empty row for user to fill
        {
          title: '',
          author: '',
          isbn: '',
          categoryId: '',
          description: '',
          condition: 'New',
          binding: 'No Binding',
          price: '',
          stock: '',
          imageUrl: '',
          publishedYear: '',
          publisher: '',
          pages: '',
          language: 'English',
          weight: '',
          dimensions: '',
          featured: 'false'
        }
      ];

      if (format === 'csv') {
        const csv = stringify(templateData, { header: true });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="import_template.csv"');
        res.send(csv);
      } else {
        // Excel format
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Template');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="import_template.xlsx"');
        res.send(buffer);
      }
    } catch (error) {
      console.error("Template download error:", error);
      res.status(500).json({ message: "Failed to download template" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
