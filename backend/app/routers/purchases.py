from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import PurchaseOrder, PurchaseOrderItem, Medicine, Supplier, User
from ..schemas import PurchaseOrderCreate, PurchaseOrderOut
from ..dependencies import get_current_user, require_staff

router = APIRouter(prefix="/purchases", tags=["Purchases & Stock Inward"])


def format_purchase_out(po: PurchaseOrder) -> dict:
    return {
        "id": po.id,
        "supplier_id": po.supplier_id,
        "supplier_name": po.supplier.name if po.supplier else "Unknown",
        "invoice_number": po.invoice_number,
        "purchase_date": po.purchase_date,
        "total_amount": po.total_amount,
        "payment_status": po.payment_status,
        "notes": po.notes,
        "created_at": po.created_at,
        "items": [
            {
                "id": it.id,
                "medicine_id": it.medicine_id,
                "medicine_name": it.medicine.name if it.medicine else "Unknown",
                "quantity": it.quantity,
                "unit_cost": it.unit_cost,
                "total_cost": it.total_cost,
                "batch_number": it.batch_number,
                "expiry_date": it.expiry_date
            }
            for it in po.items
        ]
    }


@router.post("", response_model=PurchaseOrderOut, status_code=status.HTTP_201_CREATED)
def record_purchase(
    po_in: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    supplier = db.query(Supplier).filter(Supplier.id == po_in.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    if not po_in.items:
        raise HTTPException(status_code=400, detail="Cannot record an empty purchase order.")

    total_amount = 0.0
    items_to_create = []

    for it in po_in.items:
        med = db.query(Medicine).filter(Medicine.id == it.medicine_id).first()
        if not med:
            raise HTTPException(status_code=404, detail=f"Medicine ID {it.medicine_id} not found")

        item_total = round(it.unit_cost * it.quantity, 2)
        total_amount += item_total

        # Auto-replenish medicine stock!
        med.stock_quantity += it.quantity
        med.purchase_price = it.unit_cost
        if it.batch_number:
            med.batch_number = it.batch_number
        if it.expiry_date:
            med.expiry_date = it.expiry_date

        items_to_create.append({
            "medicine_id": med.id,
            "quantity": it.quantity,
            "unit_cost": it.unit_cost,
            "total_cost": item_total,
            "batch_number": it.batch_number or med.batch_number,
            "expiry_date": it.expiry_date or med.expiry_date
        })

    po = PurchaseOrder(
        supplier_id=po_in.supplier_id,
        invoice_number=po_in.invoice_number,
        purchase_date=po_in.purchase_date or date.today(),
        total_amount=round(total_amount, 2),
        payment_status=po_in.payment_status or "Paid",
        notes=po_in.notes,
        created_by_user_id=staff.id
    )
    db.add(po)
    db.flush()

    for item_data in items_to_create:
        po_item = PurchaseOrderItem(purchase_id=po.id, **item_data)
        db.add(po_item)

    db.commit()
    db.refresh(po)
    return format_purchase_out(po)


@router.get("", response_model=List[PurchaseOrderOut])
def list_purchases(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orders = db.query(PurchaseOrder).order_by(desc(PurchaseOrder.created_at)).limit(limit).all()
    return [format_purchase_out(po) for po in orders]


@router.get("/{purchase_id}", response_model=PurchaseOrderOut)
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == purchase_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return format_purchase_out(po)
