from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field


# ==================== User & Auth Schemas ====================
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: Optional[str] = "pharmacist"
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str  # can be email or username
    password: str


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRole(BaseModel):
    role: str
    is_active: Optional[bool] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class SystemStatusOut(BaseModel):
    status: str
    database: dict
    environment: str
    active_users: int
    total_medicines: int
    total_sales: int
    currency: str
    auth_algorithm: str
    token_expiry_hours: int


# ==================== Medicine Schemas ====================
class MedicineBase(BaseModel):
    name: str
    generic_name: Optional[str] = None
    category: str
    dosage_form: Optional[str] = "Tablet"
    strength: Optional[str] = None
    manufacturer: str
    batch_number: str
    barcode: Optional[str] = None
    purchase_price: float = Field(ge=0)
    selling_price: float = Field(ge=0)
    stock_quantity: int = Field(ge=0)
    min_stock_alert: int = Field(default=15, ge=0)
    expiry_date: date
    storage_location: Optional[str] = None
    requires_prescription: bool = False
    description: Optional[str] = None


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    manufacturer: Optional[str] = None
    batch_number: Optional[str] = None
    barcode: Optional[str] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_stock_alert: Optional[int] = None
    expiry_date: Optional[date] = None
    storage_location: Optional[str] = None
    requires_prescription: Optional[bool] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class MedicineOut(MedicineBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    stock_status: Optional[str] = None  # in_stock, low_stock, out_of_stock
    expiry_status: Optional[str] = None  # valid, expiring_soon, expired
    days_to_expiry: Optional[int] = None

    class Config:
        from_attributes = True


# ==================== Supplier Schemas ====================
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    tax_id: Optional[str] = None
    status: Optional[str] = "active"
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class SupplierOut(SupplierBase):
    id: int
    created_at: datetime
    total_purchases: Optional[float] = 0.0

    class Config:
        from_attributes = True


# ==================== Purchase Schemas ====================
class PurchaseOrderItemCreate(BaseModel):
    medicine_id: int
    quantity: int = Field(gt=0)
    unit_cost: float = Field(ge=0)
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    invoice_number: str
    purchase_date: Optional[date] = None
    payment_status: Optional[str] = "Paid"
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]


class PurchaseOrderItemOut(BaseModel):
    id: int
    medicine_id: int
    medicine_name: Optional[str] = None
    quantity: int
    unit_cost: float
    total_cost: float
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None

    class Config:
        from_attributes = True


class PurchaseOrderOut(BaseModel):
    id: int
    supplier_id: int
    supplier_name: Optional[str] = None
    invoice_number: str
    purchase_date: date
    total_amount: float
    payment_status: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[PurchaseOrderItemOut] = []

    class Config:
        from_attributes = True


# ==================== Customer Schemas ====================
class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    medical_notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    medical_notes: Optional[str] = None


class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    total_orders: Optional[int] = 0
    total_spent: Optional[float] = 0.0

    class Config:
        from_attributes = True


# ==================== Prescription Schemas ====================
class PrescriptionCreate(BaseModel):
    customer_id: int
    doctor_name: str
    doctor_license: Optional[str] = None
    prescription_date: Optional[date] = None
    notes: Optional[str] = None
    status: Optional[str] = "Verified"


class PrescriptionOut(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    doctor_name: str
    doctor_license: Optional[str] = None
    prescription_date: date
    file_url: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Sales & Billing Schemas ====================
class SaleItemCreate(BaseModel):
    medicine_id: int
    quantity: int = Field(gt=0)
    unit_price: float = Field(ge=0)
    discount: float = Field(default=0.0, ge=0)


class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = "Walk-in Customer"
    customer_phone: Optional[str] = None
    doctor_name: Optional[str] = None
    prescription_id: Optional[int] = None
    discount_percentage: float = Field(default=0.0, ge=0, le=100)
    discount_amount: float = Field(default=0.0, ge=0)
    tax_rate_percent: float = Field(default=0.0, ge=0)
    payment_method: str = "Cash"
    notes: Optional[str] = None
    items: List[SaleItemCreate]


class SaleItemOut(BaseModel):
    id: int
    medicine_id: int
    medicine_name: str
    batch_number: Optional[str] = None
    quantity: int
    unit_price: float
    discount: float
    total_price: float
    expiry_date: Optional[date] = None

    class Config:
        from_attributes = True


class SaleOut(BaseModel):
    id: int
    invoice_number: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    doctor_name: Optional[str] = None
    prescription_id: Optional[int] = None
    user_id: int
    cashier_name: Optional[str] = None
    subtotal: float
    discount_amount: float
    discount_percentage: float
    tax_amount: float
    total_amount: float
    payment_method: str
    payment_status: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[SaleItemOut] = []

    class Config:
        from_attributes = True


# ==================== Notification Schemas ====================
class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: str
    reference_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Dashboard & Analytics ====================
class DashboardMetrics(BaseModel):
    total_revenue: float
    today_revenue: float
    total_sales_count: int
    today_sales_count: int
    total_medicines: int
    low_stock_count: int
    expired_count: int
    expiring_soon_count: int
    total_customers: int
    total_suppliers: int
