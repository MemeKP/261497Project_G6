import { Router } from "express";
import * as paymentController from "src/controllers/Payment.controller.js";

const router = Router();

// ดึงข้อมูลการชำระเงินโดยใช้ tableId
router.get('/', paymentController.getPaymentsByTable);
// สร้าง QR สำหรับจ่าย
router.post("/", paymentController.createPayment);
// ยืนยันการจ่าย (manual confirm โดย admin)
router.patch("/:paymentId/confirm", paymentController.confirmPayment);
// mock callback (แทน SCB callback)
router.post("/mock-callback", paymentController.mockCallback);
router.get('/status/:billId', paymentController.getPaymentStatus);
// PATCH /api/payments/bills/:billId/splits/:splitId/toggle-status
router.patch('/bills/:billId/splits/:splitId/toggle-status', paymentController.togglePaymentStatus);

// แสดงกราฟ
router.get('/revenue', paymentController.getRevenue);

export default router;