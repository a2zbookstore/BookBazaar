import { RequestHandler } from "express";
import { storage } from "./storage";

export const requireAdminAuth: RequestHandler = async (req, res, next) => {
  try {
    // Check if user is logged in (either via email or Replit auth)
    const userId = (req.session as any)?.userId;
    const isCustomerAuth = (req.session as any)?.isCustomerAuth;
    const isReplitAuth = req.isAuthenticated && req.isAuthenticated();
    
    let user = null;
    
    // Get user from email-based authentication
    if (userId && isCustomerAuth) {
      user = await storage.getUser(userId);
    }
    // Get user from Replit authentication
    else if (isReplitAuth && req.user?.claims?.sub) {
      const replitUserId = req.user.claims.sub;
      user = await storage.getUser(replitUserId);
    }
    
    // Check if user exists and has admin role
    if (!user || user.role !== "admin") {
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required.",
        requiresAdminRole: true 
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