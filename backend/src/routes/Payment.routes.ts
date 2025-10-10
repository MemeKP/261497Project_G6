import { Router } from "express";
import * as paymentController from "src/controllers/Payment.controller.js";

const router = Router();

// สร้าง QR สำหรับจ่าย
router.post("/", paymentController.createPayment);
// ยืนยันการจ่าย (manual confirm โดย admin)
router.patch("/:paymentId/confirm", paymentController.confirmPayment);
// mock callback (แทน SCB callback)
router.post("/mock-callback", paymentController.mockCallback);
// GET payment history by table/session
// router.get("/sessions/:sessionId/payments", paymentController.getPaymentHistory);

export default router;
