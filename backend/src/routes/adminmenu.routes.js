const express = require("express");
const router = express.Router();

const adminMenuController = require("../controllers/adminmenu.controller");
const upload = require("../middleware/upload");

// ===== MENU CRUD =====
router.get("/products", adminMenuController.getAllProductsAdmin);
router.post("/products", adminMenuController.addProduct);
router.put("/products/:id", adminMenuController.updateProduct);
router.put("/products/:id/stock", adminMenuController.toggleStock);

// 🔥 PERMANENT DELETE (controller-based)
router.delete(
  "/products/:id",
  adminMenuController.deleteProduct
);

// ===== IMAGE UPLOAD =====
router.post(
  "/products/upload",
  upload.single("image"),
  adminMenuController.uploadProductImage
);

module.exports = router;
