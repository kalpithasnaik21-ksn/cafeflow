let allOrders = [];

console.log("dashboard.js loaded");

/* ===============================
   API CONFIGURATION
================================ */
const API_BASE = "http://127.0.0.1:5000/api/admin/orders";

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
   API HELPER
================================ */
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "include",
        ...options,
        headers: {
            ...(options.headers || {})
        }
    });

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        const responseText = await response.text();

        throw new Error(
            `Expected JSON but received a non-JSON response. ` +
            `URL: ${url}. HTTP status: ${response.status}. ` +
            `Check your backend URL and route configuration.`
        );
    }

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
        showToast("Admin session expired. Please log in again.", true);

        throw new Error("Unauthorized. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(
            data.message || `Request failed with status ${response.status}`
        );
    }

    return data;
}

/* ===============================
   LOAD ORDERS
================================ */
async function loadOrders() {
    if (!ordersTable) {
        console.error(
            'Orders table not found. Check that your HTML contains id="ordersTable".'
        );
        return;
    }

    try {
        const response = await apiRequest(API_BASE);

        if (!response.success) {
            showToast(response.message || "Failed to load orders.", true);
            return;
        }

        const orders = Array.isArray(response.data) ? response.data : [];

        allOrders = orders;

        renderOrders(orders);
        updateStats(orders);

    } catch (error) {
        console.error("Load orders error:", error);

        if (!error.message.includes("Unauthorized")) {
            showToast("Unable to load orders. Check the backend.", true);
        }
    }
}

/* ===============================
   RENDER ORDERS TABLE
================================ */
function renderOrders(orders) {
    if (!ordersTable) return;

    ordersTable.innerHTML = "";

    if (!orders.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 8;
        cell.textContent = "No orders found.";
        cell.style.textAlign = "center";

        row.appendChild(cell);
        ordersTable.appendChild(row);
        return;
    }

    orders.forEach(order => {
        const row = document.createElement("tr");

        const nextStatus = getNextStatus(order);

        row.innerHTML = `
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>
                <button class="btn-view"
                    onclick="viewOrder(${Number(order.id)})">
                    View
                </button>
                ${
                    nextStatus
                        ? `<button class="btn-action"
                            onclick="updateOrderStatus(
                                ${Number(order.id)},
                                '${nextStatus}'
                            )">
                            → ${nextStatus.replace(/_/g, " ").toUpperCase()}
                           </button>`
                        : ""
                }
            </td>
        `;

        const cells = row.querySelectorAll("td");

        cells[0].textContent = `#${order.order_number ?? order.id}`;
        cells[1].textContent = order.customer_name || "Customer";
        cells[2].textContent = getOrderTypeLabel(order.order_type);
        cells[3].textContent = order.total_items ?? order.items_count ?? 0;
        cells[4].textContent =
            `₹${Number(order.total_amount || 0).toFixed(2)}`;
        cells[5].textContent = formatTime(order.created_at);
        cells[6].textContent = formatStatus(order.status);

        ordersTable.appendChild(row);
    });
}

