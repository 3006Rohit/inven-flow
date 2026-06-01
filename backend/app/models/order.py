import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    DateTime,
    ForeignKey,
    Enum,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.session import Base


def utcnow():
    return datetime.now(timezone.utc)


class OrderStatus(str, PyEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity = Column(Integer, nullable=False)
    total_amount = Column(Numeric(14, 2), nullable=False)
    order_status = Column(
        Enum(OrderStatus, name="order_status_enum", create_type=False),
        default=OrderStatus.PENDING,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    customer = relationship("Customer", back_populates="orders")
    product = relationship("Product", back_populates="orders")

    __table_args__ = (
        Index("ix_orders_status", "order_status"),
        Index("ix_orders_created_at", "created_at"),
    )
