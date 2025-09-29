import { type Request, type Response, type NextFunction } from "express";
import { users, admins } from "@db/schema.js";
import { dbClient } from "@db/client.js";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "src/utils/hashPassword.js";

const formatUser = (user: any, userType: "user" | "admin") => ({
  id: user.id,
  name: user.name,
  email: user.email,
  userType,
  createdAt: (user.createdAt as Date) ?? null, // ✅ ป้องกัน null
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, email, password, userType = "user" } = req.body;

    // รวมเป็น name 
    const name = [firstName, lastName].filter(Boolean).join(" ");

    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ error: "First name, last name, email, and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const existingUser = await dbClient.query.users.findFirst({
      where: eq(users.email, email),
    });
    const existingAdmin = await dbClient.query.admins.findFirst({
      where: eq(admins.email, email),
    });
    if (existingUser || existingAdmin) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    const hashedPassword = await hashPassword(password);
    const table = userType === "admin" ? admins : users;

    const newUser = await dbClient
      .insert(table)
      .values({ name, email, password: hashedPassword })
      .returning({
        id: table.id,
        name: table.name,
        email: table.email,
        createdAt: table.createdAt as any, // ✅ หลอก TS ให้ยอม
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

    // ✅ ใช้ any แก้ TypeScript error createdAt null
    let user: any = await dbClient.query.users.findFirst({
      where: eq(users.email, email),
    });
    let userType: "user" | "admin" = "user";

    if (!user) {
      user = (await dbClient.query.admins.findFirst({
        where: eq(admins.email, email),
      })) as any; // ✅ cast เป็น any
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

    // ✅ cast เป็น any ป้องกัน error createdAt null
    const user: any =
      userType === "admin"
        ? await dbClient.query.admins.findFirst({
            where: eq(admins.id, userId!),
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
