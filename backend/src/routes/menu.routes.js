const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menu.controller");

router.get("/products", menuController.getAllProducts);
router.get("/categories/:id/products", menuController.getProductsByCategory);

module.exports = router;
