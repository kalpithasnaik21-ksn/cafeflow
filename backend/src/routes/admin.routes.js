const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const requireAdmin = require("../middleware/role.middleware");
const auth = require("../middleware/auth.middleware");
const adminOrdersRoutes = require("./adminOrders.routes");

// ===============================
// PRODUCT & CATEGORY ROUTES
// ===============================

router.post("/categories", auth, requireAdmin, adminController.addCategory);
router.post("/products", auth, requireAdmin, adminController.addProduct);

// ===============================
// ADMIN ORDER ROUTES
// ===============================

router.use("/orders", auth, requireAdmin, adminOrdersRoutes);

module.exports = router;
