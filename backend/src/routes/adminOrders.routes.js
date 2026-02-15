const express = require("express");
const router = express.Router();

const adminOrdersController = require("../controllers/adminOrders.controller");

// GET all orders
router.get("/", adminOrdersController.getOrders);

// GET dashboard summary
router.get("/dashboard", adminOrdersController.getDashboardCounts);

// GET single order details
router.get("/:id", adminOrdersController.getOrderDetails);

// UPDATE order status
router.put("/:id/status", adminOrdersController.updateOrderStatus);

// CANCEL order
router.put("/:id/cancel", adminOrdersController.cancelOrder);

// VERIFY UPI PAYMENT
router.put("/:id/verify-payment", adminOrdersController.verifyPayment);

module.exports = router;
