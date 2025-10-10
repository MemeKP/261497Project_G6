import { dbClient } from "@db/client.js";
import { bills, billSplits, diningSessions, group_members, payments } from "@db/schema.js";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import * as paymentService from "src/services/Payment-services.js";

// Create payment (PromptPay)
export async function createPayment(req: Request, res: Response) {
  try {
    const { billId, memberId } = req.body;

    if (!billId) {
      return res.status(400).json({ error: "billId is required" });
    }

    const result = await paymentService.createQrPayment({
      billId: Number(billId),
      memberId: memberId ? Number(memberId) : undefined,
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// Manual confirm
export async function confirmPayment(req: Request, res: Response) {
  try {
    const { paymentId } = req.params;
    if (isNaN(Number(paymentId))) {
      return res.status(400).json({ error: "Invalid paymentId" });
    }

    const updated = await paymentService.confirmPayment(Number(paymentId));
    if (!updated) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(updated);
  } catch (err: any) {
    console.error("confirmPayment error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// Mock callback
export async function mockCallback(req: Request, res: Response) {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: "paymentId is required" });
    }

    await paymentService.mockCallback(Number(paymentId));

    res.status(200).json({ message: "ACK (mock callback executed)" });
  } catch (err: any) {
    console.error("mockCallback error:", err.message);
    res.status(500).json({ error: "Callback handling failed" });
  }
}

export async function getPaymentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { billId } = req.params;
    const { memberId } = req.query;

    if (!billId) {
      return res.status(400).json({
        error: "Bill ID is required"
      });
    }

    // แปลง billId เป็น number
    const billIdNum = parseInt(billId as string);
    const memberIdNum = memberId ? parseInt(memberId as string) : null;

    let payment;

    if (memberIdNum) {
      // กรณีจ่ายแบบ split - ใช้ Drizzle query
      const result = await dbClient
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.billId, billIdNum),
            eq(payments.memberId, memberIdNum)
          )
        )
        .orderBy(desc(payments.paidAt))
        .limit(1);

      payment = result[0];
    } else {
      // กรณีจ่ายทั้งบิล
      const result = await dbClient
        .select()
        .from(payments)
        .where(eq(payments.billId, billIdNum))
        .orderBy(desc(payments.paidAt))
        .limit(1);

      payment = result[0];
    }

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found"
      });
    }

    res.json({
      status: payment.status,
      paymentId: payment.id,
      amount: payment.amount,
      billId: payment.billId,
      memberId: payment.memberId,
      billSplitId: payment.billSplitId,
    });

  } catch (error) {
    console.error("Error fetching payment status:", error);
    next(error);
  }
}

