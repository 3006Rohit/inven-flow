import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.session import Base


def utcnow():
    return datetime.now(timezone.utc)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(320), unique=True, nullable=False, index=True)
    phone_number = Column(String(30), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    orders = relationship("Order", back_populates="customer")

    __table_args__ = (
        Index("ix_customers_full_name", "full_name"),
    )
