import { type Request, type Response, type NextFunction } from "express";
import QRCode from "qrcode";
import express from "express";
import "dotenv/config";
import ImageKit from "imagekit";
import { eq, and, isNotNull, ilike, sql, like, or, desc, asc } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  users,
  admins as admin,
  diningSessions,
  groups,
  group_members,
  menuItems,
  orders,
  orderItems,
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

const uploadImageToImagekit = async (file: Express.Multer.File) => {
  try {
    const result = await imagekit.upload({
      file: file.buffer.toString("base64"),
      fileName: `menu_${Date.now()}_${file.originalname}`,
      folder: "/261497project",
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
    const fileName = imageUrl.split('/').pop();    
    const items = await imagekit.listFiles({
      path: "/261497project",
      limit: 100
    });
    
    // ใช้ type guard 
    const isFileObject = (item: any): item is { fileId: string; name: string; url: string } => {
      return item && typeof item === 'object' && 'fileId' in item && 'name' in item && 'url' in item;
    };
    
    const targetFile = items.find(item => isFileObject(item) && item.name === fileName);
    
    if (targetFile && isFileObject(targetFile)) {
      console.log(`[DELETE IMAGE] Found file:`, {
        fileId: targetFile.fileId,
        name: targetFile.name,
        url: targetFile.url
      });
      
      await imagekit.deleteFile(targetFile.fileId);
      console.log(`[DELETE IMAGE] Successfully deleted!`);
    } else {
      console.log(`[DELETE IMAGE] File not found: ${fileName}`);
    }
    
  } catch (error: any) {
    console.error("[DELETE IMAGE] Error:", error.message);
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
    const showAll = req.query.showAll === "true"; //ให้adminใช้
    const defaultLimit = 5;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : nolimit
        ? 0
        : defaultLimit;

    const offset = (page - 1) * limit;
    const search = (req.query.search as string)?.trim() || "";
    const category = (req.query.category as string)?.trim() || "";

    //const whereConditions = showAll ? [] : [eq(menuItems.isAvailable, true)];
    const whereConditions: any[] = [];
    
    if (!showAll) {
      whereConditions.push(eq(menuItems.isAvailable, true));
    }
    if (search) {
  if (search.length <= 50) { 
    const searchPattern = `%${search}%`;
    whereConditions.push(
      or(
        ilike(menuItems.name, searchPattern),
        ilike(menuItems.description, searchPattern)
      )
    );
  }
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
    console.log(`[DELETE MENU] Raw ID from params:`, id, typeof id);

    // ตรวจสอบว่า id เป็น number ที่ถูกต้อง
    const menuId = parseInt(id);
    console.log(`[DELETE MENU] Parsed ID:`, menuId);

    if (isNaN(menuId)) {
      console.log(`[DELETE MENU] Invalid ID: ${id}`);
      return res.status(400).json({
        success: false,
        error: "Invalid menu ID",
      });
    }

    // Get menu item to access image URL
    const existingItem = await dbClient.query.menuItems.findFirst({
      where: eq(menuItems.id, menuId),
    });

    console.log(`[DELETE MENU] Found item:`, existingItem);

    if (!existingItem) {
      console.log(`[DELETE MENU] Item not found for ID: ${menuId}`);
      return res.status(404).json({
        success: false,
        error: "Menu item not found",
      });
    }

    // Delete image from ImageKit if exists
    if (existingItem.imageUrl) {
      console.log(`[DELETE MENU] Deleting image: ${existingItem.imageUrl}`);
      await deleteImageFromImageKit(existingItem.imageUrl);
    } else {
      console.log(`[DELETE MENU] No image to delete`);
    }

    // Delete from database
    console.log(`[DELETE MENU] Deleting from database`);
    await dbClient.delete(menuItems).where(eq(menuItems.id, menuId));

    console.log(`[DELETE MENU] Successfully deleted menu item ID: ${menuId}`);
    res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE MENU] Error deleting menu item:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
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
      description,
      price,
      category,
      isSignature = false,
      isAvailable = true,
      createdByAdminId,
    } = req.body;

    // แปลง isAvailable เป็น boolean
    const parsedIsAvailable = 
      isAvailable === 'true' || 
      isAvailable === true || 
      isAvailable === '1';

    // แปลง isSignature เป็น boolean
    const parsedIsSignature = 
      isSignature === 'true' || 
      isSignature === true || 
      isSignature === '1';

    console.log('✅ [CREATE MENU] Final values:');
    console.log('isAvailable:', parsedIsAvailable);
    console.log('isSignature:', parsedIsSignature);


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
        isSignature: parsedIsSignature,
        isAvailable: parsedIsAvailable,
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
    const { menuId } = req.params;
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
      where: eq(menuItems.id, parseInt(menuId)),
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

    const parsedIsAvailable = 
      isAvailable !== undefined 
        ? (isAvailable === 'true' || isAvailable === true || isAvailable === '1')
        : existingItem.isAvailable;
    
    const parsedIsSignature = 
      isSignature !== undefined 
        ? (isSignature === 'true' || isSignature === true || isSignature === '1')
        : existingItem.isSignature;

    const [updatedItem] = await dbClient
      .update(menuItems)
      .set({
        name: name || existingItem.name,
        price: price || existingItem.price,
        description:
          description !== undefined ? description : existingItem.description,
        imageUrl,
        category: category || existingItem.category,
        isSignature: parsedIsSignature, 
        isAvailable: parsedIsAvailable,  
        updatedByAdminId: updatedByAdminId
          ? parseInt(updatedByAdminId)
          : existingItem.updatedByAdminId,
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, parseInt(menuId)))
      .returning();

    res.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error("[UPDATE MENU] Error updating menu item:", error);
    next(error);
  }
};

export const getBestSeller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ถ้ามี order_items ใช้จำนวนสั่งจริง
    const countOrders = await dbClient.select().from(orderItems).limit(1);

    let bestSellers;

    if (countOrders.length > 0) {
      bestSellers = await dbClient
        .select({
          id: menuItems.id,
          name: menuItems.name,
          description: menuItems.description,
          price: menuItems.price,
          imageUrl: menuItems.imageUrl,
          totalOrders: sql<number>`SUM(${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .groupBy(menuItems.id)
        .orderBy(desc(sql`SUM(${orderItems.quantity})`))
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
/*
const deleteImageFromImageKit = async (imageUrl: string): Promise<void> => {
  try {
    const fileId = getFileIdFromUrl(imageUrl);
    if (fileId) {
      await imagekit.deleteFile(fileId);
    }
  } catch (error) {
    console.error("ImageKit delete error:", error);
  }
};*/
/*
const getFileIdFromUrl = (url: string): string | null => {
  try {
    console.log(`[GET FILE ID] Processing URL: ${url}`);
    
    if (!url) return null;

    const urlObj = new URL(url);
    
    // สำหรับ ImageKit เราสามารถใช้ path โดยลบ / ออกหน้าแรก
    const filePath = urlObj.pathname.substring(1); // ลบ / ตัวแรกออก
    console.log(`[GET FILE ID] Using file path: ${filePath}`);
    
    return filePath; // '496kiwiBird/261497project/menu_1760188389383_water_3p7xrRMO7.png'
    
  } catch (error) {
    console.error("[GET FILE ID] Error:", error);
    return null;
  }
};*/
