from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..database import get_db
from ..models import Sale, SaleItem, Medicine, Customer, Supplier, User
from ..dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reporting & Analytics"])


@router.get("/dashboard")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())

    # Total & Today Revenue
    total_rev = db.query(func.coalesce(func.sum(Sale.total_amount), 0.0))\
        .filter(Sale.payment_status == "Completed").scalar()
    
    today_rev = db.query(func.coalesce(func.sum(Sale.total_amount), 0.0))\
        .filter(Sale.payment_status == "Completed", Sale.created_at >= today_start).scalar()

    total_sales = db.query(func.count(Sale.id))\
        .filter(Sale.payment_status == "Completed").scalar()
    
    today_sales = db.query(func.count(Sale.id))\
        .filter(Sale.payment_status == "Completed", Sale.created_at >= today_start).scalar()

    # Medicine stats
    all_meds = db.query(Medicine).filter(Medicine.is_active == True).all()
    total_medicines = len(all_meds)
    
    low_stock_count = 0
    expired_count = 0
    expiring_soon_count = 0

    for m in all_meds:
        days = (m.expiry_date - today).days
        if days < 0:
            expired_count += 1
        elif days <= 60:
            expiring_soon_count += 1

        if m.stock_quantity <= m.min_stock_alert:
            low_stock_count += 1

    total_customers = db.query(func.count(Customer.id)).scalar()
    total_suppliers = db.query(func.count(Supplier.id)).filter(Supplier.status == "active").scalar()

    # Last 7 Days Sales Trend
    trend_labels = []
    trend_revenues = []
    trend_counts = []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())

        day_stats = db.query(
            func.coalesce(func.sum(Sale.total_amount), 0.0),
            func.count(Sale.id)
        ).filter(
            Sale.payment_status == "Completed",
            Sale.created_at >= day_start,
            Sale.created_at <= day_end
        ).first()

        trend_labels.append(day.strftime("%b %d"))
        trend_revenues.append(round(float(day_stats[0]), 2) if day_stats else 0.0)
        trend_counts.append(day_stats[1] if day_stats else 0)

    # Top 5 Selling Medicines
    top_items = db.query(
        SaleItem.medicine_name,
        func.sum(SaleItem.quantity).label("units_sold"),
        func.sum(SaleItem.total_price).label("total_sales")
    ).join(Sale, Sale.id == SaleItem.sale_id)\
     .filter(Sale.payment_status == "Completed")\
     .group_by(SaleItem.medicine_name)\
     .order_by(desc("units_sold"))\
     .limit(5).all()

    top_medicines = [
        {"name": t[0], "units_sold": int(t[1]), "total_sales": round(float(t[2]), 2)}
        for t in top_items
    ]

    # Category distribution
    cat_items = db.query(
        Medicine.category,
        func.count(Medicine.id).label("count")
    ).filter(Medicine.is_active == True)\
     .group_by(Medicine.category).all()
    
    category_distribution = [{"category": c[0], "count": c[1]} for c in cat_items]

    # Payment method breakdown
    pay_items = db.query(
        Sale.payment_method,
        func.coalesce(func.sum(Sale.total_amount), 0.0).label("amount"),
        func.count(Sale.id).label("count")
    ).filter(Sale.payment_status == "Completed")\
     .group_by(Sale.payment_method).all()

    payment_breakdown = [
        {"method": p[0], "amount": round(float(p[1]), 2), "count": p[2]}
        for p in pay_items
    ]

    # Recent 5 sales
    recent_sales = db.query(Sale).order_by(desc(Sale.created_at)).limit(5).all()
    formatted_recent = [
        {
            "id": s.id,
            "invoice_number": s.invoice_number,
            "customer_name": s.customer_name,
            "total_amount": s.total_amount,
            "payment_method": s.payment_method,
            "payment_status": s.payment_status,
            "created_at": s.created_at
        }
        for s in recent_sales
    ]

    return {
        "metrics": {
            "total_revenue": round(float(total_rev), 2),
            "today_revenue": round(float(today_rev), 2),
            "total_sales_count": total_sales,
            "today_sales_count": today_sales,
            "total_medicines": total_medicines,
            "low_stock_count": low_stock_count,
            "expired_count": expired_count,
            "expiring_soon_count": expiring_soon_count,
            "total_customers": total_customers,
            "total_suppliers": total_suppliers
        },
        "sales_trend": {
            "labels": trend_labels,
            "revenues": trend_revenues,
            "counts": trend_counts
        },
        "top_medicines": top_medicines,
        "category_distribution": category_distribution,
        "payment_breakdown": payment_breakdown,
        "recent_sales": formatted_recent
    }


@router.get("/inventory-valuation")
def get_inventory_valuation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meds = db.query(Medicine).filter(Medicine.is_active == True).all()

    total_units = sum(m.stock_quantity for m in meds)
    total_cost_valuation = sum(m.stock_quantity * m.purchase_price for m in meds)
    total_retail_valuation = sum(m.stock_quantity * m.selling_price for m in meds)
    potential_profit = total_retail_valuation - total_cost_valuation

    return {
        "total_items": len(meds),
        "total_units": total_units,
        "total_cost_valuation": round(total_cost_valuation, 2),
        "total_retail_valuation": round(total_retail_valuation, 2),
        "potential_profit": round(potential_profit, 2),
        "profit_margin_percent": round((potential_profit / total_retail_valuation * 100), 1) if total_retail_valuation > 0 else 0.0
    }
