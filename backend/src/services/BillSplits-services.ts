import { dbClient as db } from "db/client.js";
import {
  bills,
  billSplits,
  orderItems,
  menuItems,
  group_members,
  orders,
  diningSessions,
} from "db/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Generate bill สำหรับ order เดียว
 */
export async function generateBill(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new Error("Order not found");

  // ถ้ามี bill เดิมของ order นี้อยู่แล้ว → return เลย
  // const existingBill = await db.select().from(bills).where(eq(bills.orderId, orderId));
  // if (existingBill.length > 0) {
  //   const splits = await getSplit(existingBill[0].id);
  //   return { ...existingBill[0], splits };
  // }
   // ✅ ตรวจสอบ bill เก่าอย่างเข้มงวด
  const existingBill = await db.select().from(bills).where(eq(bills.orderId, orderId));
  
  if (existingBill.length > 0) {
    console.log("📄 Using existing bill for order:", orderId);
    const bill = existingBill[0]; // ใช้ตัวแรกเสมอ
    const splits = await getSplit(bill.id);
    return { ...bill, splits };
  }

  const diningSessionId = Number(order.diningSessionId);

  // ดึงรายการสินค้าใน order นั้น
  const items = await db
    .select({
      price: menuItems.price,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));

  const subtotal = items.reduce((sum, i) => sum + i.price * (i.quantity ?? 0), 0);
  const serviceCharge = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + serviceCharge).toFixed(2);

  // ✅ insert bill ใหม่
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

  await calculateSplit(orderId, bill.id, serviceCharge);

  const splits = await getSplit(bill.id);
  return { ...bill, splits };
}

/**
 * Generate bill รวมทุก order ของ session (ใช้เวลาปิดโต๊ะ)
 */
