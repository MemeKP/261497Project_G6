import { dbClient as db } from "db/client.js";
import { order_items, orders, menuItems, members } from "db/schema.js";
import { eq } from "drizzle-orm";

/**
 * เพิ่ม OrderItem เข้าไปใน Order (Add to cart)
 */
export async function addOrderItem(
  order_id: number,
  menu_item_id: number,
  member_id: number,
  quantity: number,
  note?: string
) {
  // checkว่า orderId มีอยู่จริง
  const [order] = await db.select().from(orders).where(eq(orders.id,order_id));
  if (!order) throw new Error("Order not found");

  // checkว่า memberId มีอยู่จริง
  const [member] = await db.select().from(members).where(eq(members.id, member_id));
  if (!member) throw new Error("Member not found");

  //  checkว่า member กับ order อยู่ใน session เดียวกัน
  if (member.diningSessionId !== order.dining_session_id) {
    throw new Error("Member and Order do not belong to the same session");
  }

  //  checkว่าเมนูยัง available อยู่
  const [menu] = await db.select().from(menuItems).where(eq(menuItems.id, menu_item_id));
  if (!menu) throw new Error("Menu item not found");
  if (!menu.isAvailable) {
    throw new Error("This menu item is not available");
  }

  // check qty
  if (quantity <= 0) throw new Error("Quantity must be at least 1");

  //  insert order item
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

  // return item พร้อมข้อมูลเมนู
  return {
    ...newItem,
    menuName: menu.name,
    menuPrice: menu.price,
  };
}

/**
 * ดึง OrderItems ทั้งหมดของ Order (Cart list)
 * → ใช้ใน Cart Page
 */
export async function getOrderItemsByOrderId(orderId: number) {
  const items = await db
    .select({
      id: order_items.id,
      orderId: order_items.order_id,
      memberId: order_items.member_id,
      quantity: order_items.quantity,
      note: order_items.note,
      menuItemId: order_items.menu_item_id,
      menuName: menuItems.name,
      menuPrice: menuItems.price,
    })
    .from(order_items)
    .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
    .where(eq(order_items.order_id, orderId));

  return items;
}

/**
 * ดึง OrderItems ทั้งหมดของ Session (ใช้ในหน้า Order Status)
 */
export async function getOrderItemsBySession(sessionId: number) {
  return await db
    .select({
      id: order_items.id,
      menuName: menuItems.name,
      quantity:order_items.quantity,
      status: order_items.status,
    })
    .from(order_items)
    .innerJoin(orders, eq(order_items.order_id, orders.id))
    .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
    .where(eq(orders.dining_session_id, sessionId));
}

/**
 * อัปเดทสถานะของ OrderItem
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
 * อัปเดต OrderItem (แก้ qty/note)
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

  // ดึงข้อมูลเมนู
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
 * ลบ OrderItem (remove from cart)
 */
export async function deleteOrderItem(id: number) {
  const [deleted] = await db
    .delete(order_items)
    .where(eq(order_items.id, id))
    .returning();

  if (!deleted) return null;

  // ลบแล้วไม่จำเป็นต้อง join menu 
  return { ...deleted, message: "Deleted successfully" };
}
