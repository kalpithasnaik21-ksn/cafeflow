const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const requireStaff = require("../middleware/staff.middleware");

// Staff views active orders
router.get("/orders", requireStaff, adminController.getActiveOrdersForStaff);

// Staff updates order status (reuse admin logic)
router.put(
  "/orders/:orderId/status",
  requireStaff,
  adminController.updateOrderStatus
);

module.exports = router;
