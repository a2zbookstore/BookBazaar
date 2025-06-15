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
    console.log("Razorpay verification request body:", req.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

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