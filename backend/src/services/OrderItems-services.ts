import { dbClient as db } from "db/client.js";
import { orderItems, orders, menuItems,group_members } from "db/schema.js";
import { eq } from "drizzle-orm";

/**
 * add OrderItem  Order (Add to cart)
 */
export async function addOrderItem(
  orderId: number,
  menuItemId: number,
  memberId: number,
  quantity: number,
  note?: string,
  status: string = "PREPARING"
) {
  const [order] = await db.select().from(orders).where(eq(orders.id,orderId));
  if (!order) throw new Error("Order not found");

  const [member] = await db.select().from(group_members).where(eq(group_members.id, memberId));
  if (!member) throw new Error("Member not found");

  if (member.diningSessionId !== order.diningSessionId) {
    throw new Error("Member and Order do not belong to the same session");
  }

  const [menu] = await db.select().from(menuItems).where(eq(menuItems.id, menuItemId));
  if (!menu) throw new Error("Menu item not found");
  if (!menu.isAvailable) {
    throw new Error("This menu item is not available");
  }

  if (quantity <= 0) throw new Error("Quantity must be at least 1");

  const [newItem] = await db
    .insert(orderItems)
    .values({
      orderId,
      menuItemId,
      memberId,
      quantity,
      note: note || null,
    })
    .returning();

  return {
    ...newItem,
    menuName: menu.name,
    menuPrice: menu.price,
  };
}

export async function getOrderItemsByOrderId(orderId: number) {
  const items = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      menuItemId: orderItems.menuItemId,
      memberId: orderItems.memberId,
      memberName: group_members.name,
      quantity: orderItems.quantity,
      note: orderItems.note,
      menuName: menuItems.name,
      menuPrice: menuItems.price,
      menuImage: menuItems.imageUrl,
      status: orderItems.status,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .leftJoin(group_members, eq(orderItems.memberId, group_members.id))
    .where(eq(orderItems.orderId, orderId));

  return items.map((item) => ({
    ...item,
    menuItem: { imageUrl: item.menuImage },
  }));
}

export async function getOrderItemById(itemId: number) {
  const [item] = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      menuItemId: orderItems.menuItemId,
      memberId: orderItems.memberId,
      memberName: group_members.name,
      quantity: orderItems.quantity,
      note: orderItems.note,
      status: orderItems.status,
      menuName: menuItems.name,
      menuPrice: menuItems.price,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .leftJoin(group_members, eq(orderItems.memberId, group_members.id))
    .where(eq(orderItems.id, itemId))
    .limit(1);

  return item || null;
}

/**
 * ดึง OrderItems Session (Order Status)
 */
export async function getOrderItemsBySession(sessionId: number) {
  return await db
    .select({
      id: orderItems.id,
      menuName: menuItems.name,
      menuPrice: menuItems.price,
      quantity: orderItems.quantity,
      note: orderItems.note,
      memberName: group_members.name,
      status: orderItems.status,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .leftJoin( group_members, eq(orderItems.memberId, group_members.id)) // join member
    .where(eq(orders.diningSessionId, sessionId));
}

/**
 * update OrderItem
 */
export async function updateStatus(itemId: number, status: string) {
  const allowed = ["PENDING", "PREPARING", "READY_TO_SERVE", "CANCELLED", "COMPLETE"];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status. Allowed: ${allowed.join(", ")}`);
  }

  const [updated] = await db
    .update(orderItems)
    .set({ status })
    .where(eq(orderItems.id, itemId))
    .returning();

  return updated || null;
}

/**
 * Update OrderItem (edit qty/note)
 */
export async function updateOrderItem(id: number, quantity?: number, note?: string) {
  const updates: Partial<{ quantity: number; note: string }> = {};

  if (quantity !== undefined) {
    if (quantity < 1) throw new Error("Quantity must be at least 1");
    updates.quantity = quantity;
  }
  if (note !== undefined) {
    updates.note = note;
  }

  const [updated] = await db
    .update(orderItems)
    .set(updates)
    .where(eq(orderItems.id, id))
    .returning();

  if (!updated) return null;

  const [menu] = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.id, updated.menuItemId));

  return {
    ...updated,
    menuName: menu?.name,
    menuPrice: menu?.price,
  };
}

/**
 *  OrderItem (remove from cart)
 */
export async function deleteOrderItem(id: number) {
  const [deleted] = await db
    .delete(orderItems)
    .where(eq(orderItems.id, id))
    .returning();

  if (!deleted) return null;

  return { ...deleted, message: "Deleted successfully" };
}