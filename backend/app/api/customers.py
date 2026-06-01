from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerListResponse
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["Customers"])


def get_service(db: Session = Depends(get_db)) -> CustomerService:
    return CustomerService(db)


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    service: CustomerService = Depends(get_service),
):
    """Create a new customer. Email must be unique."""
    return service.create(payload)


@router.get("/", response_model=CustomerListResponse, status_code=status.HTTP_200_OK)
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: str | None = Query(None, description="Search by name or email"),
    service: CustomerService = Depends(get_service),
):
    """List all customers with optional search and pagination."""
    total, items = service.get_all(skip=skip, limit=limit, search=search)
    return CustomerListResponse(total=total, items=items)


@router.get("/{customer_id}", response_model=CustomerResponse, status_code=status.HTTP_200_OK)
def get_customer(
    customer_id: UUID,
    service: CustomerService = Depends(get_service),
):
    """Get a single customer by ID."""
    return service.get_by_id(customer_id)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: UUID,
    service: CustomerService = Depends(get_service),
):
    """Delete a customer. Fails if customer has existing orders."""
    service.delete(customer_id)
