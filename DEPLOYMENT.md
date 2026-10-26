# PharmaPulse - Database & Production Deployment Guide

This guide walks through configuring and deploying the **PharmaPulse Pharmacy Management System** to production cloud platforms (Render, Railway, Docker, Fly.io, or VPS) with **Supabase (PostgreSQL)** or **SQLite**.

---

## 1. Cloud Database Setup (Supabase / PostgreSQL)

PharmaPulse supports **Supabase Cloud PostgreSQL** out of the box with connection pooling and automated table schema creation.

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create an account or sign in.
2. Click **New Project**, choose a name (e.g. `pharmapulse-db`), set a database password, and choose your preferred cloud region (e.g., *Mumbai / ap-south-1*).
3. Wait ~1 minute for Supabase to provision your database.

### Step 2: Retrieve your Database Connection String
1. In the Supabase Dashboard, go to **Project Settings** (gear icon) -> **Database**.
2. Scroll to **Connection string** and select the **URI** tab.
3. Copy the URI string:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
   *(Or for high-concurrency environments, use the connection pooler on port 6543)*
4. Replace `[YOUR-PASSWORD]` with your actual database password.

### Step 3: Add Environment Variables
Add the connection string to your `.env` file or cloud host's environment settings:
```env
ENVIRONMENT=production
DATABASE_URL=postgresql://postgres:YOUR_STRONG_PASSWORD@db.xxxxxxxxxxxxxxxxxxxx.supabase.co:5432/postgres
SECRET_KEY=YOUR_GENERATED_32_CHAR_JWT_SECRET
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=*
```

> **Zero Manual Migrations Needed**: When PharmaPulse boots up, SQLAlchemy automatically creates all 10 relational tables (`users`, `medicines`, `suppliers`, `purchase_orders`, `customers`, `prescriptions`, `sales`, etc.) and automatically seeds initial inventory and accounts if the database is fresh!

---

## 2. One-Click Deploy to Render.com (Recommended Free Hosting)

PharmaPulse includes a [`render.yaml`](./render.yaml) blueprint for 1-click zero-config deployment.

### Option A: Using Render Blueprint (Fastest)
1. Push your repository to GitHub or GitLab.
2. Sign in to [Render.com](https://render.com).
3. Click **Blueprints** -> **New Blueprint Instance**.
4. Select your repository. Render reads `render.yaml` automatically and configures the web service.
5. In the Environment Variables section, add your `DATABASE_URL` (Supabase connection string).
6. Click **Apply**. Render will build and deploy your app with a public `https://your-app.onrender.com` URL.

### Option B: Manual Web Service on Render
- **Environment**: Python
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `DATABASE_URL`: Your Supabase URI or Render Postgres URI
  - `SECRET_KEY`: Random 32+ character string
  - `ENVIRONMENT`: `production`

---

## 3. One-Click Deploy to Railway

PharmaPulse includes a [`railway.toml`](./railway.toml) configuration.

1. Install Railway CLI or connect via [Railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Railway automatically detects Python, installs dependencies from `requirements.txt`, and runs the start command.
4. In Railway project settings, go to **Variables** and add:
   - `DATABASE_URL`: Your Supabase connection string
   - `SECRET_KEY`: A secure random secret
   - `ENVIRONMENT`: `production`
5. Railway generates a public domain with SSL.

---

## 4. Deploying with Docker & Docker Compose

PharmaPulse includes an optimized [`Dockerfile`](./Dockerfile) and [`docker-compose.yml`](./docker-compose.yml).

### Build & Run Locally / On VPS:
```bash
# Build and run the container
docker compose up -d --build

# View container logs
docker compose logs -f

# Health check test
curl http://localhost:8000/api/health
```

### Production Docker Run:
```bash
docker run -d \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres" \
  -e SECRET_KEY="your_secure_secret_key" \
  --name pharmapulse \
  pharmapulse:latest
```

---

## 5. Built-in Authentication & Initial Admin Accounts

When initialized on a fresh database, PharmaPulse seeds two default operational accounts:

| Role | Username | Default Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full access: User management, role updates, inventory CRUD, financial reports, stock inward, billing |
| **Pharmacist** | `pharma` | `pharma123` | Operational access: POS billing, customer records, prescription verification, stock search |

> **Security Tip**: Once deployed to production, immediately change the default admin password using the sidebar **Security / Change Password** modal or register your own administrator account.

---

## 6. Live Health & Diagnostics Endpoints

You can verify your live cloud database and authentication health anytime:

- **Health Check**: `GET /api/health`
- **System & DB Diagnostics**: `GET /api/system/status`
- **Interactive UI Diagnostics**: Click the `[● DB: ...]` badge in the top-right header inside the application.
