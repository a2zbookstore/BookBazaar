// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { Request, Response } from "express";

/* PayPal Controllers Setup */

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

if (!PAYPAL_CLIENT_ID) {
  throw new Error("Missing PAYPAL_CLIENT_ID");
}
if (!PAYPAL_CLIENT_SECRET) {
  throw new Error("Missing PAYPAL_CLIENT_SECRET");
}
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment:
    process.env.NODE_ENV === "production"
      ? Environment.Production
      : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});
const ordersController = new OrdersController(client);
const oAuthAuthorizationController = new OAuthAuthorizationController(client);

/* Token generation helpers */

export async function getClientToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    console.log("PayPal order creation request body:", req.body);
    const { amount, currency, intent, return_url, cancel_url, orderData } =
      req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      console.log("Invalid amount:", amount);
      return res.status(400).json({
        error: "Invalid amount. Amount must be a positive number.",
      });
    }

    if (!currency) {
      console.log("Missing currency");
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      console.log("Missing intent");
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
    }

    // Log order data for debugging
    if (orderData) {
      console.log("Order metadata:", JSON.stringify(orderData, null, 2));
    }

    // Convert INR to USD for PayPal sandbox compatibility
    const isINR = currency === "INR";
    const paypalCurrency = isINR ? "USD" : currency;
    const paypalAmount = isINR
      ? (parseFloat(amount) * 0.012).toFixed(2) // rough conversion
      : amount.toString();

    if (isNaN(Number(paypalAmount)) || Number(paypalAmount) <= 0) {
      return res.status(400).json({ error: "Invalid converted amount." });
    }
    console.log(
      `Currency conversion: ${currency} ${amount} -> ${paypalCurrency} ${paypalAmount}`,
    );

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currency_code: paypalCurrency,
              value: paypalAmount,
            },
          },
        ],
        applicationContext: {
          returnUrl:
            return_url ||
            `${req.protocol}://${req.get("host")}/paypal-complete`,
          cancelUrl:
            cancel_url || `${req.protocol}://${req.get("host")}/checkout`,
          brandName: "A2Z BOOKSHOP",
          landingPage: "LOGIN" as any,
          userAction: "PAY_NOW" as any,
        },
      },
      prefer: "return=representation",
    };

    console.log(
      "PayPal order collection object:",
      JSON.stringify(collect, null, 2),
    );

    const { body, ...httpResponse } =
      await ordersController.createOrder(collect);

    console.log("PayPal response status:", httpResponse.statusCode);
    console.log("PayPal response body:", String(body));

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order - full error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
      await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failedd to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  const clientToken = await getClientToken();
  res.json({
    clientToken,
  });
}
// <END_EXACT_CODE>
