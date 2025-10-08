import type { Request, Response } from "express";
import * as billSplitService from "src/services/BillSplits-services.js";
import { dbClient as db } from "db/client.js";
import { bills } from "db/schema.js";
import { eq } from "drizzle-orm";

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


export async function createSessionBill(req: Request, res: Response) {
  try {
    const sessionId = Number(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session id" });
    }

    const bill = await billSplitService.generateBillForSession(sessionId);
    res.status(201).json(bill);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate session bill" });
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

export async function getBillDetails(req: Request, res: Response) {
  try {
    const billId = Number(req.params.id);
    if (isNaN(billId)) return res.status(400).json({ error: "Invalid bill id" });

    // ดึงข้อมูลบิล
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
    if (!bill) return res.status(404).json({ error: "Bill not found" });

    // ดึง splits
    const splits = await billSplitService.getSplit(billId);

    // รวมข้อมูลทั้งหมดส่งกลับ
    res.json({
      billId: bill.id,
      sessionId: bill.diningSessionId,
      status: bill.status,
      subtotal: bill.subtotal,
      serviceCharge: bill.serviceCharge,
      vat: bill.vat,
      total: bill.total,
      splits,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get bill details" });
  }
}

export async function getSessionBill(req: Request, res: Response) {
  try {
    const sessionId = Number(req.params.id);
    if (isNaN(sessionId)) return res.status(400).json({ error: "Invalid session id" });

    const bill = await billSplitService.generateBillForSession(sessionId);
    if (!bill) return res.status(404).json({ error: "No bill found for this session" });

    res.json(bill);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get session bill" });
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