import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Numeric, Integer, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.session import Base


def utcnow():
    return datetime.now(timezone.utc)


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    price = Column(Numeric(12, 2), nullable=False)
    quantity_in_stock = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    orders = relationship("Order", back_populates="product")

    __table_args__ = (
        Index("ix_products_name", "name"),
    )
