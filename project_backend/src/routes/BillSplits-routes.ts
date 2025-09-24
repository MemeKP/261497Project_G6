import { Router } from "express";
import * as billSplitController from "src/controllers/BillSplits-controller.js";

const router = Router();

// สร้างbill จากorder
router.post("/orders/:id/bill", billSplitController.createBill);

// คำนวณsplitใหม่
router.patch("/orders/:id/splits/calc", billSplitController.recalcSplit);

// ดูsplit ของbill
router.get("/bills/:id/splits", billSplitController.getSplit);

// mark paid ให้ member
router.patch("/bills/:id/splits/:memberId/paid", billSplitController.markPaid);

export default router;

