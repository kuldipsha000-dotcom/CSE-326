from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from ..database import get_db
from ..models import Medicine, User
from ..schemas import MedicineCreate, MedicineUpdate, MedicineOut
from ..dependencies import get_current_user, require_staff

router = APIRouter(prefix="/medicines", tags=["Medicine Inventory"])


def enrich_medicine(med: Medicine) -> dict:
    today = date.today()
    days_left = (med.expiry_date - today).days

    if days_left < 0:
        expiry_status = "expired"
    elif days_left <= 60:
        expiry_status = "expiring_soon"
    else:
        expiry_status = "valid"

    if med.stock_quantity == 0:
        stock_status = "out_of_stock"
    elif med.stock_quantity <= med.min_stock_alert:
        stock_status = "low_stock"
    else:
        stock_status = "in_stock"

    return {
        "id": med.id,
        "name": med.name,
        "generic_name": med.generic_name,
        "category": med.category,
        "dosage_form": med.dosage_form,
        "strength": med.strength,
        "manufacturer": med.manufacturer,
        "batch_number": med.batch_number,
        "barcode": med.barcode,
        "purchase_price": med.purchase_price,
        "selling_price": med.selling_price,
        "stock_quantity": med.stock_quantity,
        "min_stock_alert": med.min_stock_alert,
        "expiry_date": med.expiry_date,
        "storage_location": med.storage_location,
        "requires_prescription": med.requires_prescription,
        "description": med.description,
        "is_active": med.is_active,
        "created_at": med.created_at,
        "updated_at": med.updated_at,
        "stock_status": stock_status,
        "expiry_status": expiry_status,
        "days_to_expiry": days_left
    }


@router.get("", response_model=List[MedicineOut])
def list_medicines(
    q: Optional[str] = Query(None, description="Search term for name, generic name, batch, barcode"),
    category: Optional[str] = Query(None, description="Filter by category"),
    stock_status: Optional[str] = Query(None, description="in_stock, low_stock, out_of_stock"),
    expiry_status: Optional[str] = Query(None, description="valid, expiring_soon, expired"),
    requires_prescription: Optional[bool] = None,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Medicine)
    if not include_inactive:
        query = query.filter(Medicine.is_active == True)

    if category and category != "All":
        query = query.filter(Medicine.category == category)

    if requires_prescription is not None:
        query = query.filter(Medicine.requires_prescription == requires_prescription)

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Medicine.name.ilike(search_pattern),
                Medicine.generic_name.ilike(search_pattern),
                Medicine.batch_number.ilike(search_pattern),
                Medicine.barcode.ilike(search_pattern),
                Medicine.manufacturer.ilike(search_pattern)
            )
        )

    medicines = query.order_by(Medicine.name.asc()).all()
    enriched = [enrich_medicine(m) for m in medicines]

    # Filter in memory for calculated properties
    if stock_status:
        enriched = [m for m in enriched if m["stock_status"] == stock_status]
    if expiry_status:
        enriched = [m for m in enriched if m["expiry_status"] == expiry_status]

    return enriched


@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = db.query(
        Medicine.category,
        func.count(Medicine.id).label("count")
    ).filter(Medicine.is_active == True).group_by(Medicine.category).all()
    return [{"category": r[0], "count": r[1]} for r in results]


@router.get("/{medicine_id}", response_model=MedicineOut)
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return enrich_medicine(med)


@router.post("", response_model=MedicineOut, status_code=status.HTTP_201_CREATED)
def create_medicine(
    med_in: MedicineCreate,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    if med_in.barcode:
        existing = db.query(Medicine).filter(Medicine.barcode == med_in.barcode).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"A medicine with barcode '{med_in.barcode}' already exists: {existing.name}"
            )
    
    med = Medicine(**med_in.model_dump())
    db.add(med)
    db.commit()
    db.refresh(med)
    return enrich_medicine(med)


@router.put("/{medicine_id}", response_model=MedicineOut)
def update_medicine(
    medicine_id: int,
    med_update: MedicineUpdate,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    update_data = med_update.model_dump(exclude_unset=True)

    if "barcode" in update_data and update_data["barcode"]:
        dup = db.query(Medicine).filter(
            Medicine.barcode == update_data["barcode"],
            Medicine.id != medicine_id
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Barcode already in use by another medicine.")

    for field, value in update_data.items():
        setattr(med, field, value)

    db.commit()
    db.refresh(med)
    return enrich_medicine(med)


@router.delete("/{medicine_id}")
def delete_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    # Soft delete
    med.is_active = False
    db.commit()
    return {"message": f"Medicine '{med.name}' archived successfully"}
