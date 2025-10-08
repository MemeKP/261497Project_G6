import type { Request, Response } from "express";
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
