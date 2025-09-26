import { Router } from "express";
import * as orderItemController from "src/controllers/OrderItems-controller.js";

const router = Router();

// Create new order item
router.post("/", orderItemController.createOrderItem);        // POST /order-items

// Get order items by orderId
router.get("/orders/:orderId/items", orderItemController.getOrderItems); // GET /order-items/orders/:orderId/items

// Update order item
router.patch("/:id", orderItemController.updateOrderItem);    // PATCH /order-items/:id

// Delete order item
router.delete("/:id", orderItemController.deleteOrderItem);   // DELETE /order-items/:id

export default router;
