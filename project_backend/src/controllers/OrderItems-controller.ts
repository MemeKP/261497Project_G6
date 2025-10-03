import type { Request, Response } from "express";
import * as orderItemService from "src/services/OrderItems-services.js";

export async function createOrderItem(req: Request, res: Response) {
  try {
    const { orderId, menuItemId, memberId, quantity, note } = req.body;

    // Validation
    if (!orderId || !menuItemId || !memberId || !quantity) {
      return res.status(400).json({ error: "orderId, menuItemId, memberId, and quantity are required" });
    }
    if ([orderId, menuItemId, memberId, quantity].some(v => isNaN(Number(v)))) {
      return res.status(400).json({ error: "orderId, menuItemId, memberId, and quantity must be numbers" });
    }
    if (Number(quantity) < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    const item = await orderItemService.addOrderItem(
      Number(orderId),
      Number(menuItemId),
      Number(memberId),
      Number(quantity),
      note
    );

    res.status(201).json(item);
  } catch (err: any) {
    if (err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}

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