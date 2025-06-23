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
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        error: "Invalid amount. Amount must be a positive number.",
      });
    }

    // Check for live Razorpay minimum amount requirements
    const isLiveKey = RAZORPAY_KEY_ID?.startsWith('rzp_live_');
    const minAmount = isLiveKey ? 100 : 1; // Live accounts often require ₹100 minimum
    
    if (parseFloat(amount) < minAmount) {
      return res.status(400).json({
        error: `Minimum transaction amount is ₹${minAmount}.00`,
        isLive: isLiveKey,
        suggestion: isLiveKey ? "Please add more items to reach ₹100 minimum for live payments" : undefined
      });
    }

    const amountInPaise = Math.round(parseFloat(amount) * 100);
    console.log(`Creating Razorpay order: ${amount} ${currency} = ${amountInPaise} paise`);
    
    const options = {
      amount: amountInPaise, // Razorpay expects amount in paise
      currency: currency.toUpperCase(),
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture
      notes: {
        order_amount: `${amount} ${currency}`,
        converted_amount: `${amountInPaise} paise`
      }
    };

    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created successfully:", order);
    res.json(order);
  } catch (error) {
    console.error("Failed to create Razorpay order:", error);
    
    // Enhanced error handling for live Razorpay issues
    if (error instanceof Error) {
      if (error.message.includes('live') || error.message.includes('test')) {
        res.status(400).json({ 
          error: "Payment gateway configuration issue. Please contact support.",
          details: error.message 
        });
      } else {
        res.status(500).json({ 
          error: "Failed to create Razorpay order.",
          details: error.message 
        });
      }
    } else {
      res.status(500).json({ error: "Failed to create Razorpay order." });
    }
  }
}

export async function verifyRazorpayPayment(req: Request, res: Response) {
  try {
    console.log("Razorpay verification request body:", JSON.stringify(req.body, null, 2));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log("Missing required parameters for verification");
      return res.status(400).json({ 
        status: "failed", 
        message: "Missing required parameters: razorpay_order_id, razorpay_payment_id, razorpay_signature" 
      });
    }

    // Verify signature using crypto
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    console.log("Creating signature for body:", body);
    
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET as string)
      .update(body.toString())
      .digest("hex");

    console.log("Expected signature:", expectedSignature);
    console.log("Received signature:", razorpay_signature);

    if (expectedSignature === razorpay_signature) {
      console.log("Payment verified successfully");
      
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
              quantity: item.quantity
            }));
          }
          
          console.log("Final cart items for order:", cartItems.length);

          // Process cart items for guest users (fetch book details if needed)
          if (!userId && cartItems.length > 0) {
            const processedCartItems = [];
            for (const item of cartItems) {
              try {
                let book = item.book;
                if (!book && item.bookId) {
                  book = await storage.getBookById(item.bookId);
                }
                
                if (book) {
                  processedCartItems.push({
                    book: book,
                    quantity: item.quantity || 1
                  });
                }
              } catch (error) {
                console.error("Error processing cart item:", error);
              }
            }
            cartItems = processedCartItems;
          }

          if (cartItems.length === 0) {
            return res.status(400).json({ 
              status: "failed", 
              message: "No items found in cart" 
            });
          }

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
            razorpayOrderId: razorpay_order_id
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