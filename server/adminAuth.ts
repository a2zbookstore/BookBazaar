import { RequestHandler } from "express";

export const requireAdminAuth: RequestHandler = async (req, res, next) => {
  try {
    console.log('requireAdminAuth middleware - Session debug:', {
      sessionExists: !!req.session,
      sessionId: req.sessionID,
      adminId: (req.session as any)?.adminId,
      isAdmin: (req.session as any)?.isAdmin,
      sessionKeys: req.session ? Object.keys(req.session) : [],
      cookies: req.headers.cookie
    });

    const adminId = (req.session as any)?.adminId;
    const isAdmin = (req.session as any)?.isAdmin;
    
    if (!adminId || !isAdmin) {
      console.log('Admin auth failed:', { adminId, isAdmin });
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log('Admin auth successful for adminId:', adminId);
    next();
  } catch (error) {
    console.error("Admin auth check error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};