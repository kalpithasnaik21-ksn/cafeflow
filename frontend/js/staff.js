const kitchenOrdersDiv = document.getElementById("kitchenOrders");

async function loadKitchenOrders() {
  try {
    const res = await fetch("http://localhost:5000/api/staff/orders", {
      credentials: "include"
    });

    const data = await res.json();

    if (!data.success) {
      kitchenOrdersDiv.innerHTML = "<p>Unauthorized</p>";
      return;
    }

    if (data.data.length === 0) {
      kitchenOrdersDiv.innerHTML = "<p>No active orders ☕</p>";
      return;
    }

    kitchenOrdersDiv.innerHTML = "";

    data.data.forEach(order => {
      const card = document.createElement("div");
      card.className = "kitchen-card";

      const itemsHtml = order.items
        .map(i => `<li>${i.product_name} × ${i.quantity}</li>`)
        .join("");

      let actionBtn = "";
      if (order.status === "pending") {
        actionBtn = `
          <button class="btn-preparing"
            onclick="updateStatus(${order.id}, 'preparing')">
            Start Preparing
          </button>`;
      } else if (order.status === "preparing") {
        actionBtn = `
          <button class="btn-ready"
            onclick="updateStatus(${order.id}, 'ready')">
            Mark as Ready
          </button>`;
      }

      card.innerHTML = `
        <h3>${order.order_number}</h3>
        <p>Status: <strong>${order.status}</strong></p>

        <ul>${itemsHtml}</ul>

        <div class="kitchen-actions">
          ${actionBtn}
        </div>
      `;

      kitchenOrdersDiv.appendChild(card);
    });

  } catch (error) {
    console.error("Kitchen load error:", error);
    kitchenOrdersDiv.innerHTML = "<p>Server error</p>";
  }
}

async function updateStatus(orderId, status) {
  try {
    await fetch(
      `http://localhost:5000/api/staff/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status })
      }
    );

    loadKitchenOrders(); // refresh board
  } catch (error) {
    console.error("Update status error:", error);
    alert("Failed to update order");
  }
}

// Auto refresh every 10 seconds
setInterval(loadKitchenOrders, 10000);
loadKitchenOrders();
