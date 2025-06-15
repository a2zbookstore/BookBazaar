import { RequestHandler } from "express";

export const requireAdminAuth: RequestHandler = async (req, res, next) => {
  try {
    const adminId = (req.session as any)?.adminId;
    const isAdmin = (req.session as any)?.isAdmin;
    
    if (!adminId || !isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    next();
  } catch (error) {
    console.error("Admin auth check error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};