// import { db } from "src/db/client2.js";
import { dbClient as db } from "@db/client.js";
import { group_members, menuItems, orderItems, orders } from "db/schema.js";
import { and, eq, inArray, ne } from "drizzle-orm";

// const allowedStatus = ["PENDING", "PREPARING", "COMPLETED", "CANCELLED"] as const;
const allowedStatus = ["PENDING", "PREPARING", "COMPLETED", "CANCELLED", "PAID"] as const;

export async function createOrder(diningSessionId: number, tableId: number) {
  const [newOrder] = await db
    .insert(orders)
    .values({ diningSessionId, tableId })
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
      diningSessionId: diningSessionId,
      tableId: diningSessionId, // ตอนนี้ดึงจาก dining session ไปก่อน
      status: 'PENDING'
    })
    .returning();

  // 2. สร้าง order items
  const orderItemsData = items.map(item => ({
    orderId: newOrder.id,
    menuItemId: item.menuId,
    memberId: item.memberId,
    quantity: item.qty,
    note: item.note,
    status: 'PREPARING'
  }));

  const createdItems = await db
    .insert(orderItems)
    .values(orderItemsData)
    .returning();

  return {
    ...newOrder,
    items: createdItems
  };
}


/**
 * ✅ ดึง orders ทั้งหมดของ session พร้อม items
 */
export async function getOrdersBySession(sessionId: number) {
  const ordersData = await db
    .select()
    .from(orders)
    .where(and(eq(orders.diningSessionId, sessionId), ne(orders.status, "DRAFT")));


  if (ordersData.length === 0) return [];

  const orderIds = ordersData.map((o) => o.id);

  const itemsData = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      quantity: orderItems.quantity,
      note: orderItems.note,
      status: orderItems.status,
      menuItemId: orderItems.menuItemId,
      menuName: menuItems.name,
      menuPrice: menuItems.price,
      memberName: group_members.name,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .leftJoin(group_members, eq(orderItems.memberId, group_members.id))
    .where(inArray(orderItems.orderId, orderIds));

  return ordersData.map((order) => ({
    ...order,
    items: itemsData.filter((i) => i.orderId === order.id),
  }));
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
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) return null;

  const items = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      quantity: orderItems.quantity,
      note: orderItems.note,
      menuItemId: orderItems.menuItemId,
      menuName: menuItems.name,
      menuPrice: menuItems.price,
      memberName: members.name,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));

  return { ...order, items };
}

/**
 * ดึง Orders ทั้งหมด 
 */
export async function getAllOrders() {
  const ordersData = await db.select().from(orders);
  if (ordersData.length === 0) return [];

  const orderIds = ordersData.map((o) => o.id);
  const itemsData = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  return ordersData.map((order) => ({
    ...order,
    items: itemsData.filter((i) => i.orderId === order.id),
  }));
}

/**
 * ลบ Order
 */
export async function deleteOrder(orderId: number) {
  const [deleted] = await db.delete(orders).where(eq(orders.id, orderId)).returning();
  return deleted || null;
}

