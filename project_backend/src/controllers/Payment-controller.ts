import type { Request, Response } from "express";
import * as paymentService from "src/services/Payment-services.js";

// สร้าง QR สำหรับจ่าย
export async function createPayment(req: Request, res: Response) {
  try {
    const { billId, billSplitId, memberId, amount, method } = req.body;

    if (!billId || !amount || !method) {
      return res.status(400).json({
        error: "billId, amount, and method are required",
      });
    }

    const result = await paymentService.createQrPayment({
      billId: Number(billId),
      billSplitId: billSplitId ? Number(billSplitId) : undefined,
      memberId: memberId ? Number(memberId) : undefined,
      amount: Number(amount),
      method,
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error("createPayment error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
}

// manual confirm (เช่น admin กด)
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

// callback จาก SCB
export async function scbCallback(req: Request, res: Response) {
  try {
    console.log("SCB Callback:", req.body);
    const { billPaymentRef1, statusCode } = req.body;

    if (statusCode === "00") {
      // 00 = success
      await paymentService.markAsPaidByRef1(billPaymentRef1);
    }

    res.status(200).json({ message: "ACK" });
  } catch (err: any) {
    console.error("scbCallback error:", err.message);
    res.status(500).json({ error: "Callback handling failed" });
  }
}
