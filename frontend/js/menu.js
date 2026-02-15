/* ================= DOM SELECTORS ================= */
const productList = document.getElementById("productList");
const categoryButtons = document.querySelectorAll(".cat");
const typeButtons = document.querySelectorAll(".type");
const searchInput = document.getElementById("searchInput");
const cartCountEl = document.getElementById("cartCount");

/* ================= STATE ================= */
let allProducts = [];
let activeCategory = "all";
let activeType = "all";

/* ================= FETCH PRODUCTS ================= */
async function loadProducts() {
  try {
    const res = await fetch("/api/menu/products");
    const json = await res.json();

    if (!json.success) {
      showEmpty("Failed to load menu");
      return;
    }

    allProducts = json.data || [];
    renderProducts();
    updateCartCount();
  } catch (err) {
    console.error("Menu fetch error:", err);
    showEmpty("Server error");
  }
}

/* ================= RENDER ================= */
function renderProducts() {
  let products = filterProducts();

  if (products.length === 0) {
    showEmpty("No items found");
    return;
  }

  const cart = getCart();
  productList.innerHTML = "";

  products.forEach(p => {
    const cartItem = cart.find(i => i.product_id === p.id);

    productList.innerHTML += `
      <div class="product-card">

        <div class="product-img">
          <img src="${p.image_url}" alt="${p.name}">
        </div>

        <div class="product-info">
          <h3>${p.name}</h3>
          <p class="price">₹${p.price}</p>
        </div>

        <div class="cart-control">
          ${
            cartItem
              ? qtyControl(p.id, cartItem.quantity)
              : `<button class="add-btn" onclick="addToCart(${p.id})">Add</button>`
          }
        </div>

      </div>
    `;
  });
}

/* ================= FILTER LOGIC ================= */
function filterProducts() {
  let filtered = [...allProducts];

  if (activeCategory !== "all") {
    const catId = categoryMap[activeCategory];
    filtered = filtered.filter(p => p.category_id === catId);
  }

  if (activeType !== "all") {
    filtered = filtered.filter(p =>
      activeType === "veg" ? p.is_veg === 1 : p.is_veg === 0
    );
  }

  const term = searchInput.value.trim().toLowerCase();
  if (term) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(term)
    );
  }

  return filtered;
}

/* ================= CATEGORY MAP ================= */
const categoryMap = {
  coffee: 1,
  tea: 2,
  snacks: 3,
  dessert: 4,
  mojito: 5,
  pizza: 6,
  shake: 7
};

/* ================= FILTER EVENTS ================= */
categoryButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    categoryButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.cat;
    renderProducts();
  });
});

typeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    typeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeType = btn.dataset.type;
    renderProducts();
  });
});

searchInput.addEventListener("input", renderProducts);

/* ================= CART ================= */
function getCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  return cart.filter(item => item.product_id); // auto-clean
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId) {
  const cart = getCart();
  const product = allProducts.find(p => p.id === productId);

  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  const existing = cart.find(item => item.product_id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      quantity: 1,
      price: product.price
    });
  }

  saveCart(cart);
  renderProducts();
}

function changeQty(productId, delta) {
  let cart = getCart();
  const item = cart.find(i => i.product_id === productId);

  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    cart = cart.filter(i => i.product_id !== productId);
  }

  saveCart(cart);
  renderProducts();
}

function qtyControl(id, qty) {
  return `
    <div class="qty-control">
      <button onclick="changeQty(${id}, -1)">−</button>
      <span>${qty}</span>
      <button onclick="changeQty(${id}, 1)">+</button>
    </div>
  `;
}

/* ================= CART COUNT ================= */
function updateCartCount() {
  const cart = getCart();

  const total = cart.reduce((sum, item) => {
    return sum + item.quantity;
  }, 0);

  if (cartCountEl) {
    cartCountEl.innerText = total;
    cartCountEl.style.display = total > 0 ? "inline-block" : "none";
  }
}

/* ================= UI HELPERS ================= */
function showEmpty(msg) {
  productList.innerHTML = `<p style="opacity:.7">${msg}</p>`;
}

/* ================= LOGOUT ================= */
function logout() {
  window.location.href = "../auth/login.html";
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  loadProducts();
});
