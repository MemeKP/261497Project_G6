import type { Request, Response } from "express";
import * as orderService from "src/services/Orders-services.js";

// Allowed status values
const allowedStatus = ["PENDING", "PREPARING", "COMPLETED", "CANCELLED"] as const;

export async function createOrder(req: Request, res: Response) {
  try {
    const { diningSessionId, items } = req.body;

    if (!diningSessionId || isNaN(Number(diningSessionId))) {
      return res.status(400).json({ error: "Valid diningSessionId is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order items are required" });
    }

    // items ควรเป็น array ของ { menuId, qty, note? }
    for (const item of items) {
      if (!item.menuId || isNaN(Number(item.menuId))) {
        return res.status(400).json({ error: "Each item must have a valid menuId" });
      }
      if (!item.qty || isNaN(Number(item.qty)) || item.qty <= 0) {
        return res.status(400).json({ error: "Each item must have a valid qty > 0" });
      }
    }

    // ส่งไปให้ service จัดการสร้าง order + orderItems
    const order = await orderService.createOrderWithItems(
      Number(diningSessionId),
      items
    );

    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getOrders(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const numericSessionId = Number(sessionId);

    if (isNaN(numericSessionId)) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    const orders = await orderService.getOrdersBySession(numericSessionId);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const orderId = Number(id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    if (!allowedStatus.includes(status as any)) {
      return res
        .status(400)
        .json({ error: `Invalid status value. Allowed: ${allowedStatus.join(", ")}` });
    }

    const order = await orderService.updateOrderStatus(orderId, status);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const orderId = Number(id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAllOrders(req: Request, res: Response) {
  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const orderId = Number(id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const deleted = await orderService.deleteOrder(orderId);
    if (!deleted) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ message: "Order deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}


