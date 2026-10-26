"""
Pharmacy Management System (CSE 326)
One-Click Launcher & Server Runner
"""

import os
import sys
import webbrowser
import threading
import time
import uvicorn

# Add current workspace directory to sys.path
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
if WORKSPACE_DIR not in sys.path:
    sys.path.insert(0, WORKSPACE_DIR)

from backend.app.database import engine, Base, SessionLocal
from backend.app.seeder import seed_database


def initialize_database():
    """Ensure database schema is created and pre-seeded with sample data."""
    print("=" * 60)
    print("  INITIALIZING PHARMACY MANAGEMENT SYSTEM DATABASE...")
    print("=" * 60)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    print("[OK] Database ready with complete pharmaceutical records!")


def open_browser():
    """Wait briefly for the server to bind and launch the browser."""
    time.sleep(1.5)
    url = "http://127.0.0.1:8000"
    print(f"\n[INFO] Opening web interface at: {url}\n")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Could not automatically open browser: {e}")


def main():
    initialize_database()

    print("\n" + "=" * 60)
    print("  PHARMAPULSE PHARMACY MANAGEMENT SYSTEM")
    print("=" * 60)
    print("  Web Portal URL    : http://127.0.0.1:8000")
    print("  Interactive API   : http://127.0.0.1:8000/docs")
    print("-" * 60)
    print("  DEFAULT LOGIN CREDENTIALS:")
    print("  • Administrator   : admin / admin123")
    print("  • Pharmacist      : pharma / pharma123")
    print("=" * 60 + "\n")

    # Start browser opener in background thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Run Uvicorn server
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False, log_level="info")


if __name__ == "__main__":
    main()
