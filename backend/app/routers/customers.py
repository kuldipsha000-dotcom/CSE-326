from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from ..database import get_db
from ..models import Customer, Sale, Prescription, User
from ..schemas import CustomerCreate, CustomerUpdate, CustomerOut
from ..dependencies import get_current_user, require_staff

router = APIRouter(prefix="/customers", tags=["Customer Management"])


def enrich_customer(cust: Customer, db: Session) -> dict:
    stats = db.query(
        func.count(Sale.id).label("orders_count"),
        func.coalesce(func.sum(Sale.total_amount), 0.0).label("spent_sum")
    ).filter(
        Sale.customer_id == cust.id,
        Sale.payment_status == "Completed"
    ).first()

    return {
        "id": cust.id,
        "name": cust.name,
        "phone": cust.phone,
        "email": cust.email,
        "address": cust.address,
        "medical_notes": cust.medical_notes,
        "created_at": cust.created_at,
        "total_orders": stats[0] if stats else 0,
        "total_spent": round(float(stats[1]), 2) if stats else 0.0
    }


@router.get("", response_model=List[CustomerOut])
def list_customers(
    q: Optional[str] = Query(None, description="Search customer by name or phone"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Customer)
    if q:
        query = query.filter(
            or_(
                Customer.name.ilike(f"%{q.strip()}%"),
                Customer.phone.ilike(f"%{q.strip()}%"),
                Customer.email.ilike(f"%{q.strip()}%")
            )
        )
    customers = query.order_by(Customer.name.asc()).all()
    return [enrich_customer(c, db) for c in customers]


@router.get("/{customer_id}")
def get_customer_details(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    base_info = enrich_customer(cust, db)
    
    # Recent sales
    recent_sales = [
        {
            "id": s.id,
            "invoice_number": s.invoice_number,
            "total_amount": s.total_amount,
            "payment_status": s.payment_status,
            "created_at": s.created_at
        }
        for s in cust.sales[:10]
    ]

    # Prescriptions
    prescriptions = [
        {
            "id": p.id,
            "doctor_name": p.doctor_name,
            "prescription_date": p.prescription_date,
            "status": p.status,
            "file_url": p.file_url,
            "notes": p.notes
        }
        for p in cust.prescriptions
    ]

    return {
        **base_info,
        "recent_sales": recent_sales,
        "prescriptions": prescriptions
    }


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    cust_in: CustomerCreate,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    existing = db.query(Customer).filter(Customer.phone == cust_in.phone.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Customer with phone number {cust_in.phone} already exists.")

    cust = Customer(**cust_in.model_dump())
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return enrich_customer(cust, db)


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    cust_update: CustomerUpdate,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_dict = cust_update.model_dump(exclude_unset=True)
    if "phone" in update_dict and update_dict["phone"]:
        dup = db.query(Customer).filter(
            Customer.phone == update_dict["phone"],
            Customer.id != customer_id
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Phone number already in use by another customer.")

    for field, val in update_dict.items():
        setattr(cust, field, val)

    db.commit()
    db.refresh(cust)
    return enrich_customer(cust, db)