export async function generateBillForSession(sessionId: number, force = false) {
  // ✅ ดึง orders ทั้งหมดใน session
  const ordersData = await db.select().from(orders).where(eq(orders.diningSessionId, sessionId));
  if (ordersData.length === 0) throw new Error("No orders found for this session");

  const orderIds = ordersData.map(o => o.id);

  // ✅ ดึง item ทั้งหมดใน orders
  const items = await db
    .select({
      memberId: orderItems.memberId,
      price: menuItems.price,
      quantity: orderItems.quantity,
      menuName: menuItems.name,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(inArray(orderItems.orderId, orderIds));

  // ✅ คำนวณยอดใหม่
  const subtotal = items.reduce((sum, i) => sum + i.price * (i.quantity ?? 0), 0);
  const serviceCharge = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + serviceCharge).toFixed(2);

  // ✅ ตรวจว่ามี bill เดิมไหม
  const existing = await db.select().from(bills).where(eq(bills.diningSessionId, sessionId));

  let bill;

  if (existing.length > 0) {
    // ⚙️ ถ้ามี → อัปเดตบิลเก่าแทนที่จะลบ
    [bill] = await db
      .update(bills)
      .set({
        subtotal,
        serviceCharge,
        vat: 0,
        total,
        status: "UNPAID", // reset สถานะให้กลับมา UNPAID
      })
      .where(eq(bills.diningSessionId, sessionId))
      .returning();

    console.log(`♻️ Updated existing bill for session ${sessionId}`);
  } else {
    // 🧾 ถ้าไม่มี → สร้างใหม่
    [bill] = await db
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

    console.log(`🧾 Created new bill for session ${sessionId}`);
  }

  // ✅ ล้าง splits เก่า (ถ้ามี)
  await db.delete(billSplits).where(eq(billSplits.billId, bill.id));

  // ✅ คำนวณ split ใหม่
  await calculateSplitForSession(sessionId, bill.id, serviceCharge);

  // ✅ ดึง splits ที่เพิ่งคำนวณ
  const splits = await getSplit(bill.id);

  // ✅ คืนค่ากลับให้ frontend
  return { ...bill, items, splits };
}


/**
 * คำนวณ split สำหรับบิลรวมทั้ง session
 */
export async function calculateSplitForSession(
  sessionId: number,
  billId: number,
  serviceChargeOverride?: number
) {
  const ordersData = await db.select().from(orders).where(eq(orders.diningSessionId, sessionId));
  const orderIds = ordersData.map(o => o.id);

  const items = await db
    .select({
      memberId: orderItems.memberId,
      price: menuItems.price,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(inArray(orderItems.orderId, orderIds));

  // รวมยอดแต่ละ member
  const memberTotals: Record<number, number> = {};
  for (const item of items) {
    const amount = item.price * (item.quantity ?? 0);
    memberTotals[item.memberId] = (memberTotals[item.memberId] || 0) + amount;
  }

  const serviceCharge = serviceChargeOverride ?? 0;
  const memberCount = Object.keys(memberTotals).length || 1;
  const servicePerMember = +(serviceCharge / memberCount).toFixed(2);

  // ลบ splits เดิมก่อน (กันซ้ำ)
  await db.delete(billSplits).where(eq(billSplits.billId, billId));

  for (const [memberId, amount] of Object.entries(memberTotals)) {
    await db.insert(billSplits).values({
      billId,
      memberId: Number(memberId),
      amount: +(amount + servicePerMember).toFixed(2),
      paid: false,
    });
  }

  console.log(`✅ Splits created for bill ${billId}:`, memberTotals);
  return { status: "recalculated", billId };
}

/**
 * คำนวณ split สำหรับบิล order เดียว
 */
export async function calculateSplit(
  orderId: number,
  billId: number,
  serviceChargeOverride?: number
) {
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
  if (!bill) throw new Error("Bill not found");

  await db.delete(billSplits).where(eq(billSplits.billId, billId));

  const items = await db
    .select({
      memberId: orderItems.memberId,
      price: menuItems.price,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));

  const memberTotals: Record<number, number> = {};
  for (const item of items) {
    const amount = item.price * (item.quantity ?? 0);
    memberTotals[item.memberId] = (memberTotals[item.memberId] || 0) + amount;
  }

  const serviceCharge = serviceChargeOverride ?? bill.serviceCharge ?? 0;
  const memberCount = Object.keys(memberTotals).length || 1;
  const servicePerMember = +(serviceCharge / memberCount).toFixed(2);

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
 * ดึง split ของ bill
 */
export async function getSplit(billId: number) {
  return await db
    .select({
      memberId: billSplits.memberId,
      amount: billSplits.amount,
      paid: billSplits.paid,
      name: group_members.name,
    })
    .from(billSplits)
    .innerJoin(group_members, eq(group_members.id, billSplits.memberId))
    .where(eq(billSplits.billId, billId));
}

/**
 * อัปเดตสถานะการจ่ายเงินของ member
 */
export async function updatePayment(billId: number, memberId: number) {
  const [updated] = await db
    .update(billSplits)
    .set({ paid: true })
    .where(and(eq(billSplits.billId, billId), eq(billSplits.memberId, memberId)))
    .returning();

  if (!updated) return null;

  const remaining = await db
    .select()
    .from(billSplits)
    .where(and(eq(billSplits.billId, billId), eq(billSplits.paid, false)));

  let allPaid = false;
  if (remaining.length === 0) {
    await db.update(bills).set({ status: "PAID" }).where(eq(bills.id, billId));
    allPaid = true;

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

      if (unpaidBills.length === 0) {
        const allBills = await db
          .select()
          .from(bills)
          .where(eq(bills.diningSessionId, bill.diningSessionId));

        const totalAmount = allBills.reduce((sum, b) => sum + (b.total ?? 0), 0);
        await db
          .update(diningSessions)
          .set({ status: "COMPLETED", total: totalAmount })
          .where(eq(diningSessions.id, bill.diningSessionId));
      }
    }
  }

  return { ...updated, allPaid };
}

export async function calculateBillPreview(sessionId: number) {
  // ดึง orders ทั้งหมดใน session
  const ordersData = await db.select().from(orders).where(eq(orders.diningSessionId, sessionId));
  if (ordersData.length === 0) throw new Error("No orders found for this session");

  const orderIds = ordersData.map(o => o.id);

  // ดึง item ทั้งหมดใน orders
  const items = await db
    .select({
      price: menuItems.price,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(inArray(orderItems.orderId, orderIds));

  // คำนวณยอด
  const subtotal = items.reduce((sum, i) => sum + i.price * (i.quantity ?? 0), 0);
  const serviceCharge = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + serviceCharge).toFixed(2);

  return {
    subtotal,
    serviceCharge,
    total,
    itemCount: items.length,
    orderCount: ordersData.length
  };
}