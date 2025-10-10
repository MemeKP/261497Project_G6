// import type { NextFunction, Request, Response } from "express";
// import * as orderService from "src/services/Orders-services.js";
// import "dotenv/config";
// import { eq, and, isNotNull } from "drizzle-orm";
// import { dbClient } from "@db/client.js";
// import {
//   users,
//   admins,
//   diningSessions,
//   groups,
//   group_members,
//   menuItems,
//   orders,
//  order_items,
// } from "@db/schema.js";

// // Allowed status values
// const allowedStatus = ["DRAFT","PENDING", "CLOSED"] as const;

// export async function createOrder(req: Request, res: Response) {
//   try {
//     const { diningSessionId, items } = req.body;

//     if (!diningSessionId || isNaN(Number(diningSessionId))) {
//       return res.status(400).json({ error: "Valid diningSessionId is required" });
//     }

//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ error: "Order items are required" });
//     }

//     for (const item of items) {
//       if (!item.menuId || isNaN(Number(item.menuId))) {
//         return res.status(400).json({ error: "Each item must have a valid menuId" });
//       }
//       if (!item.qty || isNaN(Number(item.qty)) || item.qty <= 0) {
//         return res.status(400).json({ error: "Each item must have a valid qty > 0" });
//       }
//     }

//     // ส่งไปให้ service จัดการสร้าง order + orderItems
//     const order = await orderService.createOrderWithItems(
//       Number(diningSessionId),
//       Number(req.body.tableId),
//       items
//     );

//     res.status(201).json(order);
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// }

// // ✅ สำหรับปุ่ม New Order (ไม่มีเมนู)
// export async function createNewOrder(req: Request, res: Response) {
//   try {
//     const { diningSessionId, tableId } = req.body;

//     if (!diningSessionId || isNaN(Number(diningSessionId))) {
//       return res.status(400).json({ error: "Valid diningSessionId is required" });
//     }

//     // เรียก service ตัวที่มีอยู่แล้ว (createOrder)
//     const order = await orderService.createOrder(
//       Number(diningSessionId),
//       Number(tableId) || 1 
//     );

//     res.status(201).json(order);
//   } catch (err: any) {
//     console.error("Error creating empty order:", err);
//     res.status(500).json({ error: err.message });
//   }
// }


// export async function getOrders(req: Request, res: Response) {
//   try {
//     const { sessionId } = req.params;
//     const numericSessionId = Number(sessionId);

//     if (isNaN(numericSessionId)) {
//       return res.status(400).json({ error: "Invalid sessionId" });
//     }

//     const orders = await orderService.getOrdersBySession(numericSessionId);
//     res.json(orders);
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// }

// export async function updateOrderStatus(req: Request, res: Response) {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const orderId = Number(id);
//     if (isNaN(orderId)) {
//       return res.status(400).json({ error: "Invalid order id" });
//     }

//     if (!status) {
//       return res.status(400).json({ error: "status is required" });
//     }

//     if (!allowedStatus.includes(status as any)) {
//       return res
//         .status(400)
//         .json({ error: `Invalid status value. Allowed: ${allowedStatus.join(", ")}` });
//     }

//     const order = await orderService.updateOrderStatus(orderId, status);
//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     res.json(order);
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// }

// export async function getOrderById(req: Request, res: Response) {
//   try {
//     const { id } = req.params;
//     const orderId = Number(id);
//     if (isNaN(orderId)) {
//       return res.status(400).json({ error: "Invalid order id" });
//     }

//     const order = await orderService.getOrderById(orderId);
//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }
//     res.json(order);
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// }

// export async function getAllOrders(req: Request, res: Response) {
//   try {
//     const orders = await orderService.getAllOrders();
//     res.json(orders);
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// }

// export async function deleteOrder(req: Request, res: Response) {
//   try {
//     const { id } = req.params;
//     const orderId = Number(id);
//     if (isNaN(orderId)) {
//       return res.status(400).json({ error: "Invalid order id" });
//     }

