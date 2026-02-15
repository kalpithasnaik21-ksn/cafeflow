const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

/* =========================
   AUTH ROUTES
========================= */

// Register (Customer only)
router.post("/register", authController.register);

// Login (Customer / Staff / Admin)
router.post("/login", authController.login);

// Logout
router.post("/logout", authController.logout);

// Get logged-in user profile (for route protection)
router.get("/profile", authController.getProfile);

module.exports = router;
