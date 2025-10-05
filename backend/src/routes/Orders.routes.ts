import { Router } from "express";
import * as ordersController from "src/controllers/Orders.controller.js";

const router = Router();

// Create order (checkout พร้อม items)
router.post("/", ordersController.createOrder);                     // POST /orders

// Get all orders (admin/debug)
router.get("/", ordersController.getAllOrders);                     // GET /orders

// Get orders by session → ต้องมาก่อน /:id
router.get("/session/:sessionId", ordersController.getOrders);      // GET /orders/session/:sessionId

// Get single order by id
router.get("/:id", ordersController.getOrderById);                  // GET /orders/:id

// Update order status
router.patch("/:id/status", ordersController.updateOrderStatus);    // PATCH /orders/:id/status

// Delete order
router.delete("/:id", ordersController.deleteOrder);                // DELETE /orders/:id

export default router;

