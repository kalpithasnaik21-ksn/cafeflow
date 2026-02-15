const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const menuRoutes = require("./menu.routes");
const adminRoutes = require("./admin.routes");
const orderRoutes = require("./order.routes");
const staffRoutes = require("./staff.routes");

router.get("/test", (req, res) => {
  res.json({ message: "API routes working ✅" });
});

router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);
router.use("/admin", adminRoutes);
router.use("/orders", orderRoutes);
router.use("/staff", staffRoutes);

module.exports = router;
