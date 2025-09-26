import type { Request, Response } from "express";
import * as billSplitService from "src/services/BillSplits-services.js";

export async function createBill(req: Request, res: Response) {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    // ไม่ต้องรับ diningSessionId จาก client → service หาเองจาก order
    const bill = await billSplitService.generateBill(orderId);
    res.status(201).json(bill);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate bill" });
  }
}

export async function recalcSplit(req: Request, res: Response) {
  try {
    const orderId = Number(req.params.id);
    const { billId } = req.body;

    if (isNaN(orderId)) return res.status(400).json({ error: "Invalid order id" });
    if (isNaN(Number(billId))) return res.status(400).json({ error: "Invalid bill id" });

    const result = await billSplitService.calculateSplit(orderId, Number(billId));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to recalc split" });
  }
}

export async function getSplit(req: Request, res: Response) {
  try {
    const billId = Number(req.params.id);
    if (isNaN(billId)) return res.status(400).json({ error: "Invalid bill id" });

    const result = await billSplitService.getSplit(billId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get split" });
  }
}

export async function markPaid(req: Request, res: Response) {
  try {
    const billId = Number(req.params.id);
    const memberId = Number(req.params.memberId);

    if (isNaN(billId)) return res.status(400).json({ error: "Invalid bill id" });
    if (isNaN(memberId)) return res.status(400).json({ error: "Invalid member id" });

    const result = await billSplitService.updatePayment(billId, memberId);
    if (!result) return res.status(404).json({ error: "Bill split not found" });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update payment" });
  }
}