/* ===============================
   UPDATE ORDER STATUS
================================ */
async function updateOrderStatus(orderId, newStatus) {
    try {
        const data = await apiRequest(`${API_BASE}/${orderId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!data.success) {
            showToast(data.message || "Status update failed.", true);
            return;
        }

        showToast("Order status updated successfully.");

        closeModal();
        await loadOrders();
        await loadSummary();

    } catch (error) {
        console.error("Status update error:", error);

        if (!error.message.includes("Unauthorized")) {
            showToast(error.message || "Error updating status.", true);
        }
    }
}

/* ===============================
   VIEW ORDER DETAILS
================================ */
function viewOrder(orderId) {
    const order = allOrders.find(
        item => Number(item.id) === Number(orderId)
    );

    if (!order) {
        showToast("Order not found.", true);
        return;
    }

    const modal = document.getElementById("orderModal");

    if (!modal) {
        showToast('Order modal not found. Check id="orderModal".', true);
        return;
    }

    let typeSection = "";

    if (order.order_type === "delivery") {
        typeSection = `
            <p><strong>🚚 Delivery</strong></p>
            <p>Address: ${order.delivery_address || "Not provided"}</p>
        `;
    } else if (order.order_type === "dine-in") {
        typeSection = `
            <p><strong>🪑 Dine-In</strong></p>
            <p>Table No: ${order.table_number || "Not assigned"}</p>
        `;
    } else if (order.order_type === "takeaway") {
        typeSection = `<p><strong>🥡 Takeaway</strong></p>`;
    }

    const noteSection = order.order_note
        ? `<hr><p><strong>Special Instructions:</strong></p>
           <p>${order.order_note}</p>`
        : "";

    const nextStatus = getNextStatus(order);

    const actionButton = nextStatus
        ? `<button class="btn-action"
              onclick="updateOrderStatus(${Number(order.id)}, '${nextStatus}')">
              → ${nextStatus.replace(/_/g, " ").toUpperCase()}
           </button>`
        : "";

    modal.innerHTML = `
        <div class="modal-content">
            <h2>Order Details</h2>

            <p><strong>Order #:</strong> ${order.order_number ?? order.id}</p>
            <p><strong>Customer:</strong> ${order.customer_name || "Customer"}</p>

            ${typeSection}

            <p><strong>Payment:</strong> ${formatPayment(order)}</p>

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

/* ===============================
   PAYMENT VERIFICATION BUTTON
================================ */
function getVerifyButton(order) {
    if (
        order.payment_mode === "upi" &&
        order.payment_status === "pending"
    ) {
        return `
            <button class="btn-action"
                onclick="verifyPayment(${Number(order.id)})">
                Verify Payment
            </button>
        `;
    }

    return "";
}

/* ===============================
   VERIFY UPI PAYMENT
================================ */
async function verifyPayment(orderId) {
    try {
        const data = await apiRequest(
            `${API_BASE}/${orderId}/verify-payment`,
            { method: "PUT" }
        );

        if (!data.success) {
            showToast(data.message || "Payment verification failed.", true);
            return;
        }

        showToast("Payment verified successfully.");

        closeModal();
        await loadOrders();

    } catch (error) {
        console.error("Payment verification error:", error);

        if (!error.message.includes("Unauthorized")) {
            showToast(error.message || "Payment verification failed.", true);
        }
    }
}

/* ===============================
   CLOSE MODAL
================================ */
function closeModal() {
    const modal = document.getElementById("orderModal");

    if (modal) {
        modal.style.display = "none";
    }
}

/* ===============================
   PAYMENT TEXT
================================ */
function formatPayment(order) {
    if (order.payment_mode === "cash") {
        if (order.status === "completed") {
            return "💵 Cash (Collected)";
        }

        if (order.status === "cancelled") {
            return "💵 Cash (Not Collected)";
        }

        if (order.status === "ready") {
            return "💵 Cash (Collect at Counter)";
        }

        return "💵 Cash (To be Collected)";
    }

    if (order.payment_mode === "upi") {
        if (order.payment_status === "paid") {
            return "💳 UPI (Paid)";
        }

        if (order.status === "cancelled") {
            return "💳 UPI (Refund Required)";
        }

        const transactionId = order.transaction_id
            ? ` — Transaction ID: ${order.transaction_id}`
            : "";

        return `💳 UPI (Pending Verification)${transactionId}`;
    }

    return order.payment_mode || "Not specified";
}

/* ===============================
   DASHBOARD STATISTICS
================================ */
function updateStats(orders) {
    const count = status =>
        orders.filter(order => order.status === status).length;

    if (statNew) statNew.textContent = count("placed");
    if (statActive) statActive.textContent = count("preparing");
    if (statReady) statReady.textContent = count("ready");
    if (statCompleted) statCompleted.textContent = count("completed");
    if (statCancelled) statCancelled.textContent = count("cancelled");
}

/* ===============================
   LOAD SUMMARY COUNTS
================================ */
async function loadSummary() {
    try {
        const data = await apiRequest(`${API_BASE}/dashboard`);

        if (totalOrdersEl) {
            totalOrdersEl.textContent = data.totalOrders ?? 0;
        }

        if (todayOrdersEl) {
            todayOrdersEl.textContent = data.todayOrders ?? 0;
        }

    } catch (error) {
        console.error("Dashboard summary error:", error);
    }
}

/* ===============================
   ORDER STATUS FLOW
================================ */
function getNextStatus(order) {
    const statusFlow = {
        delivery: [
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
        takeaway: [
            "placed",
            "preparing",
            "ready",
            "completed"
        ]
    };

    const flow = statusFlow[order.order_type];

    if (!flow) return null;

    const currentIndex = flow.indexOf(order.status);

    if (currentIndex >= 0 && currentIndex < flow.length - 1) {
        return flow[currentIndex + 1];
    }

    return null;
}

/* ===============================
   HELPERS
================================ */
function getOrderTypeLabel(type) {
    if (type === "dine-in") return "🪑 Dine-In";
    if (type === "takeaway") return "🥡 Takeaway";
    if (type === "delivery") return "🚚 Delivery";

    return type || "Unknown";
}

function formatStatus(status) {
    return String(status || "unknown")
        .replace(/_/g, " ")
        .toUpperCase();
}

function formatTime(time) {
    if (!time) return "—";

    const date = new Date(time);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString();
}

/* ===============================
   LOGOUT
================================ */
async function logout() {
    try {
        await fetch("http://127.0.0.1:5000/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });
    } catch (error) {
        console.error("Logout request failed:", error);
    }

    window.location.href = "../auth/login.html";
}

/* ===============================
   INITIALIZATION
================================ */
loadOrders();
loadSummary();

// Refresh orders periodically.
setInterval(loadOrders, 10000);

/* ===============================
   EXPOSE INLINE HANDLERS
================================ */
window.updateOrderStatus = updateOrderStatus;
window.viewOrder = viewOrder;
window.closeModal = closeModal;
window.verifyPayment = verifyPayment;
window.logout = logout;
