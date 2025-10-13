import { dbClient as db, dbClient } from "db/client.js";
import { orderItems, orders, menuItems,group_members } from "db/schema.js";
import { and, eq } from "drizzle-orm";

/**
 * เพิ่ม OrderItem เข้าไปใน Order (Add to cart)
 */
// export async function addOrderItem(
//   orderId: number,
//   menuItemId: number,
//   memberId: number,
//   quantity: number,
//   note?: string,
//   status: string = "PREPARING"
// ) {
//   // checkว่า orderId มีอยู่จริง
//   const [order] = await db.select().from(orders).where(eq(orders.id,orderId));
//   if (!order) throw new Error("Order not found");

//   // checkว่า memberId มีอยู่จริง
//   const [member] = await db.select().from(group_members).where(eq(group_members.id, memberId));
//   if (!member) throw new Error("Member not found");

//   //  checkว่า member กับ order อยู่ใน session เดียวกัน
//   if (member.diningSessionId !== order.diningSessionId) {
//     throw new Error("Member and Order do not belong to the same session");
//   }

//   //  checkว่าเมนูยัง available อยู่
//   const [menu] = await db.select().from(menuItems).where(eq(menuItems.id, menuItemId));
//   if (!menu) throw new Error("Menu item not found");
//   if (!menu.isAvailable) {
//     throw new Error("This menu item is not available");
//   }

//   // check qty
//   if (quantity <= 0) throw new Error("Quantity must be at least 1");

//   //  insert order item
//   const [newItem] = await db
//     .insert(orderItems)
//     .values({
//       orderId,
//       menuItemId,
//       memberId,
//       quantity,
//       note: note || null,
//     })
//     .returning();

//   // return item พร้อมข้อมูลเมนู
//   return {
//     ...newItem,
//     menuName: menu.name,
//     menuPrice: menu.price,
//   };
// }
export const addOrderItem = async (
  orderId: number,
  menuItemId: number,
  quantity: number,
  note?: string,
  memberId?: number
) => {
  try {
    console.log('🔍 [SERVICE] addOrderItem called with:', {
      orderId,
      menuItemId,
      quantity,
      note,
      memberId,
      memberIdType: typeof memberId,
      quantityType: typeof quantity // ✅ เพิ่ม debug นี้
    });

    // ✅ แก้ไข: แปลง quantity ให้แน่ใจว่าเป็น number
    const quantityNum = Number(quantity);
    console.log('🔍 [SERVICE] Quantity after conversion:', quantityNum, 'Type:', typeof quantityNum);

    // check ว่า orderId มีอยู่จริง
    const [order] = await dbClient.select().from(orders).where(eq(orders.id, orderId));
    console.log('🔍 [SERVICE] Found order:', order);
    
    if (!order) throw new Error("Order not found");

    let finalMemberId = memberId;
    
    if (memberId === null || memberId === undefined) {
      console.log('🔍 [SERVICE] No memberId provided, finding table admin...');
      
      const tableAdminMembers = await dbClient
        .select()
        .from(group_members)
        .where(
          and(
            eq(group_members.diningSessionId, order.diningSessionId as any),
            eq(group_members.isTableAdmin, true)
          )
        )
        .limit(1);
      
      if (tableAdminMembers.length > 0) {
        finalMemberId = tableAdminMembers[0].id;
        console.log('[SERVICE] Using table admin:', tableAdminMembers[0]);
      } else {
        const firstMembers = await dbClient
          .select()
          .from(group_members)
          .where(eq(group_members.diningSessionId, order.diningSessionId as any))
          .limit(1);
        
        if (firstMembers.length === 0) throw new Error("No members found in session");
        finalMemberId = firstMembers[0].id;
      }
    } else {
      console.log(' [SERVICE] Using provided memberId:', memberId);
    }

    if (!finalMemberId) {
      throw new Error("No valid member ID found");
    }

    const members = await dbClient.select().from(group_members).where(eq(group_members.id, finalMemberId));
  
    if (members.length === 0) throw new Error("Member not found");

    const member = members[0];
    if (member.diningSessionId !== order.diningSessionId) {
      throw new Error("Member and Order do not belong to the same session");
    }

    // check ว่าเมนูยัง available อยู่
    const menuItemsResult = await dbClient.select().from(menuItems).where(eq(menuItems.id, menuItemId));
    console.log('🔍 [SERVICE] Found menu item:', menuItemsResult[0]);
    
    if (menuItemsResult.length === 0) throw new Error("Menu item not found");
    
    const menu = menuItemsResult[0];
    if (!menu.isAvailable) {
      throw new Error("This menu item is not available");
    }
    if (quantityNum <= 0) {
      throw new Error(`Quantity must be at least 1, but got: ${quantityNum} (type: ${typeof quantityNum})`);
    }

    
    const newItems = await dbClient
      .insert(orderItems)
      .values({
        orderId,
        menuItemId,
        memberId: finalMemberId,
        quantity: quantityNum, 
        note: note || null,
      })
      .returning();

    console.log('✅ [SERVICE] Order item inserted successfully:', newItems[0]);

    return {
      ...newItems[0],
      menuName: menu.name,
      menuPrice: menu.price,
    };

  } catch (error) {
    console.error('❌ [SERVICE] Error in addOrderItem:', error);
    throw error;
  }
};

/**
 * ดึง OrderItems ทั้งหมดของ Order (Cart list)
 * → ใช้ใน Cart Page
 */
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
      status: orderItems.status,
      imageUrl: menuItems.imageUrl,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .leftJoin(group_members, eq(orderItems.memberId, group_members.id)) // ✅ join ตาราง members
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
      menuPrice: menuItems.price,
      quantity: orderItems.quantity,
      note: orderItems.note,
      memberName: group_members.name,
      status: orderItems.status,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .leftJoin( group_members, eq(orderItems.memberId, group_members.id)) // ✅ เพิ่ม join member
    .where(eq(orders.diningSessionId, sessionId));
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