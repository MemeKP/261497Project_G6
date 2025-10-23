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
import QRCode from "qrcode";

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
   // ตรวจสอบ bill เก่า
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
  const ordersData = await db.select().from(orders).where(eq(orders.diningSessionId, sessionId));
  if (ordersData.length === 0) throw new Error("No orders found for this session");
  const orderIds = ordersData.map(o => o.id);
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

  // คำนวณยอดใหม่
  const subtotal = items.reduce((sum, i) => sum + i.price * (i.quantity ?? 0), 0);
  const serviceCharge = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + serviceCharge).toFixed(2);

  const existing = await db.select().from(bills).where(eq(bills.diningSessionId, sessionId));

  let bill;

  if (existing.length > 0) {
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
  }
  await db.delete(billSplits).where(eq(billSplits.billId, bill.id));
  await calculateSplitForSession(sessionId, bill.id, serviceCharge);
  const splits = await getSplit(bill.id);
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
  const [bill] = await db
    .select({
      id: bills.id,
      diningSessionId: bills.diningSessionId,
    })
    .from(bills)
    .where(eq(bills.id, billId));

  const splits = await db
    .select({
      memberId: billSplits.memberId,
      amount: billSplits.amount,
      paid: billSplits.paid,
      name: group_members.name,
    })
    .from(billSplits)
    .innerJoin(group_members, eq(group_members.id, billSplits.memberId))
    .where(eq(billSplits.billId, billId));

  return splits.map((s) => ({
    ...s,
    sessionId: bill?.diningSessionId || null,
  }));
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

/**
 * ✅ Pay Entire Bill → สร้าง QR รวมยอดทั้งหมดของโต๊ะ
 */
export async function createGroupPaymentQr(sessionId: number) {
  const [bill] = await db.select().from(bills).where(eq(bills.diningSessionId, sessionId));
  if (!bill) throw new Error("Bill not found for this session");

  const qrPayload = `PAY:${bill.total}`;
  const qrBase64 = await QRCode.toDataURL(qrPayload);

  // จะไม่บันทึก qr ลง db ก็ได้ ถ้ายังไม่เพิ่ม column
  return { ...bill, qrCode: qrBase64, message: "✅ Group QR generated" };
}

/**
 * ✅ Split Bill → คำนวณแยกยอด และสร้าง QR ของแต่ละคน
 */
export async function splitBillForSession(sessionId: number) {
  const [bill] = await db.select().from(bills).where(eq(bills.diningSessionId, sessionId));
  if (!bill) throw new Error("Bill not found for this session");

  // ล้างของเก่าก่อน
  await db.delete(billSplits).where(eq(billSplits.billId, bill.id));
  await calculateSplitForSession(sessionId, bill.id, bill.serviceCharge ?? 0);

  const splits = await db
    .select({
      memberId: billSplits.memberId,
      amount: billSplits.amount,
      name: group_members.name,
    })
    .from(billSplits)
    .innerJoin(group_members, eq(group_members.id, billSplits.memberId))
    .where(eq(billSplits.billId, bill.id));

  const withQr = await Promise.all(
    splits.map(async (s) => ({
      ...s,
      qrCode: await QRCode.toDataURL(`PAY:${s.amount}`),
    }))
  );

  console.log(`✅ Split bill and generated QR for each member in session ${sessionId}`);

  return { 
    billId: bill.id, 
    sessionId: bill.diningSessionId, 
    splits: withQr, 
    message: "✅ Split bill with QR created" 
  };
}

/**
 * ✅ Generate bill รวมทุก order ของ session
 * ➤ ใช้ตอนกด “Generate Bill” → ยังไม่ split, ยังไม่สร้าง QR
 */
// export async function generateBillForSession(sessionId: number) {
//   const ordersData = await db.select().from(orders).where(eq(orders.diningSessionId, sessionId));
//   if (ordersData.length === 0) throw new Error("No orders found for this session");
//   const orderIds = ordersData.map((o) => o.id);
//   const items = await db
//     .select({
//       memberId: orderItems.memberId,
//       price: menuItems.price,
//       quantity: orderItems.quantity,
//       menuName: menuItems.name,
//     })
//     .from(orderItems)
//     .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
//     .where(inArray(orderItems.orderId, orderIds));

//   const subtotal = items.reduce((sum, i) => sum + i.price * (i.quantity ?? 0), 0);
//   const serviceCharge = +(subtotal * 0.07).toFixed(2);
//   const total = +(subtotal + serviceCharge).toFixed(2);
//   const existing = await db.select().from(bills).where(eq(bills.diningSessionId, sessionId));

//   let bill;
//   if (existing.length > 0) {
//     [bill] = await db
//       .update(bills)
//       .set({
//         subtotal,
//         serviceCharge,
//         vat: 0,
//         total,
//         status: "UNPAID",
//       })
//       .where(eq(bills.diningSessionId, sessionId))
//       .returning();
//     console.log(`♻️ Updated existing bill for session ${sessionId}`);
//   } else {
//     [bill] = await db
//       .insert(bills)
//       .values({
//         diningSessionId: sessionId,
//         subtotal,
//         serviceCharge,
//         vat: 0,
//         total,
//         status: "UNPAID",
//       })
//       .returning();
//     console.log(`🧾 Created new bill for session ${sessionId}`);
//   }

//   // ยังไม่ split, ยังไม่สร้าง QR
//   return { ...bill, items, message: "✅ Bill created (no split / QR yet)" };
// }