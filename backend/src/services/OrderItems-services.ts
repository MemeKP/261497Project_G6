// import { db } from "src/db/client2.js";
import { dbClient as db } from "@db/client.js";
import { order_items, orders, menuItems, members } from "db/schema.js";
import { eq, sql } from "drizzle-orm";

export async function addOrderItem(orderId: number, menuItemId: number, memberId: number, quantity: number, note?: string) {
  if (quantity < 1) throw new Error("Quantity must be at least 1");

  //FK Validation
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new Error("Order not found");

  const [menu] = await db.select().from(menuItems).where(eq(menuItems.id, menuItemId));
  if (!menu) throw new Error("Menu item not found");

  const [member] = await db.select().from(members).where(eq(members.id, memberId));
  if (!member) throw new Error("Member not found");

  const [newItem] = await db
  .insert(order_items)
  .values({
    order_id: orderId,
    menu_item_id: menuItemId,
    member_id: memberId,
    quantity,
    note,
  })
  .returning();

}

export async function updateOrderItem(id: number, quantity?: number, note?: string) {
  const updates: Partial<{ quantity: number; note: string }> = {};

  if (quantity !== undefined) {
    if (quantity < 1) throw new Error("Quantity must be at least 1");
    updates.quantity = quantity;
  }
  if (note !== undefined) updates.note = note;

  const [updated] = await db
    .update(orderItems)
    .set(updates)
    .where(eq(orderItems.id, id))
    .returning();

  return updated || null;
}

export async function deleteOrderItem(id: number) {
  const [deleted] = await db
    .delete(orderItems)
    .where(eq(orderItems.id, id))
    .returning();

  if (!deleted) return null;

  // ลบแล้วไม่จำเป็นต้อง join menu 
  return { ...deleted, message: "Deleted successfully" };
}
