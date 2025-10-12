import { Router } from "express";
import * as billSplitController from "src/controllers/BillSplits.controller.js";

const router = Router();

// สร้าง bill จาก order เดียว
router.post("/orders/:id/bill", billSplitController.createBill);

// สร้าง full bill ของทั้ง session (Generate Bill)
router.post("/sessions/:id/bill", billSplitController.createSessionBill);

// ดูรายละเอียดบิลทั้งหมด (หน้า Your Bill)
router.get("/sessions/:id/bill", billSplitController.getSessionBill);

// ✅ จ่ายรวมทั้งโต๊ะ (Pay Entire Bill)
router.post("/sessions/:id/pay-entire", billSplitController.payEntireBill);

// ✅ แยกบิล (Split Bill)
router.post("/sessions/:id/split", billSplitController.splitBill);

// คำนวณ split ใหม่ (ใช้เฉพาะ debug/admin)
router.patch("/orders/:id/splits/calc", billSplitController.recalcSplit);

// ดู split ของ bill
router.get("/bills/:id/splits", billSplitController.getSplit);
// ยกเลิก Split Bill
router.delete("/bills/:id/splits", billSplitController.cancelSplit);

// mark paid ให้ member
router.patch("/bills/:id/splits/:memberId/paid", billSplitController.markPaid);

export default router;
