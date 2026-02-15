const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables
dotenv.config();
console.log("🚀 App.js started");

// Initialize app
const app = express();

// Database connection
require("./config/database");

// Session config
const sessionConfig = require("./config/session");

// ===============================
// MIDDLEWARES
// ===============================

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(sessionConfig);

app.set("trust proxy", 1);


// ===============================
// STATIC FILES
// ===============================

// Serve frontend
app.use(express.static(path.join(__dirname, "../../frontend")));

// Serve product images
app.use(
  "/images",
  express.static(path.join(__dirname, "../images"))
);

// ===============================
// ROUTES
// ===============================

// Main API router (auth, admin, orders, staff etc.)
app.use("/api", require("./routes"));

// ✅ Admin Menu Routes (needed for /api/admin/menu/products)
app.use("/api/admin/menu", require("./routes/adminmenu.routes"));

app.use("/api/payment", require("./routes/payment.routes"));


// ===============================
// ROOT ROUTE
// ===============================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 5000;

// Only start server locally (not on Vercel)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
