import { type Request, type Response, type NextFunction } from "express";
import QRCode from "qrcode";
import express from "express";
import "dotenv/config";
import ImageKit from "imagekit";
import { eq, and, isNotNull } from "drizzle-orm";
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
    const matches = url.match(/\/([^\/]+)_([a-zA-Z0-9]+)\.[^.]+$/);
    return matches ? matches[2] : null;
  } catch (error) {
    console.error("Error extracting fileId:", error);
    return null;
  }
};

const uploadImageToImagekit = async (file: Express.Multer.File) => {
  try {
    const result = await imagekit.upload({
        file: file.buffer.toString('base64'),
        fileName: `menu_${Date.now()}_${file.originalname}`,
        folder: '/menu-items'
    })

    return{
        url: result.url,
        fileId: result.fileId,
    }
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
        console.error('ImageKit delete error:', error);
    }
};

export const uploadAuth = async (req: Request, res: Response) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
};

export const getMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // get by id
    const { id } = req.params;
    const item = await dbClient.query.menuItems.findFirst({
      where: eq(menuItems.id, parseInt(id)),
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        error: "menu not found",
      });
    }
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("[BACKEND MENUCON]Error fetching menu item:", error);
    next(error);
  }
};

export const getMenus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const menus = await dbClient.query.menuItems.findMany();
    res.json({
      success: true,
      data: menus,
    });
  } catch (error) {
    console.error("[BACKEND MENUCON]Error fetching all menu items:", error);
    next(error);
  }
};

export const deleteMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Get menu item to access image URL
        const existingItem = await dbClient.query.menuItems.findFirst({
            where: eq(menuItems.id, parseInt(id)),
        });

        if (!existingItem) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found',
            });
        }

        // Delete image from ImageKit if exists
        if (existingItem.imageUrl) {
            await deleteImageFromImageKit(existingItem.imageUrl);
        }

        // Delete from database
        await dbClient
            .delete(menuItems)
            .where(eq(menuItems.id, parseInt(id)));

        res.json({
            success: true,
            message: 'Menu item deleted successfully',
        });
    } catch (error) {
        console.error('[BACKEND MENUCON] Error deleting menu item:', error);
        next(error);
    }
};

export const createMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { 
            name, 
            price, 
            description, 
            category, 
            isSignature,
            isAvailable,
            createdByAdminId 
        } = req.body;

        // Validate required fields
        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                error: 'Name, price, and category are required.',
            });
        }

        let imageUrl: string | null = null;

        // Handle image upload if file is present
        if (req.file) {
            const uploadResult = await uploadImageToImagekit(req.file);
            imageUrl = uploadResult.url;
        }

        // Insert into database
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
        console.error('[BACKEND MENUCON] Error creating menu item:', error);
        next(error);
    }
};

export const updateMenu = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { 
            name, 
            price, 
            description, 
            category, 
            isSignature,
            isAvailable,
            updatedByAdminId 
        } = req.body;

        // Check if menu item exists
        const existingItem = await dbClient.query.menuItems.findFirst({
            where: eq(menuItems.id, parseInt(id)),
        });

        if (!existingItem) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found',
            });
        }

        let imageUrl = existingItem.imageUrl;

        // Handle new image upload
        if (req.file) {
            // Delete old image if exists
            if (existingItem.imageUrl) {
                await deleteImageFromImageKit(existingItem.imageUrl);
            }

            // Upload new image
            const uploadResult = await uploadImageToImagekit(req.file);
            imageUrl = uploadResult.url;
        }

        // Update database
        const [updatedItem] = await dbClient
            .update(menuItems)
            .set({
                name: name || existingItem.name,
                price: price || existingItem.price,
                description: description !== undefined ? description : existingItem.description,
                imageUrl,
                category: category || existingItem.category,
                isSignature: isSignature !== undefined ? isSignature : existingItem.isSignature,
                isAvailable: isAvailable !== undefined ? isAvailable : existingItem.isAvailable,
                updatedByAdminId: updatedByAdminId ? parseInt(updatedByAdminId) : existingItem.updatedByAdminId,
                updatedAt: new Date(),
            })
            .where(eq(menuItems.id, parseInt(id)))
            .returning();

        res.json({
            success: true,
            data: updatedItem,
        });
    } catch (error) {
        console.error('[BACKEND MENUCON] Error updating menu item:', error);
        next(error);
    }
};