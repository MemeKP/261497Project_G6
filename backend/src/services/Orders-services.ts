// import { db } from "src/db/client2.js";
import { dbClient as db } from "@db/client.js";
import { order_items, orders } from "db/schema.js";
import { eq } from "drizzle-orm";

// const allowedStatus = ["PENDING", "PREPARING", "COMPLETED", "CANCELLED"] as const;
const allowedStatus = ["PENDING", "PREPARING", "COMPLETED", "CANCELLED", "PAID"] as const;

export async function createOrder(dining_session_id: number, table_id: number) {
  const [newOrder] = await db
    .insert(orders)
    .values({ dining_session_id, table_id })
    .returning();
  return newOrder;
}

export async function createOrderWithItems(
  diningSessionId: number, 
  items: Array<{
    menuId: number;
    qty: number;
    note?: string;
    memberId: number;
  }>
) {
  // 1. สร้าง order
  const [newOrder] = await db
    .insert(orders)
    .values({ 
      dining_session_id: diningSessionId,
      table_id: diningSessionId, // ตอนนี้ดึงจาก dining session ไปก่อน
      status: 'PENDING'
    })
    .returning();

  // 2. สร้าง order items
  const orderItemsData = items.map(item => ({
    order_id: newOrder.id,
    menu_item_id: item.menuId,
    member_id: item.memberId,
    quantity: item.qty,
    note: item.note,
    status: 'PREPARING'
  }));

  const createdItems = await db
    .insert(order_items)
    .values(orderItemsData)
    .returning();

  return {
    ...newOrder,
    items: createdItems
  };
}


export async function getOrdersBySession(sessionId: number) {
  return await db
    .select()
    .from(orders)
    .where(eq(orders.dining_session_id, sessionId));
}


export async function updateOrderStatus(orderId: number, status: string) {
  if (!allowedStatus.includes(status as any)) {
    throw new Error("Invalid order status");
  }

  const [updated] = await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, orderId))
    .returning();

  return updated;
}

export async function getOrderById(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  return order || null;
}

export async function getAllOrders() {
  return await db.select().from(orders);
}

export async function deleteOrder(orderId: number) {
  const [deleted] = await db.delete(orders).where(eq(orders.id, orderId)).returning();
  return deleted || null;
}

