import { type Request, type Response, type NextFunction } from "express";
import { admins } from "@db/schema.js";
import { dbClient } from "@db/client.js";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "src/utils/hashPassword.js";

type AdminRow = {
  id: number;
  username?: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  email: string;
  password: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

const formatAdmin = (admin: AdminRow) => ({
  id: admin.id,
  username: admin.username ?? "",
  name: admin.name,
  email: admin.email,
  phone: admin.phone ?? "",
  address: admin.address ?? "",
  userType: "admin",
  createdAt: admin.createdAt ?? new Date(),
  updatedAt: admin.updatedAt ?? new Date(),
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, username, phone, address, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, username, email, and password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const existingAdmin = await dbClient.query.admins.findFirst({
      where: eq(admins.email, email),
    });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin with this email already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = await dbClient
      .insert(admins)
      .values({ name, username, phone: phone ?? null, address: address ?? null, email, password: hashedPassword })
      .returning({
        id: admins.id,
        username: admins.username,
        name: admins.name,
        phone: admins.phone,
        address: admins.address,
        email: admins.email,
        createdAt: admins.createdAt,
        updatedAt: admins.updatedAt,
        password: admins.password
      });

    req.session.userId = newAdmin[0].id;
    req.session.userType = "admin";
    req.session.email = newAdmin[0].email;

    res.status(201).json({
      message: "Admin registered successfully",
      admin: formatAdmin(newAdmin[0]),
    });
  } catch (error) {
    next(error);
  }
};
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const admin = await dbClient.query.admins.findFirst({
      where: eq(admins.email, email),
    });

    if (!admin || !(await comparePassword(password, admin.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.userId = admin.id;
    req.session.userType = "admin";
    req.session.email = admin.email;

    res.json({
      message: "Login successful",
      admin: formatAdmin(admin),
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Could not log out" });
      res.clearCookie("connect.sid");
      res.json({ message: "Logout successful" });
    });
  } catch (error) {
    next(error);
  }
};


export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, userType } = req.session;

    if (!userId || userType !== "admin") {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const admin = await dbClient.query.admins.findFirst({
      where: eq(admins.id, userId),
      columns: {
        id: true,
        username: true,
        name: true,
        phone: true,
        address: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        password:true
      },
    });

    if (!admin) return res.status(404).json({ error: "Admin not found" });

    res.json({
      admin: formatAdmin(admin),
    });
  } catch (err) {
    next(err);
  }
};