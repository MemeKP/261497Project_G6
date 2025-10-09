import { dbClient as db } from "db/client.js";
import {
  bills,
  billSplits,
  order_items,
  menuItems,
  group_members,
  orders,
  diningSessions,
} from "db/schema.js";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Generate bill สำหรับ order เดียว
 */
export async function generateBill(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new Error("Order not found");

  const existingBill = await db.select().from(bills).where(eq(bills.orderId, orderId));
  if (existingBill.length > 0) {
    const splits = await getSplit(existingBill[0].id);
    return { ...existingBill[0], splits };
  }

  const diningSessionId = Number(order.dining_session_id);

  const items = await db
    .select({
      price: menuItems.price,
      quantity: order_items.quantity,
    })
    .from(order_items)
    .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
    .where(eq(order_items.order_id, orderId));

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
  const ordersData = await db
    .select()
    .from(orders)
    .where(eq(orders.dining_session_id, sessionId));
  if (ordersData.length === 0) throw new Error("No orders found for this session");

  const orderIds = ordersData.map((o) => o.id);

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

  const subtotal = items.reduce((sum, i) => sum + i.price * (i.quantity ?? 0), 0);
  const serviceCharge = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + serviceCharge).toFixed(2);

  const existing = await db
    .select()
    .from(bills)
    .where(eq(bills.diningSessionId, sessionId));

  let bill;
  if (existing.length > 0) {
    [bill] = await db
      .update(bills)
      .set({
        subtotal,
        serviceCharge,
        vat: 0,
        total,
        status: "UNPAID",
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

    console.log(`🧾 Created new bill for session ${sessionId}`);
  }

  // ✅ recalculated splits
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
  const ordersData = await db
    .select()
    .from(orders)
    .where(eq(orders.dining_session_id, sessionId));
  const orderIds = ordersData.map((o) => o.id);

  const items = await db
    .select({
      memberId: order_items.member_id,
      price: menuItems.price,
      quantity: order_items.quantity,
    })
    .from(order_items)
    .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
    .where(inArray(order_items.order_id, orderIds));

  const memberTotals: Record<number, number> = {};
  for (const item of items) {
    const amount = item.price * (item.quantity ?? 0);
    memberTotals[item.memberId] = (memberTotals[item.memberId] || 0) + amount;
  }

  const serviceCharge = serviceChargeOverride ?? 0;
  const memberCount = Object.keys(memberTotals).length || 1;
  const servicePerMember = +(serviceCharge / memberCount).toFixed(2);

  // ✅ update ทับแทน delete
  for (const [memberId, amount] of Object.entries(memberTotals)) {
    const [existing] = await db
      .select()
      .from(billSplits)
      .where(
        and(eq(billSplits.billId, billId), eq(billSplits.memberId, Number(memberId)))
      );

    if (existing) {
      await db
        .update(billSplits)
        .set({
          amount: +(amount + servicePerMember).toFixed(2),
          paid: false,
        })
        .where(
          and(eq(billSplits.billId, billId), eq(billSplits.memberId, Number(memberId)))
        );
    } else {
      await db.insert(billSplits).values({
        billId,
        memberId: Number(memberId),
        amount: +(amount + servicePerMember).toFixed(2),
        paid: false,
      });
    }
  }

  console.log(`✅ Splits recalculated for bill ${billId}`);
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

  const items = await db
    .select({
      memberId: order_items.member_id,
      price: menuItems.price,
      quantity: order_items.quantity,
    })
    .from(order_items)
    .innerJoin(menuItems, eq(order_items.menu_item_id, menuItems.id))
    .where(eq(order_items.order_id, orderId));

  const memberTotals: Record<number, number> = {};
  for (const item of items) {
    const amount = item.price * (item.quantity ?? 0);
    memberTotals[item.memberId] = (memberTotals[item.memberId] || 0) + amount;
  }

  const serviceCharge = serviceChargeOverride ?? bill.serviceCharge ?? 0;
  const memberCount = Object.keys(memberTotals).length || 1;
  const servicePerMember = +(serviceCharge / memberCount).toFixed(2);

  // ✅ update ทับแทน delete
  for (const [memberId, amount] of Object.entries(memberTotals)) {
    const [existing] = await db
      .select()
      .from(billSplits)
      .where(
        and(eq(billSplits.billId, billId), eq(billSplits.memberId, Number(memberId)))
      );

    if (existing) {
      await db
        .update(billSplits)
        .set({
          amount: +(amount + servicePerMember).toFixed(2),
          paid: false,
        })
        .where(
          and(eq(billSplits.billId, billId), eq(billSplits.memberId, Number(memberId)))
        );
    } else {
      await db.insert(billSplits).values({
        billId,
        memberId: Number(memberId),
        amount: +(amount + servicePerMember).toFixed(2),
        paid: false,
      });
    }
  }

  console.log(`✅ Split recalculated for single order bill ${billId}`);
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
