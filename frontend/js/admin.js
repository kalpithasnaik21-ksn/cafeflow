/*********************************
 * ADMIN DASHBOARD – CafeFlow
 *********************************/

const API_BASE_URL = "http://127.0.0.1:5000/api";

let allAdminOrders = [];

const adminOrdersDiv = document.getElementById("adminOrders");
const noOrdersText = document.getElementById("noOrders");

/* ================= API HELPER ================= */

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers
    }
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid server response (HTTP ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(
      data.message || `HTTP ${response.status}`
    );
  }

  return data;
}

/* ================= LOAD DASHBOARD ================= */

async function loadAdminOrders() {
  showLoading();

  try {
    // Load the order list from the actual backend route.
    const response = await apiRequest(
      `${API_BASE_URL}/admin/orders`
    );

    if (response.success === false) {
      throw new Error(response.message || "Unable to load orders");
    }

    if (!Array.isArray(response.data)) {
      throw new Error("Unexpected orders API response format");
    }

    allAdminOrders = response.data;

    // The list endpoint provides items_count, not item details.
    // Fetch each order's actual items from the details endpoint.
    allAdminOrders = await Promise.all(
      allAdminOrders.map(async order => {
        try {
          const detailsResponse = await apiRequest(
            `${API_BASE_URL}/admin/orders/${encodeURIComponent(order.id)}`
          );

          if (detailsResponse.success && detailsResponse.data) {
            return {
              ...order,
              ...detailsResponse.data.order,
              items: detailsResponse.data.items || []
            };
          }
        } catch (error) {
          console.error(
            `Could not load details for order ${order.id}:`,
            error
          );
        }

        return { ...order, items: [] };
      })
    );

    // Load authoritative total/today counts from the backend.
    await loadDashboardCounts();

    // Render orders using whichever layout exists in dashboard.html.
    renderAdminOrders(allAdminOrders);

  } catch (error) {
    console.error("Admin dashboard error:", error);

    showError(
      error.message.includes("401")
        ? "Session expired. Please log in again."
        : error.message.includes("403")
        ? "Admin access required."
        : `Unable to load orders: ${error.message}`
    );
  }
}

/* ================= DASHBOARD COUNTS ================= */

async function loadDashboardCounts() {
  try {
    const response = await apiRequest(
      `${API_BASE_URL}/admin/orders/dashboard`
    );

    // These two values are returned by your controller.
    setCounter(
      ["totalOrders", "totalOrdersCount", "total-orders"],
      response.totalOrders ?? 0
    );

    setCounter(
      ["todayOrders", "todayOrdersCount", "ordersToday", "today-orders"],
      response.todayOrders ?? 0
    );

  } catch (error) {
    console.error("Dashboard counts error:", error);

    // Fall back to the loaded order list if counts fail.
    updateStatusCounters(allAdminOrders);
  }
}

function updateStatusCounters(orders) {
  const normalize = status =>
    String(status || "").toLowerCase().replace(/[_\s]+/g, "-");

  const statuses = orders.map(order => normalize(order.status));

  setCounter(
    ["newOrders", "newOrdersCount", "new-orders"],
    statuses.filter(status => status === "placed").length
  );

  setCounter(
    ["activeOrders", "activeOrdersCount", "active-orders"],
    statuses.filter(status => status === "preparing").length
  );

  setCounter(
    ["readyOrders", "readyOrdersCount", "ready-orders"],
    statuses.filter(status => status === "ready").length
  );

  setCounter(
    ["completedOrders", "completedOrdersCount", "completed-orders"],
    statuses.filter(status => status === "completed").length
  );

  setCounter(
    ["cancelledOrders", "cancelledOrdersCount", "cancelled-orders"],
    statuses.filter(status => status === "cancelled").length
  );

  setCounter(
    ["totalOrders", "totalOrdersCount", "total-orders"],
    orders.length
  );
}

