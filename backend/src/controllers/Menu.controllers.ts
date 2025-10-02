import { type Request, type Response, type NextFunction } from "express";
import QRCode from "qrcode";
import express from "express";
import "dotenv/config";
import ImageKit from "imagekit";
import { eq, and, isNotNull, ilike, sql, like, or, desc } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  users,
  admins as admin,
  diningSessions as dining_sessions,
  groups,
  group_members,
  menuItems as menu_items,
  orders,
  order_items,
  menuItems,
} from "@db/schema.js";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Environment variable ${name} is not set.`);
  }
  return value;
}

const imagekit = new ImageKit({
  urlEndpoint: getEnvVar("IMAGEKIT_URL_ENDPOINT"),
  publicKey: getEnvVar("IMAGEKIT_PUBLIC_KEY"),
  privateKey: getEnvVar("IMAGEKIT_PRIVATE_KEY"),
});

const getFileIdFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1];

    const matches = fileName.match(/_([a-zA-Z0-9]+)\./);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error("Error extracting fileId:", error);
    return null;
  }
};

const uploadImageToImagekit = async (file: Express.Multer.File) => {
  try {
    const result = await imagekit.upload({
      file: file.buffer.toString("base64"),
      fileName: `menu_${Date.now()}_${file.originalname}`,
      folder: "/menu-items",
    });

    return {
      url: result.url,
      fileId: result.fileId,
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw new Error("Failed to upload image to ImageKit");
  }
};

const deleteImageFromImageKit = async (imageUrl: string): Promise<void> => {
  try {
    const fileId = getFileIdFromUrl(imageUrl);
    if (fileId) {
      await imagekit.deleteFile(fileId);
    }
  } catch (error) {
    console.error("ImageKit delete error:", error);
  }
};

export const uploadAuth = async (req: Request, res: Response) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
};

export const getMenuById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const menuId = parseInt(req.params.menuId);
    if (isNaN(menuId)) {
      return res.status(400).json({ error: "Invalid menu id" });
    }

    const menu = await dbClient
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, menuId))
      .limit(1);

    if (menu.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    return res.json(menu[0]);
  } catch (err) {
    next(err);
  }
};

export const getMenus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const nolimit = req.query.nolimit === "true";
    const defaultLimit = 5;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : nolimit
      ? 0
      : defaultLimit;

    const offset = (page - 1) * limit;
    const search = (req.query.search as string)?.trim() || "";
    const category = (req.query.category as string)?.trim() || "";

    const whereConditions = [eq(menuItems.isAvailable, true)];
    if (search) {
      const searchPattern = `%${search}%`;
      whereConditions.push(like(menuItems.name, searchPattern));
    }

    if (category) {
      whereConditions.push(eq(menuItems.category, category));
    }

    const finalWhere = and(...whereConditions);

    let queryBuilder = dbClient
      .select()
      .from(menuItems)
      .where(finalWhere)
      .orderBy(menuItems.name);

    if (!nolimit && limit > 0) {
      queryBuilder = queryBuilder.limit(limit).offset(offset) as any;
    }

    const menus = await queryBuilder;

    const countResult = await dbClient
      .select({ count: sql<number>`count(*)` })
      .from(menuItems)
      .where(finalWhere);

    const totalCount = countResult[0]?.count || 0;

    const hasMore = !nolimit && page * limit < totalCount;

    res.json({
      success: true,
      data: menus,
      hasMore,
      totalCount,
    });
  } catch (error) {
    console.error("[BACKEND MENUCON] Error fetching menus:", error);
    next(error);
  }
};

export const deleteMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Get menu item to access image URL
    const existingItem = await dbClient.query.menuItems.findFirst({
      where: eq(menuItems.id, parseInt(id)),
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: "Menu item not found",
      });
    }

    if (existingItem.imageUrl) {
      await deleteImageFromImageKit(existingItem.imageUrl);
    }

    // Delete from database
    await dbClient.delete(menuItems).where(eq(menuItems.id, parseInt(id)));

    res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("[BACKEND MENUCON] Error deleting menu item:", error);
    next(error);
  }
};

export const createMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      price,
      description,
      category,
      isSignature,
      isAvailable,
      createdByAdminId,
    } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        error: "Name, price, and category are required.",
      });
    }

    let imageUrl: string | null = null;

    if (req.file) {
      const uploadResult = await uploadImageToImagekit(req.file);
      imageUrl = uploadResult.url;
    }

    const [item] = await dbClient
      .insert(menuItems)
      .values({
        name,
        price,
        description,
        imageUrl,
        category,
        isSignature: isSignature || false,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        createdByAdminId: createdByAdminId ? parseInt(createdByAdminId) : null,
        updatedByAdminId: createdByAdminId ? parseInt(createdByAdminId) : null,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("[BACKEND MENUCON] Error creating menu item:", error);
    next(error);
  }
};

export const updateMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      description,
      category,
      isSignature,
      isAvailable,
      updatedByAdminId,
    } = req.body;

    const existingItem = await dbClient.query.menuItems.findFirst({
      where: eq(menuItems.id, parseInt(id)),
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: "Menu item not found",
      });
    }

    let imageUrl = existingItem.imageUrl;

    if (req.file) {
      if (existingItem.imageUrl) {
        await deleteImageFromImageKit(existingItem.imageUrl);
      }

      const uploadResult = await uploadImageToImagekit(req.file);
      imageUrl = uploadResult.url;
    }

    const [updatedItem] = await dbClient
      .update(menuItems)
      .set({
        name: name || existingItem.name,
        price: price || existingItem.price,
        description:
          description !== undefined ? description : existingItem.description,
        imageUrl,
        category: category || existingItem.category,
        isSignature:
          isSignature !== undefined ? isSignature : existingItem.isSignature,
        isAvailable:
          isAvailable !== undefined ? isAvailable : existingItem.isAvailable,
        updatedByAdminId: updatedByAdminId
          ? parseInt(updatedByAdminId)
          : existingItem.updatedByAdminId,
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, parseInt(id)))
      .returning();

    res.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error("[BACKEND MENUCON] Error updating menu item:", error);
    next(error);
  }
};

export const getBestSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ถ้ามี order_items ใช้จำนวนสั่งจริง
    const countOrders = await dbClient.select().from(order_items).limit(1);

    let bestSellers;

    if (countOrders.length > 0) {
      bestSellers = await dbClient
        .select({
          id: menuItems.id,
          name: menuItems.name,
          description: menuItems.description,
          price: menuItems.price,
          imageUrl: menuItems.imageUrl,
          totalOrders: sql<number>`SUM(${order_items.quantity})`,
        })
        .from(order_items)
        .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
        .groupBy(menuItems.id)
        .orderBy(desc(sql`SUM(${order_items.quantity})`))
        .limit(2);
    } else {
      // fallback: เลือก menu ใหม่ล่าสุด 2 เมนู
      bestSellers = await dbClient
        .select()
        .from(menuItems)
        .orderBy(desc(menuItems.createdAt))
        .limit(2);
    }

    return res.json(bestSellers);
  } catch (err) {
    next(err);
  }
};

