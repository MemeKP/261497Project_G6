import express from "express";

export const requireAdmin = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.log('Session:', req.session); // เพิ่มการตรวจสอบ
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.session.userType !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  req.user = req.session.userId;  // เชื่อมต่อข้อมูล user ไปที่ req
  next();
};