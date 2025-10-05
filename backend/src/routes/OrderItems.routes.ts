import { Router } from "express";
import * as orderItemController from "src/controllers/OrderItems.controller.js";

const router = Router();

// Create new order item
router.post("/", orderItemController.createOrderItem);

// Get order items by orderId (cart)
router.get("/orders/:orderId/items", orderItemController.getOrderItems);

// Get order items by sessionId (order status page)
router.get("/sessions/:sessionId/items", orderItemController.getOrderItemsBySession);

// Update order item (qty/note)
router.patch("/:id", orderItemController.updateOrderItem);

// Update status ของ order item (pending → preparing → served)
router.patch("/:id/status", orderItemController.updateOrderItemStatus);

// Delete order item
router.delete("/:id", orderItemController.deleteOrderItem);

export default router;