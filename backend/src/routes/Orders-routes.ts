import { Router } from "express";
import * as ordersController from "src/controllers/Orders-controller.js";

const router = Router();

router.post("/", ordersController.createOrder);                     // POST /orders
router.get("/", ordersController.getAllOrders);                     // GET /orders
router.get("/:id", ordersController.getOrderById);                  // GET /orders/:id
router.get("/session/:sessionId", ordersController.getOrders);      // GET /orders/session/:sessionId
router.patch("/:id/status", ordersController.updateOrderStatus);    // PATCH /orders/:id/status
router.delete("/:id", ordersController.deleteOrder);                // DELETE /orders/:id

export default router;

