let allOrders = [];
console.log("dashboard.js loaded");

/* ===============================
   API BASE
================================ */
const API_BASE = "/api/admin/orders";

/* ===============================
   SELECTORS
================================ */
const ordersTable = document.getElementById("ordersTable");

const statNew = document.getElementById("newOrders");
const statActive = document.getElementById("activeOrders");
const statReady = document.getElementById("readyOrders");
const statCompleted = document.getElementById("completedOrders");
const statCancelled = document.getElementById("cancelledOrders");

const totalOrdersEl = document.getElementById("totalOrders");
const todayOrdersEl = document.getElementById("todayOrders");

/* ===============================
   LOAD ORDERS
================================ */
async function loadOrders() {
  try {
    const res = await fetch(API_BASE, { credentials: "include" });

    if (res.status === 401 || res.status === 403) {
      showToast("Session expired. Please login again ❌", true);
      setTimeout(logout, 1500);
      return;
    }

    const response = await res.json();
    if (!response.success) {
      showToast("Failed to load orders ❌", true);
      return;
    }

    const orders = response.data || [];

    allOrders = orders;   // 🔥 STORE GLOBALLY

    renderOrders(orders);
    updateStats(orders);

  } catch (err) {
    console.error("Load orders error:", err);
  }
}


/* ===============================
   RENDER ORDERS TABLE
================================ */

