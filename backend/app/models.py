from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="pharmacist")  # 'admin', 'pharmacist', 'cashier'
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sales = relationship("Sale", back_populates="cashier")
    purchases = relationship("PurchaseOrder", back_populates="purchased_by")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    generic_name = Column(String(150), index=True, nullable=True)
    category = Column(String(60), index=True, nullable=False)
    dosage_form = Column(String(50), default="Tablet")  # Tablet, Capsule, Syrup, Injection, Ointment, etc.
    strength = Column(String(50), nullable=True)  # e.g. 500mg, 10mg, 100ml
    manufacturer = Column(String(100), index=True, nullable=False)
    batch_number = Column(String(50), index=True, nullable=False)
    barcode = Column(String(50), unique=True, index=True, nullable=True)
    purchase_price = Column(Float, nullable=False, default=0.0)
    selling_price = Column(Float, nullable=False, default=0.0)
    stock_quantity = Column(Integer, nullable=False, default=0)
    min_stock_alert = Column(Integer, nullable=False, default=15)
    expiry_date = Column(Date, nullable=False, index=True)
    storage_location = Column(String(50), nullable=True)  # e.g., Shelf A-2, Fridge 1
    requires_prescription = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sale_items = relationship("SaleItem", back_populates="medicine")
    purchase_items = relationship("PurchaseOrderItem", back_populates="medicine")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)
    contact_person = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=False)
    address = Column(Text, nullable=True)
    tax_id = Column(String(50), nullable=True)  # GSTIN or Tax Reg
    status = Column(String(20), default="active")  # active, inactive
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    purchases = relationship("PurchaseOrder", back_populates="supplier")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    invoice_number = Column(String(60), index=True, nullable=False)
    purchase_date = Column(Date, default=date.today)
    total_amount = Column(Float, nullable=False, default=0.0)
    payment_status = Column(String(20), default="Paid")  # Paid, Pending, Partial
    notes = Column(Text, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="purchases")
    purchased_by = relationship("User", back_populates="purchases")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    batch_number = Column(String(50), nullable=True)
    expiry_date = Column(Date, nullable=True)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    medicine = relationship("Medicine", back_populates="purchase_items")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    medical_notes = Column(Text, nullable=True)  # Allergies, Chronic conditions
    created_at = Column(DateTime, default=datetime.utcnow)

    sales = relationship("Sale", back_populates="customer")
    prescriptions = relationship("Prescription", back_populates="customer")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    doctor_name = Column(String(100), nullable=False)
    doctor_license = Column(String(50), nullable=True)
    prescription_date = Column(Date, default=date.today)
    file_url = Column(String(255), nullable=True)  # uploaded file URL
    notes = Column(Text, nullable=True)
    status = Column(String(20), default="Verified")  # Verified, Pending, Dispensed
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="prescriptions")
    sales = relationship("Sale", back_populates="prescription")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(100), default="Walk-in Customer")
    customer_phone = Column(String(20), nullable=True)
    doctor_name = Column(String(100), nullable=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    subtotal = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    discount_percentage = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    payment_method = Column(String(30), default="Cash")  # Cash, Card, UPI, Insurance
    payment_status = Column(String(20), default="Completed")  # Completed, Refunded
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    customer = relationship("Customer", back_populates="sales")
    prescription = relationship("Prescription", back_populates="sales")
    cashier = relationship("User", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    medicine_name = Column(String(150), nullable=False)
    batch_number = Column(String(50), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    total_price = Column(Float, nullable=False)
    expiry_date = Column(Date, nullable=True)

    sale = relationship("Sale", back_populates="items")
    medicine = relationship("Medicine", back_populates="sale_items")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(30), nullable=False)  # 'low_stock', 'expired', 'expiring_soon', 'system'
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    reference_id = Column(Integer, nullable=True)  # medicine_id or other
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
