/* ================= CONFIGURATION ================= */

const API_BASE_URL = "http://localhost:5000/api";
const BACKEND_URL = "http://localhost:5000";

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
  if (!productList) {
    console.error("Menu error: #productList element was not found.");
    return;
  }

  try {
    productList.innerHTML = "<p>Loading menu...</p>";

    const res = await fetch(`${API_BASE_URL}/menu/products`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      throw new Error(`Menu API returned HTTP ${res.status}`);
    }

    const json = await res.json();

    if (!json.success || !Array.isArray(json.data)) {
      console.error("Unexpected menu API response:", json);
      showEmpty("Failed to load menu.");
      return;
    }

    allProducts = json.data;
    renderProducts();
    updateCartCount();

  } catch (err) {
    console.error("Menu fetch error:", err);
    showEmpty("Unable to load menu. Please try again.");
  }
}

/* ================= IMAGE URL HELPER ================= */

function getProductImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    return "";
  }

  const value = imageUrl.trim();

  if (!value) {
    return "";
  }

  // Preserve absolute HTTP/HTTPS image URLs.
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Serve relative image paths from the backend.
  if (value.startsWith("/")) {
    return `${BACKEND_URL}${value}`;
  }

  // Handle paths such as images/products/latte.jpg.
  if (value.startsWith("images/")) {
    return `${BACKEND_URL}/${value}`;
  }

  // Handle filenames such as latte.jpg.
  return `${BACKEND_URL}/images/products/${value}`;
}

/* ================= RENDER PRODUCTS ================= */

function renderProducts() {
  if (!productList) return;

  const products = filterProducts();

  productList.innerHTML = "";

  if (products.length === 0) {
    showEmpty(allProducts.length ? "No items found." : "No menu items available.");
    return;
  }

  const cart = getCart();
  const fragment = document.createDocumentFragment();

  products.forEach(product => {
    const productId = Number(product.id);
    const cartItem = cart.find(
      item => Number(item.product_id) === productId
    );

    const card = document.createElement("div");
    card.className = "product-card";

    const imageContainer = document.createElement("div");
    imageContainer.className = "product-img";

    const image = document.createElement("img");
    image.alt = product.name || "CafeFlow menu item";
    image.loading = "lazy";

    const imageUrl = getProductImageUrl(product.image_url);

    if (imageUrl) {
      image.src = imageUrl;

      image.onerror = () => {
        image.onerror = null;
        imageContainer.textContent = "☕";
        imageContainer.setAttribute("aria-label", "Image unavailable");
      };
    } else {
      imageContainer.textContent = "☕";
      imageContainer.setAttribute("aria-label", "No image available");
    }

    if (imageUrl) {
      imageContainer.appendChild(image);
    }

    const info = document.createElement("div");
    info.className = "product-info";

    const name = document.createElement("h3");
    name.textContent = product.name || "Unnamed item";

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = `₹${Number(product.price || 0).toFixed(2)}`;

    info.append(name, price);

    const controls = document.createElement("div");
    controls.className = "cart-control";

    if (cartItem) {
      controls.innerHTML = qtyControl(
        productId,
        cartItem.quantity
      );
    } else {
      const addButton = document.createElement("button");
      addButton.className = "add-btn";
      addButton.textContent = "Add";
      addButton.addEventListener("click", () => addToCart(productId));
      controls.appendChild(addButton);
    }

    card.append(imageContainer, info, controls);
    fragment.appendChild(card);
  });

  productList.appendChild(fragment);
}

/* ================= FILTER LOGIC ================= */

function filterProducts() {
  let filtered = [...allProducts];

  if (activeCategory !== "all") {
    const categoryId = categoryMap[activeCategory];

    if (categoryId !== undefined) {
      filtered = filtered.filter(
        product => Number(product.category_id) === categoryId
      );
    }
  }

  if (activeType !== "all") {
    filtered = filtered.filter(product => {
      const isVeg =
        product.is_veg === true ||
        Number(product.is_veg) === 1;

      return activeType === "veg" ? isVeg : !isVeg;
    });
  }

  const term = searchInput?.value.trim().toLowerCase() || "";

  if (term) {
    filtered = filtered.filter(product =>
      String(product.name || "").toLowerCase().includes(term)
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

categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    categoryButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    activeCategory = button.dataset.cat || "all";
    renderProducts();
  });
});

typeButtons.forEach(button => {
  button.addEventListener("click", () => {
    typeButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    activeType = button.dataset.type || "all";
    renderProducts();
  });
});

searchInput?.addEventListener("input", renderProducts);

/* ================= CART ================= */

function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (!Array.isArray(cart)) return [];

    return cart.filter(item => item && item.product_id != null);
  } catch (error) {
    console.error("Unable to read cart:", error);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId) {
  const cart = getCart();

  const product = allProducts.find(
    item => Number(item.id) === Number(productId)
  );

  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  const existingItem = cart.find(
    item => Number(item.product_id) === Number(productId)
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      product_id: Number(product.id),
      name: product.name,
      quantity: 1,
      price: Number(product.price)
    });
  }

  saveCart(cart);
  renderProducts();
}

function changeQty(productId, delta) {
  let cart = getCart();

  const item = cart.find(
    entry => Number(entry.product_id) === Number(productId)
  );

  if (!item) return;

  item.quantity = Number(item.quantity) + delta;

  if (item.quantity <= 0) {
    cart = cart.filter(
      entry => Number(entry.product_id) !== Number(productId)
    );
  }

  saveCart(cart);
  renderProducts();
}

function qtyControl(id, quantity) {
  const productId = Number(id);

  return `
    <div class="qty-control">
      <button type="button"
        onclick="changeQty(${productId}, -1)"
        aria-label="Decrease quantity">−</button>

      <span>${Number(quantity)}</span>

      <button type="button"
        onclick="changeQty(${productId}, 1)"
        aria-label="Increase quantity">+</button>
    </div>
  `;
}

/* ================= CART COUNT ================= */

function updateCartCount() {
  const cart = getCart();

  const total = cart.reduce((sum, item) => {
    return sum + Math.max(0, Number(item.quantity) || 0);
  }, 0);

  if (cartCountEl) {
    cartCountEl.textContent = total;
    cartCountEl.style.display = total > 0 ? "inline-block" : "none";
  }
}

/* ================= UI HELPERS ================= */

function showEmpty(message) {
  if (!productList) return;

  productList.replaceChildren();

  const paragraph = document.createElement("p");
  paragraph.style.opacity = "0.7";
  paragraph.textContent = message;

  productList.appendChild(paragraph);
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