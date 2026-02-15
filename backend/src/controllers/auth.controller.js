const db = require("../config/database");
const bcrypt = require("bcrypt");

/* =========================
   REGISTER (CUSTOMER)
========================= */
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `
      INSERT INTO users (role, name, email, phone, password_hash)
      VALUES ('customer', ?, ?, ?, ?)
      `,
      [name, email, phone || null, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful"
    });

  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   LOGIN (ADMIN / CUSTOMER)
========================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ? AND status = 'active'",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // ✅ SAFE SESSION ASSIGNMENT (DO NOT OVERWRITE WHOLE SESSION)
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    await db.query(
      "UPDATE users SET last_login = NOW() WHERE id = ?",
      [user.id]
    );

    return res.status(200).json({
      success: true,
      user: req.session.user
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   LOGOUT (SAFE)
========================= */
exports.logout = (req, res) => {
  try {
    // ❗ DO NOT destroy the entire session store
    req.session.user = null;

    res.clearCookie("cafeflow.sid"); // must match session name

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });

  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
};

/* =========================
   GET LOGGED-IN USER PROFILE
========================= */
exports.getProfile = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Session expired"
    });
  }

  return res.status(200).json({
    success: true,
    user: req.session.user
  });
};
