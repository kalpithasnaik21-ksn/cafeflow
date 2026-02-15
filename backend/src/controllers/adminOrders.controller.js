const db = require("../config/database");

/* ===============================
   DASHBOARD COUNTS
================================ */
exports.getDashboardCounts = async (req, res) => {
  try {
    const [[total]] = await db.query(
      "SELECT COUNT(*) AS totalOrders FROM orders"
    );

    const [[today]] = await db.query(
      `SELECT COUNT(*) AS todayOrders
       FROM orders
       WHERE DATE(created_at) = CURDATE()`
    );

    res.json({
      totalOrders: total.totalOrders,
      todayOrders: today.todayOrders
    });
  } catch (error) {
    console.error("Dashboard counts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard counts"
    });
  }
};

/* ===============================
   GET ALL ORDERS (ADMIN)
================================ */
exports.getOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
  SELECT
  o.id,
  o.order_number,
  o.customer_name,
  o.order_type,
  o.table_number,
  o.delivery_address,
  o.order_note,
  o.payment_mode,
  o.payment_status,
  o.transaction_id,
  o.status,
  o.total_amount,
  o.created_at,
  COUNT(oi.id) AS items_count
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  GROUP BY o.id
  ORDER BY o.created_at DESC
`);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

/* ===============================
   GET SINGLE ORDER DETAILS
================================ */
exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id; // ✅ NOT orderId from params


    const [[order]] = await db.query(
      `
  SELECT
    id,
    order_number,
    customer_name,
    order_type,
    table_number,
    delivery_address,
    order_note,
    status,
    total_amount,
    created_at,
    payment_mode,
    cancel_reason
  FROM orders
  WHERE id = ?
  `,
      [orderId]
    );


    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const [items] = await db.query(
      `
      SELECT
        p.name AS product_name,
        oi.quantity,
        oi.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      `,
      [orderId]
    );

    res.json({
      success: true,
      data: { order, items }
    });
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details"
    });
  }
};

/* ===============================
   SMART MESSAGE GENERATOR
================================ */
function getOrderMessage(orderType, status) {
  const messages = {
    "dine-in": {
      confirmed: "Your order is confirmed. Please have your seat.",
      ready: "Your order is ready. Enjoy your meal!"
    },
    takeaway: {
      ready: "Your order is ready. Please collect it from the counter."
    },
    delivery: {
      out_for_delivery: "Your order is out for delivery.",
      completed: "Your order has been delivered. Thank you!"
    }
  };

  return messages[orderType]?.[status] || "";
}

/* ===============================
   UPDATE ORDER STATUS (ADMIN)
================================ */
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    let { status } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    status = status.toLowerCase();

    const allowedStatuses = [
      "placed",
      "preparing",
      "ready",
      "dispatched",
      "completed",
      "cancelled"
    ];


    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    // Check if order exists
    const [orders] = await db.query(
      "SELECT id, order_type, table_number FROM orders WHERE id = ?",
      [orderId]
    );

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update order status
    const [result] = await db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // OPTIONAL: Free table if dine-in & completed
    const order = orders[0];
    if (status === "completed" && order.order_type === "dine-in") {
      await db.query(
        "UPDATE tables SET is_occupied = 0 WHERE table_number = ?",
        [order.table_number]
      );
    }

    res.json({
      success: true,
      message: "Order status updated successfully"
    });

  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status"
    });
  }
};

/* ===============================
   VERIFY UPI PAYMENT (ADMIN)
================================ */
exports.verifyPayment = async (req, res) => {
  try {
    const orderId = req.params.id;

    const [[order]] = await db.query(
      `SELECT payment_mode, payment_status FROM orders WHERE id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.payment_mode !== "upi") {
      return res.status(400).json({
        success: false,
        message: "Not a UPI order"
      });
    }

    if (order.payment_status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Already verified"
      });
    }

    await db.query(
      `UPDATE orders SET payment_status = 'paid' WHERE id = ?`,
      [orderId]
    );

    res.json({
      success: true,
      message: "Payment verified successfully"
    });

  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment"
    });
  }
};

/* ===============================
   CANCEL ORDER
================================ */
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Cancel reason required"
      });
    }

    await db.query(
      `UPDATE orders
       SET status = 'cancelled', cancel_reason = ?
       WHERE id = ?`,
      [reason, orderId]
    );

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
