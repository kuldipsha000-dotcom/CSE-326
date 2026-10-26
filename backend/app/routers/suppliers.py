from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Supplier, PurchaseOrder, User
from ..schemas import SupplierCreate, SupplierUpdate, SupplierOut
from ..dependencies import get_current_user, require_staff

router = APIRouter(prefix="/suppliers", tags=["Supplier Management"])


def enrich_supplier(sup: Supplier, db: Session) -> dict:
    total_spent = db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0.0))\
        .filter(PurchaseOrder.supplier_id == sup.id).scalar()
    return {
        "id": sup.id,
        "name": sup.name,
        "contact_person": sup.contact_person,
        "email": sup.email,
        "phone": sup.phone,
        "address": sup.address,
        "tax_id": sup.tax_id,
        "status": sup.status,
        "notes": sup.notes,
        "created_at": sup.created_at,
        "total_purchases": round(float(total_spent), 2)
    }


@router.get("", response_model=List[SupplierOut])
def list_suppliers(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Supplier)
    if status:
        query = query.filter(Supplier.status == status)
    suppliers = query.order_by(Supplier.name.asc()).all()
    return [enrich_supplier(s, db) for s in suppliers]


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sup = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return enrich_supplier(sup, db)


@router.post("", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
def create_supplier(
    sup_in: SupplierCreate,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    sup = Supplier(**sup_in.model_dump())
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return enrich_supplier(sup, db)


@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: int,
    sup_update: SupplierUpdate,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    sup = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, val in sup_update.model_dump(exclude_unset=True).items():
        setattr(sup, field, val)

    db.commit()
    db.refresh(sup)
    return enrich_supplier(sup, db)


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    sup = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")
    sup.status = "inactive"
    db.commit()
    return {"message": f"Supplier '{sup.name}' set to inactive"}
