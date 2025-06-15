import { RequestHandler } from "express";

export const requireAdminAuth: RequestHandler = async (req, res, next) => {
  try {
    console.log('Admin auth check:', {
      sessionExists: !!req.session,
      sessionId: req.sessionID,
      adminId: (req.session as any)?.adminId,
      isAdmin: (req.session as any)?.isAdmin,
      sessionData: req.session,
      cookies: req.headers.cookie
    });

    const adminId = (req.session as any)?.adminId;
    const isAdmin = (req.session as any)?.isAdmin;
    
    if (!adminId || !isAdmin) {
      console.log('Auth failed - no valid admin session');
      return res.status(401).json({ message: "Unauthorized" });
    }

    next();
  } catch (error) {
    console.error("Admin auth check error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};