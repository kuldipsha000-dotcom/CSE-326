from datetime import date
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Notification, Medicine, User
from ..schemas import NotificationOut
from ..dependencies import get_current_user

router = APIRouter(prefix="/alerts", tags=["Notifications & Alerts"])


@router.get("/summary")
def get_alerts_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    meds = db.query(Medicine).filter(Medicine.is_active == True).all()

    expired = []
    expiring_soon = []
    low_stock = []
    out_of_stock = []

    for m in meds:
        days_left = (m.expiry_date - today).days

        if days_left < 0:
            expired.append({
                "id": m.id,
                "name": m.name,
                "batch_number": m.batch_number,
                "expiry_date": m.expiry_date,
                "stock": m.stock_quantity,
                "days_expired": abs(days_left),
                "severity": "critical"
            })
        elif days_left <= 60:
            expiring_soon.append({
                "id": m.id,
                "name": m.name,
                "batch_number": m.batch_number,
                "expiry_date": m.expiry_date,
                "stock": m.stock_quantity,
                "days_left": days_left,
                "severity": "warning"
            })

        if m.stock_quantity == 0:
            out_of_stock.append({
                "id": m.id,
                "name": m.name,
                "batch_number": m.batch_number,
                "min_stock": m.min_stock_alert,
                "severity": "critical"
            })
        elif m.stock_quantity <= m.min_stock_alert:
            low_stock.append({
                "id": m.id,
                "name": m.name,
                "batch_number": m.batch_number,
                "stock": m.stock_quantity,
                "min_stock": m.min_stock_alert,
                "severity": "warning"
            })

    total_active_alerts = len(expired) + len(expiring_soon) + len(low_stock) + len(out_of_stock)

    return {
        "total_count": total_active_alerts,
        "expired": expired,
        "expiring_soon": expiring_soon,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock
    }


@router.get("", response_model=List[NotificationOut])
def list_notifications(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Notification).order_by(desc(Notification.created_at)).limit(limit).all()


@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Notification marked as read"}


@router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
