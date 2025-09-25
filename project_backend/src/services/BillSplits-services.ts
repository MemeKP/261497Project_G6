import { db } from "src/db/client.js";
import { bills, billSplits, orderItems, menuItems, members, orders } from "src/db/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Generate a new bill for an order
 */
export async function generateBill(orderId: number) {
  // check ว่า order มีจริงไหม
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new Error("Order not found");

  // check ว่า orderId นี้มี bill อยู่แล้วหรือยัง
  const existingBill = await db.select().from(bills).where(eq(bills.orderId, orderId));
  if (existingBill.length > 0) {
    return existingBill[0]; //ถ้ามีแล้ว return ไปเลย ไม่สร้างซ้ำ
  }

  const diningSessionId = order.diningSessionId;

  // คำนวณ subtotal
  const items = await db
    .select({
      price: menuItems.price,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * (item.quantity ?? 0),
    0
  );

  // service charge 7%
  const serviceCharge = +(subtotal * 0.07).toFixed(2);
  const total = +(subtotal + serviceCharge).toFixed(2);

  const [bill] = await db
    .insert(bills)
    .values({
      orderId,
      diningSessionId,
      subtotal,
      serviceCharge,
      vat: 0, // ถ้าอนาคตมี VAT ค่อยบวกเพิ่ม
      total,
      status: "UNPAID",
    })
    .returning();

  return bill;
}

/**
 * Recalculate split by members
 */
export async function calculateSplit(orderId: number, billId: number) {
  // check ว่า bill มีจริง
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
  if (!bill) throw new Error("Bill not found");

  // ลบ splits เดิม
  await db.delete(billSplits).where(eq(billSplits.billId, billId));

  // ดึง orderItems + menuItems
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

  for (const [memberId, amount] of Object.entries(memberTotals)) {
    await db.insert(billSplits).values({
      billId,
      memberId: Number(memberId),
      amount: +amount.toFixed(2), // ✅ ตัดเป็นทศนิยม 2 ตำแหน่ง
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
      name: members.name,
    })
    .from(billSplits)
    .innerJoin(members, eq(members.id, billSplits.memberId))
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
    await db.update(bills).set({ status: "PAID" }).where(eq(bills.id, billId));
    allPaid = true;
  }

  return { ...updated, allPaid };
}


