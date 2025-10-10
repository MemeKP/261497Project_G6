// import { dbClient as db } from "@db/client.js";
// import { order_items, orders, menuItems, group_members } from "db/schema.js";
// import { eq, and, inArray, desc } from "drizzle-orm";

// const allowedStatus = ["DRAFT","PENDING", "CLOSED"] as const;

// // ✅ สร้าง order ใหม่
// export async function createOrder(dining_session_id: number, table_id: number) {
//   const [newOrder] = await db
//     .insert(orders)
//     .values({
//       dining_session_id,
//       table_id,
//       status: "DRAFT",
//     })
//     .returning();
//   return newOrder;
// }

// // ✅ สร้าง order + items
// export async function createOrderWithItems(
//   diningSessionId: number,
//   tableId: number,
//   items: Array<{
//     menuId: number;
//     qty: number;
//     note?: string;
//     memberId: number;
//   }>
// ) {
//   // ✅ 1. ตรวจสอบว่ามี order เดิมที่ยังไม่ checkout ไหม
//   let [existingOrder] = await db
//     .select()
//     .from(orders)
//     .where(
//       and(
//         eq(orders.dining_session_id, diningSessionId),
//         eq(orders.status, "DRAFT")
//       )
//     )
//     .orderBy(desc(orders.created_at))
//     .limit(1);

//   // ✅ 2. ถ้าไม่มี → สร้างใหม่
//   if (!existingOrder) {
//     const [newOrder] = await db
//       .insert(orders)
//       .values({
//         dining_session_id: diningSessionId,
//         table_id: tableId || 1, // ✅ ป้องกัน null
//         status: "DRAFT",
//       })
//       .returning();

//     existingOrder = newOrder;
//   }

//   // ✅ 3. เพิ่ม order items
//   const orderItemsData = items.map((item) => ({
//     order_id: existingOrder.id,
//     menu_item_id: item.menuId,
//     member_id: item.memberId,
//     quantity: item.qty,
//     note: item.note || "",
//     status: "PREPARING",
//   }));

//   const createdItems = await db
//     .insert(order_items)
//     .values(orderItemsData)
//     .returning();

//   // ✅ 4. ส่งคืนข้อมูลรวม
//   return {
//     ...existingOrder,
//     newItems: createdItems,
//   };
// }

// // ✅ ดึง orders ทั้งหมดของ session พร้อม items
// export async function getOrdersBySession(sessionId: number) {
//   const ordersData = await db
//     .select()
//     .from(orders)
//     .where(eq(orders.dining_session_id, sessionId));

//   if (ordersData.length === 0) return [];

//   const orderIds = ordersData.map((o) => o.id);

//   const itemsData = await db
//     .select({
//       id: order_items.id,
//       orderId: order_items.order_id,
//       quantity: order_items.quantity,
//       note: order_items.note,
//       status: order_items.status,
//       menuItemId: order_items.menu_item_id,
//       menuName: menuItems.name,
//       menuPrice: menuItems.price,
//       memberName: group_members.name,
//     })
//     .from(order_items)
//     .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
//     .leftJoin(group_members, eq(order_items.member_id, group_members.id))
//     .where(inArray(order_items.order_id, orderIds));

//   return ordersData.map((order) => ({
//     ...order,
//     items: itemsData.filter((i) => i.orderId === order.id),
//   }));
// }

// // ✅ เปลี่ยนสถานะ order (ใช้ตอน checkout)
// export async function updateOrderStatus(orderId: number, status: string) {
//   if (!allowedStatus.includes(status as any)) {
//     throw new Error("Invalid order status");
//   }

//   const [updated] = await db
//     .update(orders)
//     .set({ status })
//     .where(eq(orders.id, orderId))
//     .returning();

//   return updated;
// }

// // ✅ ใช้สำหรับหน้าแอดมินหรือ debug
// export async function getOrderById(orderId: number) {
//   const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
//   return order || null;
// }

// export async function getAllOrders() {
//   return await db.select().from(orders);
// }

// export async function deleteOrder(orderId: number) {
//   const [deleted] = await db
//     .delete(orders)
//     .where(eq(orders.id, orderId))
//     .returning();
//   return deleted || null;
// }

// export async function checkoutOrder(orderId: number) {
//   const [updated] = await db
//     .update(orders)
//     .set({ status: "PENDING" })
//     .where(eq(orders.id, orderId))
//     .returning();

//   return updated;
// }

import { dbClient as db } from "@db/client.js";
import { order_items, orders, menuItems, group_members } from "db/schema.js";
import { ne, eq, and, inArray, desc } from "drizzle-orm";

/**
 * Allowed order statuses
 * เพิ่มสถานะทั้งหมดที่ใช้ใน flow จริง
 */
const allowedStatus = [
  "DRAFT",      // ยังไม่กด Checkout
  "PENDING",    // รอยืนยัน (หลัง Checkout)
  "PREPARING",  // ร้านเริ่มทำอาหาร
  "COMPLETED",  // เสิร์ฟครบแล้ว
  "PAID",       // จ่ายเงินแล้ว
  "CLOSED"      // ปิดออเดอร์ / ปิด session
] as const;

/**
 * create order (button new ordr)
 */
export async function createOrder(dining_session_id: number, table_id: number) {
  const [newOrder] = await db
    .insert(orders)
    .values({
      dining_session_id,
      table_id,
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
        eq(orders.dining_session_id, diningSessionId),
        eq(orders.status, "DRAFT")
      )
    )
    .orderBy(desc(orders.created_at))
    .limit(1);

  // newOrder
  if (!existingOrder) {
    const [newOrder] = await db
      .insert(orders)
      .values({
        dining_session_id: diningSessionId,
        table_id: tableId || 1,
        status: "DRAFT",
      })
      .returning();

    existingOrder = newOrder;
  }
  //add order items
  const orderItemsData = items.map((item) => ({
    order_id: existingOrder.id,
    menu_item_id: item.menuId,
    member_id: item.memberId,
    quantity: item.qty,
    note: item.note || "",
    status: "PREPARING",
  }));

  const createdItems = await db
    .insert(order_items)
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
    .where(and(eq(orders.dining_session_id, sessionId), ne(orders.status, "DRAFT")));


  if (ordersData.length === 0) return [];

  const orderIds = ordersData.map((o) => o.id);

  const itemsData = await db
    .select({
      id: order_items.id,
      orderId: order_items.order_id,
      quantity: order_items.quantity,
      note: order_items.note,
      status: order_items.status,
      menuItemId: order_items.menu_item_id,
      menuName: menuItems.name,
      menuPrice: menuItems.price,
      menuImage: menuItems.imageUrl,
      memberName: group_members.name,
    })
    .from(order_items)
    .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
    .leftJoin(group_members, eq(order_items.member_id, group_members.id))
    .where(inArray(order_items.order_id, orderIds));

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
    .where(and(eq(orders.dining_session_id, sessionId), eq(orders.status, "DRAFT")))
    .orderBy(desc(orders.created_at))
    .limit(1);

  return draftOrder || null;
}
