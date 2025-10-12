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
// mark paid ให้ member
router.patch("/bills/:id/splits/:memberId/paid", billSplitController.markPaid);
// ในไม่สร้างซ้ำหลังกด billsplit อีก
router.get("/sessions/:id/check-bill", billSplitController.checkExistingBill); // เปลี่ยนจาก orders เป็น sessions
// ลองเพิ่มาใช้แทนตอนดูราคาว่ากินไปเท่าไหร่แล้ว (ไม่สร้างบิลจริง)
router.get("/sessions/:id/bill-preview", billSplitController.getBillPreview);
export default router;
