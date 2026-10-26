from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
from ..models import User, Medicine, Sale
from ..config import ENVIRONMENT, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, DATABASE_URL
from ..supabase_client import get_database_info, get_supabase_client
from ..schemas import SystemStatusOut

router = APIRouter(prefix="/system", tags=["System & Cloud Database Status"])


@router.get("/status", response_model=SystemStatusOut)
def get_system_status(db: Session = Depends(get_db)):
    # Test DB connection
    db_connected = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_connected = False

    db_info = get_database_info()
    db_info["connected"] = db_connected

    active_users = db.query(User).filter(User.is_active == True).count()
    total_medicines = db.query(Medicine).count()
    total_sales = db.query(Sale).count()

    return {
        "status": "healthy" if db_connected else "degraded",
        "database": db_info,
        "environment": ENVIRONMENT,
        "active_users": active_users,
        "total_medicines": total_medicines,
        "total_sales": total_sales,
        "currency": "INR (₹)",
        "auth_algorithm": ALGORITHM,
        "token_expiry_hours": ACCESS_TOKEN_EXPIRE_MINUTES // 60
    }


@router.get("/deployment-info")
def get_deployment_info():
    is_sqlite = DATABASE_URL.startswith("sqlite")
    return {
        "title": "PharmaPulse Management System",
        "version": "2.0.0",
        "framework": "FastAPI + SQLAlchemy + Tailwind/shadcn",
        "ready_for_cloud": True,
        "supported_databases": [
            "Supabase PostgreSQL (Recommended for cloud)",
            "PostgreSQL (Neon, Railway, AWS RDS, Docker)",
            "SQLite (Local file or Persistent Container Volume)"
        ],
        "auth_provider": "JWT (HMAC-SHA256) with PBKDF2 Password Hashing",
        "current_database_mode": "SQLite (Local)" if is_sqlite else "Cloud PostgreSQL / Supabase",
        "deployment_platforms": ["Render", "Railway", "Fly.io", "AWS", "Docker"]
    }
