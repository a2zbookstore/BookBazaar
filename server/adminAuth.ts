import { RequestHandler } from "express";
import { storage } from "./storage";

export const requireAdminAuth: RequestHandler = async (req, res, next) => {
  try {
    // Check if user is logged in (either via email, Replit, or OAuth)
    const userId = (req.session as any)?.userId;
    const isCustomerAuth = (req.session as any)?.isCustomerAuth;
    const isPassportAuth = req.isAuthenticated && req.isAuthenticated();

    let user = null;

    // 1. Email / phone-based authentication
    if (userId && isCustomerAuth) {
      user = await storage.getUser(userId);
    }
    // 2. Google / Facebook OAuth — passport deserialises req.user as the full DB user object (no claims)
    else if (isPassportAuth && (req.user as any)?.id && !(req.user as any)?.claims) {
      user = req.user as any;
    }
    // 3. Replit authentication — req.user has a claims object
    else if (isPassportAuth && (req.user as any)?.claims?.sub) {
      user = await storage.getUser((req.user as any).claims.sub);
    }

    // Check if user exists and has admin role
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
        requiresAdminRole: true,
      });
    }

    // Attach user to request for use in route handlers
    (req as any).adminUser = user;

    next();
  } catch (error) {
    console.error("Admin auth check error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};