const session = require("express-session");

module.exports = session({
  name: "cafeflow.sid",
  secret: process.env.SESSION_SECRET || "cafeflow_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,        // true ONLY in HTTPS
    sameSite: "lax"       // ⭐ REQUIRED ⭐
  }
});
