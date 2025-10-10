import { dbClient } from "@db/client.js";
import { payments } from "@db/schema.js";
import { and, desc, eq } from "drizzle-orm";
import type { Request, Response, NextFunction} from "express";
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