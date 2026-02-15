const db = require("../config/database");

// =========================
// ADD CATEGORY (ADMIN)
// =========================
exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }

    // Check duplicate
    const [existing] = await db.query(
      "SELECT id FROM categories WHERE name = ?",
      [name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Category already exists"
      });
    }

    await db.query(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
      [name, description || null]
    );

    return res.status(201).json({
      success: true,
      message: "Category added successfully"
    });

  } catch (error) {
    console.error("Add category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add category"
    });
  }
};

// =========================
// ADD PRODUCT (ADMIN)
// =========================
exports.addProduct = async (req, res) => {
  try {
    const { name, category_id, description, price, image_url } = req.body;

    // Basic validation
    if (!name || !category_id || !price) {
      return res.status(400).json({
        success: false,
        message: "Name, category_id, and price are required"
      });
    }

    // Check category exists
    const [categories] = await db.query(
      "SELECT id FROM categories WHERE id = ? AND is_active = true",
      [category_id]
    );

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    await db.query(
      `INSERT INTO products (name, category_id, description, price, image_url)
       VALUES (?, ?, ?, ?, ?)`,
      [name, category_id, description || null, price, image_url || null]
    );

    return res.status(201).json({
      success: true,
      message: "Product added successfully"
    });

  } catch (error) {
    console.error("Add product error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add product"
    });
  }
};

// =========================
// GET ALL ORDERS (ADMIN)
// =========================
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;

    let ordersQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.order_type,
        o.status,
        o.total_amount,
        o.created_at,
        u.name AS customer_name,
        u.email AS customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;

    const params = [];

    if (status) {
      ordersQuery += " WHERE o.status = ?";
      params.push(status);
    }

    ordersQuery += " ORDER BY o.created_at DESC";

    const [orders] = await db.query(ordersQuery, params);

    // Fetch items for each order
    for (const order of orders) {
      const [items] = await db.query(
        `
        SELECT 
          oi.quantity,
          oi.price,
          p.name AS product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
        `,
        [order.id]
      );

      order.items = items;
    }

    return res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

// =========================
// UPDATE ORDER STATUS (ADMIN)
// =========================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const order = rows[0];

    const statusFlow = {
      delivery: [
        "placed",
        "preparing",
        "ready",
        "out_for_delivery",
        "completed"
      ],
      "dine-in": [
        "placed",
        "preparing",
        "ready",
        "completed"
      ],
      takeaway: [
        "placed",
        "preparing",
        "ready",
        "completed"
      ]
    };

    const flow = statusFlow[order.order_type];

    if (!flow) {
      return res.status(400).json({
        success: false,
        message: "Invalid order type"
      });
    }

    const currentIndex = flow.indexOf(order.status);

    if (currentIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Invalid current status"
      });
    }

    const nextStatus = flow[currentIndex + 1];

    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message: "Order already completed"
      });
    }

    if (status !== nextStatus) {
      return res.status(400).json({
        success: false,
        message: "Invalid status transition"
      });
    }

    await db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    return res.json({ success: true });

  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({ success: false });
  }
};



// =========================
// STAFF – VIEW ACTIVE ORDERS
// =========================
exports.getActiveOrdersForStaff = async (req, res) => {
  try {
    const [orders] = await db.query(
      `
      SELECT 
        o.id,
        o.order_number,
        o.order_type,
        o.status,
        o.created_at
      FROM orders o
      WHERE o.status IN ('pending', 'preparing')
      ORDER BY o.created_at ASC
      `
    );

    for (const order of orders) {
      const [items] = await db.query(
        `
        SELECT 
          oi.quantity,
          p.name AS product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
        `,
        [order.id]
      );

      order.items = items;
    }

    return res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error("Staff orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active orders"
    });
  }
};

