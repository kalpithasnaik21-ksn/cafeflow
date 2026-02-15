const adminOrdersDiv = document.getElementById("adminOrders");
const noOrdersText = document.getElementById("noOrders");

async function loadAdminOrders() {
  try {
    const res = await fetch("/api/admin/orders", {
      credentials: "include"
    });

    const data = await res.json();
    console.log("Admin orders response:", data);

    // ❌ Unauthorized
    if (!data.success) {
      adminOrdersDiv.innerHTML = "";
      noOrdersText.style.display = "block";
      noOrdersText.innerText = "🚫 Unauthorized access";
      return;
    }

    // ☕ No orders
    if (data.data.length === 0) {
      adminOrdersDiv.innerHTML = "";
      noOrdersText.style.display = "block";
      return;
    }

    // ✅ Orders exist
    noOrdersText.style.display = "none";
    adminOrdersDiv.innerHTML = "";

    data.data.forEach(order => {
      const card = document.createElement("div");
      card.className = "order-card";

      // Status class
      const statusClass =
        order.status === "Preparing"
          ? "preparing"
          : order.status === "Ready"
          ? "ready"
          : "completed";

      const itemsHtml = order.items
        .map(
          i => `<li>${i.product_name} × ${i.quantity}</li>`
        )
        .join("");

      card.innerHTML = `
        <div class="order-header">
          <span class="order-id">${order.order_number}</span>
          <span class="status ${statusClass}">${order.status}</span>
        </div>

        <div class="order-body">
          <strong>${order.customer_name}</strong> • ${order.order_type}

          <ul class="order-items">
            ${itemsHtml}
          </ul>

          <strong>Total: ₹${order.total_amount}</strong>
        </div>

        <div class="order-actions">
          <button onclick="markReady('${order.id}')">
            Mark Ready
          </button>
          <button class="secondary" onclick="markCompleted('${order.id}')">
            Complete
          </button>
        </div>
      `;

      adminOrdersDiv.appendChild(card);
    });

  } catch (error) {
    console.error("Admin load error:", error);
    adminOrdersDiv.innerHTML = "";
    noOrdersText.style.display = "block";
    noOrdersText.innerText = "⚠️ Server error";
  }
}

/* OPTIONAL – wire later to backend */
function markReady(orderId) {
  alert("Mark Ready clicked for Order ID: " + orderId);
}

function markCompleted(orderId) {
  alert("Complete clicked for Order ID: " + orderId);
}

loadAdminOrders();
