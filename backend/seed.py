"""
Seed script — populates the database with sample products, customers, and orders.
Run with: python seed.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from decimal import Decimal
from app.database.session import SessionLocal, engine, Base
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderStatus


PRODUCTS = [
    {"name": "Wireless Mouse", "sku": "SKU-WM-001", "price": Decimal("29.99"), "quantity_in_stock": 150},
    {"name": "Mechanical Keyboard", "sku": "SKU-KB-002", "price": Decimal("89.99"), "quantity_in_stock": 75},
    {"name": "USB-C Hub 7-in-1", "sku": "SKU-HUB-003", "price": Decimal("49.99"), "quantity_in_stock": 8},
    {"name": "27-inch Monitor", "sku": "SKU-MON-004", "price": Decimal("349.99"), "quantity_in_stock": 30},
    {"name": "Laptop Stand", "sku": "SKU-LS-005", "price": Decimal("39.99"), "quantity_in_stock": 5},
    {"name": "Webcam 1080p", "sku": "SKU-WC-006", "price": Decimal("69.99"), "quantity_in_stock": 60},
    {"name": "Noise-Cancelling Headphones", "sku": "SKU-HP-007", "price": Decimal("199.99"), "quantity_in_stock": 3},
    {"name": "Desk Lamp LED", "sku": "SKU-DL-008", "price": Decimal("24.99"), "quantity_in_stock": 200},
    {"name": "HDMI Cable 2m", "sku": "SKU-HDMI-009", "price": Decimal("9.99"), "quantity_in_stock": 9},
    {"name": "External SSD 1TB", "sku": "SKU-SSD-010", "price": Decimal("119.99"), "quantity_in_stock": 45},
]

CUSTOMERS = [
    {"full_name": "Alice Johnson", "email": "alice.johnson@example.com", "phone_number": "+1-555-0101"},
    {"full_name": "Bob Martinez", "email": "bob.martinez@example.com", "phone_number": "+1-555-0102"},
    {"full_name": "Carol Williams", "email": "carol.williams@example.com", "phone_number": "+44-20-7946-0958"},
    {"full_name": "David Chen", "email": "david.chen@example.com", "phone_number": "+65-6123-4567"},
    {"full_name": "Eva Patel", "email": "eva.patel@example.com", "phone_number": "+91-98765-43210"},
    {"full_name": "Frank Mueller", "email": "frank.mueller@example.com", "phone_number": "+49-30-12345678"},
]


def seed():
    print("🌱 Starting database seed...")

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        # Check if already seeded
        if db.query(Product).count() > 0:
            print("⚠️  Database already has data. Skipping seed.")
            return

        # Create products
        products = []
        for data in PRODUCTS:
            product = Product(**data)
            db.add(product)
            products.append(product)
        db.flush()
        print(f"✅ Created {len(products)} products")

        # Create customers
        customers = []
        for data in CUSTOMERS:
            customer = Customer(**data)
            db.add(customer)
            customers.append(customer)
        db.flush()
        print(f"✅ Created {len(customers)} customers")

        # Create sample orders
        orders_data = [
            {
                "customer": customers[0],
                "product": products[0],
                "quantity": 2,
                "status": OrderStatus.CONFIRMED,
            },
            {
                "customer": customers[1],
                "product": products[1],
                "quantity": 1,
                "status": OrderStatus.SHIPPED,
            },
            {
                "customer": customers[2],
                "product": products[3],
                "quantity": 1,
                "status": OrderStatus.DELIVERED,
            },
            {
                "customer": customers[3],
                "product": products[5],
                "quantity": 3,
                "status": OrderStatus.PENDING,
            },
            {
                "customer": customers[4],
                "product": products[9],
                "quantity": 2,
                "status": OrderStatus.CONFIRMED,
            },
            {
                "customer": customers[0],
                "product": products[2],
                "quantity": 1,
                "status": OrderStatus.PENDING,
            },
        ]

        orders = []
        for od in orders_data:
            product = od["product"]
            quantity = od["quantity"]
            if product.quantity_in_stock >= quantity:
                product.quantity_in_stock -= quantity
                order = Order(
                    customer_id=od["customer"].id,
                    product_id=product.id,
                    quantity=quantity,
                    total_amount=product.price * quantity,
                    order_status=od["status"],
                )
                db.add(order)
                orders.append(order)

        db.commit()
        print(f"✅ Created {len(orders)} orders")
        print("🎉 Seed completed successfully!")


if __name__ == "__main__":
    seed()
