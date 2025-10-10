import { dbClient as db } from "db/client.js";
import { order_items, orders, menuItems,group_members } from "db/schema.js";
import { eq } from "drizzle-orm";

/**
 * add OrderItem  Order (Add to cart)
 */
export async function addOrderItem(
  order_id: number,
  menu_item_id: number,
  member_id: number,
  quantity: number,
  note?: string,
  status: string = "PREPARING"
) {
  const [order] = await db.select().from(orders).where(eq(orders.id,order_id));
  if (!order) throw new Error("Order not found");

  const [member] = await db.select().from(group_members).where(eq(group_members.id, member_id));
  if (!member) throw new Error("Member not found");

  if (member.diningSessionId !== order.dining_session_id) {
    throw new Error("Member and Order do not belong to the same session");
  }

  const [menu] = await db.select().from(menuItems).where(eq(menuItems.id, menu_item_id));
  if (!menu) throw new Error("Menu item not found");
  if (!menu.isAvailable) {
    throw new Error("This menu item is not available");
  }

  if (quantity <= 0) throw new Error("Quantity must be at least 1");

  const [newItem] = await db
    .insert(order_items)
    .values({
      order_id,
      menu_item_id,
      member_id,
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
      id: order_items.id,
      orderId: order_items.order_id,
      menuItemId: order_items.menu_item_id,
      memberId: order_items.member_id,
      memberName: group_members.name,
      quantity: order_items.quantity,
      note: order_items.note,
      menuName: menuItems.name,
      menuPrice: menuItems.price,
      menuImage: menuItems.imageUrl,
      status: order_items.status,
    })
    .from(order_items)
    .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
    .leftJoin(group_members, eq(order_items.member_id, group_members.id))
    .where(eq(order_items.order_id, orderId));

  return items.map((item) => ({
    ...item,
    menuItem: { imageUrl: item.menuImage },
  }));
}

export async function getOrderItemById(itemId: number) {
  const [item] = await db
    .select({
      id: order_items.id,
      orderId: order_items.order_id,
      menuItemId: order_items.menu_item_id,
      memberId: order_items.member_id,
      memberName: group_members.name,
      quantity: order_items.quantity,
      note: order_items.note,
      status: order_items.status,
      menuName: menuItems.name,
      menuPrice: menuItems.price,
    })
    .from(order_items)
    .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
    .leftJoin(group_members, eq(order_items.member_id, group_members.id))
    .where(eq(order_items.id, itemId))
    .limit(1);

  return item || null;
}

/**
 * ดึง OrderItems Session (Order Status)
 */
export async function getOrderItemsBySession(sessionId: number) {
  return await db
    .select({
      id: order_items.id,
      menuName: menuItems.name,
      menuPrice: menuItems.price,
      quantity: order_items.quantity,
      note: order_items.note,
      memberName: group_members.name,
      status: order_items.status,
    })
    .from(order_items)
    .innerJoin(orders, eq(order_items.order_id, orders.id))
    .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
    .leftJoin( group_members, eq(order_items.member_id, group_members.id)) // join member
    .where(eq(orders.dining_session_id, sessionId));
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
    .update(order_items)
    .set({ status })
    .where(eq(order_items.id, itemId))
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
    .update(order_items)
    .set(updates)
    .where(eq(order_items.id, id))
    .returning();

  if (!updated) return null;

  const [menu] = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.id, updated.menu_item_id));

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
    .delete(order_items)
    .where(eq(order_items.id, id))
    .returning();

  if (!deleted) return null;

  return { ...deleted, message: "Deleted successfully" };
}