function setCounter(ids, value) {
  ids.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

/* ================= RENDER ORDERS ================= */

function renderAdminOrders(orders) {
  const tableBody = document.querySelector("#ordersTable tbody");

  if (tableBody) {
    renderOrdersTable(tableBody, orders);
    hideNoOrdersMessage();
    return;
  }

  if (!adminOrdersDiv) {
    console.error(
      "Could not find #adminOrders or #ordersTable tbody. " +
      "Check the IDs in dashboard.html."
    );
    return;
  }

  adminOrdersDiv.replaceChildren();

  if (orders.length === 0) {
    showNoOrdersMessage();
    return;
  }

  hideNoOrdersMessage();

  orders.forEach(order => {
    const card = document.createElement("div");
    card.className = "order-card";

    const header = document.createElement("div");
    header.className = "order-header";

    const orderNumber = document.createElement("span");
    orderNumber.className = "order-id";
    orderNumber.textContent =
      order.order_number || `#${order.id}`;

    const status = document.createElement("span");
    status.className =
      `status ${String(order.status || "").toLowerCase()}`;
    status.textContent = formatStatus(order.status);

    header.append(orderNumber, status);

    const body = document.createElement("div");
    body.className = "order-body";

    const customer = document.createElement("p");
    customer.textContent =
      `${order.customer_name || "Customer"} • ${order.order_type || ""}`;

    const itemsList = createItemsList(order.items);

    const total = document.createElement("strong");
    total.textContent =
      `Total: ₹${Number(order.total_amount || 0).toFixed(2)}`;

    body.append(customer, itemsList, total);

    if (order.table_number) {
      const table = document.createElement("p");
      table.textContent = `Table: ${order.table_number}`;
      body.appendChild(table);
    }

    if (order.delivery_address) {
      const address = document.createElement("p");
      address.textContent = `Delivery: ${order.delivery_address}`;
      body.appendChild(address);
    }

    const actions = createOrderActions(order);

    card.append(header, body, actions);
    adminOrdersDiv.appendChild(card);
  });
}

/* ================= TABLE LAYOUT ================= */

function renderOrdersTable(tableBody, orders) {
  tableBody.replaceChildren();

  if (orders.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();

    cell.colSpan = 8;
    cell.textContent = "No orders found.";
    return;
  }

  orders.forEach(order => {
    const row = tableBody.insertRow();

    const itemsText = (order.items || []).map(item =>
      `${item.product_name || "Item"} × ${item.quantity}`
    ).join(", ") || "No items";

    const values = [
      order.order_number || `#${order.id}`,
      order.customer_name || "Customer",
      order.order_type || "—",
      itemsText,
      `₹${Number(order.total_amount || 0).toFixed(2)}`,
      formatDate(order.created_at),
      formatStatus(order.status)
    ];

    values.forEach(value => {
      const cell = row.insertCell();
      cell.textContent = value;
    });

    const actionsCell = row.insertCell();
    actionsCell.appendChild(createOrderActions(order));
  });
}

/* ================= ORDER ITEMS ================= */

function createItemsList(items) {
  const list = document.createElement("ul");
  list.className = "order-items";

  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No item details available";
    list.appendChild(li);
    return list;
  }

  items.forEach(item => {
    const li = document.createElement("li");
    li.textContent =
      `${item.product_name || "Item"} × ${item.quantity}`;
    list.appendChild(li);
  });

  return list;
}

/* ================= ORDER ACTIONS ================= */

function createOrderActions(order) {
  const actions = document.createElement("div");
  actions.className = "order-actions";

  const status = String(order.status || "").toLowerCase();

  if (["placed", "preparing"].includes(status)) {
    actions.appendChild(createButton(
      "Mark Ready",
      () => updateOrderStatus(order.id, "ready")
    ));
  }

  if (status === "ready") {
    actions.appendChild(createButton(
      "Complete",
      () => updateOrderStatus(order.id, "completed"),
      "secondary"
    ));
  }

  return actions;
}

function createButton(label, callback, className = "") {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = label;

  if (className) button.className = className;

  button.addEventListener("click", callback);
  return button;
}

/* ================= UPDATE ORDER STATUS ================= */

async function updateOrderStatus(orderId, status) {
  if (!confirm(`Change order status to "${status}"?`)) return;

  try {
    const response = await apiRequest(
      `${API_BASE_URL}/admin/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status })
      }
    );

    if (response.success === false) {
      throw new Error(response.message || "Status update failed");
    }

    alert("Order status updated successfully ☕");

    await loadAdminOrders();

  } catch (error) {
    console.error("Status update error:", error);
    alert(`Unable to update order: ${error.message}`);
  }
}

/* ================= UI HELPERS ================= */

function formatStatus(status) {
  return String(status || "unknown")
    .replace(/[_-]/g, " ")
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-IN");
}

function showLoading() {
  if (adminOrdersDiv) {
    adminOrdersDiv.textContent = "Loading orders...";
  }

  const tableBody = document.querySelector("#ordersTable tbody");

  if (tableBody) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();

    cell.colSpan = 8;
    cell.textContent = "Loading orders...";
  }

  if (noOrdersText) noOrdersText.style.display = "none";
}

function showNoOrdersMessage() {
  if (noOrdersText) {
    noOrdersText.style.display = "block";
    noOrdersText.textContent = "No orders found.";
  }
}

function hideNoOrdersMessage() {
  if (noOrdersText) noOrdersText.style.display = "none";
}

function showError(message) {
  if (adminOrdersDiv) adminOrdersDiv.textContent = message;

  const tableBody = document.querySelector("#ordersTable tbody");

  if (tableBody) {
    tableBody.replaceChildren();

    const row = tableBody.insertRow();
    const cell = row.insertCell();

    cell.colSpan = 8;
    cell.textContent = message;
  }

  if (noOrdersText) {
    noOrdersText.style.display = "block";
    noOrdersText.textContent = message;
  }
}

/* ================= LOGOUT ================= */

async function logout() {
  try {
    await apiRequest(`${API_BASE_URL}/auth/logout`, {
      method: "POST"
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    window.location.href = "../auth/login.html";
  }
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", loadAdminOrders);