const db = require("../config/database");

/* ===============================
   PLACE ORDER
================================ */
exports.placeOrder = async (req, res) => {
  console.log("REQ BODY:", req.body);

  const connection = await db.getConnection();

  try {
    const {
      order_type,
      payment_mode,
      transaction_id,
      items,
      delivery_address,
      order_note
    } = req.body;

    // ✅ Basic validation
    if (!order_type || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data"
      });
    }

    const userId = req.session.user?.id;
    const userName = req.session.user?.name;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login"
      });
    }

    // ✅ UPI validation
    if (payment_mode === "upi") {
      if (!transaction_id || transaction_id.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Valid UPI transaction ID is required"
        });
      }
    }

    const orderNumber = "ORD" + Date.now();

    await connection.beginTransaction();

    let assignedTable = null;

    // ================= DINE-IN TABLE ASSIGN =================
    if (order_type === "dine-in") {
      const [rows] = await connection.query(
        `SELECT table_number FROM tables WHERE is_occupied = 0 LIMIT 1`
      );

      if (!rows.length) {
        throw new Error("No tables available");
      }

      assignedTable = rows[0].table_number;

      await connection.query(
        `UPDATE tables SET is_occupied = 1 WHERE table_number = ?`,
        [assignedTable]
      );
    }

    // ================= CALCULATE TOTAL =================
    let totalAmount = 0;

    for (const item of items) {

      if (!item.product_id) {
        throw new Error("Invalid product ID");
      }

      const [rows] = await connection.query(
        "SELECT price FROM products WHERE id = ? AND is_available = 1",
        [item.product_id]
      );

      if (!rows.length) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      const product = rows[0];

      totalAmount += product.price * item.quantity;
    }

    // ================= PAYMENT LOGIC =================
    let paymentStatus = "pending";
    let txnId = null;

    if (payment_mode === "upi") {
      paymentStatus = "pending"; // Admin will verify
      txnId = transaction_id;
    }

    // ================= INSERT ORDER =================
    const [orderResult] = await connection.query(
      `INSERT INTO orders
(order_number, user_id, customer_name, order_type, table_number,
 delivery_address, payment_mode, payment_status,
 total_amount, order_note, transaction_id)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        userId,
        userName,
        order_type,
        assignedTable,
        delivery_address || null,
        payment_mode,
        paymentStatus,
        totalAmount,
        order_note || null,
        txnId
      ]
    );

    const orderId = orderResult.insertId;

    // ================= INSERT ORDER ITEMS =================
    for (const item of items) {

      const [rows] = await connection.query(
        "SELECT price FROM products WHERE id = ? AND is_available = 1",
        [item.product_id]
      );

      if (!rows.length) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      const product = rows[0];

      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, product.price]
      );
    }

    // ================= STATUS HISTORY =================
    await connection.query(
      `INSERT INTO order_status_history (order_id, status)
       VALUES (?, 'placed')`,
      [orderId]
    );

    let estimatedTime = "";

    if (order_type === "dine-in") {
      estimatedTime = "10 mins";
    } else if (order_type === "takeaway") {
      estimatedTime = "15–20 mins";
    } else if (order_type === "delivery") {
      estimatedTime = "30 mins";
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Order placed successfully",
      order_id: orderId,
      order_number: orderNumber,
      table_number: assignedTable || null,
      payment_status: paymentStatus,
      estimated_time: estimatedTime
    });

  } catch (error) {
    await connection.rollback();
    console.error("PLACE ORDER ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  } finally {
    connection.release();
  }
};



exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [rows] = await db.query(`
  SELECT 
    id,
    order_number,
    customer_name,
    order_type,
    table_number,
    delivery_address,
    order_note,
    payment_mode,
    status,
    total_amount,
    created_at
  FROM orders
  ORDER BY created_at DESC
`);



    // 🔥 Build structured response
    const ordersMap = {};

    rows.forEach(row => {
      if (!ordersMap[row.id]) {
        ordersMap[row.id] = {
          id: row.id,
          order_number: row.order_number,
          status: row.status,
          total_amount: row.total_amount,
          created_at: row.created_at,
          items: []
        };
      }

      // Only push item if exists
      if (row.product_id) {
        ordersMap[row.id].items.push({
          product_id: row.product_id,
          product_name: row.product_name,
          quantity: row.quantity,
          price: row.price
        });
      }
    });

    const orders = Object.values(ordersMap);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    await connection.rollback();
    console.error("PLACE ORDER ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message   // 🔥 show real error
    });
  }
};

/* ===============================
   CANCEL ORDER (CUSTOMER)
================================ */
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.session.user.id;

    // 1️⃣ Check order belongs to this user & is still placed
    const [[order]] = await db.query(
      `
      SELECT id, status, order_type, table_number
      FROM orders
      WHERE id = ? AND user_id = ?
      `,
      [orderId, userId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status !== "placed") {
      return res.status(400).json({
        success: false,
        message: "Order can no longer be cancelled"
      });
    }

    // 2️⃣ Update order status
    await db.query(
      `
      UPDATE orders
      SET status = 'cancelled'
      WHERE id = ?
      `,
      [orderId]
    );

    // 3️⃣ Free table if dine-in
    if (order.order_type === "dine-in" && order.table_number) {
      await db.query(
        `
        UPDATE tables
        SET is_occupied = 0
        WHERE table_number = ?
        `,
        [order.table_number]
      );
    }

    res.json({
      success: true,
      message: "Order cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order"
    });
  }
};


exports.getOrderItems = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const [items] = await db.query(`
      SELECT
        p.name AS product_name,
        oi.quantity,
        oi.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    res.json({
      success: true,
      data: items
    });

  } catch (err) {
    console.error("Get order items error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order items"
    });
  }
};








