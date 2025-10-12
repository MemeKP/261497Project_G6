import { dbClient as db } from "db/client.js";
import { bills, billSplits, order_items, menuItems,  orders, diningSessions , group_members } from "db/schema.js";
import { eq, and , inArray } from "drizzle-orm";

// export async function generateBill(orderId: number) {
//   // check ว่า order มีจริงไหม
//   const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
//   if (!order) throw new Error("Order not found");

//   // check ว่า orderId นี้มี bill อยู่แล้วหรือยัง
//   const existingBill = await db.select().from(bills).where(eq(bills.orderId, orderId));
//   if (existingBill.length > 0) {
//     // ดึง splits ของบิลเก่ามาด้วย
//     const splits = await getSplit(existingBill[0].id);
//     return { ...existingBill[0], splits };
//   }

//   //  ตรวจให้แน่ใจว่ามีค่าเสมอ
//       // const diningSessionId = Number(order.dining_session_id);

//     const diningSessionId = Number(order.dining_session_id ?? 0);
//     if (!diningSessionId) {
//       throw new Error(`Order ${orderId} missing dining_session_id`);
//     }


//   // คำนวณ subtotal
//   const items = await db
//     .select({
//       price: menuItems.price,
//       quantity: order_items.quantity,
//     })
//     .from(order_items)
//     .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
//     .where(eq(order_items.order_id, orderId));

//   const subtotal = items.reduce(
//     (sum, item) => sum + item.price * (item.quantity ?? 0),
//     0
//   );

//   // service charge 7%
//   const serviceCharge = +(subtotal * 0.07).toFixed(2);
//   const total = +(subtotal + serviceCharge).toFixed(2);

//   // insert bill
//   const [bill] = await db
//     .insert(bills)
//     .values({
//       orderId,
//       diningSessionId,
//       subtotal,
//       serviceCharge,
//       vat: 0,
//       total,
//       status: "UNPAID",
//     })
//     .returning();

//   await calculateSplit(orderId, bill.id, serviceCharge);

//   // ดึง splits ที่เพิ่งสร้างมา
//   const splits = await getSplit(bill.id);

//   // return bill + splits
//   return {
//     ...bill,
//     splits,
//   };
// }
export async function generateBill(orderId: number) {
  try {
    console.log(" [generateBill] Start generating bill for order:", orderId);

    // check ว่า order มีจริงไหม
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) throw new Error("Order not found");
    console.log("[generateBill] Found order:", order);

    // check ว่า orderId นี้มี bill อยู่แล้วหรือยัง
    const existingBill = await db.select().from(bills).where(eq(bills.orderId, orderId));
    if (existingBill.length > 0) {
      console.log("[generateBill] Bill already exists:", existingBill[0]);
      const splits = await getSplit(existingBill[0].id);
      return { ...existingBill[0], splits };
    }

    //  ตรวจให้แน่ใจว่ามีค่าเสมอ
    const diningSessionId = Number(order.dining_session_id ?? 0);
    if (!diningSessionId) {
      throw new Error(`Order ${orderId} missing dining_session_id`);
    }

    console.log(" [generateBill] Using diningSessionId:", diningSessionId);

    // คำนวณ subtotal
    const items = await db
      .select({
        price: menuItems.price,
        quantity: order_items.quantity,
      })
      .from(order_items)
      .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
      .where(eq(order_items.order_id, orderId));

    console.log(" [generateBill] Found order items:", items);

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * (item.quantity ?? 0),
      0
    );

    const serviceCharge = +(subtotal * 0.07).toFixed(2);
    const total = +(subtotal + serviceCharge).toFixed(2);

    console.log(" [generateBill] subtotal:", subtotal, "serviceCharge:", serviceCharge, "total:", total);

    // insert bill
    const [bill] = await db
      .insert(bills)
      .values({
        orderId,
        diningSessionId,
        subtotal,
        serviceCharge,
        vat: 0,
        total,
        status: "UNPAID",
      })
      .returning();

    console.log("🧾 [generateBill] Inserted bill:", bill);

    await calculateSplit(orderId, bill.id, serviceCharge);
    console.log(" [generateBill] Finished calculating split for bill:", bill.id);

    // ดึง splits ที่เพิ่งสร้างมา
    const splits = await getSplit(bill.id);
    console.log(" [generateBill] getSplit() results:", splits);

    // return bill + splits
    return {
      ...bill,
      splits,
    };
  } catch (err: any) {
    console.error("[generateBill] Error:", err.message);
    throw err;
  }
}


/**
 * Generate bill รวมทั้ง session 
 */
