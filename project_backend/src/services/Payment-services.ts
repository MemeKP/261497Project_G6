import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { db } from "src/db/client.js";
import { payments, billSplits, bills } from "src/db/schema.js";
import { eq, and } from "drizzle-orm";

/** ใช้ยอดที่คำนวณและบันทึกไว้แล้วในตาราง bills */
async function calculateBillTotal(billId: number): Promise<number> {
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
  if (!bill) throw new Error("Bill not found");
  return Number(bill.total); // รวม service แล้ว ตาม flow generateBill
}

/** ใช้ยอดที่คำนวณและบันทึกไว้แล้วในตาราง bill_splits */
async function calculateSplitTotal(billSplitId: number): Promise<number> {
  const [split] = await db.select().from(billSplits).where(eq(billSplits.id, billSplitId));
  if (!split) throw new Error("Bill split not found");
  return Number(split.amount); // เป็นยอดสุทธิของ member นั้นแล้ว
}

/** สร้าง PromptPay QR จาก bill ทั้งบิลหรือจากบิลสปลิต */
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
    //  หา split ตาม billId + memberId
    const [split] = await db
      .select()
      .from(billSplits)
      .where(and(eq(billSplits.billId, billId), eq(billSplits.memberId, memberId)));

    if (!split) throw new Error("Bill split not found for this member");
    amount = Number(split.amount);
    billSplitId = split.id;
  } else {
    //  จ่ายเต็มโต๊ะ
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
    if (!bill) throw new Error("Bill not found");
    amount = Number(bill.total);
  }

  //  สร้าง PromptPay QR
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


/** กดยืนยันว่าจ่ายแล้ว (manual/admin หรือ mock callback) */
export async function confirmPayment(paymentId: number) {
  const [updated] = await db
    .update(payments)
    .set({ status: "PAID", paidAt: new Date() })
    .where(eq(payments.id, paymentId))
    .returning();

  if (!updated) return null;

  // ถ้าเป็นการจ่ายแบบแยก ให้ติ๊ก paid ใน bill_splits ด้วย
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

  // ถ้าทุก split ของบิลนี้จ่ายครบแล้ว → ปิดบิลเป็น PAID
  const remaining = await db
    .select()
    .from(billSplits)
    .where(and(eq(billSplits.billId, updated.billId), eq(billSplits.paid, false)));

  if (remaining.length === 0) {
    await db.update(bills).set({ status: "PAID" }).where(eq(bills.id, updated.billId));
  }

  return updated;
}

/** mock callback: ใช้ตอนทดสอบแทน callback จริงจากธนาคาร */
export async function mockCallback(paymentId: number) {
  return confirmPayment(paymentId);
}