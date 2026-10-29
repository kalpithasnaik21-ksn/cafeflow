/*********************************
 * CART LOGIC – CafeFlow
 *********************************/

const API_BASE_URL = "http://127.0.0.1:5000/api";

const cartItemsDiv = document.getElementById("cart-items");
const totalSpan = document.getElementById("total");

let pendingOrderData = null;

/* ================= SAFE GET CART ================= */

function getCart() {
  try {
    const rawCart = JSON.parse(localStorage.getItem("cart")) || [];

    if (!Array.isArray(rawCart)) return [];

    const cleanCart = rawCart.filter(
      item => item && item.product_id != null
    );

    if (cleanCart.length !== rawCart.length) {
      console.warn("Corrupted cart items removed");
      localStorage.setItem("cart", JSON.stringify(cleanCart));
    }

    return cleanCart;
  } catch (error) {
    console.error("Unable to read cart:", error);
    return [];
  }
}

/* ================= LOAD CART ================= */

function loadCart() {
  if (!cartItemsDiv || !totalSpan) return;

  const cart = getCart();
  cartItemsDiv.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;

    total += price * qty;

    const div = document.createElement("div");
    div.className = "cart-item";

    const info = document.createElement("div");
    info.className = "item-info";

    const name = document.createElement("h4");
    name.textContent = item.name || "Menu item";

    const priceInfo = document.createElement("p");
    priceInfo.textContent = `₹${price.toFixed(2)} × ${qty}`;

    info.append(name, priceInfo);

    const controls = document.createElement("div");
    controls.className = "qty-controls";
    controls.innerHTML = `
      <button type="button" onclick="updateQty(${index}, -1)">−</button>
      <span>${qty}</span>
      <button type="button" onclick="updateQty(${index}, 1)">+</button>
    `;

    div.append(info, controls);
    cartItemsDiv.appendChild(div);
  });

  const orderType = document.getElementById("orderType")?.value;

  if (orderType === "delivery") {
    total += 40;

    const feeDiv = document.createElement("div");
    feeDiv.className = "delivery-fee";
    feeDiv.textContent = "Delivery Fee: ₹40";
    cartItemsDiv.appendChild(feeDiv);
  }

  totalSpan.textContent = total.toFixed(2);
  updateCartCount();
}

/* ================= UPDATE QUANTITY ================= */

