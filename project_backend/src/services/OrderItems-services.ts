import { db } from "src/db/client.js";
import { orderItems, orders, menuItems, members } from "src/db/schema.js";
import { eq } from "drizzle-orm";

/**
 * เพิ่ม OrderItem เข้าไปใน Order (Add to cart)
 */
export async function addOrderItem(
  orderId: number,
  menuItemId: number,
  memberId: number,
  quantity: number,
  note?: string
) {
  // checkว่า orderId มีอยู่จริง
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new Error("Order not found");

  // checkว่า memberId มีอยู่จริง
  const [member] = await db.select().from(members).where(eq(members.id, memberId));
  if (!member) throw new Error("Member not found");

  //  checkว่า member กับ order อยู่ใน session เดียวกัน
  if (member.diningSessionId !== order.diningSessionId) {
    throw new Error("Member and Order do not belong to the same session");
  }

  //  checkว่าเมนูยัง available อยู่
  const [menu] = await db.select().from(menuItems).where(eq(menuItems.id, menuItemId));
  if (!menu) throw new Error("Menu item not found");
  if (!menu.isAvailable) {
    throw new Error("This menu item is not available");
  }

  // check qty
  if (quantity <= 0) throw new Error("Quantity must be at least 1");

  //  insert order item
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
      id: orderItems.id,
      orderId: orderItems.orderId,
      memberId: orderItems.memberId,
      quantity: orderItems.quantity,
      note: orderItems.note,
      menuItemId: orderItems.menuItemId,
      menuName: menuItems.name,
      menuPrice: menuItems.price,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));

  return items;
}

/**
 * ดึง OrderItems ทั้งหมดของ Session (ใช้ในหน้า Order Status)
 */
export async function getOrderItemsBySession(sessionId: number) {
  return await db
    .select({
      id: orderItems.id,
      menuName: menuItems.name,
      quantity: orderItems.quantity,
      status: orderItems.status,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orders.diningSessionId, sessionId));
}

/**
 * อัปเดทสถานะของ OrderItem
 */
export async function updateStatus(itemId: number, status: string) {
  const allowed = ["PENDING", "PREPARING", "SERVED", "CANCELLED"];
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
    .update(orderItems)
    .set(updates)
    .where(eq(orderItems.id, id))
    .returning();

  if (!updated) return null;

  // ดึงข้อมูลเมนู
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
 * ลบ OrderItem (remove from cart)
 */
export async function deleteOrderItem(id: number) {
  const [deleted] = await db
    .delete(orderItems)
    .where(eq(orderItems.id, id))
    .returning();

  if (!deleted) return null;

  // ลบแล้วไม่จำเป็นต้อง join menu 
  return { ...deleted, message: "Deleted successfully" };
}

