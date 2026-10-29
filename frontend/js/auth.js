
/*********************************
 * AUTH LOGIC – CafeFlow
 *********************************/

// Backend API base URL
const API_BASE_URL = "http://127.0.0.1:5000/api";

/* ================= MESSAGES ================= */

function showMessage(message, type = "error") {
  const box = document.getElementById("authMessage");
  if (!box) return;

  box.textContent = message;
  box.className = "auth-message " + type;
  box.style.display = "block";
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
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showMessage(data.message || "Invalid email or password");
      return;
    }

    const role = data.user?.role;

    if (role === "admin") {
      window.location.href = "../admin/dashboard.html";
    } else if (role === "staff") {
      window.location.href = "../staff/orders.html";
    } else {
      window.location.href = "../customer/menu.html";
    }

  } catch (error) {
    console.error("Login error:", error);
    showMessage("Unable to connect to the server. Please try again.");
  }
}

/* ================= REGISTER ================= */

async function register() {
  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;
  const phone = document.getElementById("phone")?.value.trim();

  if (!name || !email || !password || !phone) {
    showMessage("Please fill in all required fields");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        name,
        email,
        password,
        phone
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showMessage(data.message || "Registration failed");
      return;
    }

    showMessage("Registration successful ☕ Please login", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);

  } catch (error) {
    console.error("Registration error:", error);
    showMessage("Unable to connect to the server. Please try again.");
  }
}

/* ================= LOGOUT ================= */

async function logout() {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (!res.ok) {
      console.error("Logout failed:", res.status);
    }

    window.location.href = "../index.html";

  } catch (error) {
    console.error("Logout error:", error);
    showMessage("Unable to connect to the server.");
  }
}