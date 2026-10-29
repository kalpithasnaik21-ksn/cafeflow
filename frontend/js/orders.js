
/*********************************
 * ORDERS LOGIC – CafeFlow
 *********************************/

const API_BASE_URL = "http://127.0.0.1:5000/api";

let userOrders = [];
const ordersContainer = document.getElementById("orders-container");

/* ================= SAFE CART ================= */

function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem("cart")) || [];
    if (!Array.isArray(raw)) return [];

    const clean = raw.filter(
      item => item && item.product_id != null
    );

    if (clean.length !== raw.length) {
      console.warn("Corrupted cart items removed");
      localStorage.setItem("cart", JSON.stringify(clean));
    }

    return clean;
  } catch (error) {
    console.error("Cart read error:", error);
    return [];
  }
}

/* ================= TOAST ================= */

function showToast(message, type = "success", callback = null) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    if (callback) callback();
    return;
  }

  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    if (callback) callback();
  }, 2500);
}

/* ================= LOAD ORDERS ================= */

async function loadOrders() {
  if (!ordersContainer) {
    console.error("Missing #orders-container in orders.html");
    return;
  }

  ordersContainer.textContent = "Loading your orders...";

  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    });

    const responseText = await res.text();
    let responseData = {};

    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(
        `Orders API returned invalid JSON (HTTP ${res.status})`
      );
    }

    if (res.status === 401) {
      console.error("Orders API authentication failed:", responseData);

      ordersContainer.innerHTML = `
        <p class="muted">
          Your session could not be verified.
          Please log in again.
        </p>
        <p>
          <a href="../auth/login.html">Go to Login</a>
        </p>
      `;
      return;
    }

    if (!res.ok) {
      throw new Error(
        responseData.message || `Orders request failed: ${res.status}`
      );
    }

    // Support either { success, data } or a direct array response.
    const orders = Array.isArray(responseData)
      ? responseData
      : responseData.data;

    if (!Array.isArray(orders)) {
      console.error("Unexpected orders response:", responseData);
      throw new Error("Unexpected response from orders API");
    }

    userOrders = orders;
    ordersContainer.innerHTML = "";

    if (orders.length === 0) {
      ordersContainer.innerHTML =
        "<p class='muted'>You haven't placed any orders yet. ☕</p>";
      return;
    }

    for (const order of userOrders) {
      await renderOrder(order);
    }

  } catch (error) {
    console.error("Load orders error:", error);

    ordersContainer.innerHTML = `
      <p class="muted">
        Unable to load orders. Please try again.
      </p>
    `;
  }
}

/* ================= RENDER ONE ORDER ================= */

async function renderOrder(order) {
  const card = document.createElement("div");
  card.className = "order-card";

  const orderHeader = document.createElement("div");
  orderHeader.className = "order-header";

  const details = document.createElement("div");

  const orderNumber = document.createElement("span");
  orderNumber.className = "order-number";
  orderNumber.textContent = `#${order.order_number ?? order.id}`;

  const typeBadge = document.createElement("span");
  typeBadge.className =
    `order-type-badge badge-${order.order_type || "other"}`;
  typeBadge.textContent = getOrderTypeLabel(order.order_type);

  details.append(orderNumber, typeBadge);

  if (order.order_type === "dine-in" && order.table_number) {
    addOrderMeta(details, `🪑 Table No: ${order.table_number}`);
  }

  if (order.order_type === "delivery" && order.delivery_address) {
    addOrderMeta(details, `📍 ${order.delivery_address}`);
  }

  if (order.order_note) {
    addOrderMeta(details, `📝 ${order.order_note}`);
  }

  const status = document.createElement("span");
  status.className = `order-status status-${order.status || ""}`;
  status.textContent = formatStatus(order.status);

  orderHeader.append(details, status);

  const itemsList = document.createElement("ul");
  itemsList.className = "order-items";
  itemsList.innerHTML = "<li class='muted'>Loading items...</li>";

  const footer = document.createElement("div");
  footer.className = "order-footer";

  const total = document.createElement("span");
  total.className = "order-total";
  total.textContent =
    `Total: ₹${Number(order.total_amount || 0).toFixed(2)}`;

  const actions = document.createElement("div");
  actions.className = "order-actions";

  if (order.status === "placed") {
    const cancelButton = document.createElement("button");
    cancelButton.className = "cancel-btn";
    cancelButton.textContent = "Cancel Order";
    cancelButton.addEventListener("click", () => {
      cancelOrder(order.id);
    });
    actions.appendChild(cancelButton);
  }

  const reorderButton = document.createElement("button");
  reorderButton.className = "reorder-btn";
  reorderButton.textContent = "Re-order";
  reorderButton.addEventListener("click", () => {
    reorder(order.id);
  });

  actions.appendChild(reorderButton);
  footer.append(total, actions);
  card.append(orderHeader, itemsList, footer);
  ordersContainer.appendChild(card);

  /* ===== FETCH ORDER ITEMS ===== */

  try {
    const itemsRes = await fetch(
      `${API_BASE_URL}/orders/${encodeURIComponent(order.id)}/items`,
      {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" }
      }
    );

    if (itemsRes.status === 401) {
      itemsList.innerHTML =
        "<li class='muted'>Session could not be verified.</li>";
      return;
    }

    if (!itemsRes.ok) {
      throw new Error(`Items request failed: ${itemsRes.status}`);
    }

    const itemsData = await itemsRes.json();

    const items = Array.isArray(itemsData)
      ? itemsData
      : itemsData.data;

    if (
      (!Array.isArray(itemsData) && itemsData.success === false) ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      itemsList.innerHTML = "<li class='muted'>No items found.</li>";
      return;
    }

    order.items = items;
    itemsList.innerHTML = "";

    items.forEach(item => {
      const li = document.createElement("li");

      const productName = document.createElement("span");
      productName.textContent = item.product_name || item.name || "Item";

      const quantity = document.createElement("span");
      quantity.textContent = `× ${Number(item.quantity) || 0}`;

      li.append(productName, quantity);
      itemsList.appendChild(li);
    });

  } catch (error) {
    console.error("Order items fetch error:", error);
    itemsList.innerHTML =
      "<li class='muted'>Unable to load order items.</li>";
  }
}

