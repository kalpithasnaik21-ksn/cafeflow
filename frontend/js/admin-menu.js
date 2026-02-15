/* ===============================
   GLOBALS
================================ */
let uploadedImageUrl = "";
let deleteTargetId = null;

/* ===============================
   LOAD MENU (ADMIN)
================================ */
async function loadMenu() {
  const tbody = document.getElementById("menuTable");
  tbody.innerHTML = "";

  try {
    const res = await fetch("/api/admin/menu/products", {
      credentials: "include"
    });

    if (!res.ok) {
      console.error("Failed to load menu");
      return;
    }

    const data = await res.json();

    if (!data.success || !Array.isArray(data.data)) return;

    data.data.forEach(product => {
      const tr = document.createElement("tr");

      /* ✅ IMPORTANT: row id for instant delete */
      tr.id = `product-row-${product.id}`;

      tr.innerHTML = `
        <td>${product.name}</td>
        <td>₹${product.price}</td>
        <td>${product.is_veg ? "🌱 Veg" : "🍗 Non-Veg"}</td>
        <td>${product.is_available ? "✅ Available" : "❌ Out of Stock"}</td>
        <td class="actions">

          <button class="edit-btn"
            onclick='openEdit(${JSON.stringify(product)})'>
            Edit
          </button>

          <button class="stock-btn"
            onclick="toggleStock(${product.id}, ${product.is_available})">
            ${product.is_available ? "Out of Stock" : "In Stock"}
          </button>

          <button class="delete-btn"
            onclick="deleteProduct(${product.id})">
            Delete
          </button>

        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Admin menu load error:", err);
  }
}


/* ===============================
   ADD PRODUCT
================================ */
async function addProduct() {
  const name = document.getElementById("name").value.trim();
  const price = document.getElementById("price").value;
  const category_id = document.getElementById("category").value;
  const imageFile = document.getElementById("imageFile").files[0];

  if (!name || !price || !category_id) {
    showToast("Please fill all required fields ☕");
    return;
  }

  if (!imageFile) {
    showToast("Please select an image 🖼");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("price", price);
  formData.append("category_id", category_id);
  formData.append("image", imageFile); // MUST match upload.single("image")

  formData.append("is_veg", document.getElementById("veg").checked ? 1 : 0);
  formData.append("is_bestseller", document.getElementById("bestseller").checked ? 1 : 0);
  formData.append("is_seasonal", document.getElementById("seasonal").checked ? 1 : 0);
  formData.append("is_fast", document.getElementById("fast").checked ? 1 : 0);

  try {
    const res = await fetch("/api/admin/menu/products", {
      method: "POST",
      credentials: "include",
      body: formData   // IMPORTANT: no headers here
    });

    const data = await res.json();

    if (!data.success) {
      showToast("Failed to add product ❌");
      return;
    }

    showToast("Product added successfully ☕");
    resetAddForm();
    loadMenu();

  } catch (err) {
    console.error(err);
    showToast("Server error ❌");
  }
}


/* ===============================
   IMAGE UPLOAD
================================ */
async function uploadImage() {
  const fileInput = document.getElementById("imageFile");
  if (!fileInput.files.length) {
    alert("Select an image");
    return;
  }

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  const res = await fetch("/api/admin/menu/products/upload", {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  const data = await res.json();
  uploadedImageUrl = data.image_url;

  alert("Image uploaded successfully ✅");
}

/* ===============================
   TOGGLE STOCK
================================ */
async function toggleStock(id, current) {
  await fetch(`/api/admin/menu/products/${id}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      is_available: current ? 0 : 1
    })
  });

  loadMenu();
}

/* ===============================
   DELETE (SOFT DELETE)
================================ */
function deleteProduct(id) {
  deleteTargetId = id;
  document.getElementById("deleteModal").classList.remove("hidden");
}


function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById("deleteModal").classList.add("hidden");
}


/* ===============================
   EDIT MODAL
================================ */
function openEdit(product) {
  document.getElementById("editId").value = product.id;
  document.getElementById("editName").value = product.name;
  document.getElementById("editPrice").value = product.price;
  document.getElementById("editImage").value = product.image_url || "";

  document.getElementById("editVeg").checked = !!product.is_veg;
  document.getElementById("editBestseller").checked = !!product.is_bestseller;
  document.getElementById("editSeasonal").checked = !!product.is_seasonal;
  document.getElementById("editFast").checked = !!product.is_fast;

  document.getElementById("editModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("editModal").classList.add("hidden");
}

/* ===============================
   SAVE EDIT
================================ */
async function saveEdit() {
  const id = document.getElementById("editId").value;

  const body = {
    name: document.getElementById("editName").value,
    price: Number(document.getElementById("editPrice").value),
    image_url: document.getElementById("editImage").value,
    is_veg: document.getElementById("editVeg").checked ? 1 : 0,
    is_bestseller: document.getElementById("editBestseller").checked ? 1 : 0,
    is_seasonal: document.getElementById("editSeasonal").checked ? 1 : 0,
    is_fast: document.getElementById("editFast").checked ? 1 : 0
  };

  const res = await fetch(`/api/admin/menu/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (data.success) {
    closeModal();
    loadMenu();
    showToast("Product updated successfully ☕");
  } else {
    showToast("Failed to update product ❌");
  }
}

async function confirmDelete() {
  if (!deleteTargetId) return;

  const id = deleteTargetId;

  // Remove row immediately (optimistic UI)
  const row = document.getElementById(`product-row-${id}`);
  if (row) row.remove();

  closeDeleteModal();

  try {
    const res = await fetch(`/api/admin/menu/products/${id}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) throw new Error("Delete failed");

    // ✅ TOAST — this WILL appear
    showToast("Product deleted successfully ☕");

  } catch (err) {
    console.error(err);

    showToast("Failed to delete product ❌");

    // Rollback UI if needed
    loadMenu();
  } finally {
    deleteTargetId = null;
  }
}

/* ===============================
   TOAST
================================ */
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;

  // Force browser paint
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
  }, 2500);
}



/* ===============================
   RESET FORM
================================ */
function resetAddForm() {
  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("category").value = "1";

  document.getElementById("veg").checked = false;
  document.getElementById("bestseller").checked = false;
  document.getElementById("seasonal").checked = false;
  document.getElementById("fast").checked = false;

  document.getElementById("imageFile").value = "";
  uploadedImageUrl = "";
}

/* ===============================
   LOGOUT
================================ */
function logout() {
  window.location.href = "../auth/login.html";
}


/* ===============================
   INIT
================================ */
loadMenu();