export const getPaymentsByTable = async (req: Request, res: Response, next: NextFunction) => {
  const { tableId } = req.query;

  if (!tableId) {
    return res.status(400).json({ 
      success: false,
      error: 'tableId is required' 
    });
  }

  try {
    const tableIdNum = parseInt(tableId as string);

    // 1. ดึง dining session ที่ active ของโต๊ะนี้
    const diningSessionResult = await dbClient
      .select()
      .from(diningSessions)
      .where(
        and(
          eq(diningSessions.tableId, tableIdNum),
          eq(diningSessions.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (diningSessionResult.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No active dining session found for this table' 
      });
    }

    const diningSession = diningSessionResult[0];
    const diningSessionId = diningSession.id;

    // 2. ดึง bills ของ session นี้
    const billsResult = await dbClient
      .select()
      .from(bills)
      .where(eq(bills.diningSessionId, diningSessionId));

    if (billsResult.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No bills found for this dining session' 
      });
    }

    const billIds = billsResult.map(bill => bill.id);

    // 3. ดึง bill splits และ member information
    const splitsResult = await dbClient
      .select({
        splitId: billSplits.id,
        billId: billSplits.billId,
        memberId: billSplits.memberId,
        amount: billSplits.amount,
        paid: billSplits.paid,
        memberName: group_members.name,
        // memberRole: group_members.role,
        billCreatedAt: bills.createdAt,
      })
      .from(billSplits)
      .innerJoin(bills, eq(billSplits.billId, bills.id))
      .innerJoin(group_members, eq(billSplits.memberId, group_members.id))
      .where(inArray(billSplits.billId, billIds));

    // 4. ดึง payment information
    const paymentsResult = await dbClient
      .select()
      .from(payments)
      .where(inArray(payments.billId, billIds));

    // 5. รวมข้อมูลและจัดรูปแบบ
    const formattedPayments = splitsResult.map(split => {
      // หา payment ที่เกี่ยวข้องกับ split นี้
      const relatedPayment = paymentsResult.find(p => 
        p.billSplitId === split.splitId || 
        (p.billId === split.billId && p.memberId === split.memberId)
      );

      // กำหนดสถานะ: ถ้ามี payment และ status เป็น PAID หรือ billSplit paid เป็น true = Paid
      const isPaid = split.paid || relatedPayment?.status === 'PAID';
      
      return {
        billId: split.billId,
        splitId: split.splitId,
        memberId: split.memberId,
        name: split.memberName,
        // role: split.memberRole,
        amount: Number(split.amount),
        status: isPaid ? 'PAID' : 'PENDING',
        date: relatedPayment?.paidAt || split.billCreatedAt.toISOString(),
        method: relatedPayment?.method || 'QR',
        paymentId: relatedPayment?.id,
      };
    });

    res.json(formattedPayments);

  } catch (err) {
    console.error('Error fetching payments by table:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

export const togglePaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { billId, splitId } = req.params;
    const { status } = req.body;

    const billIdNum = parseInt(billId);
    const splitIdNum = parseInt(splitId);

    // 1. อัพเดต bill_splits.paid
    const [updatedSplit] = await dbClient
      .update(billSplits)
      .set({ 
        paid: status === 'PAID' ? true : false
      })
      .where(
        and(
          eq(billSplits.id, splitIdNum),
          eq(billSplits.billId, billIdNum)
        )
      )
      .returning();

    if (!updatedSplit) {
      return res.status(404).json({
        success: false,
        error: "Bill split not found"
      });
    }

    // 2. อัพเดต payments.status (ถ้ามี payment record)
    let updatedPayment = null;
    const existingPayment = await dbClient
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.billSplitId, splitIdNum),
          eq(payments.billId, billIdNum)
        )
      )
      .limit(1);

    if (existingPayment.length > 0) {
      [updatedPayment] = await dbClient
        .update(payments)
        .set({
          status: status,
          paidAt: status === 'PAID' ? new Date() : null
        })
        .where(eq(payments.id, existingPayment[0].id))
        .returning();
    } else {
      // สร้าง payment record ใหม่ถ้ายังไม่มี
      [updatedPayment] = await dbClient
        .insert(payments)
        .values({
          billId: billIdNum,
          billSplitId: splitIdNum,
          memberId: updatedSplit.memberId,
          method: 'MANUAL', // Admin manually confirmed
          amount: updatedSplit.amount,
          status: status,
          paidAt: status === 'PAID' ? new Date() : null
        })
        .returning();
    }

    // 3. เช็คว่าทั้ง bill จ่ายครบแล้วหรือยัง
    const remainingSplits = await dbClient
      .select()
      .from(billSplits)
      .where(
        and(
          eq(billSplits.billId, billIdNum),
          eq(billSplits.paid, false)
        )
      );

    // 4. ถ้าจ่ายครบแล้ว อัพเดต bill status
    if (remainingSplits.length === 0) {
      await dbClient
        .update(bills)
        .set({
          status: 'PAID'
        })
        .where(eq(bills.id, billIdNum));
    }

    res.json({
      success: true,
      data: {
        isPaid: updatedSplit.paid,
        paymentStatus: status,
        paidAt: updatedPayment?.paidAt
      }
    });

  } catch (error) {
    console.error("Error toggling payment status:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};