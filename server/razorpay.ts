import Razorpay from "razorpay";
import { Request, Response } from "express";

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error("Missing Razorpay credentials: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export async function createRazorpayOrder(req: Request, res: Response) {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        error: "Invalid amount. Amount must be a positive number.",
      });
    }

    const options = {
      amount: Math.round(parseFloat(amount) * 100), // Razorpay expects amount in paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Failed to create Razorpay order:", error);
    res.status(500).json({ error: "Failed to create Razorpay order." });
  }
}

export async function verifyRazorpayPayment(req: Request, res: Response) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature using crypto
    const crypto = require("crypto");
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment is valid
      res.json({ status: "success", message: "Payment verified successfully" });
    } else {
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