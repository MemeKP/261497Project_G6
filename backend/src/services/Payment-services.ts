import axios from "axios";
// import { db } from "src/db/client2.js";
import { dbClient as db } from "@db/client.js";
import { payments, billSplits, bills } from "db/schema.js";
import { eq, and } from "drizzle-orm";

const SCB_BASE_URL = "https://api-sandbox.partners.scb/partners/sandbox/v3";
const CLIENT_ID = process.env.SCB_CLIENT_ID!;
const CLIENT_SECRET = process.env.SCB_CLIENT_SECRET!;
const BIZ_ID = process.env.SCB_BIZ_ID!; // merchant id

// Step 1: Get access token
async function getAccessToken() {
  const res = await axios.post(
    `${SCB_BASE_URL}/oauth/token`,
    {
      applicationKey: CLIENT_ID,
      applicationSecret: CLIENT_SECRET,
    },
    { headers: { "Content-Type": "application/json" } }
  );

  return res.data.data.accessToken;
}

// Step 2: Generate QR code + save payment record
export async function createQrPayment({
  billId,
  billSplitId,
  memberId,
  amount,
  method,
}: {
  billId: number;
  billSplitId?: number;
  memberId?: number;
  amount: number;
  method: string;
}) {
  try {
    const accessToken = await getAccessToken();

    const transactionId = `BILL-${billId}-${Date.now()}`;
    const payload = {
      qrType: "PP",
      ppType: "BILLERID",
      ppId: BIZ_ID,
      amount: amount.toFixed(2),
      // ✅ SCB sandbox ต้องการ ref1 เป็นตัวเลข 20 หลัก
      ref1: billId.toString().padStart(20, "0"),
      ref2: "RESTAURANT",
      ref3: "NLP", // ตาม Reference 3 Prefix ใน SCB Portal
    };

   const res = await axios.post(
  `${SCB_BASE_URL}/payment/qrcode/create`,
  payload,
  {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "resourceOwnerId": CLIENT_ID,
      "requestUId": transactionId,
    },
  }
);

    const qrRawData = res.data.data.qrRawData;

    const [payment] = await db
      .insert(payments)
      .values({
        billId,
        billSplitId,
        memberId,
        amount,
        method,
        status: "PENDING",
      })
      .returning();

    return {
      paymentId: payment.id,
      billId: payment.billId,
      billSplitId: payment.billSplitId,
      memberId: payment.memberId,
      amount: payment.amount,
      qrCode: qrRawData,
      status: payment.status,
    };
  } catch (err: any) {
    const errorMsg = err.response?.data || err.message;
    console.error("createQrPayment error:", errorMsg);
    throw new Error(JSON.stringify(errorMsg));
  }
}

// Step 3: Manual confirm (admin confirm)
export async function confirmPayment(paymentId: number) {
  const [updated] = await db
    .update(payments)
    .set({ status: "PAID", paidAt: new Date() })
    .where(eq(payments.id, paymentId))
    .returning();

  if (!updated) return null;

  // ถ้าเป็น split → update billSplits.paid = true
  if (updated.billSplitId && updated.memberId) {
    await db
      .update(billSplits)
      .set({ paid: true })
      .where(
        and(
          eq(billSplits.id, updated.billSplitId),
          eq(billSplits.memberId, updated.memberId)
        )
      );
  }

  // check ว่าทุก split จ่ายครบหรือยัง → mark bill เป็น PAID
  const remaining = await db
    .select()
    .from(billSplits)
    .where(
      and(eq(billSplits.billId, updated.billId), eq(billSplits.paid, false))
    );

  if (remaining.length === 0) {
    await db.update(bills).set({ status: "PAID" }).where(eq(bills.id, updated.billId));
  }

  return updated;
}

// Step 4: Confirm by SCB callback (ใช้ ref1)
export async function markAsPaidByRef1(ref1: string) {
  // ref1 = billId ที่ถูก padStart(20, "0")
  const billId = parseInt(ref1, 10);

  const [updated] = await db
    .update(payments)
    .set({ status: "PAID", paidAt: new Date() })
    .where(eq(payments.billId, billId))
    .returning();

  if (updated) {
    await db.update(bills).set({ status: "PAID" }).where(eq(bills.id, billId));
  }

  return updated;
}