function addOrderMeta(parent, text) {
  const element = document.createElement("div");
  element.className = "order-meta";
  element.textContent = text;
  parent.appendChild(element);
}

/* ================= FORMAT STATUS ================= */

function formatStatus(status) {
  if (!status) return "";
  return String(status).replace(/_/g, " ").toUpperCase();
}

/* ================= FORMAT DATE ================= */

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* ================= REORDER ================= */

function reorder(orderId) {
  const order = userOrders.find(
    item => Number(item.id) === Number(orderId)
  );

  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    showToast("No items available to reorder.", "error");
    return;
  }

  const cart = getCart();

  order.items.forEach(item => {
    const productId = Number(item.product_id);

    const existing = cart.find(
      entry => Number(entry.product_id) === productId
    );

    if (existing) {
      existing.quantity =
        Number(existing.quantity) + Number(item.quantity);
    } else {
      cart.push({
        product_id: productId,
        name: item.product_name || item.name,
        quantity: Number(item.quantity),
        price: Number(item.price) || 0
      });
    }
  });

  localStorage.setItem("cart", JSON.stringify(cart));

  showToast("Items added to cart ☕", "success", () => {
    window.location.href = "cart.html";
  });
}

/* ================= CANCEL ORDER ================= */

let cancelTargetId = null;

function cancelOrder(orderId) {
  cancelTargetId = orderId;

  const modal = document.getElementById("cancelConfirmModal");

  if (modal) {
    modal.classList.remove("hidden");
  } else {
    confirmCancel();
  }
}

function closeCancelModal() {
  cancelTargetId = null;

  document
    .getElementById("cancelConfirmModal")
    ?.classList.add("hidden");
}

async function confirmCancel() {
  if (cancelTargetId == null) return;

  const orderId = cancelTargetId;

  try {
    const res = await fetch(
      `${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/cancel`,
      {
        method: "PUT",
        credentials: "include",
        headers: { Accept: "application/json" }
      }
    );

    const data = await res.json();

    if (res.status === 401) {
      showToast("Session expired. Please log in again.", "error");
      return;
    }

    if (!res.ok || !data.success) {
      showToast(data.message || "Unable to cancel order.", "error");
      return;
    }

    closeCancelModal();
    showToast("Order cancelled successfully ☕");
    await loadOrders();

  } catch (error) {
    console.error("Cancel order error:", error);
    showToast("Something went wrong while cancelling the order.", "error");
  }
}

/* ================= ORDER TYPE LABEL ================= */

function getOrderTypeLabel(type) {
  switch (type) {
    case "dine-in":
      return "🪑 DINE-IN";
    case "takeaway":
      return "🥡 TAKEAWAY";
    case "delivery":
      return "🚚 DELIVERY";
    default:
      return String(type || "").toUpperCase();
  }
}

/* ================= LOGOUT ================= */

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    localStorage.removeItem("cart");
    window.location.href = "../auth/login.html";
  }
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", loadOrders);