export async function generateBillForSession(sessionId: number) {
  // ดึง orders ทั้งหมดของ session
  const ordersData = await db.select().from(orders).where(eq(orders.dining_session_id, sessionId));
  if (ordersData.length === 0) throw new Error("No orders found for this session");

  const orderIds = ordersData.map(o => o.id);

  // ดึง orderItems + menuItems ทั้งหมด
  const items = await db
    .select({
      memberId: order_items.member_id,
      price: menuItems.price,
      quantity: order_items.quantity,
      menuName: menuItems.name,
    })
    .from(order_items)
    .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
    .where(inArray(order_items.order_id, orderIds));

  // คำนวณ subtotal
  const subtotal = items.reduce((sum, i) => sum + i.price * (i.quantity ?? 0), 0);

  const serviceCharge = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + serviceCharge).toFixed(2);

  // check มี bill ของ session แล้วหรือยัง
  const existing = await db.select().from(bills).where(eq(bills.diningSessionId, sessionId));
  if (existing.length > 0) {
    return { ...existing[0], items };
  }

  // insert bill 
  const [bill] = await db
    .insert(bills)
    .values({
      diningSessionId: sessionId,
      subtotal,
      serviceCharge,
      vat: 0,
      total,
      status: "UNPAID",
    })
    .returning();

  return { ...bill, items };
}


/**
 * Recalculate split by members (service charge หารเท่า ๆ กัน)
 */
export async function calculateSplit(orderId: number, billId: number, serviceChargeOverride?: number) {
  // check ว่า bill มีจริง
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
  if (!bill) throw new Error("Bill not found");

  // ลบ splits เดิม
  await db.delete(billSplits).where(eq(billSplits.billId, billId));

  // ดึง orderItems + menuItems
  const items = await db
    .select({
      memberId: order_items.member_id,
      price: menuItems.price,
      quantity: order_items.quantity,
    })
    .from(order_items)
    .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
    .where(eq(order_items.order_id, orderId));

  // รวมยอดแต่ละ member
  const memberTotals: Record<number, number> = {};
  for (const item of items) {
    const amount = item.price * (item.quantity ?? 0);
    memberTotals[item.memberId] = (memberTotals[item.memberId] || 0) + amount;
  }

  // ใช้ serviceChargeOverride 
  const serviceCharge = serviceChargeOverride ?? bill.serviceCharge ?? 0;
  const memberCount = Object.keys(memberTotals).length || 1;
  const servicePerMember = +(serviceCharge / memberCount).toFixed(2);

  // insert split สำหรับแต่ละ member
  for (const [memberId, amount] of Object.entries(memberTotals)) {
    await db.insert(billSplits).values({
      billId,
      memberId: Number(memberId),
      amount: +(amount + servicePerMember).toFixed(2),
      paid: false,
    });
  }

  return { status: "recalculated", billId };
}


/**
 * Get split details of a bill
 */
export async function getSplit(billId: number) {
  return await db
    .select({
      memberId: billSplits.memberId,
      amount: billSplits.amount,
      paid: billSplits.paid,
      // name: members.name,
      name: group_members.name, // เปลี่ยนจาก members → group_members
    })
    .from(billSplits)
    // .innerJoin(members, eq(members.id, billSplits.memberId))
    .innerJoin(group_members, eq(group_members.id, billSplits.memberId))
    .where(eq(billSplits.billId, billId));
}


/**
 * Update payment status for a member
 */
export async function updatePayment(billId: number, memberId: number) {
  const [updated] = await db
    .update(billSplits)
    .set({ paid: true })
    .where(and(eq(billSplits.billId, billId), eq(billSplits.memberId, memberId)))
    .returning();

  if (!updated) return null;

  // check ว่าทุก member จ่ายครบหรือยัง → update bill เป็น PAID
  const remaining = await db
    .select()
    .from(billSplits)
    .where(and(eq(billSplits.billId, billId), eq(billSplits.paid, false)));

  let allPaid = false;
  if (remaining.length === 0) {
    //  อัปเดตสถานะ bill
    await db.update(bills).set({ status: "PAID" }).where(eq(bills.id, billId));
    allPaid = true;

    //  ตรวจว่าบิลทั้งหมดใน session นี้จ่ายครบหรือยัง
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
    if (bill) {
      const unpaidBills = await db
        .select()
        .from(bills)
        .where(
          and(
            eq(bills.diningSessionId, bill.diningSessionId),
            eq(bills.status, "UNPAID")
          )
        );

      //  ถ้าไม่มีบิลเหลือให้จ่ายแล้ว → session เสร็จสมบูรณ์
      if (unpaidBills.length === 0) {
        const allBills = await db
          .select()
          .from(bills)
          .where(eq(bills.diningSessionId, bill.diningSessionId));

        const totalAmount = allBills.reduce(
          (sum, b) => sum + (b.total ?? 0),
          0
        );

        await db.update(diningSessions)
          .set({ status: "COMPLETED", total: totalAmount })
          .where(eq(diningSessions.id, bill.diningSessionId));
      }
    }
  }

  return { ...updated, allPaid };
}

