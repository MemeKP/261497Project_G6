import { db } from "src/db/client.js";
import { orders } from "src/db/schema.js";
import { eq } from "drizzle-orm";

// const allowedStatus = ["PENDING", "PREPARING", "COMPLETED", "CANCELLED"] as const;
const allowedStatus = ["PENDING", "PREPARING", "COMPLETED", "CANCELLED", "PAID"] as const;

export async function createOrder(diningSessionId: number) {
  const [newOrder] = await db
    .insert(orders)
    .values({ diningSessionId })
    .returning();
  return newOrder;
}

export async function getOrdersBySession(sessionId: number) {
  return await db
    .select()
    .from(orders)
    .where(eq(orders.diningSessionId, sessionId));
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

