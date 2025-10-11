import type { NextFunction, Request, Response } from "express";
import * as orderService from "src/services/Orders-services.js";
import QRCode from "qrcode";
import express from "express";
import "dotenv/config";
import { eq, and, isNotNull } from "drizzle-orm";
import { dbClient } from "@db/client.js";
import {
  users,
  admins,
  diningSessions,
  groups,
  group_members,
  menuItems,
  orders,
 orderItems,
} from "@db/schema.js";

/**
 * Allowed order status (ครบทุกสถานะในระบบ)
 * - DRAFT: ยังไม่ checkout
 * - PENDING: สั่งแล้ว รอร้านรับ
 * - PREPARING: ร้านกำลังทำ
 * - COMPLETED: ทำเสร็จแล้ว
 * - PAID: จ่ายเงินแล้ว
 * - CLOSED: ปิด order / ปิด session
 */
const allowedStatus = [
  "DRAFT",
  "PENDING",
  "PREPARING",
  "COMPLETED",
  "PAID",
  "CLOSED",
] as const;


// Allowed status values
// const allowedStatus = ["PENDING", "PREPARING", "READY_TO_SERVE", "CANCELLED", "COMPLETE"] as const;

export async function createOrder(req: Request, res: Response) {
  try {
    const { diningSessionId, items } = req.body;

    if (!diningSessionId || isNaN(Number(diningSessionId))) {
      return res.status(400).json({ error: "Valid diningSessionId is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order items are required" });
    }

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

export async function createNewOrder(req: Request, res: Response) {
  try {
    const { diningSessionId, tableId, closePreviousOrderId } = req.body;

    if (!diningSessionId || isNaN(Number(diningSessionId))) {
      return res.status(400).json({ error: "Valid diningSessionId is required" });
    }

    if (closePreviousOrderId) {
      await orderService.updateOrderStatus(Number(closePreviousOrderId), "CLOSED");
    }

    const order = await orderService.createOrder(
      Number(diningSessionId),
      Number(tableId) || 1
    );

    res.status(201).json(order);
  } catch (err: any) {
    console.error("Error creating empty order:", err);
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

/**
 * Checkout: เปลี่ยนจาก DRAFT → PENDING
 */
export async function checkoutOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const orderId = Number(id);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await orderService.checkoutOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order checked out successfully", order });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDraftOrder(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const numericSessionId = Number(sessionId);

    if (isNaN(numericSessionId)) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    const order = await orderService.getDraftOrderBySession(numericSessionId);

    if (!order) {
      return res.json({
        success: true,
        message: "No draft order yet",
        order: null,
        items: [],
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (err: any) {
    console.error("Error fetching draft order:", err);
    return res.status(500).json({ error: err.message });
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

// ADMIN
export const getOrderAdmin = async (req:Request, res:Response, next:NextFunction) => {
    try {
      const {
        status,
        tableId,
        diningSessionId,
        limit = 50,
        offset = 0,
      } = req.query;
  
      let orderWhereConditions: any[] = [];
  
      if (status && typeof status === "string") {
        orderWhereConditions.push(eq(orders.status, status as any));
      }
  
      if (tableId && !isNaN(Number(tableId))) {
        orderWhereConditions.push(eq(orders.tableId, Number(tableId)));
      }
  
      if (diningSessionId && !isNaN(Number(diningSessionId))) {
        orderWhereConditions.push(
          eq(orders.diningSessionId, Number(diningSessionId))
        );
        orderWhereConditions.push(isNotNull(orders.diningSessionId));
      }
  
      const allOrders = await dbClient.query.orders.findMany({
        where:
          orderWhereConditions.length > 0
            ? and(...orderWhereConditions)
            : undefined,
        orderBy: [orders.createdAt],
        limit: Number(limit),
        offset: Number(offset),
      });
  
      const ordersWithItems = await Promise.all(
        allOrders.map(async (order) => {
          const items = await dbClient.query.orderItems.findMany({
            where: eq(orderItems.orderId, order.id),
          });
  
          let groupInfo = null;
          if (order.groupId) {
            const group = await dbClient.query.groups.findFirst({
              where: eq(groups.id, order.groupId),
            });
            if (group) {
              const members = await dbClient.query.group_members.findMany({
                where: eq(group_members.groupId, group.id),
              });
              groupInfo = {
                id: group.id,
                tableId: group.tableId,
                memberCount: members?.length || 0,
              };
            }
          }
  
          let diningSession = null;
          if (order.diningSessionId) {
            diningSession = await dbClient.query.diningSessions.findFirst({
              where: eq(diningSessions.id, order.diningSessionId),
            });
          }
  
          return {
            id: order.id,
            tableId: order.tableId,
            groupId: order.groupId,
            userId: order.userId,
            diningSessionId: order.diningSessionId,
            status: order.status,
            createdAt: order.createdAt,
            items:
              items?.map((item) => ({
                id: item.id,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                note: item.note,
              })) || [],
            group: groupInfo,
            diningSession: diningSession
              ? {
                  id: diningSession.id,
                  status: diningSession.status,
                  startedAt: diningSession.startedAt,
                  endedAt: diningSession.endedAt,
                }
              : null,
          };
        })
      );
  
      const totalOrders = await dbClient.query.orders.findMany({
        where:
          orderWhereConditions.length > 0
            ? and(...orderWhereConditions)
            : undefined,
      });
  
      const statusCounts: { [key: string]: number } = {
        PENDING: 0,
        PREPARING: 0,
        SERVED: 0,
        COMPLETED: 0,
      };
  
      ordersWithItems.forEach((order) => {
        const status = order.status;
        if (status && statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++;
        }
      });
  
      res.json({
        orders: ordersWithItems,
        statistics: {
          totalOrders: ordersWithItems.length,
          statusCounts,
          totalItems: ordersWithItems.reduce(
            (sum, order) =>
              sum +
              order.items.reduce(
                (itemSum, item) => itemSum + (item.quantity || 0),
                0
              ),
            0
          ),
        },
      });
    } catch (err) {
      console.error("Error in /orders:", err);
      next(err);
    }
}

export const getOrderByIdAdmin = async (req:Request, res:Response, next:NextFunction) => {
  try {
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({
        error: "Invalid Order ID",
      });
    }

    const order = await dbClient.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const items = await dbClient.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
    });

    let groupInfo = null;
    if (order.groupId) {
      const group = await dbClient.query.groups.findFirst({
        where: eq(groups.id, order.groupId),
      });
      if (group) {
        const members = await dbClient.query.group_members.findMany({
          where: eq(group_members.groupId, group.id),
        });
        groupInfo = {
          id: group.id,
          tableId: group.tableId,
          creatorUserId: group.creatorUserId,
          createdAt: group.createdAt,
          members:
            members?.map((member) => ({
              id: member.id,
              name: member.name,
              userId: member.userId,
              note: member.note,
            })) || [],
        };
      }
    }

    let diningSession = null;
    if (order.diningSessionId) {
      diningSession = await dbClient.query.diningSessions.findFirst({
        where: eq(diningSessions.id, order.diningSessionId),
      });
    }

    let userInfo = null;
    if (order.userId) {
      const user = await dbClient.query.users.findFirst({
        where: eq(users.id, order.userId),
        columns: {
          id: true,
          name: true,
          email: true,
        },
      });
      userInfo = user;
    }

    res.json({
      order: {
        id: order.id,
        tableId: order.tableId,
        groupId: order.groupId,
        userId: order.userId,
        diningSessionId: order.diningSessionId,
        status: order.status,
        createdAt: order.createdAt,
        items:
          items?.map((item) => ({
            id: item.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            note: item.note,
          })) || [],
        group: groupInfo,
        user: userInfo,
        diningSession: diningSession
          ? {
              id: diningSession.id,
              tableId: diningSession.tableId,
              status: diningSession.status,
              startedAt: diningSession.startedAt,
              endedAt: diningSession.endedAt,
              totalCustomers: diningSession.totalCustomers,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("Error in /orders/:orderId:", err);
    next(err);
  }
}

export const updateOrderStatusByAdmin = async (req:Request, res:Response, next:NextFunction) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;

    if (isNaN(orderId)) {
      return res.status(400).json({
        error: "Invalid Order ID",
      });
    }

    const validStatuses = ["PENDING", "PREPARING", "SERVED", "COMPLETED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    const existingOrder = await dbClient.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const updatedOrder = await dbClient
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning({
        id: orders.id,
        table_id: orders.tableId,
        groupId: orders.groupId,
        userId: orders.userId,
        diningSessionId: orders.diningSessionId,
        status: orders.status,
        createdAt: orders.createdAt,
      });

    res.json({
      message: `Order ${orderId} status updated to ${status}`,
      order: {
        id: updatedOrder[0].id,
        tableId: updatedOrder[0].table_id,
        groupId: updatedOrder[0].groupId,
        userId: updatedOrder[0].userId,
        diningSessionId: updatedOrder[0].diningSessionId,
        status: updatedOrder[0].status,
        createdAt: updatedOrder[0].createdAt,
      },
    });
  } catch (err) {
    console.error("Error in /orders/:orderId/status:", err);
    next(err);
  }
}

export async function closeOrdersBySession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const numericSessionId = Number(sessionId);

    if (isNaN(numericSessionId)) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    const updated = await dbClient
      .update(orders)
      .set({ status: "CLOSED" })
      .where(eq(orders.diningSessionId, numericSessionId))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "No orders found for this session" });
    }

    res.json({ message: "All orders in this session have been closed.", updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
