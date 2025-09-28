// import { Router } from "express";
// import * as paymentController from "src/controllers/Payment-controller.js";

// const router = Router();

// // สร้าง QR สำหรับจ่าย
// router.post("/", paymentController.createPayment);

// // ยืนยันการจ่าย (เรียกจาก callback หรือ admin confirm)
// router.patch("/:paymentId/confirm", paymentController.confirmPayment);

// export default router;
import { Router } from "express";
import * as paymentController from "src/controllers/Payment.controller.ts";

const router = Router();

// สร้าง QR สำหรับจ่าย
router.post("/", paymentController.createPayment);

// ยืนยันการจ่าย (manual confirm โดย admin)
router.patch("/:paymentId/confirm", paymentController.confirmPayment);

// callback จาก SCB หลังลูกค้าจ่ายเสร็จ
// URL นี้ต้องใส่ไปใน SCB Developer Portal (Payment Confirmation Endpoint)
router.post("/scb-callback", paymentController.scbCallback);

export default router;
