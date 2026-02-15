let userOrders = [];
const ordersContainer = document.getElementById("orders-container");

/* ================= SAFE CART ================= */
function getCart() {
  const raw = JSON.parse(localStorage.getItem("cart")) || [];
  const clean = raw.filter(item => item.product_id);

  if (clean.length !== raw.length) {
    console.warn("⚠ Corrupted cart items removed");
    localStorage.setItem("cart", JSON.stringify(clean));
  }

  return clean;
}

/* ================= TOAST ================= */
function showToast(message, type = "success", callback = null) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = "toast " + type;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    if (callback) callback();
  }, 2500);
}

/* ================= LOAD ORDERS ================= */
async function loadOrders() {
  try {
    const res = await fetch("http://localhost:5000/api/orders", {
      credentials: "include"
    });

    if (res.status === 401) {
      ordersContainer.innerHTML =
        "<p class='muted'>Please login to view your orders ☕</p>";
      return;
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Orders API error:", errorText);
      throw new Error("Failed to fetch orders");
    }

    const responseData = await res.json();
    const orders = Array.isArray(responseData)
      ? responseData
      : responseData.data;

    if (!orders || !orders.length) {
      ordersContainer.innerHTML =
        "<p class='muted'>You haven’t placed any orders yet.</p>";
      return;
    }

    userOrders = orders;
    ordersContainer.innerHTML = "";

    for (const order of userOrders) {
      const card = document.createElement("div");
      card.className = "order-card";

      card.innerHTML = `
        <div class="order-header">
          <div>
            <span class="order-number">#${order.order_number}</span>

            <span class="order-type-badge badge-${order.order_type}">
              ${getOrderTypeLabel(order.order_type)}
            </span>

            ${order.order_type === "dine-in" && order.table_number ? `
              <div class="order-meta">🪑 Table No: ${order.table_number}</div>
            ` : ""}

            ${order.order_type === "delivery" && order.delivery_address ? `
              <div class="order-meta">📍 ${order.delivery_address}</div>
            ` : ""}

            ${order.order_note ? `
              <div class="order-meta">📝 ${order.order_note}</div>
            ` : ""}
          </div>

          <span class="order-status status-${order.status}">
            ${formatStatus(order.status)}
          </span>
        </div>

        <ul class="order-items">
          <li class="muted">Loading items...</li>
        </ul>

        <div class="order-footer">
          <span class="order-total">
            Total: ₹${Number(order.total_amount).toFixed(2)}
          </span>

          <div class="order-actions">
  ${order.status === "placed" ? `
    <button class="cancel-btn"
      onclick="cancelOrder(${order.id})">
      Cancel Order
    </button>
  ` : ""}

          <button class="reorder-btn" onclick="reorder(${order.id})">
            Re-order
          </button>

        </div>
      `;

      ordersContainer.appendChild(card);

      /* ===== FETCH ORDER ITEMS ===== */
      try {
        const itemsRes = await fetch(
          `http://localhost:5000/api/orders/${order.id}/items`,
          { credentials: "include" }
        );

        if (!itemsRes.ok) throw new Error("Items API failed");

        const itemsData = await itemsRes.json();
        const itemsEl = card.querySelector(".order-items");

        if (!itemsData.success || !itemsData.data?.length) {
          itemsEl.innerHTML = "<li class='muted'>No items</li>";
          continue;
        }

        order.items = itemsData.data;

        itemsEl.innerHTML = itemsData.data.map(item => `
          <li>
            <span>${item.product_name}</span>
            <span>× ${item.quantity}</span>
          </li>
        `).join("");

      } catch (err) {
        console.error("Items fetch error:", err);
        const itemsEl = card.querySelector(".order-items");
        if (itemsEl) {
          itemsEl.innerHTML =
            "<li class='muted'>Unable to load items</li>";
        }
      }
    }

  } catch (error) {
    console.error("Load orders error:", error);
    ordersContainer.innerHTML =
      "<p class='muted'>Server error. Please try again later.</p>";
  }
}

/* ================= FORMAT STATUS ================= */
function formatStatus(status) {
  if (!status) return "";
  return status.replace(/_/g, " ").toUpperCase();
}

/* ================= FORMAT DATE ================= */
function formatDateTime(ts) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* ================= REORDER ================= */
function reorder(orderId) {
  const order = userOrders.find(o => o.id === orderId);

  if (!order || !order.items || order.items.length === 0) {
    showToast("No items to reorder.", "error");
    return;
  }

  let cart = getCart();

  order.items.forEach(item => {
    const existing = cart.find(i => i.product_id === item.product_id);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.push({
        product_id: item.product_id,
        name: item.product_name,
        quantity: item.quantity,
        price: item.price
      });
    }
  });

  localStorage.setItem("cart", JSON.stringify(cart));

  showToast("Items added to cart ☕", "success", () => {
    window.location.href = "cart.html";
  });
}

let cancelTargetId = null;

function cancelOrder(orderId) {
  cancelTargetId = orderId;
  document.getElementById("cancelConfirmModal").classList.remove("hidden");
}

function closeCancelModal() {
  cancelTargetId = null;
  document.getElementById("cancelConfirmModal").classList.add("hidden");
}

async function confirmCancel() {
  if (!cancelTargetId) return;

  try {
    const res = await fetch(`/api/orders/${cancelTargetId}/cancel`, {
      method: "PUT",
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.message || "Cannot cancel order ❌");
      return;
    }

    showToast("Order cancelled successfully ☕");
    closeCancelModal();
    loadOrders();

  } catch (err) {
    console.error(err);
    showToast("Something went wrong ❌");
  } finally {
    cancelTargetId = null;
  }
}


/* ================= ORDER TYPE LABEL ================= */
function getOrderTypeLabel(type) {
  if (!type) return "";

  switch (type) {
    case "dine-in":
      return "🪑 DINE-IN";
    case "takeaway":
      return "🥡 TAKEAWAY";
    case "delivery":
      return "🚚 DELIVERY";
    default:
      return type.toUpperCase();
  }
}

/* ================= LOGOUT ================= */
function logout() {
  fetch("http://localhost:5000/api/auth/logout", {
    credentials: "include"
  }).finally(() => {
    localStorage.clear();
    window.location.href = "../auth/login.html";
  });
}

/* ================= INIT ================= */
loadOrders();
