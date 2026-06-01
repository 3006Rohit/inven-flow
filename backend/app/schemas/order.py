from decimal import Decimal
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.order import OrderStatus


class OrderCreate(BaseModel):
    customer_id: UUID = Field(..., examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"])
    product_id: UUID = Field(..., examples=["3fa85f64-5717-4562-b3fc-2c963f66afa6"])
    quantity: int = Field(..., gt=0, examples=[3])


class OrderStatusUpdate(BaseModel):
    order_status: OrderStatus


class OrderResponse(BaseModel):
    id: UUID
    customer_id: UUID
    product_id: UUID
    quantity: int
    total_amount: Decimal
    order_status: OrderStatus
    created_at: datetime

    # Nested details (loaded via join)
    customer_name: str | None = None
    customer_email: str | None = None
    product_name: str | None = None
    product_sku: str | None = None

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    total: int
    items: list[OrderResponse]
