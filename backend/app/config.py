import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Load environment variables from .env
env_paths = [PROJECT_DIR / ".env", BASE_DIR / ".env"]
for p in env_paths:
    if p.exists():
        load_dotenv(dotenv_path=p)
        break
else:
    load_dotenv()

# Environment Mode: 'development' or 'production'
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

# Database Configuration
# Defaults to local SQLite, but supports Supabase, PostgreSQL, Neon, Railway via DATABASE_URL
raw_db_url = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'pharmacy.db'}")
# Normalize postgres:// to postgresql:// for modern SQLAlchemy compatibility
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
DATABASE_URL = raw_db_url

# Supabase Cloud Configuration (Optional direct client connection)
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

# Security & JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "pharmacy_super_secure_secret_key_2026_cse326_advanced")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24)))  # 24 hours

# CORS Settings
ALLOWED_ORIGINS = [orig.strip() for orig in os.getenv("ALLOWED_ORIGINS", "*").split(",") if orig.strip()]
