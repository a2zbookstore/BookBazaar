import Razorpay from "razorpay";
import { Request, Response } from "express";
import crypto from "crypto";

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error("Missing Razorpay credentials: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Check if we're using live or test keys
const isLiveEnvironment = RAZORPAY_KEY_ID?.startsWith('rzp_live_');
console.log(`Razorpay initialized with ${isLiveEnvironment ? 'LIVE' : 'TEST'} credentials`);

export async function createRazorpayOrder(req: Request, res: Response) {
  try {
    console.log("Creating Razorpay order with request body:", req.body);
    
    const { amount, currency, receipt, international } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    let finalAmount;
    let finalCurrency = currency || "INR";
    
    // For international payments, always use USD
    if (international) {
      // Force USD for international payments to ensure PayPal compatibility
      finalAmount = Math.round(amount * 100); // Convert to cents
      finalCurrency = "USD";
      console.log(`International payment: USD ${amount} = ${finalAmount} cents`);
    } else {
      // For domestic payments, use INR
      finalAmount = Math.round(amount * 100);
      finalCurrency = "INR";
      console.log(`Domestic payment: INR ${amount} = ${finalAmount} paise`);
    }

    const options = {
      amount: finalAmount,
      currency: finalCurrency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1
    };

    console.log("Razorpay order options:", options);

    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created:", order);

    res.json(order);
  } catch (error) {
    console.error("Failed to create Razorpay order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
}

export async function verifyRazorpayPayment(req: Request, res: Response) {
  try {
    console.log("===== RAZORPAY PAYMENT VERIFICATION START =====");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log("❌ Missing required parameters for verification");
      console.log("razorpay_order_id:", razorpay_order_id);
      console.log("razorpay_payment_id:", razorpay_payment_id);
      console.log("razorpay_signature:", razorpay_signature);
      return res.status(400).json({ 
        status: "failed", 
        message: "Missing required parameters: razorpay_order_id, razorpay_payment_id, razorpay_signature" 
      });
    }

    // Verify signature using crypto
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    console.log("✅ Creating signature for body:", body);
    
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET as string)
      .update(body.toString())
      .digest("hex");

    console.log("✅ Expected signature:", expectedSignature);
    console.log("✅ Received signature:", razorpay_signature);
    console.log("✅ Signature match:", expectedSignature === razorpay_signature);

    if (expectedSignature === razorpay_signature) {
      console.log("✅ Payment verified successfully");
      
      // If order data is provided, complete the order creation
      if (orderData) {
        console.log("Processing order completion after payment verification...");
        try {
          // Import storage to create the order
          const { storage } = await import("./storage.js");
          const { sendOrderConfirmationEmail } = await import("./emailService.js");
          
          let userId = null;
          let user = null;
          
          // Check for authenticated user
          const sessionUserId = (req as any).session?.userId;
          const isCustomerAuth = (req as any).session?.isCustomerAuth;
          
          if (sessionUserId && isCustomerAuth) {
            userId = sessionUserId;
            user = await storage.getUser(userId);
          } else if ((req as any).isAuthenticated && (req as any).isAuthenticated()) {
            userId = (req as any).user.claims.sub;
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
            totalInINR,
            paymentMethod = "Razorpay",
            items,
            checkoutType,
            registerPassword
          } = orderData;

          // Handle guest registration if requested
          if (checkoutType === "register" && registerPassword && !userId) {
            console.log("Creating new user account during checkout...");
            const passwordHash = crypto.createHash('sha256').update(registerPassword).digest('hex');
            
            try {
              user = await storage.createEmailUser({
                email: customerEmail,
                firstName: customerName.split(' ')[0] || customerName,
                lastName: customerName.split(' ').slice(1).join(' ') || '',
                passwordHash
              });
              userId = user.id;
              console.log("User account created successfully:", userId);
            } catch (userError: any) {
              if (userError.message?.includes('duplicate') || userError.message?.includes('unique')) {
                console.log("User already exists, proceeding with guest checkout");
              } else {
                throw userError;
              }
            }
          }

          // Get cart items for the order
          let cartItems = [];
          console.log("Getting cart items for order creation, userId:", userId);
          
          if (userId) {
            cartItems = await storage.getCartItems(userId);
            console.log("Authenticated user cart items:", cartItems.length);
          } else {
            // For guest users, get cart from session
            const guestCart = (req as any).session?.guestCart || [];
            console.log("Guest cart from session:", guestCart.length, "items");
            console.log("Guest cart details:", JSON.stringify(guestCart, null, 2));
            cartItems = guestCart;
          }

          // If no cart items but items provided in request, use those
          if (cartItems.length === 0 && items && items.length > 0) {
            console.log("Using items from request payload:", items.length);
            cartItems = items.map((item: any) => ({
              book: {
                id: item.bookId,
                title: item.title,
                author: item.author,
                price: parseFloat(item.price)
              },
              quantity: item.quantity,
              isGift: false
            }));
          }
          
          console.log("Final cart items for order:", cartItems.length);
          
          if (cartItems.length === 0) {
            console.error("No cart items found for order creation");
            return res.status(400).json({ 
              status: "failed", 
              message: "No items found in cart. Please add items and try again." 
            });
          }

          // Process cart items to ensure proper format
          const processedCartItems = [];
          for (const item of cartItems) {
            try {
              let book = item.book;
              
              // For guest users or incomplete book data, fetch from database
              if (!book || !book.id) {
                if (item.bookId) {
                  book = await storage.getBookById(item.bookId);
                } else {
                  console.error("No bookId found for cart item:", item);
                  continue;
                }
              }
              
              if (book && book.id) {
                processedCartItems.push({
                  book: book,
                  quantity: item.quantity || 1,
                  isGift: item.isGift || false
                });
              }
            } catch (error) {
              console.error("Error processing cart item:", error);
            }
          }
          
          cartItems = processedCartItems;

          if (cartItems.length === 0) {
            console.error("No valid cart items found after processing");
            return res.status(400).json({ 
              status: "failed", 
              message: "No valid items found in cart. Please add items and try again." 
            });
          }
          
          console.log("Processed cart items:", cartItems.length);

          // Create order
          const order = await storage.createOrder({
            userId: userId,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress: JSON.stringify(shippingAddress),
            billingAddress: JSON.stringify(billingAddress),
            subtotal: parseFloat(subtotal),
            shipping: parseFloat(shipping),
            tax: parseFloat(tax),
            total: parseFloat(total),
            paymentMethod,
            paymentId: razorpay_payment_id,
            status: "confirmed",
            paymentStatus: "paid"
          }, cartItems.map((item: any) => ({
            bookId: item.book.id,
            quantity: item.quantity,
            price: item.book.price,
            title: item.book.title,
            author: item.book.author
          })));

          // Clear cart after successful order
          if (userId) {
            await storage.clearCart(userId);
          } else {
            // Clear both guest cart formats
            (req as any).session.cartItems = [];
            (req as any).session.guestCart = [];
          }

          // Send order confirmation email
          try {
            await sendOrderConfirmationEmail({
              order: {
                ...order,
                items: cartItems.map((item: any) => ({
                  ...item,
                  book: item.book
                }))
              },
              customerEmail,
              customerName
            });
            console.log("Order confirmation email sent successfully");
          } catch (emailError) {
            console.error("Failed to send order confirmation email:", emailError);
          }

          console.log("Order created successfully:", order.id);
          
          return res.json({ 
            status: "success", 
            message: "Payment verified and order created successfully",
            orderId: order.id,
            paymentId: razorpay_payment_id
          });
          
        } catch (orderError) {
          console.error("Failed to create order after payment verification:", orderError);
          console.error("Order error stack:", orderError instanceof Error ? orderError.stack : orderError);
          return res.status(500).json({ 
            status: "failed", 
            message: "Payment verified but order creation failed",
            error: orderError instanceof Error ? orderError.message : "Unknown error",
            details: orderError instanceof Error ? orderError.stack : String(orderError)
          });
        }
      }
      
      res.json({ status: "success", message: "Payment verified successfully" });
    } else {
      console.log("Signature verification failed");
      res.status(400).json({ status: "failed", message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Failed to verify Razorpay payment:", error);
    res.status(500).json({ error: "Failed to verify payment." });
  }
}

export async function getRazorpayConfig(req: Request, res: Response) {
  res.json({
    key_id: RAZORPAY_KEY_ID,
  });
}