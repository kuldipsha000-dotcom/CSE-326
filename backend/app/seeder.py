from datetime import date, datetime, timedelta
import random
from sqlalchemy.orm import Session
from .models import User, Medicine, Supplier, Customer, Sale, SaleItem, PurchaseOrder, PurchaseOrderItem, Prescription, Notification
from .security import get_password_hash


def seed_database(db: Session, force: bool = False):
    # Only seed if no users exist or force is True
    if not force and db.query(User).count() > 0:
        return

    print("Seeding fresh Pharmacy Management System database (Indian Localization - INR)...")

    # Clear existing if force
    if force:
        db.query(SaleItem).delete()
        db.query(Sale).delete()
        db.query(PurchaseOrderItem).delete()
        db.query(PurchaseOrder).delete()
        db.query(Prescription).delete()
        db.query(Notification).delete()
        db.query(Medicine).delete()
        db.query(Customer).delete()
        db.query(Supplier).delete()
        db.query(User).delete()
        db.commit()

    # 1. Users
    admin_user = User(
        username="admin",
        email="admin@pharmapulse.in",
        full_name="Dr. Rajesh Sharma",
        hashed_password=get_password_hash("admin123"),
        role="admin",
        phone="+91 98101 23456",
        is_active=True
    )
    pharma_user = User(
        username="pharma",
        email="pharma@pharmapulse.in",
        full_name="Pooja Sharma",
        hashed_password=get_password_hash("pharma123"),
        role="pharmacist",
        phone="+91 98202 34567",
        is_active=True
    )
    db.add_all([admin_user, pharma_user])
    db.flush()

    # 2. Indian Pharmaceutical Suppliers
    suppliers_data = [
        Supplier(
            name="Cipla Healthcare Distributors",
            contact_person="Ramesh Kulkarni",
            email="orders@cipla-dist.in",
            phone="+91 98333 11223",
            address="Plot 45, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093",
            tax_id="27AABCC1234F1Z8",
            status="active",
            notes="Authorized distributor for antibiotics, cardiac care and asthma inhalers."
        ),
        Supplier(
            name="Sun Pharma Wholesale Depot",
            contact_person="Vikram Singhania",
            email="depot@sunpharma-wholesale.in",
            phone="+91 98444 22334",
            address="Phase II, Baddi Industrial Estate, Solan, Himachal Pradesh 173205",
            tax_id="02AABCS5678D1Z2",
            status="active",
            notes="Primary wholesale supplier for diabetes management and daily analgesics."
        ),
        Supplier(
            name="Dr. Reddy's Regional Logistics",
            contact_person="Praveen Reddy",
            email="supply@drreddys-logistics.in",
            phone="+91 98555 33445",
            address="Road No. 3, Banjara Hills, Hyderabad, Telangana 500034",
            tax_id="36AABCD9012K1Z9",
            status="active",
            notes="Emergency deliveries for cardiovascular and gastroenterology formulations."
        ),
        Supplier(
            name="Mankind Lifesciences Depot",
            contact_person="Suresh Mehra",
            email="depot@mankind-logistics.in",
            phone="+91 98666 44556",
            address="Okhla Industrial Area Phase III, New Delhi 110020",
            tax_id="07AABCM3456L1Z4",
            status="active",
            notes="Weekly replenishment for vitamins, OTC syrups, and dermatology ointments."
        )
    ]
    db.add_all(suppliers_data)
    db.flush()

    # 3. Indian Customers / Patients
    customers_data = [
        Customer(
            name="Rajesh Sharma",
            phone="+91 98111 22334",
            email="rajesh.sharma@gmail.com",
            address="Flat 402, Shanti Niketan, Sector 14, Rohini, New Delhi",
            medical_notes="Allergic to Penicillin; Mild Bronchial Asthma"
        ),
        Customer(
            name="Priya Patel",
            phone="+91 98222 33445",
            email="priya.patel@outlook.com",
            address="B-12 Navrangpura, Near University Road, Ahmedabad, Gujarat",
            medical_notes="Type 2 Diabetes Mellitus; Regular Metformin patient"
        ),
        Customer(
            name="Amit Verma",
            phone="+91 98333 44556",
            email="amit.verma@corp.in",
            address="74 Indiranagar, 100 Feet Road, Bengaluru, Karnataka",
            medical_notes="Stage 1 Hypertension; Sensitive to NSAIDs"
        ),
        Customer(
            name="Ananya Iyer",
            phone="+91 98444 55667",
            email="ananya.iyer@yahoo.com",
            address="Flat 3A, Greenways Road, R.A. Puram, Chennai, Tamil Nadu",
            medical_notes="No known drug allergies (NKDA)"
        ),
        Customer(
            name="Mohammed Rizwan",
            phone="+91 98555 66778",
            email="m.rizwan@gmail.com",
            address="204 Hill View, Bandra West, Mumbai, Maharashtra",
            medical_notes="Seasonal Allergic Rhinitis; Regular Levocetirizine user"
        )
    ]
    db.add_all(customers_data)
    db.flush()

    # 4. Medicines (Prices in Indian Rupees - ₹ INR)
    today = date.today()
    meds_seed = [
        # Antibiotics
        {
            "name": "Amoxicillin 500mg",
            "generic_name": "Amoxicillin Trihydrate",
            "category": "Antibiotics",
            "dosage_form": "Capsule",
            "strength": "500mg",
            "manufacturer": "Cipla Ltd",
            "batch_number": "AMX-2025-01",
            "barcode": "89010010001",
            "purchase_price": 52.00,
            "selling_price": 95.00,
            "stock_quantity": 120,
            "min_stock_alert": 20,
            "expiry_date": today + timedelta(days=400),
            "storage_location": "Rack A-1",
            "requires_prescription": True,
            "description": "Broad spectrum beta-lactam antibiotic used for bacterial infections."
        },
        {
            "name": "Azithromycin 500mg",
            "generic_name": "Azithromycin Dihydrate",
            "category": "Antibiotics",
            "dosage_form": "Tablet",
            "strength": "500mg",
            "manufacturer": "Sun Pharma",
            "batch_number": "AZT-2024-88",
            "barcode": "89010010002",
            "purchase_price": 75.00,
            "selling_price": 140.00,
            "stock_quantity": 45,
            "min_stock_alert": 15,
            "expiry_date": today + timedelta(days=220),
            "storage_location": "Rack A-2",
            "requires_prescription": True,
            "description": "Macrolide antibiotic for upper and lower respiratory tract infections."
        },
        {
            "name": "Ciprofloxacin 500mg",
            "generic_name": "Ciprofloxacin HCl",
            "category": "Antibiotics",
            "dosage_form": "Tablet",
            "strength": "500mg",
            "manufacturer": "Cipla Ltd",
            "batch_number": "CIP-2024-12",
            "barcode": "89010010003",
            "purchase_price": 42.00,
            "selling_price": 85.00,
            "stock_quantity": 8,  # Low stock trigger!
            "min_stock_alert": 20,
            "expiry_date": today + timedelta(days=180),
            "storage_location": "Rack A-3",
            "requires_prescription": True,
            "description": "Fluoroquinolone antibiotic for urinary tract and gastrointestinal infections."
        },
        {
            "name": "Cephalexin 500mg",
            "generic_name": "Cephalexin Monohydrate",
            "category": "Antibiotics",
            "dosage_form": "Capsule",
            "strength": "500mg",
            "manufacturer": "Mankind Lifesciences",
            "batch_number": "CPH-2023-99",
            "barcode": "89010010004",
            "purchase_price": 58.00,
            "selling_price": 115.00,
            "stock_quantity": 30,
            "min_stock_alert": 15,
            "expiry_date": today - timedelta(days=15),  # Expired medicine trigger!
            "storage_location": "Rack A-4 (Quarantine)",
            "requires_prescription": True,
            "description": "First-generation cephalosporin; Batch flagged expired. Immediate return to depot."
        },
        # Analgesics & Pain Relief
        {
            "name": "Dolo 650 / Paracetamol 650mg",
            "generic_name": "Paracetamol / Acetaminophen",
            "category": "Analgesics & Antipyretics",
            "dosage_form": "Tablet",
            "strength": "650mg",
            "manufacturer": "Micro Labs / Sun Pharma",
            "batch_number": "PCM-2025-45",
            "barcode": "89010010005",
            "purchase_price": 14.50,
            "selling_price": 32.00,
            "stock_quantity": 350,
            "min_stock_alert": 50,
            "expiry_date": today + timedelta(days=650),
            "storage_location": "Rack B-1",
            "requires_prescription": False,
            "description": "India's standard antipyretic for viral fever, headaches, and general body aches."
        },
        {
            "name": "Ibuprofen 400mg (Brufen)",
            "generic_name": "Ibuprofen IP",
            "category": "Analgesics & Antipyretics",
            "dosage_form": "Tablet",
            "strength": "400mg",
            "manufacturer": "Abbott / Sun Pharma",
            "batch_number": "IBU-2024-30",
            "barcode": "89010010006",
            "purchase_price": 18.00,
            "selling_price": 42.00,
            "stock_quantity": 180,
            "min_stock_alert": 30,
            "expiry_date": today + timedelta(days=25),  # Expiring soon trigger (< 30 days)!
            "storage_location": "Rack B-2",
            "requires_prescription": False,
            "description": "Non-steroidal anti-inflammatory drug (NSAID) for dental pain, arthritis, and swelling."
        },
        {
            "name": "Tramadol 50mg (Ultracet)",
            "generic_name": "Tramadol Hydrochloride",
            "category": "Analgesics & Antipyretics",
            "dosage_form": "Capsule",
            "strength": "50mg",
            "manufacturer": "Dr. Reddy's",
            "batch_number": "TRM-2025-05",
            "barcode": "89010010007",
            "purchase_price": 68.00,
            "selling_price": 145.00,
            "stock_quantity": 40,
            "min_stock_alert": 10,
            "expiry_date": today + timedelta(days=320),
            "storage_location": "Vault Lock A (Schedule H1)",
            "requires_prescription": True,
            "description": "Schedule H1 controlled analgesic prescribed for acute postoperative and chronic severe pain."
        },
        # Cardiovascular & Hypertension
        {
            "name": "Amlodipine 5mg (Amlong)",
            "generic_name": "Amlodipine Besylate IP",
            "category": "Cardiovascular",
            "dosage_form": "Tablet",
            "strength": "5mg",
            "manufacturer": "Micro Labs",
            "batch_number": "AML-2025-11",
            "barcode": "89010010008",
            "purchase_price": 24.00,
            "selling_price": 56.00,
            "stock_quantity": 95,
            "min_stock_alert": 25,
            "expiry_date": today + timedelta(days=480),
            "storage_location": "Rack C-1",
            "requires_prescription": True,
            "description": "Calcium channel blocker for treating essential hypertension and chronic stable angina."
        },
        {
            "name": "Atorvastatin 20mg (Atorva)",
            "generic_name": "Atorvastatin Calcium IP",
            "category": "Cardiovascular",
            "dosage_form": "Tablet",
            "strength": "20mg",
            "manufacturer": "Zydus / Cipla",
            "batch_number": "ATV-2025-09",
            "barcode": "89010010009",
            "purchase_price": 48.00,
            "selling_price": 118.00,
            "stock_quantity": 80,
            "min_stock_alert": 20,
            "expiry_date": today + timedelta(days=510),
            "storage_location": "Rack C-2",
            "requires_prescription": True,
            "description": "Lipid-lowering statin medication to manage hypercholesterolemia and prevent myocardial infarction."
        },
        {
            "name": "Losartan Potassium 50mg (Losar)",
            "generic_name": "Losartan Potassium IP",
            "category": "Cardiovascular",
            "dosage_form": "Tablet",
            "strength": "50mg",
            "manufacturer": "Unichem / Sun Pharma",
            "batch_number": "LOS-2024-77",
            "barcode": "89010010010",
            "purchase_price": 32.00,
            "selling_price": 78.00,
            "stock_quantity": 5,  # Low stock trigger!
            "min_stock_alert": 20,
            "expiry_date": today + timedelta(days=360),
            "storage_location": "Rack C-3",
            "requires_prescription": True,
            "description": "Angiotensin II receptor antagonist (ARB) for blood pressure control and renal protection in diabetes."
        },
        # Diabetes Care
        {
            "name": "Metformin 500mg (Glyciphage)",
            "generic_name": "Metformin Hydrochloride IP",
            "category": "Diabetic Care",
            "dosage_form": "Tablet",
            "strength": "500mg",
            "manufacturer": "Franco-Indian / Sun Pharma",
            "batch_number": "MET-2025-33",
            "barcode": "89010010011",
            "purchase_price": 16.00,
            "selling_price": 38.00,
            "stock_quantity": 220,
            "min_stock_alert": 40,
            "expiry_date": today + timedelta(days=600),
            "storage_location": "Rack D-1",
            "requires_prescription": True,
            "description": "First-line biguanide oral hypoglycemic agent for glycemic management in Type-2 Diabetes."
        },
        {
            "name": "Glimepiride 2mg (Amaryl)",
            "generic_name": "Glimepiride IP",
            "category": "Diabetic Care",
            "dosage_form": "Tablet",
            "strength": "2mg",
            "manufacturer": "Sanofi India",
            "batch_number": "GLM-2024-19",
            "barcode": "89010010012",
            "purchase_price": 26.00,
            "selling_price": 62.00,
            "stock_quantity": 65,
            "min_stock_alert": 20,
            "expiry_date": today + timedelta(days=45),  # Expiring soon (< 60 days)!
            "storage_location": "Rack D-2",
            "requires_prescription": True,
            "description": "Second-generation sulfonylurea stimulating insulin release from beta cells of the pancreas."
        },
        {
            "name": "Insulin Glargine 100U/ml Pen (Lantus)",
            "generic_name": "Insulin Glargine Recombinant",
            "category": "Diabetic Care",
            "dosage_form": "Injection",
            "strength": "100 Units/ml",
            "manufacturer": "Sanofi / Biocon",
            "batch_number": "INS-2025-02",
            "barcode": "89010010013",
            "purchase_price": 480.00,
            "selling_price": 765.00,
            "stock_quantity": 25,
            "min_stock_alert": 10,
            "expiry_date": today + timedelta(days=280),
            "storage_location": "Cold Storage Refrigerator #1 (2°C - 8°C)",
            "requires_prescription": True,
            "description": "Long-acting 24-hour basal human insulin analog administered once daily subcutaneously."
        },
        # Respiratory
        {
            "name": "Asthalin Inhaler 100mcg (Salbutamol)",
            "generic_name": "Salbutamol Inhalation IP",
            "category": "Respiratory",
            "dosage_form": "Inhaler",
            "strength": "100mcg/puff (200 MD)",
            "manufacturer": "Cipla Ltd",
            "batch_number": "SAL-2025-14",
            "barcode": "89010010014",
            "purchase_price": 82.00,
            "selling_price": 165.00,
            "stock_quantity": 50,
            "min_stock_alert": 15,
            "expiry_date": today + timedelta(days=420),
            "storage_location": "Rack E-1",
            "requires_prescription": True,
            "description": "Fast-acting bronchodilator for instant relief from acute asthma and bronchospasm."
        },
        {
            "name": "Montair-LC (Montelukast + Levocetirizine)",
            "generic_name": "Montelukast 10mg + Levocetirizine 5mg",
            "category": "Respiratory",
            "dosage_form": "Tablet",
            "strength": "10mg + 5mg",
            "manufacturer": "Cipla Ltd",
            "batch_number": "MON-2025-60",
            "barcode": "89010010015",
            "purchase_price": 62.00,
            "selling_price": 135.00,
            "stock_quantity": 70,
            "min_stock_alert": 15,
            "expiry_date": today + timedelta(days=340),
            "storage_location": "Rack E-2",
            "requires_prescription": True,
            "description": "Dual action anti-allergic formulation for allergic rhinitis, asthma prophylaxis, and chronic urticaria."
        },
        # Gastrointestinal
        {
            "name": "Pantocid 40mg (Pantoprazole)",
            "generic_name": "Pantoprazole Sodium Gastro-resistant",
            "category": "Gastrointestinal",
            "dosage_form": "Tablet",
            "strength": "40mg",
            "manufacturer": "Sun Pharma",
            "batch_number": "PAN-2025-88",
            "barcode": "89010010016",
            "purchase_price": 45.00,
            "selling_price": 98.00,
            "stock_quantity": 140,
            "min_stock_alert": 25,
            "expiry_date": today + timedelta(days=490),
            "storage_location": "Rack F-1",
            "requires_prescription": False,
            "description": "Proton pump inhibitor (PPI) reducing stomach gastric acid production for GERD and peptic ulcers."
        },
        {
            "name": "Omez 20mg (Omeprazole)",
            "generic_name": "Omeprazole Gastro-resistant IP",
            "category": "Gastrointestinal",
            "dosage_form": "Capsule",
            "strength": "20mg",
            "manufacturer": "Dr. Reddy's",
            "batch_number": "OMP-2024-51",
            "barcode": "89010010017",
            "purchase_price": 32.00,
            "selling_price": 72.00,
            "stock_quantity": 90,
            "min_stock_alert": 20,
            "expiry_date": today + timedelta(days=310),
            "storage_location": "Rack F-2",
            "requires_prescription": False,
            "description": "Proton pump inhibitor capsules for heartburn, reflux esophagitis, and gastritis."
        },
        {
            "name": "Digene Antacid Gel Mint 200ml",
            "generic_name": "Magnesium Hydroxide + Simethicone",
            "category": "Gastrointestinal",
            "dosage_form": "Syrup",
            "strength": "200ml Bottle",
            "manufacturer": "Abbott India",
            "batch_number": "ANT-2025-08",
            "barcode": "89010010018",
            "purchase_price": 55.00,
            "selling_price": 125.00,
            "stock_quantity": 0,  # Out of stock trigger!
            "min_stock_alert": 15,
            "expiry_date": today + timedelta(days=260),
            "storage_location": "Rack F-3",
            "requires_prescription": False,
            "description": "Liquid antacid syrup providing fast relief from hyperacidity, gas, and stomach bloating."
        },
        # Vitamins & Supplements
        {
            "name": "Calcirol / Vitamin D3 60,000 IU",
            "generic_name": "Cholecalciferol IP",
            "category": "Vitamins & Supplements",
            "dosage_form": "Capsule",
            "strength": "60,000 IU",
            "manufacturer": "Cadila Pharmaceuticals",
            "batch_number": "VD3-2025-22",
            "barcode": "89010010019",
            "purchase_price": 38.00,
            "selling_price": 85.00,
            "stock_quantity": 210,
            "min_stock_alert": 30,
            "expiry_date": today + timedelta(days=700),
            "storage_location": "Rack G-1",
            "requires_prescription": False,
            "description": "Weekly high-dose vitamin D3 soft gelatin capsule for bone density and calcium absorption."
        },
        {
            "name": "Zincovit Multivitamin & Minerals",
            "generic_name": "Multivitamins with Zinc & Grape Seed",
            "category": "Vitamins & Supplements",
            "dosage_form": "Tablet",
            "strength": "Complex",
            "manufacturer": "Apex Laboratories",
            "batch_number": "ZNC-2025-90",
            "barcode": "89010010020",
            "purchase_price": 48.00,
            "selling_price": 110.00,
            "stock_quantity": 115,
            "min_stock_alert": 25,
            "expiry_date": today + timedelta(days=580),
            "storage_location": "Rack G-2",
            "requires_prescription": False,
            "description": "Comprehensive daily nutritional supplement with essential trace elements for general immunity."
        },
        # Dermatology & Topical
        {
            "name": "Betnovate-C Cream 20g",
            "generic_name": "Betamethasone + Clioquinol",
            "category": "Dermatology",
            "dosage_form": "Ointment",
            "strength": "20g Tube",
            "manufacturer": "GlaxoSmithKline (GSK)",
            "batch_number": "BTM-2025-03",
            "barcode": "89010010021",
            "purchase_price": 32.00,
            "selling_price": 72.00,
            "stock_quantity": 38,
            "min_stock_alert": 10,
            "expiry_date": today + timedelta(days=365),
            "storage_location": "Rack H-1",
            "requires_prescription": True,
            "description": "Topical corticosteroid cream for eczema, inflammatory dermatoses, and psoriasis."
        },
        {
            "name": "T-Bact 2% Ointment 5g (Mupirocin)",
            "generic_name": "Mupirocin 2% w/w IP",
            "category": "Dermatology",
            "dosage_form": "Ointment",
            "strength": "5g Tube",
            "manufacturer": "GlaxoSmithKline (GSK)",
            "batch_number": "MUP-2024-91",
            "barcode": "89010010022",
            "purchase_price": 54.00,
            "selling_price": 125.00,
            "stock_quantity": 14,  # Low stock trigger!
            "min_stock_alert": 15,
            "expiry_date": today + timedelta(days=190),
            "storage_location": "Rack H-2",
            "requires_prescription": True,
            "description": "Topical antibacterial antibiotic ointment for impetigo and bacterial wound infections."
        }
    ]

    medicines_objs = []
    for med_dict in meds_seed:
        m = Medicine(**med_dict)
        db.add(m)
        medicines_objs.append(m)
    db.flush()

    # 5. Sample Prescriptions
    p1 = Prescription(
        customer_id=customers_data[1].id,  # Priya Patel
        doctor_name="Dr. Rajesh Kumar, M.D.",
        doctor_license="MCI-DEL-4821",
        prescription_date=today - timedelta(days=3),
        file_url=None,
        notes="Metformin 500mg BID with meals; Glimepiride 2mg once daily before breakfast.",
        status="Verified"
    )
    p2 = Prescription(
        customer_id=customers_data[2].id,  # Amit Verma
        doctor_name="Dr. Sunita Rao, D.N.B.",
        doctor_license="KMC-BLR-9921",
        prescription_date=today - timedelta(days=1),
        file_url=None,
        notes="Amlodipine 5mg OD in morning; Atorvastatin 20mg at night. Monitor BP weekly.",
        status="Verified"
    )
    db.add_all([p1, p2])
    db.flush()

    # 6. Sample Past Sales (In INR ₹)
    payment_methods = ["UPI", "Cash", "Card", "Insurance"]
    sales_created = 0

    for day_offset in range(7, -1, -1):
        sale_date = today - timedelta(days=day_offset)
        num_sales = random.randint(2, 4)
        for s_idx in range(num_sales):
            sales_created += 1
            cust = random.choice(customers_data)
            pm = random.choice(payment_methods)
            selected_meds = random.sample(medicines_objs[:15], random.randint(1, 3))
            
            subtotal = 0.0
            sale_items = []
            for sm in selected_meds:
                qty = random.randint(1, 3)
                price = sm.selling_price
                tot = round(qty * price, 2)
                subtotal += tot
                sale_items.append(
                    SaleItem(
                        medicine_id=sm.id,
                        medicine_name=sm.name,
                        batch_number=sm.batch_number,
                        quantity=qty,
                        unit_price=price,
                        discount=0.0,
                        total_price=tot,
                        expiry_date=sm.expiry_date
                    )
                )

            discount_pct = 5.0 if subtotal > 300 else 0.0
            discount_val = round(subtotal * (discount_pct / 100.0), 2)
            taxable = max(0.0, subtotal - discount_val)
            tax_val = round(taxable * 0.05, 2)  # 5% GST
            final_total = round(taxable + tax_val, 2)

            sale_time = datetime.combine(sale_date, datetime.min.time()) + timedelta(
                hours=random.randint(9, 20),
                minutes=random.randint(0, 59)
            )

            sale_record = Sale(
                invoice_number=f"INV-{sale_date.strftime('%Y%m%d')}-{1000 + sales_created}",
                customer_id=cust.id,
                customer_name=cust.name,
                customer_phone=cust.phone,
                doctor_name="Dr. Rajesh Kumar, M.D." if random.random() > 0.5 else None,
                user_id=pharma_user.id if random.random() > 0.4 else admin_user.id,
                subtotal=subtotal,
                discount_amount=discount_val,
                discount_percentage=discount_pct,
                tax_amount=tax_val,
                total_amount=final_total,
                payment_method=pm,
                payment_status="Completed",
                notes="Prescription verified & dispensed via UPI / Cash." if random.random() > 0.5 else "OTC counter sale.",
                created_at=sale_time,
                items=sale_items
            )
            db.add(sale_record)

    # 7. Sample Stock Inward / Purchase Order (In INR ₹)
    po = PurchaseOrder(
        supplier_id=suppliers_data[0].id,
        invoice_number="CIPLA-PO-2026-9041",
        purchase_date=today - timedelta(days=10),
        total_amount=7450.00,
        payment_status="Paid",
        notes="Monthly bulk inward order for antibiotics and emergency respiratory inhalers.",
        created_by_user_id=admin_user.id
    )
    db.add(po)
    db.flush()

    po_items = [
        PurchaseOrderItem(
            purchase_id=po.id,
            medicine_id=medicines_objs[0].id,
            quantity=100,
            unit_cost=52.00,
            total_cost=5200.00,
            batch_number=medicines_objs[0].batch_number,
            expiry_date=medicines_objs[0].expiry_date
        ),
        PurchaseOrderItem(
            purchase_id=po.id,
            medicine_id=medicines_objs[1].id,
            quantity=30,
            unit_cost=75.00,
            total_cost=2250.00,
            batch_number=medicines_objs[1].batch_number,
            expiry_date=medicines_objs[1].expiry_date
        )
    ]
    db.add_all(po_items)

    # 8. Notifications
    notif1 = Notification(
        type="expired",
        title="Expired Medicine Detected",
        message="Cephalexin 500mg (Batch CPH-2023-99) expired 15 days ago. Immediate quarantine required.",
        reference_id=medicines_objs[3].id,
        is_read=False
    )
    notif2 = Notification(
        type="low_stock",
        title="Low Stock Alert: Ciprofloxacin 500mg",
        message="Only 8 units remaining in inventory (Threshold: 20). Reorder recommended from Cipla Ltd.",
        reference_id=medicines_objs[2].id,
        is_read=False
    )
    notif3 = Notification(
        type="expiring_soon",
        title="Expiring Soon: Brufen / Ibuprofen 400mg",
        message="Batch IBU-2024-30 will expire in 25 days. Priority first-expiry dispensing advised.",
        reference_id=medicines_objs[5].id,
        is_read=False
    )
    db.add_all([notif1, notif2, notif3])

    db.commit()
    print("Database seeding completed with Indian Rupee (INR) pricing and records!")
