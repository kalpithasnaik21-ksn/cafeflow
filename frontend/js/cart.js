const cartItemsDiv = document.getElementById("cart-items");
const totalSpan = document.getElementById("total");

let pendingOrderData = null;

/* ================= SAFE GET CART ================= */
function getCart() {
  const rawCart = JSON.parse(localStorage.getItem("cart")) || [];

  const cleanCart = rawCart.filter(item => item.product_id);

  if (cleanCart.length !== rawCart.length) {
    console.warn("⚠ Corrupted cart items removed");
    localStorage.setItem("cart", JSON.stringify(cleanCart));
  }

  return cleanCart;
}

/* ================= LOAD CART ================= */
function loadCart() {
  const cart = getCart();
  cartItemsDiv.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {
    const price = Number(item.price);
    const qty = Number(item.quantity);

    total += price * qty;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <div class="item-info">
        <h4>${item.name}</h4>
        <p>₹${price} × ${qty}</p>
      </div>

      <div class="qty-controls">
        <button onclick="updateQty(${index}, -1)">−</button>
        <span>${qty}</span>
        <button onclick="updateQty(${index}, 1)">+</button>
      </div>
    `;

    cartItemsDiv.appendChild(div);
  });

  const orderType = document.getElementById("orderType")?.value;

  if (orderType === "delivery") {
    total += 40;

    const feeDiv = document.createElement("div");
    feeDiv.className = "delivery-fee";
    feeDiv.innerHTML = "<p>Delivery Fee: ₹40</p>";
    cartItemsDiv.appendChild(feeDiv);
  }

  totalSpan.innerText = total.toFixed(2);
  updateCartCount();
}

/* ================= UPDATE QUANTITY ================= */
function updateQty(index, change) {
  let cart = getCart();

  if (!cart[index]) return;

  cart[index].quantity += change;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
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

/* ================= PRIMARY BUTTON HANDLER ================= */
function handlePrimaryAction() {
  const paymentMode = document.getElementById("paymentMode").value;

  if (paymentMode === "upi") {
    proceedToUpi();
  } else {
    placeCashOrder();
  }
}

/* ================= BUILD ORDER DATA ================= */
function buildOrderData() {
  const cart = getCart();

  if (cart.length === 0) {
    showToast("Cart is empty ☕", "error");
    return null;
  }

  const orderType = document.getElementById("orderType").value;
  const paymentMode = document.getElementById("paymentMode").value;

  let deliveryAddress = null;

  if (orderType === "delivery") {
    deliveryAddress = document.getElementById("deliveryAddress")?.value;

    if (!deliveryAddress || deliveryAddress.trim() === "") {
      showToast("Please enter delivery address 📍", "error");
      return null;
    }
  }

  const orderNote = document.getElementById("orderNote")?.value || "";

  return {
    order_type: orderType,
    payment_mode: paymentMode,
    delivery_address: deliveryAddress,
    order_note: orderNote,
    items: cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }))
  };
}

/* ================= CASH ORDER ================= */
function placeCashOrder() {
  const orderData = buildOrderData();
  if (!orderData) return;

  submitOrder(orderData, null);
}

/* ================= UPI FLOW ================= */
function proceedToUpi() {
  const orderData = buildOrderData();
  if (!orderData) return;

  openUpiModal(orderData);
}

function openUpiModal(orderData) {
  pendingOrderData = orderData;

  const cart = getCart();
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;
  });

  // Load QR from backend
  fetch(`/api/payment/upi-qr?amount=${total}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById("upiQrImg").src = data.qr;
      }
    });


  const orderType = document.getElementById("orderType")?.value;
  if (orderType === "delivery") total += 40;

  document.getElementById("upiAmount").innerText = total.toFixed(2);
  document.getElementById("upiModal").classList.add("active");
}

function closeUpiModal() {
  pendingOrderData = null;
  document.getElementById("transactionIdInput").value = "";
  document.getElementById("upiModal").classList.remove("active");
}

function verifyAndPlaceOrder() {
  const txnId = document.getElementById("transactionIdInput").value.trim();

  if (!txnId) {
    showToast("Please enter transaction ID ❗", "error");
    return;
  }

  submitOrder(pendingOrderData, txnId);
}

/* ================= SUBMIT ORDER ================= */
async function submitOrder(orderData, transactionId) {
  if (transactionId) {
    orderData.transaction_id = transactionId;
  }

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(orderData)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showToast(data.message || "Failed to place order ❌", "error");
      return;
    }

    closeUpiModal();

    let successMessage = "Order placed ☕";

    if (data.table_number) {
      successMessage += `\n🪑 Table: ${data.table_number}`;
    }

    if (data.estimated_time) {
      successMessage += `\n🕒 Estimated time: ${data.estimated_time}`;
    }

    showToast(successMessage, "success", () => {
      localStorage.removeItem("cart");
      window.location.href = "/customer/orders.html";
    });

  } catch (error) {
    console.error("FRONTEND ORDER ERROR:", error);
    showToast("Server error. Please try again ❌", "error");
  }
}

/* ================= BUTTON TEXT SWITCH ================= */
function updatePlaceOrderButton() {
  const paymentMode = document.getElementById("paymentMode")?.value;
  const btn = document.getElementById("placeOrderBtn");

  if (!btn) return;

  if (paymentMode === "upi") {
    btn.innerText = "Proceed to Pay 💳";
  } else {
    btn.innerText = "Place Order ☕";
  }
}

/* ================= CART COUNT ================= */
function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const badge = document.getElementById("cartCount");
  if (badge) badge.innerText = count;
}

/* ================= ORDER TYPE CHANGE ================= */
const orderTypeSelect = document.getElementById("orderType");
const extraFields = document.getElementById("extraFields");

if (orderTypeSelect) {
  orderTypeSelect.addEventListener("change", handleOrderTypeChange);
}

function handleOrderTypeChange() {
  const type = orderTypeSelect.value;
  extraFields.innerHTML = "";

  if (type === "dine-in") {
    extraFields.innerHTML = `
      <div class="info-text">
        🪑 Table will be assigned automatically.
      </div>
    `;
  }

  if (type === "delivery") {
    extraFields.innerHTML = `
      <label>Delivery Address</label>
      <textarea id="deliveryAddress" placeholder="Enter delivery address"></textarea>
    `;
  }

  loadCart();
}

/* ================= LOGOUT ================= */
function logout() {
  fetch("/api/auth/logout", {
    credentials: "include"
  }).finally(() => {
    localStorage.clear();
    window.location.href = "/auth/login.html";
  });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  updateCartCount();
  updatePlaceOrderButton();

  const paymentSelect = document.getElementById("paymentMode");
  if (paymentSelect) {
    paymentSelect.addEventListener("change", updatePlaceOrderButton);
  }
});