function updateQty(index, change) {
  const cart = getCart();

  if (!cart[index]) return;

  cart[index].quantity = Number(cart[index].quantity) + change;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
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

/* ================= PRIMARY BUTTON ================= */

function handlePrimaryAction() {
  const paymentMode = document.getElementById("paymentMode")?.value;

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

  const orderType = document.getElementById("orderType")?.value;
  const paymentMode = document.getElementById("paymentMode")?.value;

  let deliveryAddress = null;

  if (orderType === "delivery") {
    deliveryAddress =
      document.getElementById("deliveryAddress")?.value.trim();

    if (!deliveryAddress) {
      showToast("Please enter delivery address 📍", "error");
      return null;
    }
  }

  const orderNote =
    document.getElementById("orderNote")?.value || "";

  return {
    order_type: orderType,
    payment_mode: paymentMode,
    delivery_address: deliveryAddress,
    order_note: orderNote,
    items: cart.map(item => ({
      product_id: item.product_id,
      quantity: Number(item.quantity)
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

async function openUpiModal(orderData) {
  pendingOrderData = orderData;

  const cart = getCart();

  let total = cart.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  if (orderData.order_type === "delivery") {
    total += 40;
  }

  const amountEl = document.getElementById("upiAmount");
  const modal = document.getElementById("upiModal");

  if (amountEl) amountEl.textContent = total.toFixed(2);
  if (modal) modal.classList.add("active");

  try {
    const response = await fetch(
      `${API_BASE_URL}/payment/upi-qr?amount=${encodeURIComponent(total)}`,
      {
        method: "GET",
        credentials: "include"
      }
    );

    if (!response.ok) {
      throw new Error(`UPI QR request failed: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.qr) {
      const qrImage = document.getElementById("upiQrImg");
      if (qrImage) qrImage.src = data.qr;
    } else {
      showToast("Unable to generate UPI QR code.", "error");
    }
  } catch (error) {
    console.error("UPI QR error:", error);
    showToast("Unable to load UPI QR code.", "error");
  }
}

function closeUpiModal() {
  pendingOrderData = null;

  const transactionInput =
    document.getElementById("transactionIdInput");
  const modal = document.getElementById("upiModal");

  if (transactionInput) transactionInput.value = "";
  if (modal) modal.classList.remove("active");
}

function verifyAndPlaceOrder() {
  if (!pendingOrderData) {
    showToast("Please start the UPI payment process again.", "error");
    return;
  }

  const txnId =
    document.getElementById("transactionIdInput")?.value.trim();

  if (!txnId) {
    showToast("Please enter transaction ID ❗", "error");
    return;
  }

  submitOrder(pendingOrderData, txnId);
}

/* ================= SUBMIT ORDER ================= */

async function submitOrder(orderData, transactionId) {
  if (!orderData) return;

  const payload = { ...orderData };

  if (transactionId) {
    payload.transaction_id = transactionId;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    // Read as text first so HTML errors don't cause a JSON parse crash.
    const responseText = await response.text();

    let data;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(
        `Server returned a non-JSON response (HTTP ${response.status}). ` +
        "Check the backend route and server logs."
      );
    }

    if (!response.ok || !data.success) {
      showToast(
        data.message || `Failed to place order (HTTP ${response.status})`,
        "error"
      );
      return;
    }

    closeUpiModal();

    let successMessage = "Order placed ☕";

    if (data.table_number) {
      successMessage += ` | Table: ${data.table_number}`;
    }

    if (data.estimated_time) {
      successMessage += ` | Estimated time: ${data.estimated_time}`;
    }

    showToast(successMessage, "success", () => {
      localStorage.removeItem("cart");
      window.location.href = "../customer/orders.html";
    });

  } catch (error) {
    console.error("FRONTEND ORDER ERROR:", error);
    showToast(error.message || "Unable to place order. Please try again.", "error");
  }
}

/* ================= BUTTON TEXT ================= */

function updatePlaceOrderButton() {
  const paymentMode = document.getElementById("paymentMode")?.value;
  const btn = document.getElementById("placeOrderBtn");

  if (!btn) return;

  btn.textContent =
    paymentMode === "upi"
      ? "Proceed to Pay 💳"
      : "Place Order ☕";
}

/* ================= CART COUNT ================= */

function updateCartCount() {
  const cart = getCart();

  const count = cart.reduce(
    (sum, item) => sum + Math.max(0, Number(item.quantity) || 0),
    0
  );

  const badge = document.getElementById("cartCount");

  if (badge) {
    badge.textContent = count;
  }
}

/* ================= ORDER TYPE CHANGE ================= */

const orderTypeSelect = document.getElementById("orderType");
const extraFields = document.getElementById("extraFields");

if (orderTypeSelect) {
  orderTypeSelect.addEventListener("change", handleOrderTypeChange);
}

function handleOrderTypeChange() {
  if (!orderTypeSelect || !extraFields) return;

  const type = orderTypeSelect.value;
  extraFields.innerHTML = "";

  if (type === "dine-in") {
    const info = document.createElement("div");
    info.className = "info-text";
    info.textContent = "🪑 Table will be assigned automatically.";
    extraFields.appendChild(info);
  }

  if (type === "delivery") {
    const label = document.createElement("label");
    label.htmlFor = "deliveryAddress";
    label.textContent = "Delivery Address";

    const textarea = document.createElement("textarea");
    textarea.id = "deliveryAddress";
    textarea.placeholder = "Enter delivery address";

    extraFields.append(label, textarea);
  }

  loadCart();
}

/* ================= LOGOUT ================= */

async function logout() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      console.error("Logout failed:", response.status);
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    localStorage.removeItem("cart");
    window.location.href = "../auth/login.html";
  }
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