//     const deleted = await orderService.deleteOrder(orderId);
//     if (!deleted) {
//       return res.status(404).json({ error: "Order not found" });
//     }
//     res.json({ message: "Order deleted" });
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// }

// // ADMIN
// export const getOrderAdmin = async (req:Request, res:Response, next:NextFunction) => {
//     try {
//       const {
//         status,
//         tableId,
//         diningSessionId,
//         limit = 50,
//         offset = 0,
//       } = req.query;
  
//       let orderWhereConditions: any[] = [];
  
//       if (status && typeof status === "string") {
//         orderWhereConditions.push(eq(orders.status, status as any));
//       }
  
//       if (tableId && !isNaN(Number(tableId))) {
//         orderWhereConditions.push(eq(orders.table_id, Number(tableId)));
//       }
  
//       if (diningSessionId && !isNaN(Number(diningSessionId))) {
//         orderWhereConditions.push(
//           eq(orders.dining_session_id, Number(diningSessionId))
//         );
//         orderWhereConditions.push(isNotNull(orders.dining_session_id));
//       }
  
//       const allOrders = await dbClient.query.orders.findMany({
//         where:
//           orderWhereConditions.length > 0
//             ? and(...orderWhereConditions)
//             : undefined,
//         orderBy: [orders.created_at],
//         limit: Number(limit),
//         offset: Number(offset),
//       });
  
//       const ordersWithItems = await Promise.all(
//         allOrders.map(async (order) => {
//           const items = await dbClient.query.order_items.findMany({
//             where: eq(order_items.order_id, order.id),
//           });
  
//           let groupInfo = null;
//           if (order.group_id) {
//             const group = await dbClient.query.groups.findFirst({
//               where: eq(groups.id, order.group_id),
//             });
//             if (group) {
//               const members = await dbClient.query.group_members.findMany({
//                 where: eq(group_members.group_id, group.id),
//               });
//               groupInfo = {
//                 id: group.id,
//                 tableId: group.table_id,
//                 memberCount: members?.length || 0,
//               };
//             }
//           }
  
//           let diningSession = null;
//           if (order.dining_session_id) {
//             diningSession = await dbClient.query.diningSessions.findFirst({
//               where: eq(diningSessions.id, order.dining_session_id),
//             });
//           }
  
//           return {
//             id: order.id,
//             tableId: order.table_id,
//             groupId: order.group_id,
//             userId: order.user_id,
//             diningSessionId: order.dining_session_id,
//             status: order.status,
//             createdAt: order.created_at,
//             items:
//               items?.map((item) => ({
//                 id: item.id,
//                 menuItemId: item.menu_item_id,
//                 quantity: item.quantity,
//                 note: item.note,
//               })) || [],
//             group: groupInfo,
//             diningSession: diningSession
//               ? {
//                   id: diningSession.id,
//                   status: diningSession.status,
//                   startedAt: diningSession.startedAt,
//                   endedAt: diningSession.endedAt,
//                 }
//               : null,
//           };
//         })
//       );
  
//       const totalOrders = await dbClient.query.orders.findMany({
//         where:
//           orderWhereConditions.length > 0
//             ? and(...orderWhereConditions)
//             : undefined,
//       });
  
//       const statusCounts: { [key: string]: number } = {
//         PENDING: 0,
//         PREPARING: 0,
//         SERVED: 0,
//         COMPLETED: 0,
//       };
  
//       ordersWithItems.forEach((order) => {
//         const status = order.status;
//         if (status && statusCounts.hasOwnProperty(status)) {
//           statusCounts[status]++;
//         }
//       });
  
//       res.json({
//         orders: ordersWithItems,
//         statistics: {
//           totalOrders: ordersWithItems.length,
//           statusCounts,
//           totalItems: ordersWithItems.reduce(
//             (sum, order) =>
//               sum +
//               order.items.reduce(
//                 (itemSum, item) => itemSum + (item.quantity || 0),
//                 0
//               ),
//             0
//           ),
//         },
//       });
//     } catch (err) {
//       console.error("Error in /orders:", err);
//       next(err);
//     }
// }

