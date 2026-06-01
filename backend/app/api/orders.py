from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.order import OrderStatus
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


def get_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(db)


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    service: OrderService = Depends(get_service),
):
    """
    Create an order.
    - Validates customer and product exist.
    - Checks stock availability (returns 400 if insufficient).
    - Deducts stock automatically.
    - Calculates total_amount = price × quantity (backend only).
    """
    return service.create(payload)


@router.get("/", response_model=OrderListResponse, status_code=status.HTTP_200_OK)
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: OrderStatus | None = Query(None, alias="status"),
    service: OrderService = Depends(get_service),
):
    """List all orders with optional status filter and pagination."""
    total, items = service.get_all(skip=skip, limit=limit, status=status_filter)
    return OrderListResponse(total=total, items=items)


@router.get("/{order_id}", response_model=OrderResponse, status_code=status.HTTP_200_OK)
def get_order(
    order_id: UUID,
    service: OrderService = Depends(get_service),
):
    """Get a single order by ID (includes customer and product details)."""
    return service.get_by_id(order_id)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_order(
    order_id: UUID,
    service: OrderService = Depends(get_service),
):
    """Cancel/delete an order. Restores the product stock automatically."""
    service.delete(order_id)
