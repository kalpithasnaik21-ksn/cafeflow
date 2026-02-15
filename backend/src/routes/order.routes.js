const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");
const isAuthenticated = require("../middleware/auth.middleware");

// Place order
router.post("/", isAuthenticated, orderController.placeOrder);

// Get logged-in user's orders
router.get("/", isAuthenticated, orderController.getMyOrders);

// Get order items
router.get("/:orderId/items", isAuthenticated, orderController.getOrderItems);

// Cancel order
router.put(
  "/:id/cancel",
  isAuthenticated,
  orderController.cancelOrder
);

module.exports = router;