function renderOrders(orders) {

  allOrders = orders;   // 🔥 store globally for viewOrder()

  ordersTable.innerHTML = "";

  orders.forEach(order => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>#${order.order_number}</td>
      <td>${order.customer_name}</td>
      <td>${getOrderTypeLabel(order.order_type)}</td>
      <td>${order.total_items || 0}</td>
      <td>₹${Number(order.total_amount).toFixed(2)}</td>
      <td>${formatTime(order.created_at)}</td>
      <td>${formatStatus(order.status)}</td>
      <td>
        <button class="btn-view" onclick="viewOrder(${order.id})">View</button>
        ${getNextStatus(order)
        ? `<button class="btn-action"
               onclick="updateOrderStatus(${order.id}, '${getNextStatus(order)}')">
               → ${getNextStatus(order).replace(/_/g, " ").toUpperCase()}
             </button>`
        : ""
      }
      </td>
    `;

    ordersTable.appendChild(row);
  });
}


/* ===============================
   UPDATE ORDER STATUS
================================ */
/* ===============================
   UPDATE ORDER STATUS
================================ */
async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.message || "Status update failed ❌", true);
      return;
    }

    showToast("Status updated successfully ✅");
    closeModal();
    loadOrders();

  } catch (err) {
    console.error("Status error:", err);
    showToast("Error updating status ❌", true);
  }
}




/* ===============================
   TOAST
================================ */
function showToast(message, error = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.style.background = error
    ? "linear-gradient(135deg,#ff8d8d,#ff6f6f)"
    : "linear-gradient(135deg,#caa36a,#a9743a)";

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
  }, 2500);
}

/* ===============================
   VIEW ORDER DETAILS
================================ */
function viewOrder(orderId) {

  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  const modal = document.getElementById("orderModal");

  let typeSection = "";

  if (order.order_type === "delivery") {
    typeSection = `
      <p>🚚 <strong>Delivery</strong></p>
      <p>📍 Address: ${order.delivery_address || "Not Provided"}</p>
    `;
  }

  if (order.order_type === "dine-in") {
    typeSection = `
      <p>🪑 <strong>Dine-In</strong></p>
      <p>Table No: ${order.table_number || "Not Assigned"}</p>
    `;
  }

  if (order.order_type === "takeaway") {
    typeSection = `
      <p>🥡 <strong>Takeaway</strong></p>
    `;
  }

  const noteSection = order.order_note
    ? `<hr><p><strong>📝 Special Instructions:</strong></p><p>${order.order_note}</p>`
    : "";

  const nextStatus = getNextStatus(order);

  const actionButton = nextStatus
    ? `<button class="btn-action"
         onclick="updateOrderStatus(${order.id}, '${nextStatus}')">
         → ${nextStatus.replace(/_/g, " ").toUpperCase()}
       </button>`
    : "";

  modal.innerHTML = `
    <div class="modal-content">
      <h2>Order Details</h2>

      <p><strong>Order #:</strong> ${order.order_number}</p>
      <p><strong>Customer:</strong> ${order.customer_name}</p>

      ${typeSection}

<p>
  <strong>Payment:</strong>
  ${formatPayment(order)}
</p>
${getVerifyButton(order)}


      ${noteSection}

      <hr>

      <p><strong>Status:</strong> ${formatStatus(order.status)}</p>

      ${actionButton}

      <button class="btn-close" onclick="closeModal()">Close</button>
    </div>
  `;

  modal.style.display = "flex";
}

function getVerifyButton(order) {

  if (
    order.payment_mode === "upi" &&
    order.payment_status === "pending"
  ) {
    return `
      <button class="btn-action"
        onclick="verifyPayment(${order.id})">
        Verify Payment
      </button>
    `;
  }

  return "";
}

function openUpiModal(orderData) {
  pendingOrderData = orderData;

  const cart = getCart();
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;
  });

  document.getElementById("upiAmount").innerText = total.toFixed(2);
  document.getElementById("upiModal").classList.add("active");
}


function closeModal() {
  const modal = document.getElementById("orderModal");
  modal.style.display = "none";
}


/* ===============================
   PAYMENT TEXT
================================ */
function getPaymentText(order) {
  if (order.payment_mode === "upi") return "💳 Paid via UPI";
  if (order.status === "completed") return "✅ Cash collected";
  if (order.status === "cancelled") return "❌ Payment cancelled";
  return "💵 Cash to be collected";
}

function formatPayment(order) {

  // ================= CASH =================
  if (order.payment_mode === "cash") {

    if (order.status === "completed") {
      return `💵 Cash (Collected)`;
    }

    if (order.status === "cancelled") {
      return `💵 Cash (Not Collected)`;
    }

    if (order.status === "ready") {
      return `💵 Cash (Collect at Counter)`;
    }

    return `💵 Cash (To be Collected)`;
  }

  // ================= UPI =================
  if (order.payment_mode === "upi") {

    if (order.payment_status === "paid") {
      return `💳 UPI (Paid)`;
    }

    if (order.status === "cancelled") {
      return `💳 UPI (Refund Required)`;
    }

    return `
    💳 UPI (Pending Verification)
    ${order.transaction_id
        ? `<div class="txn-id"><b>Txn ID: ${order.transaction_id}</b></div>`
        : ""
      }
  `;
  }

  return order.payment_mode;
}


async function verifyPayment(orderId) {
  try {
    const res = await fetch(
      `/api/admin/orders/${orderId}/verify-payment`,
      {
        method: "PUT",
        credentials: "include"
      }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.message || "Verification failed ❌", true);
      return;
    }

    showToast("Payment verified ✅");

    closeModal();
    loadOrders();

  } catch (err) {
    console.error(err);
    showToast("Server error ❌", true);
  }
}


/* ===============================
   DASHBOARD STATS
================================ */
function updateStats(orders) {
  const count = s => orders.filter(o => o.status === s).length;

  statNew.innerText = count("placed");
  statActive.innerText = count("preparing");
  statReady.innerText = count("ready");
  statCompleted.innerText = count("completed");
  statCancelled.innerText = count("cancelled");
}

/* ===============================
   STATUS FLOW
================================ */
function getNextStatus(order) {

  const statusFlow = {
    "delivery": [
      "placed",
      "preparing",
      "ready",
      "dispatched",
      "completed"
    ],

    "dine-in": [
      "placed",
      "preparing",
      "ready",
      "completed"
    ],
    "takeaway": [
      "placed",
      "preparing",
      "ready",
      "completed"
    ]
  };

  const flow = statusFlow[order.order_type];
  const currentIndex = flow.indexOf(order.status);

  if (currentIndex < flow.length - 1) {
    return flow[currentIndex + 1];
  }

  return null;
}

/* ===============================
   SUMMARY
================================ */
async function loadSummary() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`, {
      credentials: "include"
    });

    if (!res.ok) return;

    const data = await res.json();
    totalOrdersEl.innerText = data.totalOrders ?? 0;
    todayOrdersEl.innerText = data.todayOrders ?? 0;

  } catch (err) {
    console.error("Summary error:", err);
  }
}

/* ===============================
   HELPERS
================================ */
function getOrderTypeLabel(type) {
  if (type === "dine-in") return "🪑 Dine-In";
  if (type === "takeaway") return "🥡 Takeaway";
  return "🚚 Delivery";
}

function formatStatus(status) {
  return status.replace(/_/g, " ").toUpperCase();
}

function formatTime(time) {
  return new Date(time).toLocaleTimeString();
}

function logout() {
  window.location.href = "../auth/login.html";
}

/* ===============================
   INIT
================================ */
loadOrders();
loadSummary();
setInterval(loadOrders, 5000);

// expose for inline onclick
window.updateOrderStatus = updateOrderStatus;
window.viewOrder = viewOrder;
window.closeModal = closeModal;
