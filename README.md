# 🛡️ PRABHU SECURITY SOLUTIONS - CCTV Camera Sales & Home Installation Web Application & ERP

A complete, production-ready, full-stack CCTV Camera Sales and Home Installation web application built for **PRABHU SECURITY SOLUTIONS** (Managed by **L. CHIRU**) with **Node.js**, **Express.js**, **SQLite**, **Socket.io**, **JWT Authentication**, and modern **Cream & Dark Green UI**.

---

## 📞 Business & Contact Information

- **Company Name**: PRABHU SECURITY SOLUTIONS
- **Managing Director / Admin**: L. CHIRU
- **Cell / Contact Numbers**: 8790978417, 8688372556
- **Email**: lankachiranjeevi1996@gmail.com
- **Office Address**: H.No.07-006/A, Plot No.3, JK Nagar, Subhash Nagar, Jeedimetla, Hyderabad-500 055.

---

## 🌟 Key Features

### 🌐 Customer Portal (No Login Required)
- **Home Page**: Hero banner ("Secure Your Home With Smart CCTV"), camera showcase, why choose us, service breakdown, how home installation works, and approved customer reviews.
- **CCTV Products Catalog**: Interactive product cards detailing resolution, night vision specs, storage options, pricing, and direct booking links.
- **Installation & Maintenance Services**: Breakdown of Home setup, Office setup, Maintenance, Camera upgrades, and Replacement services.
- **Our Recent Work Gallery**: Public photo gallery featuring real installation work completed by technicians with category filters and image detail modal.
- **Customer Ratings & Reviews**: Display approved reviews with star ratings (1-5). Includes interactive modal for customers to submit reviews (defaulting to `PENDING` status for admin moderation).
- **Dedicated Booking Engine**: Customer enters Full Name, Mobile Number, Complete Address, Preferred Date, and dynamic Time Slot (which disables already booked or unavailable slots). Automatically generates unique Booking ID (e.g. `CCTV-2026-0001`).

### 👑 Admin Management Portal (Protected by JWT Auth)
- **Admin Authentication**: Password hashing using `bcryptjs` and session management via JSON Web Tokens (JWT). Non-admin attempts return `401 Unauthorized` or `403 Forbidden`.
- **Real-Time 🔔 NEW WORK Notifications**: Socket.io integration pushes instant alert toasts and audio/visual cues to Admin Dashboard when a customer submits a booking, auto-refreshing the dashboard without page reload!
- **NEW WORK Section**: Immediate display of incoming requests with customer details, clickable mobile link (`tel:`), complete address, date, time slot, camera requirement, and quick action buttons (`[Accept]`, `[Assign]`, `[Mark Completed]`, `[Cancel]`).
- **Bookings Management**: Table search by name/mobile/booking ID, status filters (`NEW`, `ACCEPTED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), date pickers, and detail modal.
- **Time Slot Management**: Enable/disable time slots, set max capacity per slot, and create custom time slots.
- **Customer Review Moderation**: View all submitted reviews, approve (`APPROVED`), hide (`HIDDEN`), or permanently delete reviews.
- **Work Photo Gallery Manager**: Upload installation photos using `multer` with title, description, category, date, location. Toggle public visibility (`is_visible`) and delete photos with confirmation prompts.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla CSS with Cream `#FAF7F2` + Dark Green `#0A382C` theme), Bootstrap 5, Bootstrap Icons.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (via `better-sqlite3` with WAL mode & automated schema migration).
- **Real-Time WebSocket**: Socket.io.
- **Security**: JWT (jsonwebtoken), password hashing (bcryptjs), Multer image upload filter.

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Node.js (v16+ recommended) installed on your system.

### 2. Install Dependencies
Open terminal in `C:\Users\varun\OneDrive\Pictures\Desktop\CCTV_ERP` and run:
```bash
npm install
```

### 3. Environment Variables Configuration
Check or edit the `.env` file in the root directory:
```env
PORT=5000
JWT_SECRET=cctv_secure_admin_jwt_secret_key_2026_antigravity
DB_PATH=./cctv_database.db
ADMIN_DEFAULT_USER=admin
ADMIN_DEFAULT_PASS=admin123
```

### 4. Start the Application
Run the Express server:
```bash
npm start
```
*Or for development with automatic restart:*
```bash
npm run dev
```

---

## 🔑 Admin Credentials

| Field | Value |
|-------|-------|
| **Admin Login URL** | `https://prabhu-security-cctv-erp.onrender.com/admin-login.html` |
| **Username** | `Lankaprabhu` |
| **Password** | `Chiru@123` |

---

## 🌐 Application URLs

- **Public Home Page**: [http://localhost:5000](http://localhost:5000)
- **CCTV Products Catalog**: [http://localhost:5000/products.html](http://localhost:5000/products.html)
- **Installation Services**: [http://localhost:5000/services.html](http://localhost:5000/services.html)
- **Our Recent Work Gallery**: [http://localhost:5000/gallery.html](http://localhost:5000/gallery.html)
- **Customer Reviews**: [http://localhost:5000/reviews.html](http://localhost:5000/reviews.html)
- **Book Installation Page**: [http://localhost:5000/book.html](http://localhost:5000/book.html)
- **Admin Login**: [http://localhost:5000/admin-login.html](http://localhost:5000/admin-login.html)
- **Admin Dashboard**: [http://localhost:5000/admin-dashboard.html](http://localhost:5000/admin-dashboard.html)

---

*Developed for PRABHU SECURITY SOLUTIONS (L. CHIRU) by Antigravity AI.*
