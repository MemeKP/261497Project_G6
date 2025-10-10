import generatePayload from "promptpay-qr";
import { dbClient as db } from "@db/client.js";
import { payments, billSplits, bills } from "db/schema.js";
import { eq, and } from "drizzle-orm";
import QRCode from "qrcode";

async function calculateBillTotal(billId: number): Promise<number> {
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
  if (!bill) throw new Error("Bill not found");
  return Number(bill.total); 
}

async function calculateSplitTotal(billSplitId: number): Promise<number> {
  const [split] = await db.select().from(billSplits).where(eq(billSplits.id, billSplitId));
  if (!split) throw new Error("Bill split not found");
  return Number(split.amount); 
}

export async function createQrPayment({
  billId,
  memberId,
}: {
  billId: number;
  memberId?: number;
}) {
  const promptPayId = process.env.PROMPTPAY_ID!;
  if (!promptPayId) throw new Error("PROMPTPAY_ID not configured in .env");

  let amount: number;
  let billSplitId: number | undefined;

  if (memberId) {
    const [split] = await db
      .select()
      .from(billSplits)
      .where(and(eq(billSplits.billId, billId), eq(billSplits.memberId, memberId)));

    if (!split) throw new Error("Bill split not found for this member");
    amount = Number(split.amount);
    billSplitId = split.id;
  } else {
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
    if (!bill) throw new Error("Bill not found");
    amount = Number(bill.total);
  }
  const payload = generatePayload(promptPayId, { amount });
  const qrCode = await QRCode.toDataURL(payload);

  const [payment] = await db
    .insert(payments)
    .values({
      billId,
      billSplitId,
      memberId,
      amount,
      method: "QR",
      status: "PENDING",
    })
    .returning();

  return {
    paymentId: payment.id,
    billId: payment.billId,
    billSplitId: payment.billSplitId,
    memberId: payment.memberId,
    amount: payment.amount,
    qrCode,
    payload,
    status: payment.status,
  };
}

export async function confirmPayment(paymentId: number) {
  const [updated] = await db
    .update(payments)
    .set({ status: "PAID", paidAt: new Date() })
    .where(eq(payments.id, paymentId))
    .returning();

  if (!updated) return null;

  if (updated.billSplitId && updated.memberId) {
    await db
      .update(billSplits)
      .set({ paid: true })
      .where(
        and(
          eq(billSplits.id, updated.billSplitId),
          eq(billSplits.memberId, updated.memberId),
        ),
      );
  }

  const remaining = await db
    .select()
    .from(billSplits)
    .where(and(eq(billSplits.billId, updated.billId), eq(billSplits.paid, false)));

  if (remaining.length === 0) {
    await db.update(bills).set({ status: "PAID" }).where(eq(bills.id, updated.billId));
  }

  return updated;
}

export async function mockCallback(paymentId: number) {
  return confirmPayment(paymentId);
}

export async function getPaymentStatus(billId: number, memberId?: number) {
  if (memberId) {
    const [split] = await db
      .select({
        id: billSplits.id,
        billId: billSplits.billId,
        memberId: billSplits.memberId,
        paid: billSplits.paid,
      })
      .from(billSplits)
      .where(and(eq(billSplits.billId, billId), eq(billSplits.memberId, memberId)));

    if (!split) {
      throw new Error("Bill split not found for this member");
    }

    return {
      success: true,
      type: "SPLIT",
      status: split.paid ? "PAID" : "UNPAID",
      billId: split.billId,
      memberId: split.memberId,
    };
  }

  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
  if (!bill) throw new Error("Bill not found");

  return {
    success: true,
    type: "FULL",
    status: bill.status ?? "UNPAID",
    billId: bill.id,
    total: bill.total,
  };
}
