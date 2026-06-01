from decimal import Decimal
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, examples=["Wireless Mouse"])
    sku: str = Field(..., min_length=1, max_length=100, examples=["SKU-WM-001"])
    price: Decimal = Field(..., gt=0, examples=[29.99])
    quantity_in_stock: int = Field(..., ge=0, examples=[100])

    @field_validator("sku")
    @classmethod
    def sku_uppercase(cls, v: str) -> str:
        return v.strip().upper()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    sku: str | None = Field(None, min_length=1, max_length=100)
    price: Decimal | None = Field(None, gt=0)
    quantity_in_stock: int | None = Field(None, ge=0)

    @field_validator("sku")
    @classmethod
    def sku_uppercase(cls, v: str | None) -> str | None:
        return v.strip().upper() if v else v


class ProductResponse(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    total: int
    items: list[ProductResponse]
