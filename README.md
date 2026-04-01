# ☕ CafeFlow — Smart Café Ordering & Management System

## 💡 Problem Statement

Modern cafés and restaurants require efficient systems to manage orders, payments, and table operations in real time. Traditional manual processes often lead to delays, order mismanagement, and inefficient payment handling.

**Objective:**
To design and develop a full-stack web application that simulates real-world café operations, enabling seamless customer ordering, efficient admin control, and structured workflow management.

---

## 📂 System Overview

CafeFlow is a full-stack restaurant management system that integrates customer-facing ordering features with an administrative dashboard and backend workflow engine.

The system replicates real café environments by handling:

* Order placement and tracking
* Table allocation and release
* Payment processing (Cash & UPI)
* Admin verification and control

---

## 🚀 Key Features

### 👤 Customer Module

* Browse menu with category-based filtering
* Add items to cart with real-time updates
* Place orders (Dine-in / Takeaway / Delivery)
* Automatic table assignment for dine-in
* Add special instructions (order notes)
* Multiple payment options (Cash / UPI)
* Dynamic QR code-based UPI payment
* Submit transaction ID for verification
* Cancel orders before preparation
* Track order status in real time

---

### 🧑‍💼 Admin Module

* Product and category management
* Image upload and management
* Order lifecycle control
* Manual UPI payment verification
* Automatic table release on completion/cancellation
* Dashboard analytics and statistics

---

## 💳 Payment System (Real-World Simulation)

The application implements a realistic payment workflow:

1. QR code is generated dynamically for UPI payments
2. Customer completes payment externally
3. Transaction ID is submitted by the customer
4. Admin verifies the transaction manually

### Payment States:

* Pending
* Paid
* Failed
* Cash Collected

---

## 🧠 Order Workflow

PLACED → PREPARING → READY → DISPATCHED → COMPLETED

* Orders transition through structured states
* Dine-in tables are automatically released after completion or cancellation

---

## 🛠️ Technology Stack

### Frontend:

* HTML
* CSS (Custom Café-Themed UI)
* Vanilla JavaScript

### Backend:

* Node.js
* Express.js
* MySQL

### Additional Tools:

* Multer (Image Upload Handling)
* QRCode (UPI QR Generation)
* LocalStorage (Cart Persistence)

---

## 🗄️ Database Design

The system uses a relational database with the following core tables:

* users
* products
* categories
* orders
* order_items
* tables
* order_status_history

### Order Attributes:

* order_type
* payment_mode
* payment_status
* transaction_id
* order_note

---

## 🔐 Authentication & Authorization

* Session-based authentication
* Role-based access control

### User Roles:

* Customer
* Staff
* Admin

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/kalpithasnaik21-ksn/cafeflow.git
cd cafeflow/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cafeflow
SESSION_SECRET=your_secret_key
```

### 4. Run the server

```bash
node src/app.js
```

### 5. Open in browser

```
http://localhost:5000
```

---

## 📸 Image Handling

* Product images are uploaded via admin panel
* Stored in: `backend/images/products/`
* Served as static files via backend

---

## 💡 Key Concepts Implemented

* Full order lifecycle management
* Role-based access control (RBAC)
* Realistic payment verification workflow
* Dynamic QR code generation
* Table occupancy automation
* Session-based authentication
* Modular MVC backend architecture

---

## 🎯 Learning Outcomes

This project demonstrates:

* Full-stack web application development
* RESTful API design and integration
* Database schema design and relationships
* Real-world workflow simulation
* State management using vanilla JavaScript
* UI/UX consistency and design principles
* Payment flow logic and validation

---

## 📈 Future Enhancements

* Integration with real payment gateways
* Real-time updates using WebSockets
* Invoice generation (PDF)
* Advanced analytics dashboard
* Fully responsive mobile design

---

## 📌 Conclusion

CafeFlow is a comprehensive full-stack application that models real-world restaurant operations. It showcases the integration of frontend and backend systems, structured workflows, and realistic business logic, making it a strong demonstration of practical software engineering skills.

---

## 👩‍💻 Author

**Kalpitha Naik**
Full-Stack Web Developer

---
