import shutil
from datetime import date
from pathlib import Path
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Prescription, Customer, User
from ..schemas import PrescriptionCreate, PrescriptionOut
from ..dependencies import get_current_user, require_staff
from ..config import UPLOAD_DIR

router = APIRouter(prefix="/prescriptions", tags=["Prescription Handling"])


def format_prescription_out(rx: Prescription) -> dict:
    return {
        "id": rx.id,
        "customer_id": rx.customer_id,
        "customer_name": rx.customer.name if rx.customer else "Unknown",
        "doctor_name": rx.doctor_name,
        "doctor_license": rx.doctor_license,
        "prescription_date": rx.prescription_date,
        "file_url": rx.file_url,
        "notes": rx.notes,
        "status": rx.status,
        "created_at": rx.created_at
    }


@router.get("", response_model=List[PrescriptionOut])
def list_prescriptions(
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Prescription)
    if customer_id:
        query = query.filter(Prescription.customer_id == customer_id)
    if status and status != "All":
        query = query.filter(Prescription.status == status)

    rx_list = query.order_by(desc(Prescription.created_at)).all()
    return [format_prescription_out(rx) for rx in rx_list]


@router.post("", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
def create_prescription(
    rx_in: PrescriptionCreate,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    cust = db.query(Customer).filter(Customer.id == rx_in.customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    rx = Prescription(
        customer_id=rx_in.customer_id,
        doctor_name=rx_in.doctor_name,
        doctor_license=rx_in.doctor_license,
        prescription_date=rx_in.prescription_date or date.today(),
        notes=rx_in.notes,
        status=rx_in.status or "Verified"
    )
    db.add(rx)
    db.commit()
    db.refresh(rx)
    return format_prescription_out(rx)


@router.post("/upload", response_model=PrescriptionOut)
def upload_prescription_file(
    customer_id: int = Form(...),
    doctor_name: str = Form(...),
    doctor_license: Optional[str] = Form(None),
    prescription_date_str: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Save uploaded file
    file_ext = Path(file.filename).suffix.lower()
    unique_name = f"rx_{uuid.uuid4().hex}{file_ext}"
    dest_path = UPLOAD_DIR / unique_name

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/uploads/{unique_name}"

    parsed_date = date.today()
    if prescription_date_str:
        try:
            parsed_date = date.fromisoformat(prescription_date_str)
        except Exception:
            pass

    rx = Prescription(
        customer_id=customer_id,
        doctor_name=doctor_name,
        doctor_license=doctor_license,
        prescription_date=parsed_date,
        file_url=file_url,
        notes=notes,
        status="Verified"
    )
    db.add(rx)
    db.commit()
    db.refresh(rx)
    return format_prescription_out(rx)


@router.put("/{rx_id}/status", response_model=PrescriptionOut)
def update_prescription_status(
    rx_id: int,
    status_val: str,
    db: Session = Depends(get_db),
    staff: User = Depends(require_staff)
):
    rx = db.query(Prescription).filter(Prescription.id == rx_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")

    rx.status = status_val
    db.commit()
    db.refresh(rx)
    return format_prescription_out(rx)
