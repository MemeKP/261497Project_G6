import { dbClient } from "@db/client.js";
import { orderItems, orders } from "@db/schema.js";
import { sql } from "drizzle-orm";
import type { Request, Response } from "express";
import * as orderItemService from "src/services/OrderItems-services.js";

// export async function createOrderItem(req: Request, res: Response) {
//   try {
//     const { orderId, menuItemId, memberId, quantity, note } = req.body;

//     // Validation
//     if (!orderId || !menuItemId || !quantity) {
//       return res.status(400).json({ error: "orderId, menuItemId, and quantity are required" });
//     }
//     if ([orderId, menuItemId, memberId, quantity].some(v => isNaN(Number(v)))) {
//       return res.status(400).json({ error: "orderId, menuItemId, memberId, and quantity must be numbers" });
//     }
//     if (Number(quantity) < 1) {
//       return res.status(400).json({ error: "Quantity must be at least 1" });
//     }

//     const item = await orderItemService.addOrderItem(
//       Number(orderId),
//       Number(menuItemId),
//       Number(memberId),
//       Number(quantity),
//       note,
//     );

//     res.status(201).json(item);
//   } catch (err: any) {
//     if (err.message.includes("not found")) {
//       return res.status(404).json({ error: err.message });
//     }
//     res.status(500).json({ error: err.message });
//   }
// }
export const createOrderItem = async (req: Request, res: Response) => {
  try {
    const { orderId, menuItemId, memberId, quantity, note } = req.body;

    console.log('🔍 [BACKEND] createOrderItem received:', {
      orderId,
      menuItemId,
      memberId,
      quantity,
      note,
      memberIdType: typeof memberId,
      quantityType: typeof quantity 
    });

    // Validation
    if (!orderId || !menuItemId || !quantity) {
      return res.status(400).json({ 
        error: "orderId, menuItemId, and quantity are required" 
      });
    }

    const orderIdNum = Number(orderId);
    const menuItemIdNum = Number(menuItemId);
    const quantityNum = Number(quantity);

    if (isNaN(orderIdNum) || isNaN(menuItemIdNum) || isNaN(quantityNum)) {
      return res.status(400).json({ 
        error: "orderId, menuItemId, and quantity must be valid numbers" 
      });
    }

    if (quantityNum < 1) {
      return res.status(400).json({ 
        error: "Quantity must be at least 1" 
      });
    }
    const item = await orderItemService.addOrderItem(
      orderIdNum,
      menuItemIdNum,
      quantityNum, 
      note,
      memberId ? Number(memberId) : undefined
    );

    console.log('✅ [BACKEND] Order item created successfully:', item);
    res.status(201).json(item);

  } catch (err: any) {
    console.error('❌ [BACKEND] Error in createOrderItem:', err);
    
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};


export async function getOrderItems(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const numericOrderId = Number(orderId);

    if (isNaN(numericOrderId)) {
      return res.status(400).json({ error: "Invalid orderId" });
    }

    const items = await orderItemService.getOrderItemsByOrderId(numericOrderId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}


export async function updateOrderItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { quantity, note } = req.body;

    const itemId = Number(id);
    if (isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid item id" });
    }
    if (quantity !== undefined && Number(quantity) < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    const updated = await orderItemService.updateOrderItem(itemId, quantity, note);
    if (!updated) return res.status(404).json({ error: "Order item not found" });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * ใช้สำหรับหน้า Order Status
 */
export async function getOrderItemsBySession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const numericSessionId = Number(sessionId);
    if (isNaN(numericSessionId)) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    const items = await orderItemService.getOrderItemsBySession(numericSessionId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 *  อัพเดทสถานะของ order item
 */
export async function updateOrderItemStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const itemId = Number(id);
    if (isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid item id" });
    }

    const updated = await orderItemService.updateStatus(itemId, status);
    if (!updated) return res.status(404).json({ error: "Order item not found" });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteOrderItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const itemId = Number(id);

    if (isNaN(itemId)) {
      return res.status(400).json({ error: "Invalid item id" });
    }

    const deleted = await orderItemService.deleteOrderItem(itemId);
    if (!deleted) return res.status(404).json({ error: "Order item not found" });

    res.json({ message: "Deleted successfully" }); 
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

 export async function getCartItemCount(req: Request, res: Response) {
    try {
      const { orderId } = req.query;

      if (!orderId) {
        return res.status(400).json({ 
          success: false,
          message: 'Order ID is required' 
        });
      }
      const result = await dbClient
        .select({
          totalCount: sql<number>`sum(${orderItems.quantity})`
        })
        .from(orderItems)
        .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
        .where(sql`
          ${orders.id} = ${Number(orderId)} 
          AND ${orders.status} = 'PENDING'
        `);

      const count = result[0]?.totalCount || 0;

      res.status(200).json({
        success: true,
        count: Number(count)
      });

    } catch (error) {
      console.error('Error getting cart item count:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error' 
      });
    }
  }

/*
export async function getCartItemCount(req: Request, res: Response) {
  try {
    const { orderId } = req.query;

    if (!orderId || isNaN(Number(orderId))) {
      return res.status(400).json({ error: "Valid orderId is required" });
    }

    const count = await orderItemService.getOrderItemCount(Number(orderId));
   res.json({ count: Number(count) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}*/