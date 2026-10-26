import os
import sys
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL", "")

print("=" * 60)
print("PHARMAPULSE DATABASE CONNECTION DIAGNOSTIC")
print("=" * 60)

if not db_url:
    print("[ERROR] DATABASE_URL is not set in environment or .env!")
    sys.exit(1)

if db_url.startswith("sqlite"):
    print("[INFO] Currently configured with: SQLite (Local Database)")
    print(f"       Target: {db_url}")
    print("[NOTE] Supabase is NOT active locally because DATABASE_URL is pointing to SQLite.")
    print("       To test Supabase, set DATABASE_URL in .env to your postgresql:// string.")
elif "supabase" in db_url or db_url.startswith("postgres"):
    print("[INFO] Testing connection to Cloud PostgreSQL (Supabase)...")
    masked_url = db_url
    if "@" in db_url:
        prefix, rest = db_url.split("@", 1)
        if ":" in prefix:
            proto, creds = prefix.split("://", 1)
            user = creds.split(":", 1)[0]
            masked_url = f"{proto}://{user}:****@{rest}"
    print(f"       Target: {masked_url}")

    try:
        from sqlalchemy import create_engine, text
        # Normalize postgres:// to postgresql://
        norm_url = db_url.replace("postgres://", "postgresql://", 1) if db_url.startswith("postgres://") else db_url
        engine = create_engine(norm_url, pool_pre_ping=True, connect_args={"connect_timeout": 10})
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();")).scalar()
            print("[SUCCESS] Connected to Supabase PostgreSQL successfully!")
            print(f"          Database Version: {result[:50]}...")
            
            # Check existing tables
            tables_result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")).fetchall()
            tables = [r[0] for r in tables_result]
            print(f"          Tables in public schema ({len(tables)}): {', '.join(tables) if tables else 'None (Tables will auto-generate on app launch)'}")
    except Exception as e:
        print("[FAILED] Could not connect to Supabase database.")
        print(f"         Error details: {e}")
        print("\nCommon fixes:")
        print("1. Check if your database password is correct.")
        print("2. If on IPv4 network, use the Pooler connection string:")
        print("   postgresql://postgres.PROJECT_ID:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres")
else:
    print(f"[UNKNOWN] DATABASE_URL protocol not recognized: {db_url[:20]}...")

print("=" * 60)