// export const getOrderByIdAdmin = async (req:Request, res:Response, next:NextFunction) => {
//   try {
//     const orderId = parseInt(req.params.orderId);

//     if (isNaN(orderId)) {
//       return res.status(400).json({
//         error: "Invalid Order ID",
//       });
//     }

//     const order = await dbClient.query.orders.findFirst({
//       where: eq(orders.id, orderId),
//     });

//     if (!order) {
//       return res.status(404).json({
//         error: "Order not found",
//       });
//     }

//     const items = await dbClient.query.order_items.findMany({
//       where: eq(order_items.order_id, orderId),
//     });

//     let groupInfo = null;
//     if (order.group_id) {
//       const group = await dbClient.query.groups.findFirst({
//         where: eq(groups.id, order.group_id),
//       });
//       if (group) {
//         const members = await dbClient.query.group_members.findMany({
//           where: eq(group_members.group_id, group.id),
//         });
//         groupInfo = {
//           id: group.id,
//           tableId: group.table_id,
//           creatorUserId: group.creator_user_id,
//           createdAt: group.created_at,
//           members:
//             members?.map((member) => ({
//               id: member.id,
//               name: member.name,
//               userId: member.user_id,
//               note: member.note,
//             })) || [],
//         };
//       }
//     }

//     let diningSession = null;
//     if (order.dining_session_id) {
//       diningSession = await dbClient.query.diningSessions.findFirst({
//         where: eq(diningSessions.id, order.dining_session_id),
//       });
//     }

//     let userInfo = null;
//     if (order.user_id) {
//       const user = await dbClient.query.users.findFirst({
//         where: eq(users.id, order.user_id),
//         columns: {
//           id: true,
//           name: true,
//     },
//       });
//       userInfo = user;
//     }

//     res.json({
//       order: {
//         id: order.id,
//         tableId: order.table_id,
//         groupId: order.group_id,
//         userId: order.user_id,
//         diningSessionId: order.dining_session_id,
//         status: order.status,
//         createdAt: order.created_at,
//         items:
//           items?.map((item) => ({
//             id: item.id,
//             menuItemId: item.menu_item_id,
//             quantity: item.quantity,
//             note: item.note,
//           })) || [],
//         group: groupInfo,
//         user: userInfo,
//         diningSession: diningSession
//           ? {
//               id: diningSession.id,
//               tableId: diningSession.tableId,
//               status: diningSession.status,
//               startedAt: diningSession.startedAt,
//               endedAt: diningSession.endedAt,
//               totalCustomers: diningSession.total_customers,
//             }
//           : null,
//       },
//     });
//   } catch (err) {
//     console.error("Error in /orders/:orderId:", err);
//     next(err);
//   }
// }

// export const updateOrderStatusByAdmin = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const orderId = parseInt(req.params.orderId);
//     const { status } = req.body;

//     if (isNaN(orderId)) {
//       return res.status(400).json({ error: "Invalid Order ID" });
//     }

//     const validStatuses = ["PENDING", "CLOSED"];
//     if (!status || !validStatuses.includes(status)) {
//       return res.status(400).json({
//         error: "Invalid status. Must be one of: " + validStatuses.join(", "),
//       });
//     }

//     const existingOrder = await dbClient.query.orders.findFirst({
//       where: eq(orders.id, orderId),
//     });

//     if (!existingOrder) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     const [updatedOrder] = await dbClient
//       .update(orders)
//       .set({ status })
//       .where(eq(orders.id, orderId))
//       .returning({
//         id: orders.id,
//         table_id: orders.table_id,
//         group_id: orders.group_id,
//         user_id: orders.user_id,
//         dining_session_id: orders.dining_session_id,
//         status: orders.status,
//         created_at: orders.created_at,
//       });

