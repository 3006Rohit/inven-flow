from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, examples=["Jane Doe"])
    email: EmailStr = Field(..., examples=["jane.doe@example.com"])
    phone_number: str | None = Field(None, max_length=30, examples=["+1-555-0100"])

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if cleaned and not re.match(r"^\+?\d{7,15}$", cleaned):
            raise ValueError("Phone number format is invalid.")
        return v


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    total: int
    items: list[CustomerResponse]
