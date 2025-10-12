// import { type Request, type Response, type NextFunction } from "express";
// import { admins } from "@db/schema.js";
// import { dbClient } from "@db/client.js";
// import { eq } from "drizzle-orm";
// import { hashPassword, comparePassword } from "src/utils/hashPassword.js";

// /**
//  * Helper function: format admin for response
//  */
// const formatAdmin = (admin: any) => ({
//   id: admin.id,
//   name: admin.name,
//   email: admin.email,
//   userType: "admin", 
//   createdAt: (admin.createdAt as Date) ?? null,
// });

// /**
//  * Register (for admins only)
//  */export const register = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { username, firstName, lastName, phone, address, email, password } = req.body;

//     const name = [firstName, lastName].filter(Boolean).join(" ");

//     if (!username || !firstName || !lastName || !email || !password) {
//       return res.status(400).json({
//         error: "Username, first name, last name, email, and password are required",
//       });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({ error: "Password must be at least 6 characters long" });
//     }

//     const existingAdmin = await dbClient.query.admins.findFirst({
//       where: eq(admins.email, email),
//     });
//     if (existingAdmin) {
//       return res.status(400).json({ error: "Admin with this email already exists" });
//     }

//     const hashedPassword = await hashPassword(password);

//     const newAdmin = await dbClient
//       .insert(admins)
//       .values({
//         username,
//         name,
//         phone,
//         address,
//         email,
//         password: hashedPassword,
//       })
//       .returning({
//         id: admins.id,
//         username: admins.username,
//         name: admins.name,
//         phone: admins.phone,
//         address: admins.address,
//         email: admins.email,
//         createdAt: admins.createdAt,
//       });

//     req.session.userId = newAdmin[0].id;
//     req.session.userType = "admin";
//     req.session.email = newAdmin[0].email;

//     res.status(201).json({
//       message: "Admin registered successfully",
//       admin: newAdmin[0],
//     });
//   } catch (error) {
//     next(error);
//   }
// };


// /**
//  * Login (admins only)
//  */
// export const login = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.status(400).json({ error: "Email and password are required" });
//     }

//     const admin: any = await dbClient.query.admins.findFirst({
//       where: eq(admins.email, email),
//     });

//     if (!admin || !(await comparePassword(password, admin.password))) {
//       return res.status(401).json({ error: "Invalid email or password" });
//     }

//     req.session.userId = admin.id;
//     req.session.userType = "admin";
//     req.session.email = admin.email;

//     res.json({
//       message: "Login successful",
//       admin: formatAdmin(admin),
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// /**
//  * Logout
//  */
// export const logout = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     req.session.destroy((err) => {
//       if (err) return res.status(500).json({ error: "Could not log out" });
//       res.clearCookie("connect.sid");
//       res.json({ message: "Logout successful" });
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Get current logged-in admin
//  */
// export const getCurrentUser = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { userId, userType } = req.session;

//     if (!userId || userType !== "admin") {
//       return res.status(401).json({ error: "Not authenticated" });
//     }

//     const admin: any = await dbClient.query.admins.findFirst({
//       where: eq(admins.id, userId),
//       columns: {
//         id: true,
//         name: true,
//         email: true,
//         createdAt: true,
//       },
//     });

//     if (!admin) {
//       return res.status(404).json({ error: "Admin not found" });
//     }

//     res.json({
//       admin: formatAdmin(admin),
//     });
//   } catch (err) {
//     next(err);
//   }
// };

import { type Request, type Response, type NextFunction } from "express";
import { admins } from "@db/schema.js";
import { dbClient } from "@db/client.js";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "src/utils/hashPassword.js";

/**
 * Helper function: format admin for response
 */
const formatAdmin = (admin: any) => ({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  userType: "admin",
  createdAt: (admin.createdAt as Date) ?? null,
});

/**
 * Register (for admins only)
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, firstName, lastName, phone, address, email, password } = req.body;
    const name = [firstName, lastName].filter(Boolean).join(" ");

    if (!username || !firstName || !lastName || !email || !password) {
      return res.status(200).json({
        success: false,
        message: "Username, first name, last name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(200).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const existingAdmin = await dbClient.query.admins.findFirst({
      where: eq(admins.email, email),
    });
    if (existingAdmin) {
      return res.status(200).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    const [newAdmin] = await dbClient
      .insert(admins)
      .values({
        username,
        name,
        phone,
        address,
        email,
        password: hashedPassword,
      })
      .returning({
        id: admins.id,
        username: admins.username,
        name: admins.name,
        phone: admins.phone,
        address: admins.address,
        email: admins.email,
        createdAt: admins.createdAt,
      });

    req.session.userId = newAdmin.id;
    req.session.userType = "admin";
    req.session.email = newAdmin.email;

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      admin: newAdmin,
    });
  } catch (error) {
    // ✅ ส่งกลับเป็น 200 พร้อม error message แทนการ throw 500
    console.error("Register error:", error);
    res.status(200).json({
      success: false,
      message: "Registration failed",
      error: (error as Error).message,
    });
  }
};

/**
 * Login (admins only)
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(200).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin: any = await dbClient.query.admins.findFirst({
      where: eq(admins.email, email),
    });

    if (!admin) {
      return res.status(200).json({
        success: false,
        message: "No admin found with this email",
      });
    }

    const valid = await comparePassword(password, admin.password);
    if (!valid) {
      return res.status(200).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    req.session.userId = admin.id;
    req.session.userType = "admin";
    req.session.email = admin.email;

    res.status(200).json({
      success: true,
      message: "Login successful",
      admin: formatAdmin(admin),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(200).json({
      success: false,
      message: "Login failed",
      error: (err as Error).message,
    });
  }
};

/**
 * Logout
 */
export const logout = async (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  });
};

/**
 * Get current logged-in admin
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
) => {
  const { userId, userType } = req.session;

  if (!userId || userType !== "admin") {
    return res.status(200).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const admin: any = await dbClient.query.admins.findFirst({
    where: eq(admins.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!admin) {
    return res.status(200).json({
      success: false,
      message: "Admin not found",
    });
  }

  res.status(200).json({
    success: true,
    admin: formatAdmin(admin),
  });
};