//     res.json({
//       message: `Order ${orderId} status updated to ${status}`,
//       order: {
//         id: updatedOrder.id,
//         tableId: updatedOrder.table_id,
//         groupId: updatedOrder.group_id,
//         userId: updatedOrder.user_id,
//         diningSessionId: updatedOrder.dining_session_id,
//         status: updatedOrder.status,
//         createdAt: updatedOrder.created_at,
//       },
//     });
//   } catch (err) {
//     console.error("Error in /orders/:orderId/status:", err);
//     next(err);
//   }
// };

// export async function closeOrdersBySession(req: Request, res: Response) {
//   try {
//     const { sessionId } = req.params;
//     const numericSessionId = Number(sessionId);

//     if (isNaN(numericSessionId)) {
//       return res.status(400).json({ error: "Invalid sessionId" });
//     }

//     const updated = await dbClient
//       .update(orders)
//       .set({ status: "CLOSED" })
//       .where(eq(orders.dining_session_id, numericSessionId))
//       .returning();

//     if (updated.length === 0) {
//       return res.status(404).json({ error: "No orders found for this session" });
//     }

//     res.json({ message: "All orders in this session have been closed.", updated });
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// }

// export async function checkoutOrder(req: Request, res: Response) {
//   try {
//     const { id } = req.params;
//     const orderId = Number(id);
//     if (isNaN(orderId)) {
//       return res.status(400).json({ error: "Invalid order ID" });
//     }

//     const order = await orderService.checkoutOrder(orderId);
//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     res.json({ message: "Order checked out successfully", order });
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// }


import type { NextFunction, Request, Response } from "express";
import * as orderService from "src/services/Orders-services.js";
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
  order_items,
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

/**
 * ✅ Create order พร้อมรายการเมนู
 */
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

    // ✅ ส่งไปให้ service สร้าง order + items (สถานะเริ่มต้น = DRAFT)
    const order = await orderService.createOrderWithItems(
      Number(diningSessionId),
      Number(req.body.tableId),
      items
    );

    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * สำหรับสร้าง Order เปล่า (New Order)
 * ใช้ในหน้าลูกค้าหลัง Checkout order เก่าไปแล้ว
 * → จะไม่กระทบ order เดิมแม้ admin เปลี่ยนสถานะภายหลัง
 */
export async function createNewOrder(req: Request, res: Response) {
  try {
    const { diningSessionId, tableId, closePreviousOrderId } = req.body;

    if (!diningSessionId || isNaN(Number(diningSessionId))) {
      return res.status(400).json({ error: "Valid diningSessionId is required" });
    }

    // ถ้ามี order เก่าระบุมา → ปิดสถานะเก่าก่อน
    if (closePreviousOrderId) {
      await orderService.updateOrderStatus(Number(closePreviousOrderId), "CLOSED");
    }

    // สร้าง order ใหม่สถานะ DRAFT
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

/**
 *  ดึง orders ทั้งหมดของ session (ใช้ในหน้า Order Status)
 */
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

/**
 *  เปลี่ยนสถานะ order (ใช้ตอน admin ปรับสถานะ)
 */
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

/**
 *  ดึง order เดี่ยวตาม id
 */
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

/**
 *  ดึงทุก order ทั้งระบบ (สำหรับ admin/debug)
 */
export async function getAllOrders(req: Request, res: Response) {
  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Delete Order
 */
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

/**
 * ปิด orders ทั้ง session (ใช้ตอน session จบ)
 */
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
      .where(eq(orders.dining_session_id, numericSessionId))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "No orders found for this session" });
    }

    res.json({ message: "All orders in this session have been closed.", updated });
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




// export async function getDraftOrder(req: Request, res: Response) {
//   try {
//     const { sessionId } = req.params;
//     const numericSessionId = Number(sessionId);
//     if (isNaN(numericSessionId)) {
//       return res.status(400).json({ error: "Invalid sessionId" });
//     }

//     const order = await orderService.getDraftOrderBySession(numericSessionId);
//     if (!order) {
//       return res.status(404).json({ message: "No draft order found" });
//     }

//     res.json(order);
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// }
