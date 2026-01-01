import { RequestHandler } from "express";

export const requireAdminAuth: RequestHandler = async (req, res, next) => {
  try {
    console.log('Admin auth check for', req.method, req.path, ':', {
      sessionExists: !!req.session,
      sessionId: req.sessionID,
      adminId: (req.session as any)?.adminId,
      isAdmin: (req.session as any)?.isAdmin,
      sessionData: req.session,
      cookies: req.headers.cookie,
      contentType: req.headers['content-type']
    });

    const adminId = (req.session as any)?.adminId;
    const isAdmin = (req.session as any)?.isAdmin;
    
    if (!adminId || !isAdmin) {
      console.log('Auth failed - no valid admin session. AdminId:', adminId, 'IsAdmin:', isAdmin);
      return res.status(401).json({ message: "Admin authentication required" });
    }

    console.log('Admin auth successful for', req.method, req.path);
    next();
  } catch (error) {
    console.error("Admin auth check error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};