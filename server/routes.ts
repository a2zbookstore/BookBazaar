import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireAdminAuth } from "./adminAuth";
import { BookImporter } from "./bookImporter";
import { sendOrderConfirmationEmail, sendStatusUpdateEmail, testEmailConfiguration } from "./emailService";
import { CloudinaryService } from "./cloudinaryService";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { 
  insertBookSchema, 
  insertCategorySchema, 
  insertContactMessageSchema,
  insertCartItemSchema,
  insertGiftCategorySchema,
  insertGiftItemSchema
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
  storage: multer.memoryStorage(), // Use memory storage for Cloudinary upload
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
  // Test Cloudinary connection on startup
  CloudinaryService.testConnection().then((success) => {
    if (success) {
      console.log('✅ Cloudinary connected successfully - Images will be stored permanently');
    } else {
      console.log('❌ Cloudinary connection failed - Check environment variables');
    }
  }).catch((error) => {
    console.error('Cloudinary test failed:', error);
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check for email-based authentication first
      const userId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      
      if (userId && isCustomerAuth) {
        const user = await storage.getUser(userId);
        if (user) {
          return res.json(user);
        }
      }
      
      // Check for Replit authentication
      if (req.isAuthenticated && req.isAuthenticated()) {
        const replitUserId = req.user.claims.sub;
        const user = await storage.getUser(replitUserId);
        if (user) {
          return res.json(user);
        }
      }
      
      res.status(401).json({ message: "Unauthorized" });
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



  // Get individual order (accessible to both authenticated users and guests with email)
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.query;
      
      let order;
      let isAuthorized = false;
      
      // Check for session-based customer authentication
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      
      if (sessionUserId && isCustomerAuth) {
        order = await storage.getOrderById(parseInt(id));
        if (order && order.userId === sessionUserId) {
          isAuthorized = true;
        }
      }
      // Check for Replit authentication
      else if (req.isAuthenticated && req.isAuthenticated()) {
        const userId = (req.user as any).claims.sub;
        order = await storage.getOrderById(parseInt(id));
        if (order && order.userId === userId) {
          isAuthorized = true;
        }
      }
      // Guest access with email
      else if (email) {
        order = await storage.getOrderByIdAndEmail(parseInt(id), email as string);
        if (order) {
          isAuthorized = true;
        }
      } else {
        return res.status(401).json({ message: "Email required for guest access" });
      }
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (!isAuthorized) {
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

  // Password reset routes
  const { requestPasswordReset, resetPassword } = await import('./passwordReset');
  app.post('/api/forgot-password', requestPasswordReset);
  app.post('/api/reset-password', resetPassword);

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

  // PayPal success route - handle return from PayPal
  app.get("/api/paypal/success", async (req, res) => {
    try {
      const { token, PayerID } = req.query;
      
      if (!token) {
        return res.redirect('/checkout?error=missing_token');
      }

      // Capture the payment
      const captureResponse = await capturePaypalOrder(
        { params: { orderID: token } } as any,
        {
          json: (data: any) => data,
          status: (code: number) => ({ json: (data: any) => data })
        } as any
      );

      // Redirect to a success page with order completion
      res.redirect(`/paypal-complete?token=${token}&PayerID=${PayerID}`);
    } catch (error) {
      console.error("PayPal success error:", error);
      res.redirect('/checkout?error=payment_failed');
    }
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

  // Customer authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { firstName, lastName, email, phone, password } = req.body;
      
      if (!firstName || !lastName || (!email && !phone) || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Check if user already exists by email or phone
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({ message: "User already exists with this email" });
        }
      }

      if (phone) {
        const existingUser = await storage.getUserByPhone(phone);
        if (existingUser) {
          return res.status(409).json({ message: "User already exists with this phone number" });
        }
      }

      // Hash password
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      // Create user
      const user = await storage.createEmailUser({
        email: email || null,
        phone: phone || null,
        firstName,
        lastName,
        passwordHash
      });

      // Send welcome email
      try {
        await sendWelcomeEmail({
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            authProvider: user.authProvider
          }
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail registration if email fails
      }

      res.json({ 
        success: true, 
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, phone, password } = req.body;
      
      if ((!email && !phone) || !password) {
        return res.status(400).json({ message: "Email/phone and password are required" });
      }

      // Find user by email or phone
      let user;
      if (email) {
        user = await storage.getUserByEmail(email);
      } else if (phone) {
        user = await storage.getUserByPhone(phone);
      }
      
      if (!user || (user.authProvider !== "email" && user.authProvider !== "phone")) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const inputPasswordHash = crypto.createHash('sha256').update(password).digest('hex');
      if (user.passwordHash !== inputPasswordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Get guest cart items before login
      const guestCartItems = (req.session as any).cartItems || [];

      // Set user session (similar to Replit auth)
      (req.session as any).userId = user.id;
      (req.session as any).isCustomerAuth = true;

      // Transfer guest cart items to authenticated user's cart
      if (guestCartItems.length > 0) {
        try {
          for (const guestItem of guestCartItems) {
            await storage.addToCart({
              userId: user.id,
              bookId: guestItem.bookId,
              quantity: guestItem.quantity
            });
          }
          // Clear guest cart from session
          (req.session as any).cartItems = [];
        } catch (error) {
          console.error("Error transferring guest cart:", error);
        }
      }

      // Save session before responding
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        res.json({ 
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      req.logout(() => {
        (req.session as any).userId = null;
        (req.session as any).isCustomerAuth = false;
        res.json({ success: true });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const admin = await storage.getAdminByUsername(username);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Simple password hash check (SHA256)
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      
      if (admin.passwordHash !== passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateAdminLastLogin(admin.id);

      // Set admin session
      (req.session as any).adminId = admin.id;
      (req.session as any).isAdmin = true;

      // Save session before responding
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        res.json({ 
          success: true, 
          admin: { 
            id: admin.id, 
            username: admin.username, 
            name: admin.name, 
            email: admin.email 
          } 
        });
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    try {
      (req.session as any).adminId = null;
      (req.session as any).isAdmin = false;
      res.json({ success: true });
    } catch (error) {
      console.error("Admin logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.post("/api/admin/change-password", async (req, res) => {
    try {
      const adminId = (req.session as any).adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Verify current password
      const currentPasswordHash = crypto.createHash('sha256').update(currentPassword).digest('hex');
      
      if (admin.passwordHash !== currentPasswordHash) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Update password
      const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
      await storage.updateAdminPassword(adminId, newPasswordHash);

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Admin password change error:", error);
      res.status(500).json({ message: "Password change failed" });
    }
  });

  // Admin customers route
  app.get("/api/admin/customers", requireAdminAuth, async (req, res) => {
    try {
      console.log("Admin customers API called");
      const customers = await storage.getAllCustomers();
      console.log(`Found ${customers.length} customers`);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Admin session check route
  app.get("/api/admin/user", async (req, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      res.json({ 
        id: admin.id, 
        username: admin.username, 
        name: admin.name, 
        email: admin.email 
      });
    } catch (error) {
      console.error("Admin session check error:", error);
      res.status(500).json({ message: "Session check failed" });
    }
  });

  // Order completion route - supports guest, registration, and authenticated users
  app.post("/api/orders/complete", async (req: any, res) => {
    try {
      let userId = null;
      let user = null;
      
      // Check for authenticated user first
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      
      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
        user = await storage.getUser(userId);
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
        user = await storage.getUser(userId);
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
        items,
        checkoutType,
        registerPassword
      } = req.body;

      // Handle account creation during checkout
      if (checkoutType === "register" && registerPassword && !userId) {
        try {
          // Check if user already exists
          const existingUser = await storage.getUserByEmail(customerEmail);
          if (!existingUser) {
            // Create new user account
            const passwordHash = crypto.createHash('sha256').update(registerPassword).digest('hex');
            const [firstName, ...lastNameParts] = customerName.split(' ');
            const lastName = lastNameParts.join(' ') || '';
            
            const newUser = await storage.createEmailUser({
              email: customerEmail,
              firstName,
              lastName,
              passwordHash
            });
            
            userId = newUser.id;
            user = newUser;
            
            // Set user session
            (req.session as any).userId = newUser.id;
            (req.session as any).isCustomerAuth = true;
          }
        } catch (error) {
          console.error("Error creating user during checkout:", error);
          // Continue as guest if user creation fails
        }
      }

      // Get cart items for order
      let cartItems: Array<{
        bookId: number;
        quantity: number;
        price: string;
        title: string;
        author: string;
        isGift?: boolean;
      }> = [];
      
      if (userId) {
        const userCartItems = await storage.getCartItems(userId);
        cartItems = userCartItems.map(item => ({
          bookId: item.book.id,
          quantity: item.quantity,
          price: item.book.price.toString(),
          title: item.book.title,
          author: item.book.author,
          isGift: item.isGift || false
        }));
      } else {
        // Get guest cart from session
        const guestCart = (req.session as any).guestCart || [];
        console.log("Guest cart from session:", JSON.stringify(guestCart, null, 2));
        console.log("Session keys:", Object.keys(req.session));
        
        // For guest cart, use existing book data or fetch from database
        for (const item of guestCart) {
          try {
            let book = item.book;
            if (!book) {
              book = await storage.getBookById(item.bookId);
            }
            
            if (book) {
              cartItems.push({
                bookId: book.id,
                quantity: item.quantity,
                price: book.price.toString(),
                title: book.title,
                author: book.author,
                isGift: item.isGift || false
              });
            }
          } catch (error) {
            console.error("Error processing guest cart item:", error);
          }
        }
        
        console.log("Final cart items for order:", cartItems.length);
      }

      // Include gift item in order if present
      const giftItem = (req.session as any).giftItem;
      if (giftItem) {
        cartItems.push({
          bookId: giftItem.giftId,
          quantity: 1,
          price: "0.00",
          title: giftItem.name,
          author: giftItem.type,
          isGift: true
        });
      }

      // Validate cart items
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty. Cannot create order." });
      }

      console.log("Creating order with cart items:", cartItems.length);

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
      }, cartItems);

      // Clear cart after successful order
      if (userId) {
        await storage.clearCart(userId);
      } else {
        // Clear guest cart from session
        (req.session as any).guestCart = [];
      }

      // Send order confirmation email
      try {
        const orderWithItems = await storage.getOrderById(order.id);
        if (orderWithItems) {
          await sendOrderConfirmationEmail({
            order: orderWithItems,
            customerEmail,
            customerName
          });
          console.log(`Order confirmation email sent for order #${order.id}`);
        }
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
        // Don't fail the order if email fails
      }

      res.json({ success: true, orderId: order.id });
    } catch (error) {
      console.error("Error completing order:", error);
      res.status(500).json({ message: "Failed to complete order" });
    }
  });

  // Wishlist routes
  app.get("/api/wishlist", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const wishlistItems = await storage.getWishlistItems(req.session.userId);
      res.json(wishlistItems);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/wishlist", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { bookId } = req.body;
      if (!bookId) {
        return res.status(400).json({ error: "Book ID is required" });
      }

      const wishlistItem = await storage.addToWishlist({
        userId: req.session.userId,
        bookId: parseInt(bookId)
      });

      res.json(wishlistItem);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/wishlist/:bookId", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const bookId = parseInt(req.params.bookId);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }

      await storage.removeFromWishlist(req.session.userId, bookId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/wishlist/check/:bookId", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.json({ inWishlist: false });
      }

      const bookId = parseInt(req.params.bookId);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }

      const inWishlist = await storage.isInWishlist(req.session.userId, bookId);
      res.json({ inWishlist });
    } catch (error) {
      console.error("Error checking wishlist:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public store settings route for contact information
  app.get('/api/store-info', async (req: any, res) => {
    try {
      const settings = await storage.getStoreSettings();
      if (!settings) {
        // Return default values if no settings exist
        return res.json({
          storeName: "A2Z BOOKSHOP",
          storeEmail: "hello@a2zbookshop.com",
          storePhone: "+31 (20) 123-BOOK",
          storeAddress: "123 Book Street\nLiterary District\nBooktown, BT 12345\nEurope"
        });
      }
      
      // Return only public information
      res.json({
        storeName: settings.storeName,
        storeEmail: settings.storeEmail,
        storePhone: settings.storePhone,
        storeAddress: settings.storeAddress
      });
    } catch (error) {
      console.error("Error fetching public store info:", error);
      res.status(500).json({ message: "Failed to fetch store information" });
    }
  });

  // Admin-only store settings routes
  app.get('/api/settings/store', async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const settings = await storage.getStoreSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching store settings:", error);
      res.status(500).json({ message: "Failed to fetch store settings" });
    }
  });

  app.put('/api/settings/store', async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
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
  app.get('/api/shipping-rates', async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
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

  app.post('/api/shipping-rates', async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
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

  app.put('/api/shipping-rates/:id', async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
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

  app.delete('/api/shipping-rates/:id', async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const { id } = req.params;
      await storage.deleteShippingRate(parseInt(id));
      res.json({ message: "Shipping rate deleted successfully" });
    } catch (error) {
      console.error("Error deleting shipping rate:", error);
      res.status(500).json({ message: "Failed to delete shipping rate" });
    }
  });

  app.post('/api/shipping-rates/:id/set-default', async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
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
        bestseller,
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
        bestseller: bestseller === "true" ? true : bestseller === "false" ? false : undefined,
        search: search as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as "asc" | "desc") || "desc",
      };

      // Debug logging for search functionality
      if (search) {
        console.log("Search query received:", search);
        console.log("Search options being passed to storage:", options);
      }

      const result = await storage.getBooks(options);
      
      if (search) {
        console.log("Search results count:", result.books.length, "out of total:", result.total);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Search suggestions endpoint
  app.get("/api/books/search-suggestions", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json([]);
      }

      const suggestions = await storage.getSearchSuggestions(q);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
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

  app.post("/api/books", async (req: any, res) => {
    try {
      // Check admin session first
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (adminId && isAdmin) {
        const admin = await storage.getAdminById(adminId);
        if (!admin || !admin.isActive) {
          return res.status(401).json({ message: "Admin account inactive" });
        }
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        // Fallback to Replit auth
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user?.role !== "admin") {
          return res.status(403).json({ message: "Admin access required" });
        }
      } else {
        return res.status(401).json({ message: "Admin authentication required" });
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

  app.put("/api/books/:id", async (req: any, res) => {
    try {
      // Check admin session first
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (adminId && isAdmin) {
        const admin = await storage.getAdminById(adminId);
        if (!admin || !admin.isActive) {
          return res.status(401).json({ message: "Admin account inactive" });
        }
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        // Fallback to Replit auth
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user?.role !== "admin") {
          return res.status(403).json({ message: "Admin access required" });
        }
      } else {
        return res.status(401).json({ message: "Admin authentication required" });
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

  app.delete("/api/books/:id", async (req: any, res) => {
    try {
      // Check admin session first
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (adminId && isAdmin) {
        const admin = await storage.getAdminById(adminId);
        if (!admin || !admin.isActive) {
          return res.status(401).json({ message: "Admin account inactive" });
        }
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        // Fallback to Replit auth
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user?.role !== "admin") {
          return res.status(403).json({ message: "Admin access required" });
        }
      } else {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid book ID" });
      }

      await storage.deleteBook(id);
      res.json({ message: "Book deleted successfully" });
    } catch (error) {
      console.error("Error deleting book:", error);
      
      // Send specific error message to user
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  // Image upload route for book covers
  app.post("/api/books/upload-image", imageUpload.single('image'), async (req: any, res) => {
    try {
      // Check admin session first
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (adminId && isAdmin) {
        const admin = await storage.getAdminById(adminId);
        if (!admin || !admin.isActive) {
          return res.status(401).json({ message: "Admin account inactive" });
        }
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        // Fallback to Replit auth
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user?.role !== "admin") {
          return res.status(403).json({ message: "Admin access required" });
        }
      } else {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      try {
        // Try uploading to Cloudinary for permanent storage
        const uploadResult = await CloudinaryService.uploadImage(
          req.file.buffer,
          'a2z-bookshop/books',
          `book-${Date.now()}-${Math.round(Math.random() * 1E9)}`
        );

        console.log("Image uploaded to Cloudinary successfully:", {
          public_id: uploadResult.public_id,
          secure_url: uploadResult.secure_url,
          size: uploadResult.bytes
        });

        res.json({ 
          message: "Image uploaded successfully to cloud storage",
          imageUrl: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          size: uploadResult.bytes,
          storage: "cloudinary"
        });
      } catch (cloudinaryError) {
        // Fallback to local storage with warning
        console.warn("Cloudinary upload failed, falling back to local storage:", cloudinaryError);
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(req.file.originalname) || '.jpg';
        const filename = `book-${uniqueSuffix}${ext}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'images');
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, req.file.buffer);
        
        const imageUrl = `/uploads/images/${filename}`;
        
        console.log("Image saved locally (TEMPORARY):", {
          filename: filename,
          imageUrl: imageUrl,
          warning: "This image will be lost on server restart"
        });

        res.json({ 
          message: "Image uploaded successfully (TEMPORARY - fix Cloudinary for permanent storage)",
          imageUrl: imageUrl,
          filename: filename,
          storage: "local",
          warning: "Image stored locally - will disappear on server restart"
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Helper function to check if cart has any non-gift books
  const hasNonGiftBooks = (cartItems: any[]) => {
    return cartItems.some(item => !item.isGift);
  };

  // Helper function to automatically remove gifts if no books remain
  const autoRemoveGiftsIfNoBooks = async (req: any, cartItems: any[]) => {
    const hasBooks = hasNonGiftBooks(cartItems);
    if (!hasBooks && (req.session as any).giftItem) {
      // Remove gift from session if no books remain
      (req.session as any).giftItem = null;
      console.log("Auto-removed gift: no books remaining in cart");
    }
  };

  // Cart routes - support both authenticated and guest users
  app.get("/api/cart", async (req: any, res) => {
    console.log("Cart GET request received");
    try {
      // Set JSON content type explicitly
      res.setHeader('Content-Type', 'application/json');
      
      // Check for authenticated user first
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      let userId = null;
      
      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
      }
      
      console.log("Cart - userId:", userId, "sessionUserId:", sessionUserId, "isCustomerAuth:", isCustomerAuth);
      
      if (userId) {
        const cartItems = await storage.getCartItems(userId);
        
        // Auto-remove gifts if no books remain
        await autoRemoveGiftsIfNoBooks(req, cartItems);
        
        const giftItem = (req.session as any).giftItem;
        
        // Add gift item to cart if present and there are books
        const fullCart = [...cartItems];
        if (giftItem && hasNonGiftBooks(cartItems)) {
          fullCart.push({
            id: `gift_${giftItem.giftId}`,
            book: {
              id: giftItem.giftId,
              title: giftItem.name,
              author: giftItem.type,
              price: "0.00",
              imageUrl: giftItem.imageUrl
            },
            quantity: 1,
            isGift: true
          });
        }
        
        console.log("Returning authenticated user cart:", fullCart.length, "items");
        return res.json(fullCart);
      } else {
        // Guest user - return session-based cart with book details
        const guestCart = (req.session as any).guestCart || [];
        console.log("Guest cart from session:", guestCart.length, "items");
        
        // Auto-remove gifts if no books remain
        await autoRemoveGiftsIfNoBooks(req, guestCart);
        
        const giftItem = (req.session as any).giftItem;
        
        // Ensure each cart item has complete book data
        const cartWithBooks = [];
        for (const item of guestCart) {
          try {
            if (!item.book || !item.book.id) {
              const book = await storage.getBookById(item.bookId);
              if (book) {
                cartWithBooks.push({ ...item, book });
              }
            } else {
              cartWithBooks.push(item);
            }
          } catch (error) {
            console.error("Error processing cart item:", error);
          }
        }
        
        // Add gift item to cart if present and there are books
        if (giftItem && hasNonGiftBooks(cartWithBooks)) {
          cartWithBooks.push({
            id: `gift_${giftItem.giftId}`,
            book: {
              id: giftItem.giftId,
              title: giftItem.name,
              author: giftItem.type,
              price: "0.00",
              imageUrl: giftItem.imageUrl
            },
            quantity: 1,
            isGift: true
          });
        }
        
        console.log("Returning guest cart:", cartWithBooks.length, "items");
        return res.json(cartWithBooks);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/add", async (req: any, res) => {
    console.log("Cart ADD request received:", req.body);
    try {
      res.setHeader('Content-Type', 'application/json');
      
      // Check for authenticated user first
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      let userId = null;
      
      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
      }
      
      console.log("Cart ADD - userId:", userId, "sessionUserId:", sessionUserId);
      
      if (userId) {
        // Authenticated user - save to database
        const cartData = insertCartItemSchema.parse({ ...req.body, userId });
        const cartItem = await storage.addToCart(cartData);
        return res.json(cartItem);
      } else {
        // Guest user - save to session
        const { bookId, quantity } = req.body;
        const book = await storage.getBookById(parseInt(bookId));
        
        if (!book) {
          return res.status(404).json({ message: "Book not found" });
        }
        
        if (!(req.session as any).guestCart) {
          (req.session as any).guestCart = [];
        }
        
        const guestCart = (req.session as any).guestCart;
        const existingItemIndex = guestCart.findIndex((item: any) => item.bookId === parseInt(bookId));
        
        if (existingItemIndex >= 0) {
          guestCart[existingItemIndex].quantity += parseInt(quantity);
        } else {
          guestCart.push({
            id: `guest_${Date.now()}`, // String-based ID for guest cart
            bookId: parseInt(bookId),
            quantity: parseInt(quantity),
            book: book
          });
        }
        
        console.log("Guest cart after add:", guestCart.length, "items");
        
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Failed to save cart" });
          }
          res.json({ message: "Item added to cart", item: guestCart[guestCart.length - 1] });
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put("/api/cart/:id", async (req: any, res) => {
    try {
      const id = req.params.id;
      const { quantity } = req.body;
      
      // Check for authenticated user first
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      let userId = null;
      
      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
      }
      
      if (userId) {
        // Authenticated user - update database cart
        const cartItem = await storage.updateCartItem(parseInt(id), quantity);
        res.json(cartItem);
      } else {
        // Guest user - update session cart
        const guestCart = (req.session as any).guestCart || [];
        const itemIndex = guestCart.findIndex((item: any) => item.id.toString() === id);
        
        if (itemIndex >= 0) {
          guestCart[itemIndex].quantity = parseInt(quantity);
          req.session.save(() => {
            res.json(guestCart[itemIndex]);
          });
        } else {
          res.status(404).json({ message: "Cart item not found" });
        }
      }
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req: any, res) => {
    try {
      const id = req.params.id;
      
      // Check for authenticated user first
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      let userId = null;
      
      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
      }
      
      if (userId) {
        // Authenticated user - remove from database cart
        await storage.removeFromCart(parseInt(id));
        
        // Check remaining cart items and auto-remove gifts if no books remain
        const remainingCartItems = await storage.getCartItems(userId);
        await autoRemoveGiftsIfNoBooks(req, remainingCartItems);
        
        res.json({ message: "Item removed from cart" });
      } else {
        // Guest user - remove from session cart
        const guestCart = (req.session as any).guestCart || [];
        const filteredCart = guestCart.filter((item: any) => item.id.toString() !== id);
        (req.session as any).guestCart = filteredCart;
        
        // Auto-remove gifts if no books remain
        await autoRemoveGiftsIfNoBooks(req, filteredCart);
        
        req.session.save(() => {
          res.json({ message: "Item removed from cart" });
        });
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart", async (req: any, res) => {
    try {
      // Check for authenticated user first
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      let userId = null;
      
      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
      }
      
      if (userId) {
        await storage.clearCart(userId);
        // Auto-remove gifts since cart is now empty
        (req.session as any).giftItem = null;
      } else {
        // Clear guest cart from session
        (req.session as any).guestCart = [];
        (req.session as any).giftItem = null;
      }
      
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Gift cart management routes
  app.post("/api/cart/gift", async (req: any, res) => {
    try {
      const { giftId, name, type, imageUrl, price, quantity } = req.body;
      
      // Check for authenticated user first
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      let userId = null;
      
      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
      }
      
      // Check if user has any books in cart before allowing gift
      let hasBooks = false;
      if (userId) {
        const cartItems = await storage.getCartItems(userId);
        hasBooks = hasNonGiftBooks(cartItems);
      } else {
        const guestCart = (req.session as any).guestCart || [];
        hasBooks = hasNonGiftBooks(guestCart);
      }
      
      if (!hasBooks) {
        return res.status(400).json({ message: "You must have at least one book in your cart to select a gift" });
      }
      
      const giftItem = {
        giftId,
        name,
        type,
        imageUrl,
        price: 0, // Always free
        quantity: 1, // Always 1
        isGift: true
      };
      
      if (userId) {
        // For authenticated users, store in database session or custom field
        // For now, use session storage
        (req.session as any).giftItem = giftItem;
      } else {
        // For guest users, store in session
        (req.session as any).giftItem = giftItem;
      }
      
      res.json({ message: "Gift added to cart", gift: giftItem });
    } catch (error) {
      console.error("Error adding gift to cart:", error);
      res.status(500).json({ message: "Failed to add gift to cart" });
    }
  });

  app.delete("/api/cart/gift", async (req: any, res) => {
    try {
      // Check for authenticated user first
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      let userId = null;
      
      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
      }
      
      if (userId) {
        // Remove gift from authenticated user's session
        (req.session as any).giftItem = null;
      } else {
        // Remove gift from guest session
        (req.session as any).giftItem = null;
      }
      
      res.json({ message: "Gift removed from cart" });
    } catch (error) {
      console.error("Error removing gift from cart:", error);
      res.status(500).json({ message: "Failed to remove gift from cart" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req: any, res) => {
    try {
      // Check for admin session authentication first
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (adminId && isAdmin) {
        // Admin can see all orders
        const admin = await storage.getAdminById(adminId);
        if (!admin || !admin.isActive) {
          return res.status(401).json({ message: "Admin account inactive" });
        }

        const options: any = {};
        // Add query parameters
        if (req.query.status) options.status = req.query.status as string;
        if (req.query.limit) options.limit = parseInt(req.query.limit as string);
        if (req.query.offset) options.offset = parseInt(req.query.offset as string);

        const result = await storage.getOrders(options);
        return res.json(result);
      }
      
      // Check for regular user authentication
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const options: any = { userId }; // Regular users can only see their own orders
      
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

  app.get("/api/orders/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check for admin session authentication
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (adminId && isAdmin) {
        // Admin can access any order
        const admin = await storage.getAdminById(adminId);
        if (!admin || !admin.isActive) {
          return res.status(401).json({ message: "Admin account inactive" });
        }
        return res.json(order);
      }

      // Check for regular user authentication
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.claims.sub;
      
      // Check if user can access this order
      if (order.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.put("/api/orders/:id/status", async (req: any, res) => {
    try {
      // Use exact same authentication pattern as GET /api/orders
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (adminId && isAdmin) {
        const admin = await storage.getAdminById(adminId);
        if (!admin || !admin.isActive) {
          return res.status(401).json({ message: "Admin account inactive" });
        }

        const id = parseInt(req.params.id);
        const { status, trackingNumber, shippingCarrier, notes } = req.body;
        
        const updatedOrder = await storage.updateOrderStatus(id, status, {
          trackingNumber,
          shippingCarrier,
          notes
        });

        // Send status update email to customer
        try {
          // Email already imported at top of file
          await sendStatusUpdateEmail({
            order: updatedOrder,
            customerEmail: updatedOrder.customerEmail,
            customerName: updatedOrder.customerName,
            newStatus: status,
            trackingNumber,
            shippingCarrier,
            notes
          });
          console.log(`Status update email sent for order #${id}, new status: ${status}`);
        } catch (emailError) {
          console.error("Failed to send status update email:", emailError);
          // Don't fail the status update if email fails
        }
        
        return res.json(updatedOrder);
      }
      
      // If not admin, deny access
      return res.status(401).json({ message: "Unauthorized" });
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

  app.get("/api/contact", async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.put("/api/contact/:id/status", async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['unread', 'read', 'replied'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedMessage = await storage.updateContactMessageStatus(id, status);
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error updating contact message status:", error);
      res.status(500).json({ message: "Failed to update message status" });
    }
  });

  // Admin dashboard routes
  app.get("/api/admin/stats", requireAdminAuth, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/sales-data", requireAdminAuth, async (req: any, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const salesData = await storage.getSalesData(days);
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      res.status(500).json({ message: "Failed to fetch sales data" });
    }
  });

  app.get("/api/admin/low-stock", requireAdminAuth, async (req: any, res) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 5;
      const lowStockBooks = await storage.getLowStockBooks(threshold);
      res.json(lowStockBooks);
    } catch (error) {
      console.error("Error fetching low stock books:", error);
      res.status(500).json({ message: "Failed to fetch low stock books" });
    }
  });

  // Legacy export route (keeping for backward compatibility)
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

  // New admin route for book importing with automatic image fetching
  app.post('/api/admin/import-books', upload.single('file'), async (req: any, res) => {
    try {
      // Check admin authentication
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Save the uploaded file temporarily
      const tempFilePath = path.join(__dirname, '../temp', `import-${Date.now()}.xlsx`);
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(tempFilePath, req.file.buffer);

      // Process the file using BookImporter
      const result = await BookImporter.importFromExcel(tempFilePath);

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      res.json(result);
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to import books" });
    }
  });

  // Admin export route using session authentication
  // Admin route to migrate existing local images to Cloudinary
  app.post("/api/admin/migrate-images", requireAdminAuth, async (req, res) => {
    try {
      console.log('Starting enhanced image migration to Cloudinary...');
      
      const books = await storage.getBooks({ limit: 1000 });
      let migratedCount = 0;
      let defaultImageCount = 0;
      let errors: string[] = [];
      
      // Create a simple default book cover SVG
      const createDefaultBookCover = (title: string, author: string) => {
        const shortTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;
        const shortAuthor = author.length > 25 ? author.substring(0, 25) + '...' : author;
        
        return `<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="600" fill="#1a365d"/>
          <rect x="20" y="20" width="360" height="560" fill="#2d3748" stroke="#4a5568" stroke-width="2"/>
          <text x="200" y="280" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
            <tspan x="200" dy="0">${shortTitle.split(' ').slice(0, 3).join(' ')}</tspan>
            <tspan x="200" dy="25">${shortTitle.split(' ').slice(3).join(' ')}</tspan>
          </text>
          <text x="200" y="350" text-anchor="middle" fill="#cbd5e0" font-family="Arial, sans-serif" font-size="14">
            <tspan x="200" dy="0">by ${shortAuthor}</tspan>
          </text>
          <rect x="60" y="450" width="280" height="4" fill="#4299e1"/>
          <text x="200" y="520" text-anchor="middle" fill="#a0aec0" font-family="Arial, sans-serif" font-size="12">A2Z BOOKSHOP</text>
        </svg>`;
      };
      
      for (const book of books.books) {
        if (book.imageUrl && book.imageUrl.startsWith('/uploads/images/')) {
          try {
            const localPath = path.join(process.cwd(), book.imageUrl);
            let uploadResult;
            
            // Check if local file exists
            if (fs.existsSync(localPath)) {
              const buffer = fs.readFileSync(localPath);
              
              // Upload existing local image to Cloudinary
              uploadResult = await CloudinaryService.uploadImage(
                buffer,
                'a2z-bookshop/books',
                `book-${book.id}-${Date.now()}`
              );
              
              console.log(`Migrated existing image for book ${book.id}: ${book.title}`);
              migratedCount++;
            } else {
              // Create and upload default book cover
              const defaultCoverSvg = createDefaultBookCover(book.title, book.author);
              const svgBuffer = Buffer.from(defaultCoverSvg, 'utf-8');
              
              uploadResult = await CloudinaryService.uploadImage(
                svgBuffer,
                'a2z-bookshop/books',
                `book-${book.id}-default-${Date.now()}`
              );
              
              console.log(`Created default cover for book ${book.id}: ${book.title}`);
              defaultImageCount++;
            }
            
            // Update book with new Cloudinary URL
            await storage.updateBook(book.id, { imageUrl: uploadResult.secure_url });
            
          } catch (error) {
            const errorMsg = `Failed to process image for book ${book.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }
      }
      
      console.log(`Enhanced migration completed. Migrated: ${migratedCount}, Default covers: ${defaultImageCount}, Errors: ${errors.length}`);
      
      res.json({
        success: true,
        message: `Enhanced image migration completed successfully`,
        migratedCount,
        defaultImageCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // Return only first 10 errors
      });
    } catch (error) {
      console.error('Enhanced image migration failed:', error);
      res.status(500).json({
        success: false,
        message: 'Enhanced image migration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/admin/books/export', requireAdminAuth, async (req: any, res) => {
    try {

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

  // Return and Refund Management Routes
  
  // Customer routes - Get eligible orders for return
  app.get("/api/returns/eligible-orders", async (req: any, res) => {
    try {
      // Check for authenticated user first
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      let userId = null;
      let email = null;
      
      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
      } else {
        // Guest user - require email parameter
        email = req.query.email;
        if (!email) {
          return res.status(400).json({ message: "Email required for guest users" });
        }
      }

      const eligibleOrders = await storage.getEligibleOrdersForReturn(userId, email);
      res.json(eligibleOrders);
    } catch (error) {
      console.error("Error fetching eligible orders:", error);
      res.status(500).json({ message: "Failed to fetch eligible orders" });
    }
  });

  // Customer route - Create return request
  app.post("/api/returns/request", async (req: any, res) => {
    try {
      const { orderId, returnReason, returnDescription, itemsToReturn, customerName, customerEmail } = req.body;
      
      if (!orderId || !returnReason || !returnDescription || !itemsToReturn || !customerName || !customerEmail) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Get order to validate and calculate refund
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if order is eligible for return (delivered and within 30 days)
      if (order.status !== "delivered") {
        return res.status(400).json({ message: "Only delivered orders can be returned" });
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
      if (orderDate < thirtyDaysAgo) {
        return res.status(400).json({ message: "Return window has expired (30 days)" });
      }

      // Calculate total refund amount based on items to return
      let totalRefundAmount = 0;
      for (const item of itemsToReturn) {
        const orderItem = order.items.find(oi => oi.bookId === item.bookId);
        if (orderItem && item.quantity <= orderItem.quantity) {
          totalRefundAmount += parseFloat(orderItem.price) * item.quantity;
        }
      }

      // Set return deadline (30 days from now for customer to ship back)
      const returnDeadline = new Date();
      returnDeadline.setDate(returnDeadline.getDate() + 30);

      // Check for authenticated user
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      let userId = null;
      
      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
      }

      const returnRequest = await storage.createReturnRequest({
        orderId,
        userId,
        customerEmail,
        customerName,
        returnReason,
        returnDescription,
        itemsToReturn,
        totalRefundAmount: totalRefundAmount.toString(),
        returnDeadline,
      });

      res.json(returnRequest);
    } catch (error) {
      console.error("Error creating return request:", error);
      res.status(500).json({ message: "Failed to create return request" });
    }
  });

  // Customer route - Get return requests for user
  app.get("/api/returns/my-requests", async (req: any, res) => {
    try {
      // Check for authenticated user first
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      let userId = null;
      
      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { returnRequests } = await storage.getReturnRequests({ userId });
      res.json(returnRequests);
    } catch (error) {
      console.error("Error fetching user return requests:", error);
      res.status(500).json({ message: "Failed to fetch return requests" });
    }
  });

  // Admin routes - Get all return requests
  app.get("/api/admin/returns", async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const status = req.query.status;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await storage.getReturnRequests({ status, limit, offset });
      res.json(result);
    } catch (error) {
      console.error("Error fetching return requests:", error);
      res.status(500).json({ message: "Failed to fetch return requests" });
    }
  });

  // Admin route - Update return request status
  app.put("/api/admin/returns/:id/status", async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const returnRequest = await storage.updateReturnRequestStatus(parseInt(id), status, adminNotes);
      res.json(returnRequest);
    } catch (error) {
      console.error("Error updating return request status:", error);
      res.status(500).json({ message: "Failed to update return request status" });
    }
  });

  // Admin route - Process refund
  app.post("/api/admin/returns/:id/refund", async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const { id } = req.params;
      const { refundMethod, refundReason } = req.body;

      // Get return request details
      const returnRequest = await storage.getReturnRequestById(parseInt(id));
      if (!returnRequest) {
        return res.status(404).json({ message: "Return request not found" });
      }

      if (returnRequest.status !== "approved") {
        return res.status(400).json({ message: "Return request must be approved first" });
      }

      // Create refund transaction record
      const refundTransaction = await storage.createRefundTransaction({
        returnRequestId: parseInt(id),
        orderId: returnRequest.orderId,
        refundAmount: returnRequest.totalRefundAmount,
        refundMethod,
        refundReason,
        processedBy: adminId,
      });

      // Update return request status to refund_processed
      await storage.updateReturnRequestStatus(parseInt(id), "refund_processed");

      // Here you would integrate with actual payment gateways
      // For now, we'll simulate successful refund processing
      await storage.updateRefundTransaction(refundTransaction.id, {
        refundStatus: "completed",
        processedAt: new Date(),
        refundTransactionId: `REF_${Date.now()}`,
      });

      res.json({ 
        message: "Refund processed successfully",
        refundTransaction: refundTransaction
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: "Failed to process refund" });
    }
  });

  const httpServer = createServer(app);
  // Test SMTP configuration endpoint
  app.post("/api/test-smtp", async (req: any, res) => {
    try {
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;
      
      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin login required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const result = await testEmailConfiguration();
      if (result) {
        res.json({ 
          success: true, 
          message: "SMTP configuration verified and test email sent successfully",
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "SMTP configuration test failed - check server logs for details" 
        });
      }
    } catch (error) {
      console.error("SMTP Test Error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Email service error - check SMTP credentials and connection" 
      });
    }
  });

  // Public Gift Categories API Route (for homepage)
  app.get("/api/gift-categories", async (req, res) => {
    try {
      const categories = await storage.getGiftCategories();
      // Only return active categories for public use
      const activeCategories = categories.filter(cat => cat.isActive);
      res.json(activeCategories);
    } catch (error) {
      console.error("Error fetching gift categories:", error);
      res.status(500).json({ message: "Failed to fetch gift categories" });
    }
  });

  // Admin Gift Categories API Routes
  app.get("/api/admin/gift-categories", requireAdminAuth, async (req, res) => {
    try {
      const categories = await storage.getGiftCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching gift categories:", error);
      res.status(500).json({ message: "Failed to fetch gift categories" });
    }
  });

  app.post("/api/admin/gift-categories", requireAdminAuth, async (req, res) => {
    try {
      const categoryData = insertGiftCategorySchema.parse(req.body);
      const category = await storage.createGiftCategory(categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating gift category:", error);
      res.status(500).json({ message: "Failed to create gift category" });
    }
  });

  app.put("/api/admin/gift-categories/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Updating category with data:", {
        ...req.body,
        imageUrl: req.body.imageUrl ? req.body.imageUrl.substring(0, 50) + '...' : req.body.imageUrl
      });
      
      const categoryData = insertGiftCategorySchema.partial().parse(req.body);
      console.log("Parsed category data:", {
        ...categoryData,
        imageUrl: categoryData.imageUrl ? categoryData.imageUrl.substring(0, 50) + '...' : categoryData.imageUrl
      });
      
      const category = await storage.updateGiftCategory(id, categoryData);
      console.log("Updated category successfully:", category);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod validation error:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating gift category:", error);
      res.status(500).json({ message: "Failed to update gift category" });
    }
  });

  app.delete("/api/admin/gift-categories/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGiftCategory(id);
      res.json({ message: "Gift category deleted successfully" });
    } catch (error) {
      console.error("Error deleting gift category:", error);
      res.status(500).json({ message: "Failed to delete gift category" });
    }
  });

  // Public Gift Items API Route (for homepage)
  app.get("/api/gift-items", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const giftItems = await storage.getGiftItems(categoryId);
      // Only return active items for public use
      const activeItems = giftItems.filter(item => item.isActive);
      res.json(activeItems);
    } catch (error) {
      console.error("Error fetching gift items:", error);
      res.status(500).json({ message: "Failed to fetch gift items" });
    }
  });

  app.post("/api/admin/gift-items", requireAdminAuth, async (req, res) => {
    try {
      const giftItemData = insertGiftItemSchema.parse(req.body);
      const giftItem = await storage.createGiftItem(giftItemData);
      res.json(giftItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating gift item:", error);
      res.status(500).json({ message: "Failed to create gift item" });
    }
  });

  app.put("/api/admin/gift-items/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const giftItemData = insertGiftItemSchema.partial().parse(req.body);
      const giftItem = await storage.updateGiftItem(id, giftItemData);
      res.json(giftItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating gift item:", error);
      res.status(500).json({ message: "Failed to update gift item" });
    }
  });

  app.delete("/api/admin/gift-items/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGiftItem(id);
      res.json({ message: "Gift item deleted successfully" });
    } catch (error) {
      console.error("Error deleting gift item:", error);
      res.status(500).json({ message: "Failed to delete gift item" });
    }
  });

  return httpServer;
}
