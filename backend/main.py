import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import BASE_DIR, PROJECT_DIR, UPLOAD_DIR
from backend.app.database import engine, Base, SessionLocal
from backend.app.seeder import seed_database

# Routers
from backend.app.routers import (
    auth,
    medicines,
    sales,
    suppliers,
    purchases,
    customers,
    prescriptions,
    reports,
    alerts,
    system
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed database if fresh
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    yield


app = FastAPI(
    title="Pharmacy Management System API",
    description="Full-featured RESTful API for modern pharmacy operations, billing, inventory, suppliers, and prescriptions.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(medicines.router, prefix="/api")
app.include_router(sales.router, prefix="/api")
app.include_router(suppliers.router, prefix="/api")
app.include_router(purchases.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(prescriptions.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(system.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "system": "Pharmacy Management System", "version": "2.0.0"}


# Mount Uploads directory
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Mount Frontend static files
FRONTEND_DIR = PROJECT_DIR / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
