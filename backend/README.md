☕ CafeFlow — Smart Café Ordering & Management System

A full-stack restaurant management web application that simulates real café operations — including customer ordering, admin dashboard, staff workflow, and UPI payment verification.

CafeFlow is designed to mimic how modern cafés manage orders, payments, and tables in real time.

🚀 Features
👤 Customer

Browse menu with categories & filters

Add items to cart with live quantity update

Dine-in / Takeaway / Delivery ordering

Automatic table assignment (dine-in)

Order notes (special instructions)

Cash or UPI payment option

Dynamic QR-code payment

Transaction ID submission

Cancel order before preparation

View order status live

🧑‍💼 Admin Panel

Product & category management

Image upload for products

Order workflow control

Payment verification (UPI)

Table auto-release on completion/cancel

Dashboard statistics

💳 Payment System (Simulated Real-World Flow)

Dynamic UPI QR generation

Customer submits transaction ID

Admin verifies payment manually

Payment states:

Pending

Paid

Failed

Cash collected

🧠 Order Workflow
PLACED → PREPARING → READY → DISPATCHED → COMPLETED


Dine-in automatically releases table after completion or cancellation.

🛠️ Tech Stack

Frontend

HTML

CSS (custom theme UI)

Vanilla JavaScript

Backend

Node.js

Express.js

MySQL

Session-based authentication

Other

Multer (image uploads)

QRCode (UPI QR generation)

LocalStorage cart persistence

🗄️ Database Highlights

Key tables:

users

products

categories

orders

order_items

tables

order_status_history

Orders include:

order_type

payment_mode

payment_status

transaction_id

order_note

🔐 Authentication

Session-based login (no JWT)

Roles:

customer

staff

admin

📦 Installation
git clone https://github.com/kalpithasnaik21-ksn/cafeflow.git
cd cafeflow/backend
npm install


Create .env

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Kalpithasnaik@21
DB_NAME=cafeflow
SESSION_SECRET=6ac4cc7bbff94a0eb995890f486ea625367ffa1f8971a76819b3f925a0d87b5f


Run server:

node src/app.js


Open:

http://localhost:5000

📸 Image Upload

Admin uploads product images → stored in:

backend/images/products/


Database stores public path:

/images/products/<filename>

💡 Key Concepts Implemented

Full order lifecycle management

Role-based access control

Realistic payment verification system

Dynamic QR code generation

Table occupancy automation

Session authentication

Modular MVC backend architecture

🎯 Learning Outcomes

This project demonstrates:

Full-stack application architecture

REST API design

State management without frameworks

Database relationship modeling

Real-world workflow simulation

UI/UX consistency design

Payment flow handling logic

🏁 Future Improvements

Real payment gateway integration

Live order updates using WebSockets

Invoice generation (PDF)

Sales analytics dashboard

Mobile responsive improvements

👩‍💻 Author

Kalpitha

Full-stack web development project built as a production-style system simulation.