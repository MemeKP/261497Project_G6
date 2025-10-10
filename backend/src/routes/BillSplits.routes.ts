import { Router } from "express";
import * as billSplitController from "src/controllers/BillSplits.controller.js";

const router = Router();

// สร้างbill จากorder
router.post("/orders/:id/bill", billSplitController.createBill);
// สร้าง full bill ของทั้ง session
router.post("/sessions/:id/bill", billSplitController.createSessionBill);
// ดูรายละเอียดบิลทั้งหมด (หน้า Your Order)
router.get("/sessions/:id/bill", billSplitController.getSessionBill);
// คำนวณsplitใหม่
router.patch("/orders/:id/splits/calc", billSplitController.recalcSplit);
// ดูsplit ของbill
router.get("/bills/:id/splits", billSplitController.getSplit);
// Toggle payment status (for admin)
// router.patch("/bills/:billId/splits/:memberId/toggle-status", billSplitController.togglePaymentStatus);
// mark paid ให้ member
router.patch("/bills/:id/splits/:memberId/paid", billSplitController.markPaid);

export default router;
