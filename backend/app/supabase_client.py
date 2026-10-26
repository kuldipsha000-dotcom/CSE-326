"""
Supabase Client & Cloud Database Integration Module
Provides optional direct Supabase client initialization, storage handling,
and database status detection for production deployment.
"""

from typing import Optional, Dict, Any
from .config import SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL

_supabase_client = None


def get_supabase_client():
    """
    Returns the Supabase Client if SUPABASE_URL and SUPABASE_ANON_KEY are set.
    Returns None if not configured.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        return _supabase_client
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
        return None


def get_database_info() -> Dict[str, Any]:
    """
    Inspects current database configuration and returns provider details.
    """
    is_sqlite = DATABASE_URL.startswith("sqlite")
    is_supabase = "supabase" in DATABASE_URL.lower() or bool(SUPABASE_URL)
    is_postgres = DATABASE_URL.startswith("postgresql")

    if is_supabase:
        db_type = "Supabase Cloud (PostgreSQL)"
        driver = "PostgreSQL (Supabase Managed)"
    elif is_postgres:
        db_type = "PostgreSQL (Cloud / Hosted)"
        driver = "PostgreSQL Dialect"
    elif is_sqlite:
        db_type = "SQLite (Local File DB)"
        driver = "SQLite 3"
    else:
        db_type = "Custom Relational DB"
        driver = DATABASE_URL.split(":")[0]

    return {
        "provider": db_type,
        "driver": driver,
        "is_cloud": not is_sqlite,
        "is_supabase": is_supabase,
        "supabase_client_active": get_supabase_client() is not None,
        "supabase_url_configured": bool(SUPABASE_URL),
        "connection_target": "Cloud Database" if not is_sqlite else "Local Storage"
    }
