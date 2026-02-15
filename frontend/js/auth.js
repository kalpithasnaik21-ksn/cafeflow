/*********************************
 * AUTH LOGIC – CafeFlow
 *********************************/

function showMessage(message, type = "error") {
  const box = document.getElementById("authMessage");
  if (!box) return;

  box.textContent = message;
  box.className = "auth-message " + type;
  box.style.display = "block";

  document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      box.style.display = "none";
    }, { once: true });
  });
}

/* ================= LOGIN ================= */
async function login() {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!email || !password) {
    showMessage("Please enter email and password");
    return;
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!data.success) {
      showMessage(data.message || "Invalid email or password");
      return;
    }

    const role = data.user.role;

    if (role === "admin") window.location.href = "../admin/dashboard.html";
    else if (role === "staff") window.location.href = "../staff/orders.html";
    else window.location.href = "../customer/menu.html";

  } catch (err) {
    console.error(err);
    showMessage("Server error. Please try again.");
  }
}

/* ================= REGISTER ================= */
async function register() {
  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const phone = document.getElementById("phone")?.value.trim();

  if (!name || !email || !password) {
    showMessage("Please fill all required fields");
    return;
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password, phone })
    });

    const data = await res.json();

    if (!data.success) {
      showMessage(data.message || "Registration failed");
      return;
    }

    showMessage("Registration successful ☕ Please login", "success");
    setTimeout(() => window.location.href = "login.html", 1500);

  } catch (error) {
    console.error(error);
    showMessage("Server error. Please try again.");
  }
}

/* ================= LOGOUT ================= */
async function logout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });

    window.location.href = "../index.html";
  } catch (error) {
    console.error(error);
  }
}
