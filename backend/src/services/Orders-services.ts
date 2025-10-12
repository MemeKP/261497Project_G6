import { dbClient as db } from "@db/client.js";
import { orderItems, orders, menuItems, group_members } from "db/schema.js";
import { ne, eq, and, inArray, desc } from "drizzle-orm";

/**
 * Allowed order statuses
 * เพิ่มสถานะทั้งหมดที่ใช้ใน flow จริง
 */
const allowedStatus = [
  "DRAFT", 
  "PENDING",
  "PREPARING",  
  "COMPLETED",  
  "PAID",       
  "CLOSED"      
] as const;

/**
 * create order (button new ordr)
 */
export async function createOrder(diningSessionId: number, tableId: number) {
  const [newOrder] = await db
    .insert(orders)
    .values({
      diningSessionId,
      tableId,
      status: "DRAFT", // no checkout
    })
    .returning();
  return newOrder;
}

/**
 * create order + items (add to cart)
 */
export async function createOrderWithItems(
  diningSessionId: number,
  tableId: number,
  items: Array<{
    menuId: number;
    qty: number;
    note?: string;
    memberId: number;
  }>
) {
  // check existing DRAFT order
  let [existingOrder] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.diningSessionId, diningSessionId),
        eq(orders.status, "DRAFT")
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(1);

  // newOrder
  if (!existingOrder) {
    const [newOrder] = await db
      .insert(orders)
      .values({
        diningSessionId: diningSessionId,
        tableId: tableId || 1,
        status: "DRAFT",
      })
      .returning();

    existingOrder = newOrder;
  }
  //add order items
  const orderItemsData = items.map((item) => ({
    orderId: existingOrder.id,
    menuItemId: item.menuId,
    memberId: item.memberId,
    quantity: item.qty,
    note: item.note || "",
    status: "PREPARING",
  }));

  const createdItems = await db
    .insert(orderItems)
    .values(orderItemsData)
    .returning();

  return {
    ...existingOrder,
    newItems: createdItems,
  };
}

/**
 * order all session
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
      menuImage: menuItems.imageUrl,
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

/**
 * order 
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
 * Checkout order: DRAFT → PENDING
 */
export async function checkoutOrder(orderId: number) {
  const [updated] = await db
    .update(orders)
    .set({ status: "PENDING" })
    .where(eq(orders.id, orderId))
    .returning();

  return updated;
}

/**
 * for admin
 */
export async function getOrderById(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  return order || null;
}

export async function getAllOrders() {
  return await db.select().from(orders);
}

export async function deleteOrder(orderId: number) {
  const [deleted] = await db
    .delete(orders)
    .where(eq(orders.id, orderId))
    .returning();
  return deleted || null;
}

// CartPage — DRAFT orders
export async function getDraftOrderBySession(sessionId: number) {
  const [draftOrder] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.diningSessionId, sessionId), eq(orders.status, "DRAFT")))
    .orderBy(desc(orders.createdAt))
    .limit(1);

  return draftOrder || null;
}