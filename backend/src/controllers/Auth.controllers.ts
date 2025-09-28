import { type Request, type Response, type NextFunction } from "express";
import { users, admin } from "@db/schema.js";
import { dbClient } from "@db/client.js";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "src/utils/HashPassword.js";

const formatUser = (user: any, userType: "user" | "admin") => ({
  id: user.id,
  name: user.name,
  email: user.email,
  userType,
  createdAt: user.createdAt,
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, userType = "user" } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const existingUser = await dbClient.query.users.findFirst({
      where: eq(users.email, email),
    });
    const existingAdmin = await dbClient.query.admin.findFirst({
      where: eq(admin.email, email),
    });
    if (existingUser || existingAdmin) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const table = userType === "admin" ? admin : users;
    const newUser = await dbClient
      .insert(table)
      .values({ name, email, password: hashedPassword })
      .returning({
        id: table.id,
        name: table.name,
        email: table.email,
        createdAt: table.createdAt,
      });

    req.session.userId = newUser[0].id;
    req.session.userType = userType;
    req.session.email = newUser[0].email;

    res.status(201).json({
      message: "User registered successfully",
      user: formatUser(newUser[0], userType),
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

    let user = await dbClient.query.users.findFirst({
      where: eq(users.email, email),
    });
    let userType: "user" | "admin" = "user";
    if (!user) {
      user = await dbClient.query.admin.findFirst({
        where: eq(admin.email, email),
      });
      userType = "admin";
    }
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.userId = user.id;
    req.session.userType = userType;
    req.session.email = user.email;

    res.json({
      message: "Login successful",
      user: formatUser(user, userType),
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

    const user =
      userType === "admin"
        ? await dbClient.query.admin.findFirst({
            where: eq(admin.id, userId!),
            columns: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          })
        : await dbClient.query.users.findFirst({
            where: eq(users.id, userId!),
            columns: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        ...user,
        userType,
      },
    });
  } catch (err) {
    next(err);
  }
};
