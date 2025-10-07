import { Router } from "express";
import * as orderItemController from "src/controllers/OrderItems.controller.js";

const router = Router();

// Create new order item
router.post("/", orderItemController.createOrderItem);     // POST /order-items
// Update order item
router.patch("/:id", orderItemController.updateOrderItem); // PATCH /order-items/:id
// Delete order item
router.delete("/:id", orderItemController.deleteOrderItem); // DELETE /order-items/:id
router.get('/count', orderItemController.getCartItemCount)
export default router;
