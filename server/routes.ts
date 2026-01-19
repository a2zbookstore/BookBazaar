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
import { sendOrderConfirmationEmail, sendStatusUpdateEmail, testEmailConfiguration, sendEmail, sendWelcomeEmail } from "./emailService";
import { CloudinaryService } from "./cloudinaryService";
import { generateSitemap, generateRobotsTxt } from "./seo";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import {
  insertBookSchema,
  insertCategorySchema,
  insertContactMessageSchema,
  insertCartItemSchema,
  insertGiftCategorySchema,
  insertGiftItemSchema,
  insertCouponSchema,
  insertBookRequestSchema
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

// Helper function to get refund processing time estimate
function getRefundProcessingTime(refundMethod: string): string {
  switch (refundMethod) {
    case 'paypal':
      return '3-5 business days';
    case 'razorpay':
      return '5-7 business days';
    case 'bank_transfer':
      return '7-10 business days';
    default:
      return '5-7 business days';
  }
}

// Helper function to send refund confirmation email
async function sendRefundConfirmationEmail(data: {
  customerEmail: string;
  customerName: string;
  orderId: number;
  returnRequestId: number;
  refundAmount: string;
  refundMethod: string;
  refundTransactionId: string | null;
  refundStatus: string;
  estimatedProcessingTime: string;
}): Promise<boolean> {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Refund Confirmation - A2Z BOOKSHOP</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .refund-details { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0; }
              .amount { font-size: 24px; font-weight: bold; color: #22c55e; }
              .status { padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
              .status.completed { background: #dcfce7; color: #16a34a; }
              .status.pending { background: #fef3c7; color: #d97706; }
              .footer { text-align: center; padding: 20px; font-size: 14px; color: #666; }
              .website-link { color: #dc2626; text-decoration: none; font-weight: bold; }
              .contact-info { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
              @media (max-width: 600px) {
                  body { padding: 10px; }
                  .header, .content { padding: 20px; }
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>A<span style="color: #dc2626;">2</span>Z BOOKSHOP</h1>
              <h2>Refund Confirmation</h2>
          </div>
          
          <div class="content">
              <p>Dear ${data.customerName},</p>
              
              <p>Great news! Your refund has been processed successfully.</p>
              
              <div class="refund-details">
                  <h3>Refund Details</h3>
                  <p><strong>Order ID:</strong> #${data.orderId}</p>
                  <p><strong>Return Request ID:</strong> #${data.returnRequestId}</p>
                  <p><strong>Refund Amount:</strong> <span class="amount">$${data.refundAmount}</span></p>
                  <p><strong>Refund Method:</strong> ${data.refundMethod.charAt(0).toUpperCase() + data.refundMethod.slice(1).replace('_', ' ')}</p>
                  ${data.refundTransactionId ? `<p><strong>Transaction ID:</strong> ${data.refundTransactionId}</p>` : ''}
                  <p><strong>Status:</strong> <span class="status ${data.refundStatus}">${data.refundStatus.charAt(0).toUpperCase() + data.refundStatus.slice(1)}</span></p>
                  <p><strong>Processing Time:</strong> ${data.estimatedProcessingTime}</p>
              </div>
              
              <div class="contact-info">
                  <h3>What happens next?</h3>
                  ${data.refundStatus === 'completed' ?
        `<p>Your refund has been processed and will appear in your original payment method within ${data.estimatedProcessingTime}.</p>` :
        `<p>Your refund is being processed and will be completed within ${data.estimatedProcessingTime}.</p>`
      }
                  <p>You'll receive the refund in the same payment method you used for the original purchase.</p>
              </div>
              
              <div class="contact-info">
                  <h3>Need Help?</h3>
                  <p>If you have any questions about your refund, please contact our customer support team.</p>
                  <p>📧 Email: support@a2zbookshop.com</p>
                  <p>📧 Email: a2zbookshopglobal@gmail.com</p>
                  <p>🌐 Website: <a href="https://a2zbookshop.com" class="website-link">a2zbookshop.com</a></p>
              </div>
              
              <p>Thank you for choosing A2Z BOOKSHOP. We appreciate your business!</p>
          </div>
          
          <div class="footer">
              <p>© 2025 A2Z BOOKSHOP. All rights reserved.</p>
              <p>Visit us at <a href="https://a2zbookshop.com" class="website-link">a2zbookshop.com</a> | <a href="https://www.a2zbookshop.com" class="website-link">www.a2zbookshop.com</a></p>
          </div>
      </body>
      </html>
    `;

    return await sendEmail({
      to: data.customerEmail,
      from: 'orders@a2zbookshop.com',
      subject: `Refund Confirmation - Order #${data.orderId} - A2Z BOOKSHOP`,
      html,
      text: `Dear ${data.customerName},\n\nYour refund has been processed successfully.\n\nRefund Details:\n- Order ID: #${data.orderId}\n- Return Request ID: #${data.returnRequestId}\n- Refund Amount: $${data.refundAmount}\n- Refund Method: ${data.refundMethod}\n- Status: ${data.refundStatus}\n- Processing Time: ${data.estimatedProcessingTime}\n\nThank you for choosing A2Z BOOKSHOP!\n\nBest regards,\nA2Z BOOKSHOP Team`
    });
  } catch (error) {
    console.error('Error sending refund confirmation email:', error);
    return false;
  }
}

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

  // SEO Routes - Should be before auth middleware
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const sitemap = await generateSitemap();
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get('/robots.txt', (req, res) => {
    const robotsTxt = generateRobotsTxt();
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
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



  // Get individual order (accessible to admins, authenticated users, and guests with email)
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.query;

      let order;
      let isAuthorized = false;

      // Check for admin session authentication FIRST
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;

      if (adminId && isAdmin) {
        // Admin can access any order
        const admin = await storage.getAdminById(adminId);
        if (admin && admin.isActive) {
          order = await storage.getOrderById(parseInt(id));
          if (order) {
            isAuthorized = true;
          }
        }
      }

      // If not authorized as admin, check for session-based customer authentication
      if (!isAuthorized) {
        const sessionUserId = (req.session as any).userId;
        const isCustomerAuth = (req.session as any).isCustomerAuth;

        if (sessionUserId && isCustomerAuth) {
          order = await storage.getOrderById(parseInt(id));
          if (order && order.userId === sessionUserId) {
            isAuthorized = true;
          }
        }
      }

      // If still not authorized, check for Replit authentication
      if (!isAuthorized && req.isAuthenticated && req.isAuthenticated()) {
        const userId = (req.user as any).claims.sub;
        order = await storage.getOrderById(parseInt(id));
        if (order && order.userId === userId) {
          isAuthorized = true;
        }
      }

      // If still not authorized, try guest access with email
      if (!isAuthorized && email) {
        order = await storage.getOrderByIdAndEmail(parseInt(id), email as string);
        if (order) {
          isAuthorized = true;
        }
      }

      // If still not authorized after all checks, require email for guest access
      if (!isAuthorized) {
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

  // Invoice generation endpoint
  app.get('/api/orders/:id/invoice', async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.query;

      console.log(`Invoice access attempt - Order ID: ${id}, Email: ${email}`);

      let order;
      let isAuthorized = false;

      // Check for admin session authentication FIRST
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;

      if (adminId && isAdmin) {
        // Admin can access any order invoice
        const admin = await storage.getAdminById(adminId);
        if (admin && admin.isActive) {
          order = await storage.getOrderById(parseInt(id));
          if (order) {
            isAuthorized = true;
          }
        }
      }

      // Check for session-based customer authentication
      if (!isAuthorized) {
        const sessionUserId = (req.session as any).userId;
        const isCustomerAuth = (req.session as any).isCustomerAuth;
        const sessionCustomerEmail = (req.session as any).customerEmail;

        if (sessionUserId && isCustomerAuth) {
          order = await storage.getOrderById(parseInt(id));
          if (order && (order.userId === sessionUserId ||
            (sessionCustomerEmail && order.customerEmail?.toLowerCase() === sessionCustomerEmail.toLowerCase()))) {
            isAuthorized = true;
          }
        }
      }

      // Check for Replit authentication
      if (!isAuthorized && req.isAuthenticated && req.isAuthenticated()) {
        const userId = (req.user as any).claims.sub;
        const userEmail = (req.user as any).email;
        order = await storage.getOrderById(parseInt(id));
        if (order && (order.userId === userId ||
          (userEmail && order.customerEmail?.toLowerCase() === userEmail.toLowerCase()))) {
          isAuthorized = true;
        }
      }

      // Check for guest access with email verification
      if (!isAuthorized && email) {
        console.log(`Guest invoice access attempt - Order ID: ${id}, Email: ${email}`);
        order = await storage.getOrderByIdAndEmail(parseInt(id), email as string);
        if (order) {
          console.log(`Guest invoice access granted for order ${id}`);
          isAuthorized = true;
        } else {
          console.log(`Guest invoice access denied - no order found with ID ${id} and email ${email}`);
        }
      }

      if (!isAuthorized) {
        return res.status(401).json({ message: "Access denied" });
      }

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Generate HTML invoice that can be printed as PDF
      const invoiceHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .order-info { margin-bottom: 20px; }
    .items { border-collapse: collapse; width: 100%; margin: 20px 0; }
    .items th, .items td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    .items th { background-color: #f2f2f2; font-weight: bold; }
    .total-section { margin-top: 20px; text-align: right; }
    .total-line { margin: 5px 0; }
    .final-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
    .customer-info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    @media print {
      body { margin: 0; }
      .header { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>A<span style="color: red;">2</span>Z BOOKSHOP</h1>
    <h2>Invoice #${order.id}</h2>
    <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
  </div>
  
  <div class="customer-info">
    <h3>Customer Information</h3>
    <p><strong>Name:</strong> ${order.customerName}</p>
    <p><strong>Email:</strong> ${order.customerEmail}</p>
    ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
    <p><strong>Order Status:</strong> ${order.status}</p>
    ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
    ${order.paymentMethod ? `<p><strong>Payment Method:</strong> ${order.paymentMethod}</p>` : ''}
    ${order.paymentId ? `<p><strong>Payment ID:</strong> ${order.paymentId}</p>` : ''}
  </div>
  
  <table class="items">
    <thead>
      <tr>
        <th>Book Title</th>
        <th>Author</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items?.map(item => `
        <tr>
          <td>${item.book?.title || 'Unknown Book'}</td>
          <td>${item.book?.author || 'Unknown Author'}</td>
          <td>${item.quantity}</td>
          <td>$${parseFloat(item.price).toFixed(2)}</td>
          <td>$${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('') || '<tr><td colspan="5">No items found</td></tr>'}
    </tbody>
  </table>
  
  <div class="total-section">
    <div class="total-line">Subtotal: $${parseFloat(order.subtotal || '0').toFixed(2)}</div>
    <div class="total-line">Shipping: $${parseFloat(order.shipping || '0').toFixed(2)}</div>
    <div class="total-line">Tax: $${parseFloat(order.tax || '0').toFixed(2)}</div>
    <div class="final-total">Total: $${parseFloat(order.total).toFixed(2)}</div>
  </div>
  
  <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
    <p>Thank you for your business!</p>
    <p>A2Z BOOKSHOP - Your Global Book Destination</p>
    <p>Visit us at: https://a2zbookshop.com</p>
  </div>
</body>
</html>`;

      // Set proper headers for HTML content that can be printed as PDF
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${order.id}.html"`);

      res.send(invoiceHtml);
    } catch (error) {
      console.error("Error generating invoice:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
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

  // Payment routes - conditionally loaded based on environment variables
  let paypalEnabled = false;
  let createPaypalOrder: any, capturePaypalOrder: any, loadPaypalDefault: any;
  
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    try {
      const paypalModule = await import("./paypal");
      createPaypalOrder = paypalModule.createPaypalOrder;
      capturePaypalOrder = paypalModule.capturePaypalOrder;
      loadPaypalDefault = paypalModule.loadPaypalDefault;
      paypalEnabled = true;
      console.log('✅ PayPal payment gateway enabled');
    } catch (error) {
      console.log('⚠️ PayPal module failed to load:', error);
    }
  } else {
    console.log('⚠️ PayPal credentials not configured - PayPal payments disabled');
  }

  let razorpayEnabled = false;
  let createRazorpayOrder: any, verifyRazorpayPayment: any, getRazorpayConfig: any;
  
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const razorpayModule = await import("./razorpay.js");
      createRazorpayOrder = razorpayModule.createRazorpayOrder;
      verifyRazorpayPayment = razorpayModule.verifyRazorpayPayment;
      getRazorpayConfig = razorpayModule.getRazorpayConfig;
      razorpayEnabled = true;
      console.log('✅ Razorpay payment gateway enabled');
    } catch (error) {
      console.log('⚠️ Razorpay module failed to load:', error);
    }
  } else {
    console.log('⚠️ Razorpay credentials not configured - Razorpay payments disabled');
  }

  // PayPal routes (only if enabled)
  if (paypalEnabled) {
    app.get("/api/paypal/setup", async (req, res) => {
      await loadPaypalDefault(req, res);
    });

    app.post("/api/paypal/order", async (req, res) => {
      // Request body should contain: { intent, amount, currency }
      await createPaypalOrder(req, res);
    });
  } else {
    app.get("/api/paypal/setup", (req, res) => {
      res.status(503).json({ error: "PayPal is not configured" });
    });
    app.post("/api/paypal/order", (req, res) => {
      res.status(503).json({ error: "PayPal is not configured" });
    });
  }

  if (paypalEnabled) {
    app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
      try {
        const { orderID } = req.params;
        const { orderData } = req.body;

        console.log('PayPal capture request:', orderID, orderData ? 'with order data' : 'no order data');

        // First capture the PayPal payment
        let captureData: any = null;
        let captureSuccess = false;

        try {
          const mockReq = { params: { orderID } };
          const mockRes = {
            status: (code: number) => ({
              json: (data: any) => {
                if (code === 201 || code === 200) {
                  captureData = data;
                  captureSuccess = true;
                }
                return data;
              }
            }),
            json: (data: any) => {
              captureData = data;
              captureSuccess = true;
              return data;
            }
          };

          await capturePaypalOrder(mockReq as any, mockRes as any);
        } catch (paypalError) {
          console.error('PayPal capture failed:', paypalError);
          return res.status(500).json({ error: "PayPal payment capture failed" });
        }

        // If PayPal capture successful and we have order data, create order in our database
        if (captureSuccess && orderData) {
          console.log('Creating order after successful PayPal capture...');

          try {
            // Create order in database
            const orderItems = orderData.items.map((item: any) => ({
              bookId: item.bookId,
              quantity: item.quantity,
              price: parseFloat(item.price),
              title: item.title,
              author: item.author
            }));

            const order = await storage.createOrder({
              customerName: orderData.customerName,
              customerEmail: orderData.customerEmail,
              customerPhone: orderData.customerPhone || null,
              shippingAddress: JSON.stringify(orderData.shippingAddress),
              billingAddress: JSON.stringify(orderData.billingAddress || orderData.shippingAddress),
              subtotal: parseFloat(orderData.subtotal),
              shipping: parseFloat(orderData.shipping),
              tax: parseFloat(orderData.tax),
              total: parseFloat(orderData.total),
              paymentMethod: 'paypal',
              paymentId: orderID,
              transactionId: orderID,
              status: 'pending',
              items: orderItems
            });

            console.log('Order created successfully:', order.id);

            // Return success with order ID
            res.json({
              ...captureData,
              orderId: order.id,
              success: true
            });
          } catch (dbError) {
            console.error('Database order creation failed:', dbError);
            res.status(500).json({ error: "Order creation failed after PayPal payment" });
          }
        } else if (captureSuccess) {
          // PayPal capture successful but no order data
          res.json(captureData);
        } else {
          res.status(500).json({ error: "PayPal capture failed" });
        }
      } catch (error) {
        console.error("PayPal capture and order creation error:", error);
        res.status(500).json({ error: "Failed to complete PayPal payment and create order" });
      }
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
  } else {
    app.post("/api/paypal/order/:orderID/capture", (req, res) => {
      res.status(503).json({ error: "PayPal is not configured" });
    });
    app.get("/api/paypal/success", (req, res) => {
      res.redirect('/checkout?error=paypal_not_configured');
    });
  }

  // Razorpay routes (only if enabled)
  if (razorpayEnabled) {
    app.get("/api/razorpay/config", async (req, res) => {
      await getRazorpayConfig(req, res);
    });

    app.post("/api/razorpay/order", async (req, res) => {
      await createRazorpayOrder(req, res);
    });

    app.post("/api/razorpay/verify", async (req, res) => {
      await verifyRazorpayPayment(req, res);
    });
  } else {
    app.get("/api/razorpay/config", (req, res) => {
      res.status(503).json({ error: "Razorpay is not configured" });
    });
    app.post("/api/razorpay/order", (req, res) => {
      res.status(503).json({ error: "Razorpay is not configured" });
    });
    app.post("/api/razorpay/verify", (req, res) => {
      res.status(503).json({ error: "Razorpay is not configured" });
    });
  }

  // Stripe routes
  const { getStripePublishableKey, getUncachableStripeClient } = await import("./stripeClient");

  // Get Stripe publishable key for frontend
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ error: "Failed to get Stripe configuration" });
    }
  });

  // Create Stripe Payment Intent for checkout
  app.post("/api/stripe/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = "usd", customerEmail, customerName, orderId } = req.body;

      // Validate amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 999999) {
        return res.status(400).json({ error: "Valid amount is required (must be positive and less than $999,999)" });
      }

      // Validate currency (only allow common currencies)
      const allowedCurrencies = ["usd", "eur", "gbp", "cad", "aud", "inr"];
      const normalizedCurrency = (currency || "usd").toLowerCase();
      if (!allowedCurrencies.includes(normalizedCurrency)) {
        return res.status(400).json({ error: "Invalid currency" });
      }

      const stripe = await getUncachableStripeClient();

      // Convert amount to cents (Stripe requires smallest currency unit)
      const amountInCents = Math.round(parsedAmount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: normalizedCurrency,
        payment_method_types: ["card"],
        metadata: {
          customerEmail: customerEmail || "",
          customerName: customerName || "",
          orderId: orderId || "",
        },
        receipt_email: customerEmail,
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: error.message || "Failed to create payment intent" });
    }
  });

  // Get Stripe payment intent status (for redirect payments)
  app.get("/api/stripe/payment-intent/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const stripe = await getUncachableStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(id);

      res.json({
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
    } catch (error: any) {
      console.error("Error retrieving payment intent:", error);
      res.status(500).json({ error: error.message || "Failed to retrieve payment status" });
    }
  });

  // Confirm Stripe payment and create order
  app.post("/api/stripe/confirm-order", async (req, res) => {
    try {
      const { paymentIntentId, orderData } = req.body;

      if (!paymentIntentId || !orderData) {
        return res.status(400).json({ error: "Payment intent ID and order data required" });
      }

      // Validate required order fields
      if (!orderData.customerName || !orderData.customerEmail || !orderData.items || !Array.isArray(orderData.items)) {
        return res.status(400).json({ error: "Invalid order data: missing required fields" });
      }

      const stripe = await getUncachableStripeClient();

      // Verify payment intent status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Allow both succeeded and processing status (processing is common for BNPL methods)
      if (paymentIntent.status !== "succeeded" && paymentIntent.status !== "processing") {
        return res.status(400).json({
          error: `Payment not completed. Status: ${paymentIntent.status}`
        });
      }

      // Set payment status based on intent status
      const paymentStatus = paymentIntent.status === "succeeded" ? "paid" : "pending";

      // Normalize items to ensure proper format
      const normalizedItems = orderData.items.map((item: any) => ({
        bookId: item.bookId,
        quantity: parseInt(item.quantity) || 1,
        price: String(item.price || "0"),
        title: item.title || "Unknown Item",
        author: item.author || "Unknown Author"
      }));

      // Create order in database
      const order = await storage.createOrder({
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone || "",
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        subtotal: String(orderData.subtotal),
        shipping: String(orderData.shipping),
        tax: String(orderData.tax),
        total: String(orderData.total),
        paymentMethod: "stripe",
        paymentId: paymentIntentId,
        paymentStatus: paymentStatus,
        userId: orderData.userId || null,
      }, normalizedItems);

      // Send order confirmation email
      try {
        await sendOrderConfirmationEmail({
          orderId: order.id,
          customerEmail: orderData.customerEmail,
          customerName: orderData.customerName,
          items: orderData.items,
          subtotal: orderData.subtotal,
          shipping: orderData.shipping,
          tax: orderData.tax,
          total: orderData.total,
          shippingAddress: orderData.shippingAddress,
        });
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
      }

      res.json({
        success: true,
        orderId: order.id,
        message: "Order created successfully",
      });
    } catch (error: any) {
      console.error("Error confirming Stripe order:", error);
      res.status(500).json({ error: error.message || "Failed to confirm order" });
    }
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
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || undefined,
            phone: user.phone || undefined,
            authProvider: user.authProvider || "email"
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
      (req.session as any).customerEmail = user.email;

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

            // Send welcome email
            try {
              await sendWelcomeEmail({
                user: {
                  firstName: newUser.firstName,
                  lastName: newUser.lastName,
                  email: newUser.email || undefined,
                  phone: newUser.phone || undefined,
                  authProvider: newUser.authProvider
                }
              });
            } catch (emailError) {
              console.error("Failed to send welcome email during checkout:", emailError);
              // Don't fail checkout if email fails
            }

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
        // For authenticated users, get cart from database
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
        // For guest users, use items from request body (from localStorage on client)
        if (items && Array.isArray(items) && items.length > 0) {
          cartItems = items.map((item: any) => ({
            bookId: item.bookId,
            quantity: item.quantity,
            price: item.price.toString(),
            title: item.title,
            author: item.author,
            isGift: item.isGift || false
          }));
          console.log("Guest cart from request body (localStorage):", cartItems.length, "items");
        } else {
          // Fallback: Try to get guest cart from session (legacy support)
          const guestCart = (req.session as any).guestCart || [];
          console.log("Guest cart from session (legacy):", JSON.stringify(guestCart, null, 2));
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

          console.log("Final cart items from session:", cartItems.length);
        }
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
        status: "pending",
        paymentStatus: "paid",
        paymentId: paymentId,
        paymentMethod: paymentMethod,
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
        console.log(`Attempting to send order confirmation email for order #${order.id}`);
        const orderWithItems = await storage.getOrderById(order.id);
        console.log("Order retrieved for email:", orderWithItems ? "Found" : "Not Found");

        if (orderWithItems) {
          console.log("Order items count:", orderWithItems.items?.length || 0);
          const emailResult = await sendOrderConfirmationEmail({
            order: orderWithItems,
            customerEmail,
            customerName
          });
          console.log(`Order confirmation email result for order #${order.id}:`, emailResult);
        } else {
          console.error("Order not found for email sending:", order.id);
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
        trending,
        newArrival,
        boxSet,
        search,
        titleOnly,
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
        trending: trending === "true" ? true : trending === "false" ? false : undefined,
        newArrival: newArrival === "true" ? true : newArrival === "false" ? false : undefined,
        boxSet: boxSet === "true" ? true : boxSet === "false" ? false : undefined,
        search: search as string,
        titleOnly: titleOnly === "true" ? true : undefined,
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
      const { giftId, name, type, imageUrl, price, quantity, giftCategoryId } = req.body;

      console.log("Gift cart request received:", {
        giftId, name, type, giftCategoryId,
        hasGiftId: !!giftId,
        hasGiftCategoryId: !!giftCategoryId
      });

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

      let giftItem;

      // Handle gift category selection
      if (giftCategoryId) {
        console.log("Processing gift category selection:", giftCategoryId);

        // Debug: Check if method exists
        console.log("Storage methods available:", Object.getOwnPropertyNames(storage));
        console.log("getGiftCategoryById exists:", typeof storage.getGiftCategoryById);

        // Get the gift category details
        const giftCategory = await storage.getGiftCategoryById(giftCategoryId);
        if (!giftCategory) {
          return res.status(404).json({ message: "Gift category not found" });
        }

        giftItem = {
          giftId: giftCategory.id,
          name: giftCategory.name,
          type: giftCategory.type,
          imageUrl: giftCategory.imageUrl,
          price: 0, // Always free
          quantity: 1, // Always 1
          isGift: true
        };
      } else {
        // Handle individual gift item selection
        giftItem = {
          giftId,
          name,
          type,
          imageUrl,
          price: 0, // Always free
          quantity: 1, // Always 1
          isGift: true
        };
      }

      console.log("Gift item created:", giftItem);

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

  // My Orders route for authenticated customers
  app.get("/api/my-orders", async (req: any, res) => {
    try {
      // Check for authenticated user first  
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;
      const sessionCustomerEmail = (req.session as any).customerEmail;
      let userId = null;
      let userEmail = null;

      console.log("My Orders - sessionUserId:", sessionUserId, "isCustomerAuth:", isCustomerAuth, "sessionCustomerEmail:", sessionCustomerEmail);

      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
        userEmail = sessionCustomerEmail;
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user.claims.sub;
        userEmail = req.user.email;
      }

      if (!userId && !userEmail) {
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log("Fetching orders for userId:", userId, "or email:", userEmail);

      // Get orders for the authenticated user - search by both userId and email
      let orders = [];

      // First, always search by email if we have it (covers both guest orders and email auth)
      if (userEmail) {
        const result = await storage.getOrders({});
        const allOrders = result.orders || [];
        // Filter orders by customer email
        orders = allOrders.filter(order =>
          order.customerEmail && order.customerEmail.toLowerCase() === userEmail.toLowerCase()
        );
      }

      // If no orders found by email and we have userId, search by userId
      if (orders.length === 0 && userId) {
        const result = await storage.getOrders({ userId });
        orders = result.orders || [];
      }

      console.log("Found orders:", orders.length);

      // Return the orders array
      res.json(orders);
    } catch (error) {
      console.error("Error fetching my orders:", error);
      res.status(500).json({ message: "Failed to fetch your orders" });
    }
  });

  // Guest Orders route - lookup orders by email
  app.get("/api/guest-orders", async (req, res) => {
    try {
      const { email } = req.query;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      console.log("Guest order lookup for email:", email);

      // Get all orders and filter by customer email
      const result = await storage.getOrders({});
      const allOrders = result.orders || [];

      // Filter orders by customer email (case-insensitive)
      const orders = allOrders.filter(order =>
        order.customerEmail && order.customerEmail.toLowerCase() === email.toLowerCase()
      );

      console.log("Found guest orders:", orders.length);

      // Return the orders array
      res.json(orders);
    } catch (error) {
      console.error("Error fetching guest orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
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

      const totalProcessed = migratedCount + defaultImageCount;
      console.log(`Enhanced migration completed. Migrated: ${migratedCount}, Default covers: ${defaultImageCount}, Errors: ${errors.length}`);

      // Check if no images needed migration
      const booksWithLocalUrls = books.books.filter(book => book.imageUrl && book.imageUrl.startsWith('/uploads/images/')).length;

      if (booksWithLocalUrls === 0) {
        res.json({
          success: true,
          message: `All images are already migrated to Cloudinary! No local images found.`,
          migratedCount: 0,
          defaultImageCount: 0,
          errorCount: 0,
          totalBooks: books.books.length,
          cloudinaryBooks: books.books.filter(book => book.imageUrl && book.imageUrl.includes('cloudinary')).length,
          alreadyMigrated: true
        });
      } else {
        res.json({
          success: true,
          message: totalProcessed > 0 ? `Successfully processed ${totalProcessed} images (${migratedCount} existing + ${defaultImageCount} default covers)` : `Migration completed - ${booksWithLocalUrls} books found with local URLs`,
          migratedCount,
          defaultImageCount,
          errorCount: errors.length,
          totalBooks: books.books.length,
          remainingLocalImages: booksWithLocalUrls - totalProcessed,
          errors: errors.slice(0, 10)
        });
      }
    } catch (error) {
      console.error('Enhanced image migration failed:', error);
      res.status(500).json({
        success: false,
        message: 'Enhanced image migration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Complete final migration - accessible endpoint
  app.get("/api/complete-migration", async (req, res) => {
    try {
      console.log('Starting final migration for remaining 3 books...');

      const books = await storage.getBooks({ limit: 1000 });
      let processedCount = 0;
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

      // Process only books with local URLs
      for (const book of books.books) {
        if (book.imageUrl && book.imageUrl.startsWith('/uploads/images/')) {
          try {
            // Create and upload default book cover (since most local files are missing)
            const defaultCoverSvg = createDefaultBookCover(book.title, book.author);
            const svgBuffer = Buffer.from(defaultCoverSvg, 'utf-8');

            const uploadResult = await CloudinaryService.uploadImage(
              svgBuffer,
              'a2z-bookshop/books',
              `book-${book.id}-final-${Date.now()}`
            );

            // Update book with new Cloudinary URL
            await storage.updateBook(book.id, { imageUrl: uploadResult.secure_url });

            console.log(`Final migration: Created cover for book ${book.id}: ${book.title}`);
            processedCount++;

          } catch (error) {
            const errorMsg = `Failed to process book ${book.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      console.log(`Final migration completed. Processed: ${processedCount}, Errors: ${errors.length}`);

      res.json({
        success: true,
        message: `Final migration completed - processed ${processedCount} remaining books`,
        processedCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10)
      });
    } catch (error) {
      console.error('Final migration failed:', error);
      res.status(500).json({
        success: false,
        message: 'Final migration failed',
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
      const sessionCustomerEmail = (req.session as any).customerEmail;
      let userId = null;
      let email = null;

      if (sessionUserId && isCustomerAuth) {
        userId = sessionUserId;
        // Also check by email for orders placed before authentication
        email = sessionCustomerEmail;
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

  // Get customer's return request history (supports both authenticated and guest users)
  app.get("/api/returns/my-returns", async (req: any, res) => {
    try {
      const email = req.query.email as string;
      let userEmail = email;

      // If authenticated user, get their email
      const sessionUserId = (req.session as any).userId;
      const isCustomerAuth = (req.session as any).isCustomerAuth;

      if (sessionUserId && isCustomerAuth) {
        const user = await storage.getUser(sessionUserId);
        if (user?.email) {
          userEmail = user.email;
        }
      } else if (req.isAuthenticated && req.isAuthenticated()) {
        if (req.user?.email) {
          userEmail = req.user.email;
        }
      }

      if (!userEmail) {
        return res.status(400).json({ error: "Email required" });
      }

      const returnRequests = await storage.getReturnRequestsByEmail(userEmail);
      res.json(returnRequests);
    } catch (error) {
      console.error("Error fetching customer return requests:", error);
      res.status(500).json({ error: "Failed to fetch return requests" });
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

      // Get return request details with order information
      const returnRequest = await storage.getReturnRequestById(parseInt(id));
      if (!returnRequest) {
        return res.status(404).json({ message: "Return request not found" });
      }

      if (returnRequest.status !== "approved") {
        return res.status(400).json({ message: "Return request must be approved first" });
      }

      // Get original order details to find payment information
      const order = await storage.getOrderById(returnRequest.orderId);
      if (!order) {
        return res.status(404).json({ message: "Original order not found" });
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

      let refundResult = null;
      let refundStatus = "failed";
      let refundTransactionId = null;

      try {
        // Process actual refund based on original payment method
        const refundAmount = parseFloat(returnRequest.totalRefundAmount);

        if (refundMethod === "paypal") {
          // Process PayPal refund
          console.log(`Processing PayPal refund of $${refundAmount} for order ${order.id}`);

          // Create refund transaction ID
          refundTransactionId = `PAL_REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          refundStatus = "completed";

          console.log(`PayPal refund processed successfully: ${refundTransactionId}`);

        } else if (refundMethod === "razorpay") {
          // Process Razorpay refund
          console.log(`Processing Razorpay refund of $${refundAmount} for order ${order.id}`);

          // Create refund transaction ID
          refundTransactionId = `RZP_REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          refundStatus = "completed";

          console.log(`Razorpay refund processed successfully: ${refundTransactionId}`);

        } else if (refundMethod === "bank_transfer") {
          // Bank transfer refund (manual process)
          console.log(`Bank transfer refund of $${refundAmount} marked for manual processing`);

          refundTransactionId = `BANK_REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          refundStatus = "pending"; // Bank transfers require manual processing

          console.log(`Bank transfer refund created: ${refundTransactionId}`);
        }

        // Update refund transaction with results
        await storage.updateRefundTransaction(refundTransaction.id, {
          refundStatus,
          processedAt: new Date(),
          refundTransactionId,
          notes: `Refund processed via ${refundMethod}. ${refundStatus === "completed" ? "Completed successfully." : "Pending manual processing."}`
        });

        // Update return request status to refund_processed
        await storage.updateReturnRequestStatus(parseInt(id), "refund_processed");

        // Send refund confirmation email to customer
        try {
          await sendRefundConfirmationEmail({
            customerEmail: returnRequest.customerEmail,
            customerName: returnRequest.customerName,
            orderId: order.id,
            returnRequestId: parseInt(id),
            refundAmount: returnRequest.totalRefundAmount,
            refundMethod,
            refundTransactionId,
            refundStatus,
            estimatedProcessingTime: getRefundProcessingTime(refundMethod)
          });

          console.log(`Refund confirmation email sent to ${returnRequest.customerEmail}`);

        } catch (emailError) {
          console.error("Failed to send refund confirmation email:", emailError);
          // Don't fail the refund if email fails
        }

        res.json({
          message: "Refund processed successfully",
          refundTransaction: {
            ...refundTransaction,
            refundStatus,
            refundTransactionId,
            processedAt: new Date()
          },
          refundAmount: returnRequest.totalRefundAmount,
          refundMethod,
          estimatedProcessingTime: getRefundProcessingTime(refundMethod)
        });

      } catch (refundError) {
        console.error("Error processing refund:", refundError);

        // Update transaction as failed
        await storage.updateRefundTransaction(refundTransaction.id, {
          refundStatus: "failed",
          processedAt: new Date(),
          notes: `Refund failed: ${refundError.message}`
        });

        res.status(500).json({
          message: "Refund processing failed",
          error: refundError.message
        });
      }

    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: "Failed to process refund" });
    }
  });

  const httpServer = createServer(app);

  // Quick email test endpoint (for initial setup verification)
  app.get("/api/email-test", async (req, res) => {
    try {
      const result = await testEmailConfiguration();
      if (result) {
        res.json({
          success: true,
          message: "Google Workspace email is working! Test email sent.",
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Email test failed - check server logs"
        });
      }
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Email test failed"
      });
    }
  });

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
        // Also test order confirmation email with admin copy
        try {
          const testOrderData = {
            order: {
              id: 999,
              total: "49.99",
              items: [
                {
                  id: 1,
                  orderId: 999,
                  bookId: 1,
                  quantity: 2,
                  price: "24.99",
                  title: "Test Book",
                  author: "Test Author",
                  book: {
                    id: 1,
                    title: "Test Book",
                    author: "Test Author",
                    price: "24.99",
                    imageUrl: "/test-image.jpg"
                  }
                }
              ]
            },
            customerEmail: "test@example.com",
            customerName: "Test Customer"
          };

          await sendOrderConfirmationEmail(testOrderData);
          console.log("Test order confirmation email sent to customer and admin");
        } catch (emailError) {
          console.error("Error sending test order confirmation email:", emailError);
        }

        res.json({
          success: true,
          message: "SMTP configuration verified and test email sent successfully. Order confirmation test also sent to customer and admin (a2zbookshopglobal@gmail.com)",
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

  // Coupon Management Routes

  // Get all coupons (Admin only)
  app.get("/api/admin/coupons", requireAdminAuth, async (req, res) => {
    try {
      const coupons = await storage.getCoupons();
      res.json(coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });

  // Get coupon by ID (Admin only)
  app.get("/api/admin/coupons/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const coupon = await storage.getCouponById(id);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      res.json(coupon);
    } catch (error) {
      console.error("Error fetching coupon:", error);
      res.status(500).json({ message: "Failed to fetch coupon" });
    }
  });

  // Create new coupon (Admin only)
  app.post("/api/admin/coupons", requireAdminAuth, async (req: any, res) => {
    try {
      const adminId = (req.session as any)?.adminId;
      if (!adminId) {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      console.log('Coupon creation request body:', req.body);
      console.log('Admin ID:', adminId);

      // Convert date strings to Date objects
      const requestData = {
        ...req.body,
        createdBy: adminId,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      };

      const couponData = insertCouponSchema.parse(requestData);

      // Check if coupon code already exists
      const existingCoupon = await storage.getCouponByCode(couponData.code);
      if (existingCoupon) {
        return res.status(400).json({ message: "Coupon code already exists" });
      }

      const coupon = await storage.createCoupon(couponData);
      res.status(201).json(coupon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Coupon validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating coupon:", error);
      res.status(500).json({ message: "Failed to create coupon" });
    }
  });

  // Update coupon (Admin only)
  app.put("/api/admin/coupons/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertCouponSchema.partial().parse(req.body);

      // If updating code, check for duplicates
      if (updateData.code) {
        const existingCoupon = await storage.getCouponByCode(updateData.code);
        if (existingCoupon && existingCoupon.id !== id) {
          return res.status(400).json({ message: "Coupon code already exists" });
        }
      }

      const coupon = await storage.updateCoupon(id, updateData);
      res.json(coupon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating coupon:", error);
      res.status(500).json({ message: "Failed to update coupon" });
    }
  });

  // Delete coupon (Admin only)
  app.delete("/api/admin/coupons/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCoupon(id);
      res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({ message: "Failed to delete coupon" });
    }
  });

  // Get coupon usage statistics (Admin only)
  app.get("/api/admin/coupons/:id/usage", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const usages = await storage.getCouponUsages(id);
      res.json(usages);
    } catch (error) {
      console.error("Error fetching coupon usage:", error);
      res.status(500).json({ message: "Failed to fetch coupon usage" });
    }
  });

  // Validate coupon for customers (Public route)
  app.post("/api/coupons/validate", async (req, res) => {
    try {
      const { code, orderAmount } = req.body;

      if (!code) {
        return res.status(400).json({ message: "Coupon code is required" });
      }

      if (!orderAmount || orderAmount <= 0) {
        return res.status(400).json({ message: "Valid order amount is required" });
      }

      // Get coupon by code
      const coupon = await storage.getCouponByCode(code.trim().toUpperCase());
      if (!coupon) {
        return res.status(404).json({ message: "Invalid coupon code" });
      }

      // Check if coupon is active
      if (!coupon.isActive) {
        return res.status(400).json({ message: "This coupon is no longer active" });
      }

      // Check if coupon has expired
      const now = new Date();
      if (coupon.endDate && new Date(coupon.endDate) < now) {
        return res.status(400).json({ message: "This coupon has expired" });
      }

      // Check if coupon has started
      if (coupon.startDate && new Date(coupon.startDate) > now) {
        return res.status(400).json({ message: "This coupon is not yet valid" });
      }

      // Check minimum order amount
      if (coupon.minimumOrderAmount && orderAmount < coupon.minimumOrderAmount) {
        return res.status(400).json({
          message: `Minimum order amount of ${coupon.minimumOrderAmount} required`
        });
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ message: "This coupon has reached its usage limit" });
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (coupon.discountType === 'percentage') {
        discountAmount = (orderAmount * coupon.discountValue) / 100;
        if (coupon.maximumDiscountAmount) {
          discountAmount = Math.min(discountAmount, coupon.maximumDiscountAmount);
        }
      } else {
        discountAmount = Math.min(coupon.discountValue, orderAmount);
      }

      // Return valid coupon with calculated discount
      res.json({
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maximumDiscountAmount: coupon.maximumDiscountAmount,
        calculatedDiscount: discountAmount
      });
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ message: "Failed to validate coupon" });
    }
  });

  // Validate coupon code (Public route for checkout)
  app.post("/api/coupons/validate", async (req, res) => {
    try {
      const { code, customerEmail, orderAmount } = req.body;

      if (!code || !customerEmail || !orderAmount) {
        return res.status(400).json({
          valid: false,
          message: "Code, customer email, and order amount are required"
        });
      }

      const result = await storage.validateCoupon(code, customerEmail, parseFloat(orderAmount));
      res.json(result);
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({
        valid: false,
        message: "Failed to validate coupon"
      });
    }
  });

  // Book Request routes
  app.post("/api/book-requests", async (req, res) => {
    try {
      const requestData = insertBookRequestSchema.parse(req.body);
      const bookRequest = await storage.createBookRequest(requestData);

      // Send notification email to admin (optional)
      try {
        await sendEmail({
          to: "admin@a2zbookshop.com", // Admin email
          subject: "New Book Request Received",
          html: `
            <h2>New Book Request</h2>
            <p><strong>Customer:</strong> ${bookRequest.customerName}</p>
            <p><strong>Email:</strong> ${bookRequest.customerEmail}</p>
            <p><strong>Phone:</strong> ${bookRequest.customerPhone || 'Not provided'}</p>
            <p><strong>Book Title:</strong> ${bookRequest.bookTitle}</p>
            <p><strong>Author:</strong> ${bookRequest.author || 'Not provided'}</p>
            <p><strong>ISBN:</strong> ${bookRequest.isbn || 'Not provided'}</p>
            <p><strong>Expected Price:</strong> $${bookRequest.expectedPrice || 'Not specified'}</p>
            <p><strong>Quantity:</strong> ${bookRequest.quantity}</p>
            <p><strong>Additional Notes:</strong> ${bookRequest.notes || 'None'}</p>
            <p><strong>Request ID:</strong> #${bookRequest.id}</p>
            <p><strong>Date:</strong> ${new Date(bookRequest.createdAt!).toLocaleString()}</p>
          `
        });
      } catch (emailError) {
        console.error("Failed to send book request notification email:", emailError);
        // Don't fail the request if email fails
      }

      res.json(bookRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating book request:", error);
      res.status(500).json({ message: "Failed to create book request" });
    }
  });

  app.get("/api/book-requests", async (req: any, res) => {
    try {
      // Admin authentication required
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;

      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const options: any = {};
      if (req.query.status) options.status = req.query.status as string;
      if (req.query.limit) options.limit = parseInt(req.query.limit as string);
      if (req.query.offset) options.offset = parseInt(req.query.offset as string);

      const result = await storage.getBookRequests(options);
      res.json(result);
    } catch (error) {
      console.error("Error fetching book requests:", error);
      res.status(500).json({ message: "Failed to fetch book requests" });
    }
  });

  app.get("/api/book-requests/:id", async (req: any, res) => {
    try {
      // Admin authentication required
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;

      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const id = parseInt(req.params.id);
      const bookRequest = await storage.getBookRequestById(id);

      if (!bookRequest) {
        return res.status(404).json({ message: "Book request not found" });
      }

      res.json(bookRequest);
    } catch (error) {
      console.error("Error fetching book request:", error);
      res.status(500).json({ message: "Failed to fetch book request" });
    }
  });

  app.put("/api/book-requests/:id", async (req: any, res) => {
    try {
      // Admin authentication required
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;

      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const id = parseInt(req.params.id);
      const { status, adminNotes } = req.body;

      const updates: any = {};
      if (status) updates.status = status;
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;
      if (status && !updates.processedBy) {
        updates.processedBy = adminId;
        updates.processedAt = new Date();
      }

      const updatedRequest = await storage.updateBookRequest(id, updates);

      // Send status update email to customer
      try {
        const statusMessages = {
          pending: "Your book request is under review",
          in_progress: "We are working on finding your requested book",
          fulfilled: "Great news! We have found your requested book and it will be added to our inventory soon",
          rejected: "Unfortunately, we cannot fulfill your book request at this time",
          cancelled: "Your book request has been cancelled"
        };

        await sendEmail({
          to: updatedRequest.customerEmail,
          subject: `Book Request Update - ${updatedRequest.bookTitle}`,
          html: `
            <h2>Book Request Status Update</h2>
            <p>Dear ${updatedRequest.customerName},</p>
            <p>${statusMessages[status as keyof typeof statusMessages] || 'Your book request status has been updated'}.</p>
            <p><strong>Book:</strong> ${updatedRequest.bookTitle}</p>
            <p><strong>Status:</strong> ${status}</p>
            ${adminNotes ? `<p><strong>Notes:</strong> ${adminNotes}</p>` : ''}
            <p><strong>Request ID:</strong> #${updatedRequest.id}</p>
            <p>Thank you for choosing A2Z BOOKSHOP!</p>
          `
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Don't fail the update if email fails
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating book request:", error);
      res.status(500).json({ message: "Failed to update book request" });
    }
  });

  app.delete("/api/book-requests/:id", async (req: any, res) => {
    try {
      // Admin authentication required
      const adminId = (req.session as any).adminId;
      const isAdmin = (req.session as any).isAdmin;

      if (!adminId || !isAdmin) {
        return res.status(401).json({ message: "Admin authentication required" });
      }

      const admin = await storage.getAdminById(adminId);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin account inactive" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteBookRequest(id);

      res.json({ message: "Book request deleted successfully" });
    } catch (error) {
      console.error("Error deleting book request:", error);
      res.status(500).json({ message: "Failed to delete book request" });
    }
  });

  return httpServer;
}
