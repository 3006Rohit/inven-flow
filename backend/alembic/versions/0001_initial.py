"""Initial schema — products, customers, orders

Revision ID: 0001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Products table
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("sku", sa.String(100), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("quantity_in_stock", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sku", name="uq_products_sku"),
        sa.CheckConstraint("quantity_in_stock >= 0", name="ck_products_stock_nonneg"),
        sa.CheckConstraint("price > 0", name="ck_products_price_positive"),
    )
    op.create_index("ix_products_id", "products", ["id"], unique=False)
    op.create_index("ix_products_sku", "products", ["sku"], unique=True)
    op.create_index("ix_products_name", "products", ["name"], unique=False)

    # Customers table
    op.create_table(
        "customers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("phone_number", sa.String(30), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_customers_email"),
    )
    op.create_index("ix_customers_id", "customers", ["id"], unique=False)
    op.create_index("ix_customers_email", "customers", ["email"], unique=True)
    op.create_index("ix_customers_full_name", "customers", ["full_name"], unique=False)

    # Order status enum — use PL/pgSQL DO block for idempotent creation (PostgreSQL 15 compatible)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE order_status_enum AS ENUM (
                'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
            );
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
    """)

    # Orders table — use postgresql.ENUM with create_type=False to avoid double-creation
    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column(
            "order_status",
            postgresql.ENUM(
                "pending", "confirmed", "shipped", "delivered", "cancelled",
                name="order_status_enum",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["customers.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["product_id"], ["products.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("quantity > 0", name="ck_orders_quantity_positive"),
        sa.CheckConstraint("total_amount > 0", name="ck_orders_total_positive"),
    )
    op.create_index("ix_orders_id", "orders", ["id"], unique=False)
    op.create_index("ix_orders_customer_id", "orders", ["customer_id"], unique=False)
    op.create_index("ix_orders_product_id", "orders", ["product_id"], unique=False)
    op.create_index("ix_orders_status", "orders", ["order_status"], unique=False)
    op.create_index("ix_orders_created_at", "orders", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_table("orders")
    op.execute("DROP TYPE IF EXISTS order_status_enum")
    op.drop_table("customers")
    op.drop_table("products")
