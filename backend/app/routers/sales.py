from datetime import datetime, date
from typing import List, Optional
import random
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Sale, SaleItem, Medicine, Customer, Notification, User
from ..schemas import SaleCreate, SaleOut
from ..dependencies import get_current_user, require_staff

router = APIRouter(prefix="/sales", tags=["Sales & Billing"])


def generate_invoice_number() -> str:
    now = datetime.utcnow()
    rand_suffix = random.randint(1000, 9999)
    return f"INV-{now.strftime('%Y%m%d%H%M')}-{rand_suffix}"


def format_sale_out(sale: Sale) -> dict:
    return {
        "id": sale.id,
        "invoice_number": sale.invoice_number,
        "customer_id": sale.customer_id,
        "customer_name": sale.customer_name,
        "customer_phone": sale.customer_phone,
        "doctor_name": sale.doctor_name,
        "prescription_id": sale.prescription_id,
        "user_id": sale.user_id,
        "cashier_name": sale.cashier.full_name if sale.cashier else "Staff",
        "subtotal": sale.subtotal,
        "discount_amount": sale.discount_amount,
        "discount_percentage": sale.discount_percentage,
        "tax_amount": sale.tax_amount,
        "total_amount": sale.total_amount,
        "payment_method": sale.payment_method,
        "payment_status": sale.payment_status,
        "notes": sale.notes,
        "created_at": sale.created_at,
        "items": [
            {
                "id": item.id,
                "medicine_id": item.medicine_id,
                "medicine_name": item.medicine_name,
                "batch_number": item.batch_number,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "discount": item.discount,
                "total_price": item.total_price,
                "expiry_date": item.expiry_date
            }
            for item in sale.items
        ]
    }


@router.post("", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Cannot process an empty sale. Add at least one medicine.")

    # Validate items and stock
    subtotal = 0.0
    sale_items_data = []
    today = date.today()

    for item_in in sale_in.items:
        med = db.query(Medicine).filter(Medicine.id == item_in.medicine_id).first()
        if not med:
            raise HTTPException(status_code=404, detail=f"Medicine ID {item_in.medicine_id} not found")
        
        if not med.is_active:
            raise HTTPException(status_code=400, detail=f"Medicine '{med.name}' is archived/inactive.")

        if med.expiry_date < today:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot sell '{med.name}'! It expired on {med.expiry_date.strftime('%Y-%m-%d')}."
            )

        if med.stock_quantity < item_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{med.name}'. Requested: {item_in.quantity}, Available: {med.stock_quantity}."
            )

        item_subtotal = (item_in.unit_price * item_in.quantity) - item_in.discount
        if item_subtotal < 0:
            item_subtotal = 0.0
        subtotal += item_subtotal

        sale_items_data.append({
            "medicine": med,
            "quantity": item_in.quantity,
            "unit_price": item_in.unit_price,
            "discount": item_in.discount,
            "total_price": round(item_subtotal, 2),
            "batch_number": med.batch_number,
            "expiry_date": med.expiry_date
        })

    # Calculations
    discount_val = sale_in.discount_amount
    if sale_in.discount_percentage > 0:
        discount_val += (subtotal * sale_in.discount_percentage / 100.0)

    taxable_amount = max(0.0, subtotal - discount_val)
    tax_amount = round(taxable_amount * (sale_in.tax_rate_percent / 100.0), 2)
    final_total = round(taxable_amount + tax_amount, 2)

    # Customer handling
    customer_id = sale_in.customer_id
    customer_name = sale_in.customer_name or "Walk-in Customer"
    customer_phone = sale_in.customer_phone

    if customer_id:
        cust = db.query(Customer).filter(Customer.id == customer_id).first()
        if cust:
            customer_name = cust.name
            customer_phone = cust.phone
    elif customer_phone:
        # Check if customer already exists by phone
        cust = db.query(Customer).filter(Customer.phone == customer_phone).first()
        if cust:
            customer_id = cust.id
            customer_name = cust.name
        else:
            # Create quick customer
            cust = Customer(name=customer_name, phone=customer_phone)
            db.add(cust)
            db.flush()
            customer_id = cust.id

    sale = Sale(
        invoice_number=generate_invoice_number(),
        customer_id=customer_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        doctor_name=sale_in.doctor_name,
        prescription_id=sale_in.prescription_id,
        user_id=current_user.id,
        subtotal=round(subtotal, 2),
        discount_amount=round(discount_val, 2),
        discount_percentage=sale_in.discount_percentage,
        tax_amount=tax_amount,
        total_amount=final_total,
        payment_method=sale_in.payment_method,
        payment_status="Completed",
        notes=sale_in.notes
    )
    db.add(sale)
    db.flush()

    # Create items and decrement medicine stocks
    for data in sale_items_data:
        med = data["medicine"]
        med.stock_quantity -= data["quantity"]

        # Check if triggered low stock alert
        if med.stock_quantity <= med.min_stock_alert:
            alert = Notification(
                type="low_stock",
                title=f"Low Stock Alert: {med.name}",
                message=f"Only {med.stock_quantity} units left in stock (Min threshold: {med.min_stock_alert}). Please reorder.",
                reference_id=med.id
            )
            db.add(alert)

        sale_item = SaleItem(
            sale_id=sale.id,
            medicine_id=med.id,
            medicine_name=med.name,
            batch_number=data["batch_number"],
            quantity=data["quantity"],
            unit_price=data["unit_price"],
            discount=data["discount"],
            total_price=data["total_price"],
            expiry_date=data["expiry_date"]
        )
        db.add(sale_item)

    db.commit()
    db.refresh(sale)
    return format_sale_out(sale)


@router.get("", response_model=List[SaleOut])
def list_sales(
    q: Optional[str] = Query(None, description="Search by invoice number or customer name"),
    payment_method: Optional[str] = None,
    payment_status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Sale)
    if payment_method and payment_method != "All":
        query = query.filter(Sale.payment_method == payment_method)
    if payment_status:
        query = query.filter(Sale.payment_status == payment_status)
    if q:
        query = query.filter(
            (Sale.invoice_number.ilike(f"%{q.strip()}%")) |
            (Sale.customer_name.ilike(f"%{q.strip()}%")) |
            (Sale.customer_phone.ilike(f"%{q.strip()}%"))
        )

    sales = query.order_by(desc(Sale.created_at)).limit(limit).all()
    return [format_sale_out(s) for s in sales]


@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale invoice not found")
    return format_sale_out(sale)


@router.post("/{sale_id}/refund")
def refund_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale invoice not found")
    
    if sale.payment_status == "Refunded":
        raise HTTPException(status_code=400, detail="This sale invoice has already been refunded.")

    # Restore stocks
    for item in sale.items:
        med = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
        if med:
            med.stock_quantity += item.quantity

    sale.payment_status = "Refunded"
    db.commit()
    return {"message": f"Invoice '{sale.invoice_number}' successfully refunded and inventory restored."}
