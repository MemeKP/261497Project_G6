import express from "express";

// Middleware สำหรับตรวจสอบว่าเป็น admin
export const requireAdmin = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.session.userType !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};