// import { dbClient as db } from "db/client.js";
// import { orders, orderItems ,menuItems ,members  } from "db/schema.js";
// import { eq, inArray } from "drizzle-orm";
// const allowedStatus = ["PENDING", "PREPARING", "READY_TO_SERVE", "CANCELLED", "COMPLETE"] as const;

// /**
//  * สร้าง Order พร้อม Items (ใช้ตอน Checkout)
//  */
// export async function createOrderWithItems(
//   diningSessionId: number,
//   tableId: number,
//   items: { menuId: number; memberId: number; qty: number; note?: string }[]
// ) {
//   // create order
//   const [newOrder] = await db
//     .insert(orders)
//     .values({ 
//       diningSessionId ,
//       tableId: diningSessionId,
//       })
//     .returning();

//   // insert order items
//   const insertedItems = [];
//   for (const item of items) {
//     const [inserted] = await db
//       .insert(orderItems)
//       .values({
//         orderId: newOrder.id,
//         menuItemId: item.menuId,   
//         memberId: item.memberId,
//         quantity: item.qty,
//         note: item.note || null,
//       })
//       .returning();
//     insertedItems.push(inserted);
//   }

//   //  return order + items
//   return { ...newOrder, items: insertedItems };
// }

// /**
//  * สร้าง Order
//  */
// export async function createOrder(diningSessionId: number ,tableId: number) {
//   const [newOrder] = await db
//     .insert(orders)
//     .values({ diningSessionId ,
//       tableId ,

//     })
//     .returning();
//   return newOrder;
// }
// export async function getOrdersBySession(sessionId: number) {
//   // ดึง orders ของ session
//   const ordersData = await db
//     .select()
//     .from(orders)
//     .where(eq(orders.diningSessionId, sessionId));

//   if (ordersData.length === 0) return [];

//   // ดึง items ของทุก order + join menuItems
//   const orderIds = ordersData.map((o) => o.id);

//   const itemsData = await db
//     .select({
//       id: orderItems.id,
//       orderId: orderItems.orderId,
//       quantity: orderItems.quantity,
//       note: orderItems.note,
//       menuItemId: orderItems.menuItemId,
//       menuName: menuItems.name,
//       menuPrice: menuItems.price,
//       memberName: members.name, //add
//     })
//     .from(orderItems)
//     .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
//     .leftJoin(members, eq(orderItems.memberId, members.id)) // add

//   // group items ตาม order
//   return ordersData.map((order) => ({
//     ...order,
//     items: itemsData.filter((i) => i.orderId === order.id),
//   }));
// }


// /**
//  * อัปเดตสถานะของ Order
//  */
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
// export async function getOrderById(orderId: number) {
//   const [order] = await db
//     .select()
//     .from(orders)
//     .where(eq(orders.id, orderId));

//   if (!order) return null;

//   const items = await db
//     .select({
//       id: orderItems.id,
//       orderId: orderItems.orderId,
//       quantity: orderItems.quantity,
//       note: orderItems.note,
//       menuItemId: orderItems.menuItemId,
//       menuName: menuItems.name,
//       menuPrice: menuItems.price,
//       memberName: members.name,
//     })
//     .from(orderItems)
//     .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
//     .where(eq(orderItems.orderId, orderId));

//   return { ...order, items };
// }

// /**
//  * ดึง Orders ทั้งหมด 
//  */
// export async function getAllOrders() {
//   const ordersData = await db.select().from(orders);
//   if (ordersData.length === 0) return [];

//   const orderIds = ordersData.map((o) => o.id);
//   const itemsData = await db
//     .select()
//     .from(orderItems)
//     .where(inArray(orderItems.orderId, orderIds));

//   return ordersData.map((order) => ({
//     ...order,
//     items: itemsData.filter((i) => i.orderId === order.id),
//   }));
// }

// /**
//  * ลบ Order
//  */
// export async function deleteOrder(orderId: number) {
//   const [deleted] = await db.delete(orders).where(eq(orders.id, orderId)).returning();
//   return deleted || null;
// }

//--------------------------------------
// import { db } from "src/db/client2.js";
import { dbClient as db } from "@db/client.js";
import { order_items, orders } from "db/schema.js";
import { eq } from "drizzle-orm";

// const allowedStatus = ["PENDING", "PREPARING", "COMPLETED", "CANCELLED"] as const;
const allowedStatus = ["PENDING", "PREPARING", "COMPLETED", "CANCELLED", "PAID"] as const;

export async function createOrder( dining_session_id: number, table_id: number) {
  const [newOrder] = await db
    .insert(orders)
    .values({ 
       dining_session_id, 
      table_id 
    })
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
       dining_session_id: diningSessionId,
      table_id: diningSessionId, // ตอนนี้ดึงจาก dining session ไปก่อน
      status: 'PENDING'
    })
    .returning();

  // 2. สร้าง order items
  const orderItemsData = items.map(item => ({
    order_id: newOrder.id,
    menu_item_id: item.menuId,
    member_id: item.memberId,
    quantity: item.qty,
    note: item.note,
    status: 'PREPARING'
  }));

  const createdItems = await db
    .insert(order_items)
    .values(orderItemsData)
    .returning();

  return {
    ...newOrder,
    items: createdItems
  };
}


export async function getOrdersBySession(sessionId: number) {
  return await db
    .select()
    .from(orders)
    .where(eq(orders. dining_session_id, sessionId));
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