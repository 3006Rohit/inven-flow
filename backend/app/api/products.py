from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
)
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


def get_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(db)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    service: ProductService = Depends(get_service),
):
    """Create a new product. SKU must be unique."""
    return service.create(payload)


@router.get("/", response_model=ProductListResponse, status_code=status.HTTP_200_OK)
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: str | None = Query(None, description="Search by name or SKU"),
    service: ProductService = Depends(get_service),
):
    """List all products with optional search and pagination."""
    total, items = service.get_all(skip=skip, limit=limit, search=search)
    return ProductListResponse(total=total, items=items)


@router.get("/low-stock", response_model=list[ProductResponse], status_code=status.HTTP_200_OK)
def get_low_stock_products(
    threshold: int = Query(10, ge=0),
    service: ProductService = Depends(get_service),
):
    """Get products with stock at or below the threshold (default: 10)."""
    return service.get_low_stock(threshold=threshold)


@router.get("/{product_id}", response_model=ProductResponse, status_code=status.HTTP_200_OK)
def get_product(
    product_id: UUID,
    service: ProductService = Depends(get_service),
):
    """Get a single product by ID."""
    return service.get_by_id(product_id)


@router.put("/{product_id}", response_model=ProductResponse, status_code=status.HTTP_200_OK)
def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    service: ProductService = Depends(get_service),
):
    """Update product fields. SKU must remain unique."""
    return service.update(product_id, payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: UUID,
    service: ProductService = Depends(get_service),
):
    """Delete a product. Fails if the product has active orders."""
    service.delete(product_id)
