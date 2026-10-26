# PharmaPulse - Pharmacy Management System (CSE 326)

[![Live Web App](https://img.shields.io/badge/Live%20Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://pharmapulse-owee.onrender.com/#landing)
[![Database](https://img.shields.io/badge/Database-Supabase%20Cloud%20Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20REST-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Currency](https://img.shields.io/badge/Currency-%E2%82%B9%20INR%20Native-000000?style=for-the-badge)](#)

> **🚀 Live Production Website:** [https://pharmapulse-owee.onrender.com/#landing](https://pharmapulse-owee.onrender.com/#landing)  
> **📖 Interactive Swagger API Docs:** [https://pharmapulse-owee.onrender.com/docs](https://pharmapulse-owee.onrender.com/docs)  
> **📊 System Telemetry & Cloud DB Status:** [https://pharmapulse-owee.onrender.com/api/system/status](https://pharmapulse-owee.onrender.com/api/system/status)

A full-stack, enterprise-grade **Pharmacy Management System** designed to streamline pharmacy operations by digitally managing medicine inventory, sales billing, suppliers, customer records, and prescriptions in Indian Rupees (₹).

---

### 🔑 Instant Live Demo Credentials
Access the live deployment directly with these pre-seeded Indian healthcare roles:
- **Administrator**: `admin` / `admin123` (*Dr. Rajesh Sharma*) — Full backoffice, staff management, inventory CRUD, valuation reports
- **Clinical Pharmacist**: `pharma` / `pharma123` (*Pooja Sharma*) — POS counter billing, GST invoices, digital Rx verification

---

## 🌟 Key Features

### 0. 🌐 Production Landing Page & 1-Click Demo Launchpad
- **Dedicated Public Landing Page**: Showcases all platform features, live numbers strip, operational workflows, and security architecture.
- **1-Click Interactive Demo Logins**:
  - 🛡️ **Administrator Session**: Instant access as `admin` (`admin123`) with full backoffice and financial privileges.
  - 💊 **Pharmacist Session**: Instant access as `pharma` (`pharma123`) with POS counter billing, Indian GST tax invoices, and prescription verification.
- **Embedded Sign In & Registration**: Direct authentication from the landing page with role assignment.
- **Seamless Workspace Transition**: Dynamic switching between the public landing page and the operational clinical workspace.

### 1. 🔐 Full Backend Authentication & Role-Based Access Control
- **JWT (JSON Web Token)** secure bearer authentication with expiration & PBKDF2-SHA256 password hashing.
- Role management:
  - **Administrator** (`admin`): Full access to inventory, sales audit, financial valuation, staff management, and role assignments.
  - **Pharmacist / Cashier** (`pharmacist`, `cashier`): Counter POS billing, medicine lookup, prescription verification, stock inward.
- User registration, login, profile management, and staff account activation/deactivation.

### 2. 💊 Medicine Inventory Management
- Rich medicine attributes: Name, Generic Composition, Category, Dosage Form (Tablet, Capsule, Syrup, Inhaler, etc.), Strength, Manufacturer, Batch Number, Barcode / SKU, Purchase Cost, Selling Price, Stock Quantity, Minimum Alert Level, Expiry Date, Storage Location (Rack/Shelf), and Rx Required flag.
- Real-time search by Brand Name, Generic Name, Batch, or Barcode scan.
- Category filters, stock level filters (In Stock, Low Stock, Out of Stock), and expiry status filters.
- Full CRUD operations with instant CSV export of all inventory items.

### 3. ⚠️ Safety, Stock & Expiry Tracking (Automated Alerts)
- **Expired Medicines Alert**: Flags expired batches immediately and prevents them from being sold at the counter.
- **Expiring Soon Alert**: Identifies medicines expiring within 30 to 60 days for priority first-expiry dispensing.
- **Low Stock & Out-of-Stock Warnings**: Real-time threshold monitoring with one-click stock inward replenishment.
- Visual badge indicators and dedicated notification center.

### 4. 🧾 Point of Sale (POS) Billing & Print-Ready Invoices
- Fast, keyboard-friendly checkout with live catalog search and barcode scanner support (Enter key).
- Safety checks: Prevents dispensing expired or out-of-stock items, warns if medicine is expiring soon.
- Itemized cart management with real-time subtotal, discount (% or ₹), and configurable tax/GST.
- Customer selector with automatic medical allergy / warning notifications.
- Multi-mode payment support: **Cash**, **Credit/Debit Card**, **UPI / QR Code**, **Insurance**.
- Generates **Printable Tax Invoices** with pharmacy header, batch details, cashier name, customer info, and barcode.
- Sales audit trail with reprint option and one-click **Refund / Void** with automatic stock restoration.

### 5. 🚚 Suppliers & Stock Inward (Purchase Orders)
- Supplier directory with contact person, phone, email, tax/GST ID, and lifetime purchase totals.
- **Stock Inward / Purchase Order Generator**: Record incoming shipments from distributors with dynamic multi-item rows, automatic stock increments, and purchase cost updates.

### 6. 🧑‍🤝‍🧑 Customer Records & Prescription Management
- Patient database with medical histories, allergies, and chronic condition notes.
- Prescription handling: Associate doctor name, medical license #, prescription date, and file attachment (image or PDF scan) with verification statuses (**Verified**, **Pending**, **Dispensed**).

### 7. 📊 Executive Dashboard & Financial Reports
- KPI cards: Total Revenue, Today's Sales, Active Formulations, Low Stock, Expired Count, Total Customers.
- Interactive Chart.js visualizations:
  - 7-Day Revenue Trend (daily income curve).
  - Inventory distribution by pharmacological category (doughnut chart).
- Financial valuation metrics: Wholesale Cost Valuation, Retail Valuation, Potential Profit Margin (%).
- Sales audit export to CSV.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Framework** | FastAPI (Async RESTful API, Python 3.14) |
| **Database** | SQLite with SQLAlchemy 2.0 ORM |
| **Security & Auth** | PyJWT (HMAC-SHA256), PBKDF2-SHA256 Password Hashing |
| **Frontend** | Modern SPA with HTML5, Vanilla ES6+ JavaScript, Tailwind CSS |
| **Visualizations** | Chart.js 4.x for revenue & category analytics |
| **API Docs** | Interactive OpenAPI / Swagger UI at `/docs` |

---

## 🚀 Quick Start (One-Click Launcher)

Run the one-command launcher from the workspace root:

```powershell
python run.py
```

This will automatically:
1. Create the SQLite database (`pharmacy.db`) with full schema tables.
2. Seed 22+ realistic medicines, 4 suppliers, 5 customers, prescriptions, and historical sales transactions.
3. Start the FastAPI server on `http://127.0.0.1:8000`.
4. Launch your default web browser to the application portal.

---

## 🔑 Default Credentials

| Role | Username | Password | Full Name |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Dr. Alexander Wright |
| **Pharmacist** | `pharma` | `pharma123` | Sarah Connor |

> **Tip:** You can also use the **1-Click Demo Login** buttons on the sign-in modal for quick access!

---

## 📁 Project Structure

```
cse 326 pharmacy/
├── backend/
│   ├── app/
│   │   ├── config.py           # Configuration (JWT, paths, DB URL)
│   │   ├── database.py         # SQLAlchemy engine and SessionLocal
│   │   ├── models.py           # Relational database models
│   │   ├── schemas.py          # Pydantic validation schemas
│   │   ├── security.py         # PBKDF2 hashing & JWT encoding
│   │   ├── dependencies.py     # Auth & Role verification guards
│   │   ├── seeder.py           # Initial data generator
│   │   └── routers/
│   │       ├── auth.py         # /api/auth (Login, Register, Users)
│   │       ├── medicines.py    # /api/medicines (CRUD, search, filters)
│   │       ├── sales.py        # /api/sales (POS billing, refunds)
│   │       ├── suppliers.py    # /api/suppliers (Suppliers directory)
│   │       ├── purchases.py    # /api/purchases (Stock inward)
│   │       ├── customers.py    # /api/customers (Patients & allergies)
│   │       ├── prescriptions.py# /api/prescriptions (Rx uploads & status)
│   │       ├── reports.py      # /api/reports (Analytics & valuation)
│   │       └── alerts.py       # /api/alerts (Expiry & stock alerts)
│   ├── uploads/                # Storage for prescription files
│   └── main.py                 # FastAPI application mount
├── frontend/
│   ├── index.html              # Responsive Single-Page Application
│   ├── css/
│   │   └── style.css           # Styling, print-receipt styles, animations
│   └── js/
│       ├── api.js              # Fetch client with auto JWT & toast alerts
│       ├── auth.js             # Session management & user roles
│       ├── dashboard.js        # KPIs, charts, and recent sales
│       ├── pos.js              # POS engine, cart calculations, invoice
│       ├── inventory.js        # Medicine table, search, filters, CRUD
│       ├── sales.js            # Sales history, reprint, refund
│       ├── suppliers.js        # Supplier management
│       ├── purchases.js        # Stock inward & replenishment
│       ├── customers.js        # Patient profiles & allergy flags
│       ├── prescriptions.js    # Rx verification & upload
│       ├── alerts.js           # Notification center & safety alerts
│       ├── reports.js          # Financial valuation & CSV export
│       ├── users.js            # Admin user permissions
│       └── app.js              # Global router & keyboard shortcuts
├── run.py                      # One-click startup runner
└── README.md                   # Complete documentation
```

---

## 📡 API Endpoints Overview

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/auth/users`, `PUT /api/auth/users/{id}/role`
- **Medicines**: `GET /api/medicines`, `POST /api/medicines`, `GET /api/medicines/{id}`, `PUT /api/medicines/{id}`, `DELETE /api/medicines/{id}`, `GET /api/medicines/categories`
- **POS / Sales**: `POST /api/sales` (Checkout), `GET /api/sales` (History), `GET /api/sales/{id}`, `POST /api/sales/{id}/refund`
- **Purchases**: `POST /api/purchases` (Stock Inward), `GET /api/purchases`, `GET /api/purchases/{id}`
- **Suppliers**: `GET /api/suppliers`, `POST /api/suppliers`, `PUT /api/suppliers/{id}`
- **Customers**: `GET /api/customers`, `POST /api/customers`, `GET /api/customers/{id}`, `PUT /api/customers/{id}`
- **Prescriptions**: `GET /api/prescriptions`, `POST /api/prescriptions`, `POST /api/prescriptions/upload`, `PUT /api/prescriptions/{id}/status`
- **Reports**: `GET /api/reports/dashboard`, `GET /api/reports/inventory-valuation`
- **Alerts**: `GET /api/alerts/summary`, `GET /api/alerts`, `PUT /api/alerts/{id}/read`
- **System & Cloud**: `GET /api/system/status`, `GET /api/system/deployment-info`, `GET /api/health`

---

## 🚀 Cloud Deployment & Supabase Setup

PharmaPulse is cloud-ready and supports **Supabase (PostgreSQL)**, **Neon**, **Railway**, **Render**, and **Docker**.

1. Copy `.env.example` to `.env`.
2. To connect **Supabase Cloud Database**, provide your URI in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
3. One-click deploy files included:
   - `render.yaml` - 1-click Render web service
   - `railway.toml` - 1-click Railway service
   - `Dockerfile` & `docker-compose.yml` - Containerized production stack
4. For comprehensive instructions, view [DEPLOYMENT.md](./DEPLOYMENT.md).
