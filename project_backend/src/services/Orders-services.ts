
import { db } from "src/db/client.js";
import { orders, orderItems } from "src/db/schema.js";
import { eq, inArray } from "drizzle-orm";

const allowedStatus = ["PENDING", "PREPARING", "COMPLETED", "CANCELLED"] as const;

/**
 * สร้าง Order พร้อม Items (ใช้ตอน Checkout)
 */
export async function createOrderWithItems(
  diningSessionId: number,
  items: { menuId: number; memberId: number; qty: number; note?: string }[]
) {
  // 1. create order
  const [newOrder] = await db
    .insert(orders)
    .values({ diningSessionId })
    .returning();

  // 2. insert order items
  const insertedItems = [];
  for (const item of items) {
    const [inserted] = await db
      .insert(orderItems)
      .values({
        orderId: newOrder.id,
        menuItemId: item.menuId,   
        memberId: item.memberId,
        quantity: item.qty,
        note: item.note || null,
      })
      .returning();
    insertedItems.push(inserted);
  }

  // 3. return order + items
  return { ...newOrder, items: insertedItems };
}

/**
 * สร้าง Order ว่าง ๆ (ไม่ควรใช้แล้ว แต่เก็บไว้เผื่อ admin/debug)
 */
export async function createOrder(diningSessionId: number) {
  const [newOrder] = await db
    .insert(orders)
    .values({ diningSessionId })
    .returning();
  return newOrder;
}

/**
 * ดึง Orders ทั้งหมดของ Session พร้อม Items
 */
export async function getOrdersBySession(sessionId: number) {
  // ดึง orders ของ session
  const ordersData = await db
    .select()
    .from(orders)
    .where(eq(orders.diningSessionId, sessionId));

  if (ordersData.length === 0) return [];

  // ดึง items ของทุก order ใน session
  const orderIds = ordersData.map((o) => o.id);
  const itemsData = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  // group items by orderId
  return ordersData.map((order) => ({
    ...order,
    items: itemsData.filter((i) => i.orderId === order.id),
  }));
}


/**
 * อัปเดตสถานะของ Order
 */
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

/**
 * ดึง Order ตาม ID พร้อม Items
 */
export async function getOrderById(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { ...order, items };
}

/**
 * ดึง Orders ทั้งหมด (admin/debug)
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
